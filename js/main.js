///////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Map Manager ///////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
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
        //var lonlatMapProj = this.lonlat2Map(lonlat);
        var resolution = map.getResolutionForZoom( zoom );
        
        var lon = pixel.x*resolution + map.maxExtent.left;
        var lat = map.maxExtent.top - pixel.y*resolution;
        
        return this.map2lonlat( new OpenLayers.LonLat( lon, lat ) );
    }
    
    
    this.setDragCompleteCallback = function( callback )
    {
        m_dragControl.onComplete = callback;
    }
    
    this.addLonlatBounds = function( bounds, style )
    {
        if (m_curFeature) m_polygonLayer.removeFeatures([m_curFeature]);
        m_curFeature = new OpenLayers.Feature.Vector(this.lonlat2Map(bounds).toGeometry(), {}, m_style);
        m_polygonLayer.addFeatures([m_curFeature]);
    }
    
    var m_map = map;
    var m_style = style;
        
    var m_polygonLayer = new OpenLayers.Layer.Vector("Polygon Layer");
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
//Trigger events: move(any changes of position or sizes)
/**
* map: OpenLayers.Map
* vectorLayer: OpenLayers.Layer.Vector
* center: OpenLayers.LonLat
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
    
    //supposes that lat and lon of the rectangle didn't change
    this.redraw = function()
    {
        if (!m_ne || !m_sw) return;
        
        var lonlatProjection = new OpenLayers.Projection("EPSG:4326");
        var rectangleBounds = new OpenLayers.Bounds();
        rectangleBounds.extend( m_ne );
        rectangleBounds.extend( m_sw );
        m_mapManager.addLonlatBounds(rectangleBounds);
    }
    
    this.setSize = function(sizeX, sizeY)
    {
        m_logger.message("Set size: " + sizeX + ", " + sizeY);
        m_lengthX = sizeX;
        m_lengthY = sizeY;
        updateCornersFromCenter();
        this.redraw();
        $(m_this).trigger('move');
    }
    
    this.getNE = function(){ return m_ne.clone(); };
    this.getSW = function(){ return m_sw.clone(); };
    
    var m_mapManager = mapManager;
    var m_this = this;
    var m_logger = logger;
    var m_map = map;
    var m_center = center;
    var m_lengthX = 0;
    var m_lengthY = 0;
    var m_ne = {};
    var m_sw = {};
    
    m_mapManager.setDragCompleteCallback( function(feature, point)
    {
        //invariant of rectangle is its center and length (in meters). 
        //So, calculate center and fit size of rectangle on screen
        var centerMapProj = feature.geometry.getBounds().getCenterLonLat();
        m_center = m_mapManager.map2lonlat(centerMapProj);
        
        updateCornersFromCenter();
        m_this.redraw();
                
        $(m_this).trigger('move');        
    });
}


///////////////////////////////////////////////////////////////////////////////
///////////////////////////// SheetController /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
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
        
        //var lonlatProjection = new OpenLayers.Projection("EPSG:4326");
        
        //var pne = ne.clone().transform( lonlatProjection, map.getProjectionObject());
        // var pne = projection.fromLatLngToPixel(ne, zoom);
        // var psw = projection.fromLatLngToPixel(sw, zoom);
        // var nw = projection.fromPixelToLatLng(new GPoint(psw.x, pne.y), zoom);
        // var se = projection.fromPixelToLatLng(new GPoint(pne.x, psw.y), zoom);
        // var pne = {x:0, y:0};
        // var psw = {x:0, y:0};
        // var nw = {lat:0, lon:0};
        // var se = {lat:0, lon:0};
        
        return {zoom: zoom, minx: psw.x, miny: pne.y, maxx: pne.x, maxy: psw.y, 
                lenx: sheetOptions.m_sizeX, leny: sheetOptions.m_sizeY, 
                ne: [ne.lat, ne.lon], 
                nw: [nw.lat, nw.lon], 
                se: [se.lat, se.lon], 
                sw: [sw.lat, sw.lon] };
    };

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
SheetOptions = function()
{
    this.m_sizeX = 0;
    this.m_sizeY = 0;
    this.m_scale = 0;
    this.m_resolution = 0;
    this.m_orientation = 0; //0 - undef, 1 - albom, 2 - portrait
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////// SheetOptionsWidget //////////////////////////
///////////////////////////////////////////////////////////////////////////////
//Fire events: change
SheetOptionsWidget = function( container, logger )
{
    var updateSheetOptionsFromWidget = function()
    {
        m_sheetOptions.m_orientation = $("#sow_albom", m_container).attr("checked") ? 1 : 2;
        m_sheetOptions.m_sizeX = $("#sow_sizex", m_container).val();
        m_sheetOptions.m_sizeY = $("#sow_sizey", m_container).val();
        m_sheetOptions.m_scale = $("#sow_scale", m_container).val();
        m_sheetOptions.m_resolution = $("select[name=resolution]", m_container).val();
        m_logger.message('Updating sheet options: '+ m_sheetOptions.m_orientation + ',' + 
            m_sheetOptions.m_sizeX + ',' + m_sheetOptions.m_sizeY + ',' + 
            m_sheetOptions.m_scale + ',' + m_sheetOptions.m_resolution);
        $(m_this).trigger("change");
    }
    
    var updateSizesFromSizePreset = function(presetName)
    {
        var isAlbom = $("#sow_albom", m_container).attr("checked");
        var sizex = m_sizePresets[presetName].sizex;
        var sizey = m_sizePresets[presetName].sizey;
        
        $("#sow_sizex", m_container).val( isAlbom ? sizex : sizey );
        $("#sow_sizey", m_container).val( isAlbom ? sizey : sizex );
    }
    
    this.setMapPixelSizes = function(sizeX, sizeY)
    {
        var dpi = Math.round((sizeX/m_sheetOptions.m_sizeX + sizeY/m_sheetOptions.m_sizeY)/2*INCH2CM);
        // var dpi = (sizeX/m_sheetOptions.m_sizeX + sizeY/m_sheetOptions.m_sizeY)/2*INCH2CM;
        // var dpi_x = sizeX/m_sheetOptions.m_sizeX*INCH2CM;
        // var dpi_y = sizeY/m_sheetOptions.m_sizeY*INCH2CM;
        $("#sow_final_sheet_options", m_container).text( sizeX + "x" + sizeY + " pixels, " + dpi + " dpi" );
    }
    
    this.getSheetOptions = function(){ return m_sheetOptions; };
    
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
///////////////////////////////// Loggers /////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
MapLayoutWidget = function( widgetContainer )
{
    //$("#available_maps li,#maps_layout li", widgetContainer).addClass("ui-state-default");
    //$("#available_maps li", widgetContainer).draggable({appendTo: "body", helper:"clone", connectToSortable: "#maps_layout"});
    //$("#maps_layout", widgetContainer).sortable();
    // $("#maps_layout", widgetContainer).droppable({
			// activeClass: "ui-state-default",
			// hoverClass: "ui-state-hover",
			// accept: ":not(.ui-sortable-helper)",
			// drop: function( event, ui ) {
				// $( this ).find( ".placeholder" ).remove();
				// $( "<li></li>" ).text( ui.draggable.text() ).appendTo( this );
			// }
		// }).sortable({
			// items: "li:not(.placeholder)",
			// sort: function() {
				// // gets added unintentionally by droppable interacting with sortable
				// // using connectWithSortable fixes this, but doesn't allow you to customize active/hoverClass options
				// $( this ).removeClass( "ui-state-default" );
			// }
		// });
    this.getMapLayout = function() { return "arbalet,slazav"; };
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////// Loggers /////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//Interface: message(message). "message" is any string. Return none.
DivLogger = function()
{
    this.message = function( message )
    {
        m_logDiv.prepend( message + "<br>" );
    }
    
    var m_logDiv = $('<div></div>').addClass('ui-widget-content')
        .css({border: 'solid', position:'absolute', overflow:'auto', 
              width: '300px', height: '200px', top: 0, left: 100, zIndex: 2500});
        
    $("#sheet_container").append(m_logDiv.get(0));
    
};

NullLogger = function(){ this.message = function(){}; };