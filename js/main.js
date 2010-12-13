// Maximum number of pixels in the rendered sheet.
// TODO: this constant should be synchronized with server. Read it from server?
var MAX_PIXELS = 12000000;

///////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Map Manager ///////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// Helper for work with OpenLayers map.
//
// Class adds vector layer to map and draws one rectangle on it. 
// Rectangle movement callback can be added by user. Rectangle position can 
// change using class method.

MapManager = function(map, style)
{
    this.getMap = function() { return m_map; };
    
    this.lonlat2Map = function( lonlat )
    {
       return lonlat.clone().transform( m_lonlatProjection, m_map.getProjectionObject() );
    }
    
    this.map2lonlat = function( lonlatMapProj )
    {
       return lonlatMapProj.clone().transform( m_map.getProjectionObject(), m_lonlatProjection );        
    }
    
    this.lonlat2pixel = function( lonlat, zoom )
    {
        var lonlatMapProj = this.lonlat2Map(lonlat);
        var resolution = map.getResolutionForZoom( zoom );
        
        return {
            x: Math.floor ((lonlatMapProj.lon - map.maxExtent.left) / resolution),
            y: Math.floor ((map.maxExtent.top - lonlatMapProj.lat) / resolution)
        }
    }
    
    this.pixel2lonlat = function( pixel, zoom )
    {
        var resolution = map.getResolutionForZoom( zoom );
        
        var lon = pixel.x*resolution + map.maxExtent.left;
        var lat = map.maxExtent.top - pixel.y*resolution;
        
        return this.map2lonlat( new OpenLayers.LonLat( lon, lat ) );
    }
    
    // callback will be called when rectangle is dragged by user
    // callback format: callback(bounds). 
    //      bounds {OpenLayers.Bounds} - new bounds of rectangle in map projection
    this.setDragCompleteCallback = function( callback )
    {
        this.m_callback = callback;
        m_dragControl.onComplete = function(feature){ callback(feature.geometry.getBounds()); };
    }
    this.getDragCallback = function(){ return this.m_callback; }
    
    this.addLonlatBounds = function( bounds, style )
    {
        if (m_curFeature) m_polygonLayer.removeFeatures([m_curFeature]);
        m_curFeature = new OpenLayers.Feature.Vector(this.lonlat2Map(bounds).toGeometry(), {}, m_style);
        m_polygonLayer.addFeatures([m_curFeature]);
    }
    
    var m_map = map;
    var m_style = style;
    var m_callback = null;
        
    var m_polygonLayer = new OpenLayers.Layer.Vector("Polygon Layer", {displayInLayerSwitcher: false});
    map.addLayers([m_polygonLayer]);
    
    var m_dragControl = new OpenLayers.Control.DragFeature(m_polygonLayer);
    map.addControl( m_dragControl );
    m_dragControl.activate();    
    
    var m_lonlatProjection = new OpenLayers.Projection("EPSG:4326");
    var m_curFeature = null;
    
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////// MapSheetRectangle ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// Main purpose of the class is to manage one sheet rectangle size. 
// Main invariant of the rectangle is phisical size of area in rendered map (meters) 
// resulting in rectangle size dependance on rectangle position on map 
// (because of Mercator projection of map)
//
// Rectangle can be defined using center coordinates and sizes or using corners' 
// coordinates. Both variants are used in class, ensuring consistency in 
// private function updateCornersFromCenter()
//
//Trigger events: move(any changes of position or sizes)
/**
* mapManager {MapManager}: helper for rectangle visualization
* center {OpenLayers.LonLat}
* logger {ILogger}: object for log writing
*/
MapSheetRectangle = function(mapManager, center, logger)
{
    //Updates coordinates of rectangle corners using center coordinates and size of rectangle (meters)
    var updateCornersFromCenter = function()
    {
        //TODO: OpenLayers.Util.destinationVincenty can be used here
        var getDeltaLatLng = function(srcLat, distX, distY, outDelta)
        {
            var R = 6378137; //earth radius, meters
            outDelta.dLat = distY/R;
            
            var tan2 = Math.tan(distX/R);
            tan2 *= tan2;
            var a = tan2/(1+tan2);
            var cos2 = Math.cos(srcLat/180*Math.PI);
            cos2 *= cos2;
            outDelta.dLng = Math.asin(Math.sqrt(a/cos2));
            
            outDelta.dLat *= 180/Math.PI;
            outDelta.dLng *= 180/Math.PI;
        }
        
        var delta = {};
        getDeltaLatLng( m_center.lat, m_lengthX/2, m_lengthY/2, delta );
        m_ne = new OpenLayers.LonLat( m_center.lon + delta.dLng, m_center.lat + delta.dLat );
        m_sw = new OpenLayers.LonLat( m_center.lon - delta.dLng, m_center.lat - delta.dLat );
    }
    
    this.redraw = function()
    {
        if (!m_ne || !m_sw) return;
        
        var lonlatProjection = new OpenLayers.Projection("EPSG:4326");
        var rectangleBounds = new OpenLayers.Bounds();
        rectangleBounds.extend( m_ne );
        rectangleBounds.extend( m_sw );
        m_mapManager.addLonlatBounds(rectangleBounds);
    }
    
    //sizeX and sizeY in meters
    this.setSize = function(sizeX, sizeY)
    {
        m_logger.message("Set size: " + sizeX + ", " + sizeY);
        m_lengthX = sizeX;
        m_lengthY = sizeY;
        updateCornersFromCenter();
        this.redraw();
        $(m_this).trigger('move');
    }
    // Get clone of NE corner
    this.getNE = function(){ if (m_ne) return m_ne.clone(); else return null; };
    
    // Get clone of SW corner
    this.getSW = function(){ if (m_sw) return m_sw.clone(); else return null; };
    
    var m_mapManager = mapManager;
    var m_this = this;
    var m_logger = logger;
    var m_center = center;
    var m_lengthX = 0;
    var m_lengthY = 0;
    var m_ne = null;
    var m_sw = null;
    
    m_mapManager.setDragCompleteCallback( function(bounds)
    {
        //invariant of rectangle is its center and length (in meters). 
        //So, calculate center and estimate size of rectangle on screen
        m_center = m_mapManager.map2lonlat(bounds.getCenterLonLat());
        
        updateCornersFromCenter();
        m_this.redraw();
                
        $(m_this).trigger('move');
    });
}


///////////////////////////////////////////////////////////////////////////////
///////////////////////////// SheetController /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// Synchronization between sheet rectangle and sheet options widget.
// map {OpenLayers.Map}
// logger {ILogger}
SheetController = function( map, logger )
{
    var onUpdateSheetOptions = function()
    {
        var sheetOptions = m_sheetOptionsWidget.getSheetOptions();
        var sizeX = sheetOptions.m_sizeX * sheetOptions.m_scale;
        var sizeY = sheetOptions.m_sizeY * sheetOptions.m_scale;
        
        m_mapSheetRectangle.setSize(sizeX, sizeY);
    };
    
    var onRectangleMove = function()
    {
        var ne = m_mapSheetRectangle.getNE();
        var sw = m_mapSheetRectangle.getSW();

        m_logger.message('Distance Y1: ' + OpenLayers.Util.distVincenty(sw, new OpenLayers.LonLat(sw.lon, ne.lat) ));
        m_logger.message('Distance Y2: ' + OpenLayers.Util.distVincenty(ne, new OpenLayers.LonLat(ne.lon, sw.lat) ));
        m_logger.message('Distance X1: ' + OpenLayers.Util.distVincenty(sw, new OpenLayers.LonLat(ne.lon, sw.lat) ));
        m_logger.message('Distance X2: ' + OpenLayers.Util.distVincenty(ne, new OpenLayers.LonLat(sw.lon, ne.lat) ));

        
        var sheetData = m_this.getSheetData();
        var sizeX = sheetData.maxx - sheetData.minx + 1;
        var sizeY = sheetData.maxy - sheetData.miny + 1;
        m_sheetOptionsWidget.setMapPixelSizes(sizeX, sizeY);
    }
    
    this.getSheetData = function()
    {
        var sheetOptions = m_sheetOptionsWidget.getSheetOptions();
        
        var zoom = sheetOptions.m_resolution;
        var ne = m_mapSheetRectangle.getNE();
        var sw = m_mapSheetRectangle.getSW();
        
        var pne = m_mapManager.lonlat2pixel(ne, zoom);
        var psw = m_mapManager.lonlat2pixel(sw, zoom);
        
        var nw = m_mapManager.pixel2lonlat( {x: psw.x, y:pne.y}, zoom );
        var se = m_mapManager.pixel2lonlat( {x: pne.x, y:psw.y}, zoom );
                
        return {zoom: zoom, minx: psw.x, miny: pne.y, maxx: pne.x, maxy: psw.y, 
                lenx: sheetOptions.m_sizeX, leny: sheetOptions.m_sizeY, 
                ne: [ne.lat, ne.lon], 
                nw: [nw.lat, nw.lon], 
                se: [se.lat, se.lon], 
                sw: [sw.lat, sw.lon] };
    };
    
    //TODO: move this function to class Sheet later
    this.isDataValid = function()
    {
        return m_sheetOptionsWidget.getSheetOptions().isDataValid();
    }

    var m_mapManager = new MapManager(map, {fillColor: "#ff0000", fillOpacity: 0.5});
    var m_logger = logger;
    var m_this = this;    
    
    var m_sheetOptionsWidget = new SheetOptionsWidget( $("#sheetOptionsWidgetContainer"), logger );
    $(m_sheetOptionsWidget).bind("change", onUpdateSheetOptions);
    
    var lonlatCenter = m_mapManager.map2lonlat( m_mapManager.getMap().getCenter() );
    var m_mapSheetRectangle = new MapSheetRectangle( m_mapManager, lonlatCenter, logger );
    
    $(m_mapSheetRectangle).bind('move', onRectangleMove);
    
    onUpdateSheetOptions();
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////// SheetOptions ////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//All sheet options, which user can change except position on map. NaN 
SheetOptions = function()
{
    this.clone = function(){ return $.extend({}, this);};
    
    this.m_sizeX = NaN; //centimeters
    this.m_sizeY = NaN; //centimeters
    this.m_scale = NaN; // meters per centimeter
    this.m_resolution = NaN; //map's zoom level (13, 14, etc)
    this.m_orientation = NaN; // 1 - albom, 2 - portrait
    
    this.isDataValid = function()
    {
        return (!isNaN(this.m_sizeX) && this.m_sizeX > 0) && 
               (!isNaN(this.m_sizeY) && this.m_sizeY > 0) &&
               (!isNaN(this.m_scale) && this.m_scale > 0) &&
                !isNaN(this.m_resolution) && !isNaN(this.m_orientation);
    }
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////// SheetOptionsWidget //////////////////////////
///////////////////////////////////////////////////////////////////////////////
//Trigger events: change
SheetOptionsWidget = function( container, logger )
{
    var updateWidgetFromSheetOptions = function()
    {
        var toggleErrorClass = function(cond, elemID)
        {
            if ( cond )
                $(elemID, m_container).addClass("sowErrorValue");
            else 
                $(elemID, m_container).removeClass("sowErrorValue");
        }
        
        toggleErrorClass( isNaN(m_sheetOptions.m_sizeX) || m_sheetOptions.m_sizeX <= 0, "#sow_sizex" );
        toggleErrorClass( isNaN(m_sheetOptions.m_sizeY) || m_sheetOptions.m_sizeY <= 0, "#sow_sizey" );
        toggleErrorClass( isNaN(m_sheetOptions.m_scale) || m_sheetOptions.m_scale <= 0, "#sow_scale" );
    }
    
    var updateSheetOptionsFromWidget = function()
    {
        m_sheetOptions.m_orientation = $("#sow_albom", m_container).attr("checked") ? 1 : 2;
        m_sheetOptions.m_sizeX = parseFloat( $("#sow_sizex", m_container).val() );
        m_sheetOptions.m_sizeY = parseFloat( $("#sow_sizey", m_container).val() );
        m_sheetOptions.m_scale = parseFloat( $("#sow_scale", m_container).val() );
        m_sheetOptions.m_resolution = parseFloat( $("select[name=resolution]", m_container).val() );
        m_logger.message('Updating sheet options: '+ m_sheetOptions.m_orientation + ',' + 
            m_sheetOptions.m_sizeX + ',' + m_sheetOptions.m_sizeY + ',' + 
            m_sheetOptions.m_scale + ',' + m_sheetOptions.m_resolution);
            
        updateWidgetFromSheetOptions();    
        $(m_this).trigger("change");
    }
    
    var updateSizesFromSizePreset = function(presetName)
    {
        var isAlbom = $("#sow_albom", m_container).attr("checked");
        var sizex = m_sizePresets[presetName].sizex;
        var sizey = m_sizePresets[presetName].sizey;
        
        $("#sow_sizex", m_container).val( isAlbom ? sizey : sizex );
        $("#sow_sizey", m_container).val( isAlbom ? sizex : sizey );
    }
    
    //pixelsX - width of sheet (pixels)
    //pixelsY - height of sheet (pixels)
    this.setMapPixelSizes = function(pixelsX, pixelsY)
    {
        //TODO: dpi can be calculated by the Sheet class
        var dpi = Math.round((pixelsX/m_sheetOptions.m_sizeX + pixelsY/m_sheetOptions.m_sizeY)/2*INCH2CM);
        $("#sow_final_sheet_options", m_container).text( pixelsX + "x" + pixelsY + " pixels, " + dpi + " dpi" );
        
        if (pixelsX*pixelsY > MAX_PIXELS)
            $("#sow_final_sheet_options", m_container).addClass("too_big_sheet").append(" (too big)")
        else
            $("#sow_final_sheet_options", m_container).removeClass("too_big_sheet");
            
    }
    
    //return clone of current sheet options
    this.getSheetOptions = function(){ return m_sheetOptions.clone(); };

    var DEFAULT_SCALE = 500;
    var INCH2CM = 2.54;

    var m_container = container;
    var m_sheetOptions = new SheetOptions();
    var m_logger = logger;
    var m_this = this;
    
    var m_sizePresets = {};
    m_sizePresets['A4'] = { sizex: 21.0, sizey: 29.7 };
    m_sizePresets['A3'] = { sizex: 29.7, sizey: 42.0 };
    
    updateSizesFromSizePreset('A4');
    $("#sow_scale", m_container).val(DEFAULT_SCALE); 

    updateSheetOptionsFromWidget();

    $("#sow_albom, #sow_portr", m_container).bind("change", function()
    {
        m_logger.message("Orientation change event");
        var sizex = $("#sow_sizex", m_container).val();
        var sizey = $("#sow_sizey", m_container).val();
        
        $("#sow_sizex", m_container).val( sizey );
        $("#sow_sizey", m_container).val( sizex );
        updateSheetOptionsFromWidget();
    });
    
    $("#sow_size_preset", m_container).bind("change", function()
    {
        m_logger.message("Size preset changed");
        
        if (this.value != 'custom')
        {        
            updateSizesFromSizePreset( this.value );
            updateSheetOptionsFromWidget();
        }
    });
    
    $("#sow_sizex, #sow_sizey", m_container).bind("change", function()
    {
        $("#sow_size_preset", m_container).val("custom");
        updateSheetOptionsFromWidget();
    });
    
    $("select[name=resolution], #sow_scale", m_container).bind("change", updateSheetOptionsFromWidget);
}

///////////////////////////////////////////////////////////////////////////////
//////////////////////////// MapLayoutWidget //////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
MapLayoutWidget = function( map, namesMap )
{
    this.getMapLayout = function() 
    {
        var serverNames = [];
        for ( var k = 0; k < map.layers.length; k++ )
            if ( map.layers[k].name in namesMap )
                serverNames.push( namesMap[map.layers[k].name] );
        return serverNames.join(',');
    };
}

///////////////////////////////////////////////////////////////////////////////
////////////////////////////////// Sheet //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//Data model. Represets all properties of one sheet of the map 
//
// Trigger event "change"
//
// Parameters:
// - size_x, size_y (get/set)
// - scale (get/set)
// - resolution (get/set)
// - center (get/set)
// - ne, sw (get)
// Sheet = function()
// {
    // this.set = function(properties)
    // {
        
        // $(m_this).trigger('change');
    // }
    
    // this.get = function(property)
    // {
    // }
// }

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////// Loggers /////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//Interface ILogger: message(message). "message" is any string. Return none.

DivLogger = function()
{
    this.message = function( message )
    {
        m_logDiv.prepend( message + "<br>" );
    }
    
    var m_logDiv = $('<div></div>').addClass('ui-widget-content divLoggerDiv');
    $("body").append(m_logDiv.get(0));
    
};

NullLogger = function(){ this.message = function(){}; };