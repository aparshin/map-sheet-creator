///////////////////////////////////////////////////////////////////////////////
///////////////////////////// SheetController /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//Trigger events: move(any changes of position or sizes)

MapSheetRectangle = function(map, center, borderColor, borderWidth, opacity, logger)
{
    var updateCornersFromCenter = function()
    {
        var getDeltaLatLng = function(srcLatLng, distX, distY, outDelta)
        {
            var R = 6378137; //earth radius, meters
            outDelta.dLat = distY/R;
            
            var tan2 = Math.tan(distX/R);
            tan2 *= tan2;
            var a = tan2/(1+tan2);
            var cos2 = Math.cos(srcLatLng.lat()/180*Math.PI);
            cos2 *= cos2;
            outDelta.dLng = Math.asin(Math.sqrt(a/cos2));
            
            outDelta.dLat *= 180/Math.PI;
            outDelta.dLng *= 180/Math.PI;
        }
        
        var delta = {};
        getDeltaLatLng( m_center, m_lengthX/2, m_lengthY/2, delta );
        m_ne = new GLatLng( m_center.lat() + delta.dLat, m_center.lng() + delta.dLng );
        m_sw = new GLatLng( m_center.lat() - delta.dLat, m_center.lng() - delta.dLng );
    }
    
    //supposes that lat and lng of the rectangle didn't change
    this.redraw = function()
    {
        if (!m_ne || !m_sw) return;
        
        var pixelNE = m_map.fromLatLngToContainerPixel(m_ne);
        var pixelSW = m_map.fromLatLngToContainerPixel(m_sw);
        m_div.style.display = 'block';
        m_div.style.left = pixelSW.x + 'px';
        m_div.style.top  = pixelNE.y + 'px';
        m_div.style.width  = (pixelNE.x - pixelSW.x - 2*m_borderWidth) + 'px';
        m_div.style.height = (pixelSW.y - pixelNE.y - 2*m_borderWidth) + 'px';
        // m_div.style.opacity = m_opacity;
        $(m_div).css({opacity: m_opacity});
        m_div.style.borderColor = m_borderColor;
        m_div.style.borderWidth = m_borderWidth + 'px';
        // m_logger.message( "W: " + m_div.style.width + "; H: " + m_div.style.height );
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
    
    this.getNE = function(){ return m_ne; };
    this.getSW = function(){ return m_sw; };
    
    var DIV_CLASS = "sheet";
    var DIV_CONTAINER_ID = "sheet_container";

    var m_this = this;
    var m_logger = logger;
    var m_map = map;
    var m_borderColor = borderColor;
    var m_borderWidth = borderWidth;
    var m_opacity = opacity;
    var m_center = center;
    var m_lengthX = 0;
    var m_lengthY = 0;
    var m_ne = {};
    var m_sw = {};
    
    var m_div = $('<div></div>').addClass('ui-widget-content').addClass(DIV_CLASS).draggable().css({position:'absolute', display: 'none'}).get(0);
    $('#'+DIV_CONTAINER_ID).append(m_div);

    $(m_div).bind('dragstop', function(event, ui) {
        var left   = parseInt(this.style.left.slice(0, this.style.left.length - 2));
        var width  = parseInt(this.style.width.slice(0, this.style.width.length - 2)) + 2*m_borderWidth;
        var top    = parseInt(this.style.top.slice(0, this.style.top.length - 2));
        var height = parseInt(this.style.height.slice(0, this.style.height.length - 2)) + 2*m_borderWidth;
        
        m_center = m_map.fromContainerPixelToLatLng( new GPoint( left + width/2, top + height/2 ) );
        updateCornersFromCenter();
        m_this.redraw();
                
        $(m_this).trigger('move');
    });
    
    GEvent.addListener( map, "move", this.redraw );
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
        m_logger.message('Distance Y1: ' + sw.distanceFrom( new GLatLng(ne.lat(), sw.lng()) ));
        m_logger.message('Distance Y2: ' + ne.distanceFrom( new GLatLng(sw.lat(), ne.lng()) ));
        m_logger.message('Distance X1: ' + sw.distanceFrom( new GLatLng(sw.lat(), ne.lng()) ));
        m_logger.message('Distance X2: ' + ne.distanceFrom( new GLatLng(ne.lat(), sw.lng()) ));
        
        var sheetData = m_this.getSheetData();
        var sizeX = sheetData.maxx - sheetData.minx + 1;
        var sizeY = sheetData.maxy - sheetData.miny + 1;
        m_sheetOptionsWidget.setMapPixelSizes(sizeX, sizeY);
    }
    
    this.getSheetData = function()
    {
        var sheetOptions = m_sheetOptionsWidget.getSheetOptions();
        var projection = m_map.getCurrentMapType().getProjection();
        
        var zoom = sheetOptions.m_resolution;
        var ne = m_mapSheetRectangle.getNE();
        var sw = m_mapSheetRectangle.getSW();
        var pne = projection.fromLatLngToPixel(ne, zoom);
        var psw = projection.fromLatLngToPixel(sw, zoom);
        var nw = projection.fromPixelToLatLng(new GPoint(psw.x, pne.y), zoom);
        var se = projection.fromPixelToLatLng(new GPoint(pne.x, psw.y), zoom);
        
        return {zoom: zoom, minx: psw.x, miny: pne.y, maxx: pne.x, maxy: psw.y, 
                lenx: sheetOptions.m_sizeX, leny: sheetOptions.m_sizeY, 
                ne: [ne.lat(), ne.lng()], 
                nw: [nw.lat(), nw.lng()], 
                se: [se.lat(), se.lng()], 
                sw: [sw.lat(), sw.lng()] };
    };

    var m_map = map;
    var m_logger = logger;
    var m_this = this;    
    
    var m_sheetOptionsWidget = new SheetOptionsWidget( $("#sheetOptionsWidgetContainer"), logger );
    $(m_sheetOptionsWidget).bind("change", onUpdateSheetOptions);
    
    var m_mapSheetRectangle = 
        new MapSheetRectangle( map, map.getCenter(), 'red', 2, 0.5, logger );
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
              width: '300px', height: '200px', top: 0, left: 100});
        
    $("#sheet_container").append(m_logDiv.get(0));
    
};

NullLogger = function(){ this.message = function(){}; };