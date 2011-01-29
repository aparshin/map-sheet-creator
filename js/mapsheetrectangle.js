ToggleLayerVisibilityByKeyboardControl = OpenLayers.Class(OpenLayers.Control, 
{
    m_toggle: null,
    m_layer: null,
    
    initialize: function(keyCode, toggleLayer) {
        OpenLayers.Control.prototype.initialize.apply(this); 
        this.handler = new OpenLayers.Handler.Keyboard(
            this, {'keyup': this.trigger} );
        
        m_toggle = keyCode;
        m_layer = toggleLayer;
    }, 

    trigger: function(e) {
        // var l = '';
        // for (var k in e) l += k + '\n';
        // alert(l);
        if ( e.altKey && m_toggle == e.keyCode && m_layer )
            m_layer.setVisibility( !m_layer.getVisibility() );
    }

});

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
    
    //bounds: {OpenLayers.Bounds} - rectangle bounds. If bounds==null, no rectangle will be rendered
    this.addLonlatBounds = function( bounds )
    {
        if (m_curFeature) m_polygonLayer.removeFeatures([m_curFeature]);
        if ( bounds )
        {
            m_curFeature = new OpenLayers.Feature.Vector(m_converter.lonlat2map(bounds).toGeometry(), {}, m_style);
            m_polygonLayer.addFeatures([m_curFeature]);
        }
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
    
    var m_keyControl = new ToggleLayerVisibilityByKeyboardControl(72, m_polygonLayer); //h button
    map.addControl( m_keyControl );
    m_keyControl.activate();
    
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
* mapManager {OpenLayers.Map}: map to draw rectangle to
* center {OpenLayers.LonLat}
* logger {ILogger}: object for log writing
* sheet {Sheet}: data object
*/
MapSheetRectangle = function(map, center, logger, sheet)
{
    this.redraw = function()
    {
        if (!m_sheet.isDataValid())
        {
            m_mapManager.addLonlatBounds(null);
            return;
        }
        var ne = m_sheet.get('ne');
        var sw = m_sheet.get('sw');
        if (!ne || !sw) return;
        
        var rectangleBounds = new OpenLayers.Bounds();
        rectangleBounds.extend( ne );
        rectangleBounds.extend( sw );
        m_mapManager.addLonlatBounds(rectangleBounds);
    }
        
    // var m_mapManager = mapManager;
    var m_mapManager = new MapManager(map, {fillColor: "#ff0000", fillOpacity: 0.5});
    var m_logger = logger;
    var m_sheet = sheet;
    var m_converter = new CoordinatesConverter( map );
    
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