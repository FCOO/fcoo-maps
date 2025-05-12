/****************************************************************************
    fcoo-maps-havnelods.js,

    (c) 2021, FCOO

    https://github.com/FCOO/fcoo-maps-havnelods
    https://github.com/FCOO

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
	window.fcoo = window.fcoo || {};
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {},
        nsHL = ns.Havnelods = ns.Havnelods || {},
        nsHLOptions = nsHL.options;

    //Add the color-names to the list of colors for markers and polylines
    L.BsMarker._lbmAddColorName('harbor-dk');
    L.BsMarker._lbmAddColorName('harbor-gl');

    //Update options for Havnelods
    nsHLOptions.smallTableWithAllLocations = ns.modernizrDevice.isPhone;
    nsHLOptions.modalIsExtended            = ns.modernizrDevice.isDesktop || ns.modernizrDevice.isTablet;

    //Icon for filter rest-button = gray filter with cross over
    nsHLOptions.resetFilterIcon = [['fal text-secondary fa-filter', 'fa-times']];

    //getDefaultMap return the default map to be used
    nsHLOptions.getDefaultMap = function(){ return nsMap.mainMap; };


    //When a messag is center-on-map the MapLayer is added to the map
    nsHLOptions.onCenterOnMap = function(location, map/*, elem*/){
        var mapLayer = location.parent.mapLayer;
        mapLayer.addTo(map);

        //Zoom to make location visible
        map.setZoom(Math.max(map.getZoom(), mapLayer.options.minZoom || 0), {animate: false});
    };


    /*
    Names for menus:
        Havne og Broer (Danske Havnelods)
        Harbors and Bridges (only in Danish)
    OR
        Danish Harbors and Bridges (only in Danish)
    OR
        Danish Marinas, Ports, and Bridges (only in Danish)
    OR
        Denmark
            Harbors
                (o) Alle / All
                ( ) Kun Erhvervshavne / Only Commertial Ports
                ( ) Kun Lystbådehavne / Only Marinas
            Bridges

    Sub-layers:
    Lystbådehavne / Marinas
    Erhvervshavne / Commertial Ports
    Broer / Bridges

    Greenland:
        By/Town,
        Bygd/Hamlet
        Station/Station

*/

    //createMapLayer = {MAPLAYER_ID: CREATE_MAPLAYER_AND_MENU_FUNCTION} See fcoo-maps/src/map-layer_00.js for description
    nsMap.createMapLayer = nsMap.createMapLayer || {};

    var mapLayer_id_options = {
            "HAVNELODS-HARBORS-DK": {
                colorId         : 'harbor-dk',
                text            : {da: 'Erhv.- og Lystbådehavne (DK)', en: 'Ports and Marinas (DK)'},
                externalUrl     : 'https://www.danskehavnelods.dk',
                minZoom         : 5,
                constructor     : nsHL.Havnelods_DK,
                getLocationGroup: nsHL.getHavnelods_DK
            },

            "HAVNELODS-HARBORS-GL": {
                colorId         : 'harbor-gl',
                text            : {da: 'Byer, Bygder og Stationer (GL)', en: 'Towns, Hamlets, and Stn. (GL)'},
                externalUrl     : 'https://www.gronlandskehavnelods.dk',
                minZoom         : 3,
                constructor     : nsHL.Havnelods_GL,
                getLocationGroup: nsHL.getHavnelods_GL
            },

            "HAVNELODS-BRIDGES-DK": {
                icon            : [['brigde-icon-adjust ' + nsHL.Location_Bridges.prototype.getIcon()]],
                text            : {da: 'Broer (DK)', en: 'Bridges (DK)'},
                externalUrl     : 'https://www.danskehavnelods.dk',
                minZoom         : 6,
                constructor     : nsHL.Havnelods_Bridges,
                getLocationGroup: nsHL.getHavnelods_Bridges
            }
        };

    function havnelodsButtonList(mapLayerId){
        return [{
            icon   : 'fa-th-list',
            text   : {da:'Vis alle', en:'Show all'},
            onClick: function(/*id, selected, $button, map, owner*/){
                let mapLayer      = nsMap.getMapLayer(mapLayerId),
                    locationGroup = mapLayer.locationGroup,
                    arg           = arguments;

                if (locationGroup)
                    locationGroup.asModal.apply(locationGroup, arguments);
                else
                    mapLayer.options.getLocationGroup( function( locationGroup ){
                        mapLayer.locationGroup = mapLayer.locationGroup || locationGroup;
                        locationGroup.mapLayer = mapLayer;
                        locationGroup.asModal.apply(locationGroup, arg);
                    });
            }
         },{
            icon   : 'far fa-link',
            text   : ['abbr:gst', {da: ' version', en:' Version'}],
            onClick: function(){
                function openGSTVersion(locationGroup){
                    window.open( locationGroup.mapLayer.options.externalUrl );
                }

                let mapLayer = nsMap.getMapLayer(mapLayerId),
                    locationGroup = mapLayer.locationGroup;
                if (locationGroup)
                    openGSTVersion(locationGroup);
                else
                    mapLayer.options.getLocationGroup( openGSTVersion );
            }
        }];
    }


    /***********************************************************
    MapLayer_Havnelods
    ***********************************************************/
    function MapLayer_Havnelods(options) {
        nsMap.MapLayer.call(this, options);
    }

    MapLayer_Havnelods.prototype = Object.create(nsMap.MapLayer.prototype);
    MapLayer_Havnelods.prototype.createLayer = function(options = {}){
        this.locationGroup = this.locationGroup || new this.options.constructor(options);
        this.locationGroup.mapLayer = this;
        return this.locationGroup.getGeoJSON(options);
    };


    /***********************************************************
    Add all versions of MapLayer_Havnelods to createMapLayer
    ***********************************************************/
    function location_onClickPosition( location ){
        if (location.latLng)
            location.latLng.asModal({header: location.header});
    }

    $.each(mapLayer_id_options, function(id, mapLayerOptions){
        mapLayerOptions = $.extend(true, {
            icon            : L.bsMarkerAsIcon(mapLayerOptions.colorId, 'black', false),
            minZoom         : 6,
            createMarkerPane: true,
            layerOptions    :{
                onClickPosition: location_onClickPosition
            },
            buttonList: havnelodsButtonList(id),
            menuOptions: {
                useLegendButtonList: true,
                showAllways        : true
            }
        }, mapLayerOptions);

        nsMap.createMapLayer[id] = function(options, addMenu/*, adjustParentMenuOptions*/){
            var mapLayer = nsMap._addMapLayer(id, MapLayer_Havnelods, mapLayerOptions );
            addMenu(mapLayer.menuItemOptions());
        };
    });

}(jQuery, L, this, document));

