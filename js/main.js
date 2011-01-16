// Maximum number of pixels in the rendered sheet.
// TODO: this constant should be synchronized with server. Read it from server?
var MAX_PIXELS = 12000000;

var INCH2CM = 2.54;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////CoordinatesConverter ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// Helper to convert coordinates using OpenLayers.

//map: {OpenLayers.Map}
CoordinatesConverter = function(map)
{
    this.lonlat2map = function( lonlat )
    {
       return lonlat.clone().transform( m_lonlatProjection, m_map.getProjectionObject() );
    }
    
    this.map2lonlat = function( lonlatMapProj )
    {
       return lonlatMapProj.clone().transform( m_map.getProjectionObject(), m_lonlatProjection );        
    }
    
    this.lonlat2pixel = function( lonlat, zoom )
    {
        var lonlatMapProj = this.lonlat2map(lonlat);
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
    
    var m_map = map;
    var m_lonlatProjection = new OpenLayers.Projection("EPSG:4326");
}

///////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Map Manager ///////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// Helper for work with OpenLayers map.
//
// Class adds vector layer to map and draws one rectangle on it. 
// Rectangle movement callback can be added by user. Rectangle position can 
// change using class method.

//map {OpenLayers.Map}
//style - style parameters for {OpenLayers.Feature.Vector} constructor
MapManager = function(map, style)
{
    this.getMap = function() { return m_map; };
    
    // callback will be called when rectangle is dragged by user
    // callback format: callback(bounds). 
    //      bounds {OpenLayers.Bounds} - new bounds of rectangle in map projection
    this.setDragCompleteCallback = function( callback )
    {
        this.m_callback = callback;
        m_dragControl.onComplete = function(feature){ callback(feature.geometry.getBounds()); };
    }
    this.getDragCallback = function(){ return this.m_callback; }
    
    this.addLonlatBounds = function( bounds )
    {
        if (m_curFeature) m_polygonLayer.removeFeatures([m_curFeature]);
        m_curFeature = new OpenLayers.Feature.Vector(m_converter.lonlat2map(bounds).toGeometry(), {}, m_style);
        m_polygonLayer.addFeatures([m_curFeature]);
    }
    
    var m_map = map;
    var m_style = style;
    var m_callback = null;
    var m_converter = new CoordinatesConverter(map);
        
    var m_polygonLayer = new OpenLayers.Layer.Vector("Polygon Layer", {displayInLayerSwitcher: false});
    map.addLayers([m_polygonLayer]);
    
    var m_dragControl = new OpenLayers.Control.DragFeature(m_polygonLayer);
    map.addControl( m_dragControl );
    m_dragControl.activate();    
    
    var m_curFeature = null;
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////// MapSheetRectangle ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// Main purpose of the class is to manage position of one sheet rectangle. 
// Main invariant of the rectangle is phisical size of area in rendered map (meters) 
// resulting in rectangle size dependence on rectangle position on map 
// (because of Mercator projection of map)
//
// Rectangle is defined using center coordinates and sizes (meters).
/**
* mapManager {MapManager}: helper for rectangle visualization
* center {OpenLayers.LonLat}
* logger {ILogger}: object for log writing
* sheet {Sheet}: data object
*/
MapSheetRectangle = function(mapManager, center, logger, sheet)
{    
    this.redraw = function()
    {
        var ne = m_sheet.get('ne');
        var sw = m_sheet.get('sw');
        if (!ne || !sw) return;
        
        var rectangleBounds = new OpenLayers.Bounds();
        rectangleBounds.extend( ne );
        rectangleBounds.extend( sw );
        m_mapManager.addLonlatBounds(rectangleBounds);
    }
        
    var m_mapManager = mapManager;
    var m_logger = logger;
    var m_sheet = sheet;
    var m_converter = new CoordinatesConverter( mapManager.getMap() );
    
    m_sheet.set({center: center});
    
    $(m_sheet).bind('change', this.redraw);
    
    m_mapManager.setDragCompleteCallback( function(bounds)
    {
        //invariant of rectangle is its center and length (in meters). 
        //So, calculate center and estimate size of rectangle on screen
        var center = m_converter.map2lonlat(bounds.getCenterLonLat());
        m_sheet.set({center: center});
    });
    
    this.redraw();
}


///////////////////////////////////////////////////////////////////////////////
///////////////////////////// SheetController /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// Synchronization between sheet rectangle and sheet options widget.
// map {OpenLayers.Map}
// logger {ILogger}
SheetController = function( map, logger )
{
    var m_mapManager = new MapManager(map, {fillColor: "#ff0000", fillOpacity: 0.5});
    var m_logger = logger;
    var m_this = this;
    var m_converter = new CoordinatesConverter( map );
    var m_sheet = new Sheet( m_converter );
    
    var m_sheetOptionsWidget = new SheetOptionsWidget( $("#sheetOptionsWidgetContainer"), logger, m_sheet );
    
    var lonlatCenter = m_converter.map2lonlat( m_mapManager.getMap().getCenter() );
    var m_mapSheetRectangle = new MapSheetRectangle( m_mapManager, lonlatCenter, logger, m_sheet );
    
    this.getSheet = function(){ return m_sheet; };
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////// SheetOptionsWidget //////////////////////////
///////////////////////////////////////////////////////////////////////////////
//Trigger events: change
SheetOptionsWidget = function( container, logger, sheet )
{
    //makes fields of widget red if corresponding parameters of the sheet are incorrect
    var updateErrorStates = function()
    {
        var toggleErrorClass = function(cond, elemID)
        {
            if ( cond )
                $(elemID, m_container).addClass("sowErrorValue");
            else 
                $(elemID, m_container).removeClass("sowErrorValue");
        }
        
        var size_x = m_sheet.get('size_x');
        var size_y = m_sheet.get('size_y');
        var scale  = m_sheet.get('scale');
        
        toggleErrorClass( isNaN(size_x) || size_x <= 0, "#sow_sizex" );
        toggleErrorClass( isNaN(size_y) || size_y <= 0, "#sow_sizey" );
        toggleErrorClass( isNaN(scale)  || scale  <= 0, "#sow_scale" );
    }
    
    var updateSheetOptionsFromWidget = function()
    {
        var orientation = $("#sow_landscape", m_container).attr("checked") ? 1 : 2;
        var sizeX = parseFloat( $("#sow_sizex", m_container).val() );
        var sizeY = parseFloat( $("#sow_sizey", m_container).val() );
        var scale = parseFloat( $("#sow_scale", m_container).val() );
        var resolution = parseFloat( $("select[name=resolution]", m_container).val() );
        m_logger.message('Updating sheet options: '+ orientation + ',' + 
                          sizeX + ',' + sizeY + ',' + 
                          scale + ',' + resolution);
        
        m_sheet.set({ size_x: sizeX, size_y: sizeY, scale: scale, resolution: resolution });
        
        updateErrorStates();
    }
    
    var updateSizesFromSizePreset = function(presetName)
    {
        var isLandscape = $("#sow_landscape", m_container).attr("checked");
        var sizex = m_sizePresets[presetName].sizex;
        var sizey = m_sizePresets[presetName].sizey;
        
        $("#sow_sizex", m_container).val( isLandscape ? sizey : sizex );
        $("#sow_sizey", m_container).val( isLandscape ? sizex : sizey );
    }
    
    //TODO: move to separate class
    this.setMapPixelSizes = function()
    {
        //pixelsX - width of sheet (pixels)
        //pixelsY - height of sheet (pixels)
        var pixelsX = m_sheet.get('maxx') - m_sheet.get('minx') + 1;
        var pixelsY = m_sheet.get('maxy') - m_sheet.get('miny') + 1;
        var dpi = m_sheet.get('dpi');
        $("#sow_final_sheet_options", m_container).text( pixelsX + "x" + pixelsY + " pixels, " + dpi + " dpi" );
        
        if (m_sheet.get('pixel_count') > MAX_PIXELS)
            $("#sow_final_sheet_options", m_container).addClass("too_big_sheet").append(" (too big)")
        else
            $("#sow_final_sheet_options", m_container).removeClass("too_big_sheet");
    }
    
    var DEFAULT_SCALE = 500;
    var DEFAULT_PRESET = 'A4';
    

    var m_container = container;
    var m_logger = logger;
    var m_sheet = sheet;
    
    var m_sizePresets = {};
    m_sizePresets['A3'] = { sizex: 29.7, sizey: 42.0 };
    m_sizePresets['A4'] = { sizex: 21.0, sizey: 29.7 };
    
    for (var p in m_sizePresets)
        $('#sow_size_preset', m_container).prepend($('<option></options>').attr({value: p}).text(p));
    
    $('#sow_size_preset', m_container).val(DEFAULT_PRESET)
    updateSizesFromSizePreset(DEFAULT_PRESET);
    
    $("#sow_scale", m_container).val(DEFAULT_SCALE); 

    updateSheetOptionsFromWidget();

    $(m_sheet).bind('change', this.setMapPixelSizes);
    
    $("#sow_landscape, #sow_portr", m_container).bind("change", function()
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
            if ( map.layers[k].name in namesMap && map.layers[k].visibility )
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
// - size_x, size_y (get/set) - centimeters
// - scale (get/set) - meters in centimeter
// - resolution (get/set) - tile level (13, 14, etc)
// - center (get/set) - {OpenLayers.LonLat}
// - ne, sw, nw, se (get) - {OpenLayers.LonLat}
// - minx, miny, maxx, maxy (get) - coordinates in raster of corresponding zoom level (pixels)
// - dpi (get) - double, pixels per inch
// - pixel_count (get) - number of pixels in rendered sheet

// converter - {CoordinatesConverter}
Sheet = function( converter )
{
    this.set = function(properties)
    {
        var isChanged = false;
        for (var propName in properties)
            if (typeof ( m_data[propName] ) != 'undefined')
            {
                m_data[propName] = properties[ propName ];
                m_bNeedUpdateCorners = true;
                isChanged = true;
            }
            
        if (isChanged) $(m_this).trigger('change');
    }
    
    this.get = function(property)
    {
        if ( typeof(m_data[property]) != 'undefined' ) return m_data[property];
        if ( typeof(m_corners[property]) != 'undefined' )
        {
            updateCornersFromCenter();
            return m_corners[property];
        }
        
        if ( property == 'dpi' )
        {
            updateCornersFromCenter();
            var pixelsX = m_corners.maxx - m_corners.minx + 1;
            var pixelsY = m_corners.maxy - m_corners.miny + 1;
            return Math.round((pixelsX/m_data.size_x + pixelsY/m_data.size_y)/2*INCH2CM);
        }
        
        if ( property == 'pixel_count' )
        {
            updateCornersFromCenter();
            var pixelsX = m_corners.maxx - m_corners.minx + 1;
            var pixelsY = m_corners.maxy - m_corners.miny + 1;
            return pixelsX*pixelsY;
        }
    }
    
    this.isDataValid = function()
    {
        return (!isNaN(m_data.size_x) && m_data.size_x > 0) && 
               (!isNaN(m_data.size_y) && m_data.size_y > 0) &&
               (!isNaN(m_data.scale)  && m_data.scale > 0 ) &&
                !isNaN(m_data.resolution) && m_data.center;
    }
    
    //Updates coordinates of rectangle corners using center coordinates and size of rectangle
    //Following properties are updated: ne, sw, nw, se, minx, miny, maxx, maxy
    var updateCornersFromCenter = function()
    {
        if ( !m_bNeedUpdateCorners || !m_data.center || !m_data.size_x || !m_data.size_y) return;
        
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
        getDeltaLatLng( m_data.center.lat, m_data.size_x*m_data.scale/2, m_data.size_y*m_data.scale/2, delta );
        m_corners.ne = new OpenLayers.LonLat( m_data.center.lon + delta.dLng, m_data.center.lat + delta.dLat );
        m_corners.sw = new OpenLayers.LonLat( m_data.center.lon - delta.dLng, m_data.center.lat - delta.dLat );
        
        var zoom = m_data.resolution;
        
        var pne = m_converter.lonlat2pixel(m_corners.ne, zoom);
        var psw = m_converter.lonlat2pixel(m_corners.sw, zoom);
        
        m_corners.nw = m_converter.pixel2lonlat( {x: psw.x, y:pne.y}, zoom );
        m_corners.se = m_converter.pixel2lonlat( {x: pne.x, y:psw.y}, zoom );
        
        m_corners.minx = psw.x;
        m_corners.miny = pne.y;
        m_corners.maxx = pne.x;
        m_corners.maxy = psw.y; 
    }
    
    var m_this = this;
    var m_data = { size_x: NaN, 
                   size_y: NaN, 
                   scale: NaN, 
                   resolution: NaN, 
                   center: null };
                   
    var m_corners = { ne: null, sw: null,
                      nw: null, se: null,
                      minx: NaN, maxx: NaN, 
                      miny: NaN, maxy: NaN };
                      
    var m_converter = converter;
    
    var m_bNeedUpdateCorners = true;
}
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////// Render Widget ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////

//helper function
constructRenderData = function( sheet, mapLayoutWidget )
{
    if ( !sheet.isDataValid() )
    {
        alert("Enter correct sheet options!");
        return;
    }
    
    var zoom = sheet.get('resolution');
    var ne = sheet.get('ne');
    var sw = sheet.get('sw');
    var nw = sheet.get('nw');
    var se = sheet.get('se');
    
    var renderData = {zoom: zoom, 
            minx: sheet.get('minx'),   miny: sheet.get('miny'), 
            maxx: sheet.get('maxx'),   maxy: sheet.get('maxy'), 
            lenx: sheet.get('size_x'), leny: sheet.get('size_y'), 
            ne: [ne.lat, ne.lon], 
            nw: [nw.lat, nw.lon], 
            se: [se.lat, se.lon], 
            sw: [sw.lat, sw.lon] };
            
    if (sheet.get('pixel_count') > MAX_PIXELS)
    {
        alert('Too big sheet! Limit is ' + MAX_PIXELS + ' pixels');
        return;
    }
    
    var mapLayoutData = mapLayoutWidget.getMapLayout();
    renderData['map_layout'] = mapLayoutData;
    return renderData;
}

//Simple render. Creates button "Render". When it is pressed, 
//send request to server and creates links to image and map files, when rendering is finished
RenderWidget = function( sheet, mapLayoutWidget, logger )
{    
    var renderSheet = function()
    {
        var renderData = constructRenderData( sheet, m_mapLayoutWidget );
        if (!renderData) return;
        
        var downloadLink = $('#download_link', m_renderDiv);
        downloadLink.text('Rendering in process...');
        
        $.ajax({type:"get", url: "cgi-bin/render.cgi", data: renderData, dataType: "json", success: function(data)
        {
            if (data.error)
            {
                alert("Error during rendering: " + data.error);
                downloadLink.empty();
                return;
            }
            
            downloadLink.html($('<a></a>').attr({href: 'sheets/'+data.pic_filename, target: '_blank'}).text('Rendered picture file'))
                               .append($('<br/>'))
                               .append($('<a></a>').attr({href: 'sheets/'+data.map_filename, target: '_blank'}).text('Rendered map file'));
            
            if (data.debug) m_logger.message("Debug from server: <br/><i>" + data.debug.join('<br/>') + '</i>');
        }, error: function(request, textStatus, error){
            alert("Error at server!\nStatus: " + textStatus + "\nError: " + error);
            downloadLink.empty();
        }});
    }
    
    var m_mapLayoutWidget = mapLayoutWidget;
    var m_renderDiv = $("#renderWidget");
    var m_logger = logger;
    var m_this = this;
    
    $("#renderButton", m_renderDiv).bind('click', renderSheet);
}

//Render for internal load testing. When button "Render" is pressed, 
//sends to server simultaneously several requests to render sheets and all links of rendered images
LoadRenderWidget = function( sheet, mapLayoutWidget, logger )
{
    var m_renderDiv = $("#renderWidget");
    m_renderDiv.height(600);
    var RENDER_REQUEST_COUNT = 20;
    // var m_currentlyRendered = 0;
    var downloadLink = $('#download_link', m_renderDiv);
    
    var successedRender = function(data)
    {
        downloadLink.append($('<a></a>').attr({href: 'sheets/'+data.pic_filename}).text('Rendered picture file'))
                    .append($('<br/>'));
    }
    
    var renderSheet = function()
    {
        var renderData = constructRenderData( sheet, mapLayoutWidget );
        if (!renderData) return;
        
        downloadLink.empty();
        
        for (var sh = 0; sh < RENDER_REQUEST_COUNT; sh++)
            $.ajax({type:"get", url: "cgi-bin/render.cgi", data: renderData, dataType: "json", 
                    success: successedRender});
        
    }
    
    $("#renderButton", m_renderDiv).bind('click', renderSheet);
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////// Loggers /////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//Interface ILogger: message(message). "message" is any string. Return none.

//Creates div for messages and writes messages to it is simple text
DivLogger = function()
{
    this.message = function( message )
    {
        m_logDiv.prepend( message + "<br>" );
    }
    
    var m_logDiv = $('<div></div>').addClass('ui-widget-content divLoggerDiv');
    $("body").append(m_logDiv);
    
};

//Do nothing with messages
NullLogger = function(){ this.message = function(){}; };