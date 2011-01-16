TrackWidget = function(m_map, m_container)
{
    //var m_tracksDiv = $('<div></div>').addClass('ui-widget-content divTrackWidget');
    //m_tracksDiv.append($('<form></form>').append($('<input></input>').attr({type:'button', value: 'Add track'})));
    //$("body").append(m_tracksDiv);
    
    var m_trackLayers = [];
    
    $("#tw_frame", m_container).bind('load', function(){
        alert( "Frame: " + $("#tw_frame", m_container).contents().find('body').text() );
    })
    
    $("#tw_add", m_container).bind('click', function()
    {
        alert( $("#tw_upload", m_container).val() );
        var trackLocation = $("#tw_web", m_container).val();
        
        if ( !trackLocation )
        {
            alert('Enter track location!');
            return;
        }
        
        var m_trackLayer = new OpenLayers.Layer.GML('Track Layer', trackLocation, 
                        {format: OpenLayers.Format.GPX,
                         style: {strokeColor: "blue", strokeWidth: 3, strokeOpacity: 1},
                         projection: new OpenLayers.Projection("EPSG:4326"),
                         displayInLayerSwitcher: false});
                         
        map.addLayers([m_trackLayer]);    
    });
}

TrackData = function()
{
    
}