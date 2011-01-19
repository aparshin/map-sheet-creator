TrackWidget = function(m_map, m_container)
{
    var m_trackLayers = [];
    var addTrack = function( trackURL )
    {
        // alert( $("#tw_upload", m_container).val() );
        // var trackLocation = $("#tw_web", m_container).val();
        
        if ( !trackURL )
        {
            alert('Enter track location!');
            return;
        }
        
        var m_trackLayer = new OpenLayers.Layer.GML('Track Layer', trackURL, 
                        {format: OpenLayers.Format.GPX,
                         style: {strokeColor: "blue", strokeWidth: 3, strokeOpacity: 1},
                         projection: new OpenLayers.Projection("EPSG:4326"),
                         displayInLayerSwitcher: false});
                         
        map.addLayers([m_trackLayer]);
    }
    
    $("#tw_frame", m_container).bind('load', function(){
        var trackURLs = $("#tw_frame", m_container).contents().find('body').text();
        // alert(trackURLs);
        trackURLs = eval(trackURLs);
        for ( var k = 0; k < trackURLs.length; k++ )
            addTrack(trackURLs[k]);
            
        $("#tw_reset", m_container).trigger('click');
    })
}