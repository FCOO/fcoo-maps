/****************************************************************************
fcoo-maps-leaflet
Objects and methods to handle leaflet-maps
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
	"use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /***********************************************************
    Leaflet
    ***********************************************************/
    //Set default path to leaflet icon images
    L.Icon.Default.imagePath = "images/";

    //BUGFIX - in Chrome and IE on desktop leaflet L.Browser.touch will get set to true - instead using Modernizr.touchevents to remove
    L.Map.addInitHook(function () {
        if (window.Modernizr && window.Modernizr.touchevents === false)
            $(this.getContainer()).removeClass('leaflet-touch');

    });

    /***********************************************************
    List of maps
    ***********************************************************/
    //Create a list of all maps-object created
    nsMap.mapList = {};
    nsMap.mapIndex = [];
    var map_index = 0;

    function whenReady(){
        nsMap.mapIndex[this.fcooMapIndex] = this;
        nsMap.mapList[this.fcooMapId] = this;
    }
    function onUnload() {
        nsMap.mapIndex[this.fcooMapIndex] = null;
        nsMap.mapList[this.fcooMapId] = null;
    }

    L.Map.addInitHook(function () {
        this.fcooMapIndex = map_index;
        this.fcooMapId = 'fcooMap'+ map_index;
        map_index++;
        this.whenReady( whenReady );
        this.on('unload', onUnload);
    });

    //nsMap.visitAllMaps: Call method(map) for all maps
    nsMap.visitAllMaps = function(method){
        $.each(nsMap.mapIndex, function(index, map){
            if (map)
                method(map);
        });
    };

    //nsMap.callAllMaps: Call methodName with arg (array) for all maps
    nsMap.callAllMaps = function(methodName, arg){
        $.each(nsMap.mapList, function(id, map){
            if (map && map[methodName])
                map[methodName].apply(map, arg);
        });
    };


    /***********************************************************
    ************************************************************
    Options for Leaflet.Map
    1: Default options for all maps
    2: Options for the main map
    3: options for secondary maps (index 1-4)
    ************************************************************
    ***********************************************************/

    /***********************************************************
    1: Default options for all maps
    ***********************************************************/
    L.Map.mergeOptions({

        //Set default minZoom and maxZoom
        minZoom:  3,
        maxZoom: 12,

        zoomSnap: 0.25,

        //Hide attribution
        attributionControl: false,

        //Show default zoom-control
        zoomControl: true,

        //Adjust zoom-speed to be a bit slower
        wheelPxPerZoomLevel: 100,

        //worldCopyJump: With this option enabled, the map tracks when you pan to another "copy" of the world and
        //seamlessly jumps to the original one so that all overlays like markers and vector layers are still visible.
        worldCopyJump: true,

        //Set zoom by mouse wheel to keep center
        //Both scrollWheelZoom and googleScrollWheelZoom is Boolean|String: Whether the map can be zoomed by using the mouse wheel.
        //If passed 'center', it will zoom to the center of the view regardless of where the mouse was.
        scrollWheelZoom      : true,
        googleScrollWheelZoom: false,   //googleScrollWheelZoom not included

        //Set default bounding to prevent panning round - MANGLER: ER der brug for denne??
        maxBounds: L.latLngBounds([-90, -230],    //southWest
                                  [+90, +230])    //northEast
    });


    /***********************************************************
    2: Options for the main map
    ***********************************************************/
    nsMap.mainMapOptions = {
        //Marking main map
        isMainMap: true,

        //Hide attribution
        attributionControl: false,

        //Replace default zoom-control with BsZoomControl
        zoomControl  : false,
        bsZoomControl: true,
        bsZoomOptions: {
            position           : 'bottomright',
            map_setView_options: L.Map.prototype._mapSync_NO_ANIMATION
        },

        //Add zoom-modernizr (leaflet-zoom-modernizr)
        zoomModernizr       : true,
        zoomModernizrOptions: {},        //{minZoom,maxZoom}

        //BsPosition = Show position of mouse or map center
        bsPositionControl: true,
        bsPositionOptions: {
            isExtended        : true,
            showCursorPosition: !window.bsIsTouch,
            inclContextmenu   : false,  //Set to true when contextmenu for the map is implemented
            selectFormat      : function(){ ns.globalSetting.edit(ns.events.LATLNGFORMATCHANGED); },
        },

        //bsScale - Scale with nm, km or both
        bsScaleControl: true,
        bsScaleOptions: {
            isExtended          : true,
            maxUnitsWidth       : 360, //Max width (default = 200)
            maxUnitsWidthPercent: 30,  //Max width as percent of map width. 35 is set to prevent the scale from hidding buttons in centerbottom-position
            selectFormat        : function(){ ns.globalSetting.edit(ns.events.UNITCHANGED); },
        },


        //legendControl: Install L.Control.Legend
        legendControl: true,

        //locateControl: Install leaflet.locatecontrol
        locateControl: true,

        //routeControl: Install L.Control.Route
        routeControl: false,

        //permalinkControl: Install L.Control.Permalink
        permalinkControl: true,

        doubleClickZoom: true, //Default Leaflet

        //latLngGraticule: Install leaflet-latlng-graticule
        latLngGraticule: true,
        latLngGraticuleOptions: {
            show     : true,
            type     : L.latLngGraticuleType.TYPE_MAJOR_LINE + L.latLngGraticuleType.TYPE_MINOR_TICK,
            showLabel: true
        },

        //L.Control.Setting
        bsSettingControl: true,

        //No map sync control on main map
        mapSyncControl: false,

    };

    /***********************************************************
    2: Options for secondary maps (index 1-4)
    ***********************************************************/
    nsMap.secondaryMapOptions = $.extend(true, {}, nsMap.mainMapOptions, {
        isMainMap: false,


        //bsZoomControl without history
        bsZoomControl: true,
        bsZoomOptions: {
            isExtended    : false,
            showHistory   : false,
            historyEnabled: false
        },

        //No zoom-modernizr - only used for search in main-map
        zoomModernizr: false,

        //legendControl: Install L.Control.Legend
        legendControl: false,

        //locateControl: Install leaflet.locatecontrol
        locateControl: false,

        //routeControl: Install L.Control.Route
        routeControl: false,


        //permalinkControl: Install L.Control.Permalink
        permalinkControl: false,

        //latLngGraticule: Install leaflet-latlng-graticule. If latLngGraticule !== true => use latLngGraticule as options.type for leaflet-latlng-graticule
//HER        latLngGraticule       : false,
//HER        latLngGraticuleOptions: {showLabel: true},

        //Add map-sync control
        mapSyncControl: true,
//HER        mapSyncOptions: {active: false},
    });


    /***********************************************************
    ************************************************************
    Install Leaflet controls
    ************************************************************
    ***********************************************************/

    //********************************************
    //legendControl: Install L.Control.Legend
    L.Map.mergeOptions({
        legendControl: false,
        legendControlOptions: {}
    });
    L.Map.addInitHook(function () {
        if (this.options.legendControl){
            this.legendControl = new L.Control.Legend(
                $.extend(
                    {
                        position: 'topright',
                        height  : 0.8
                    },
                    this.options.legendControlOptions
                )
            );
            this.legendControl.minimized = true; //Bug fix
            this.addControl(this.legendControl);
        }
    });

    //********************************************
    //locateControl: Install leaflet.locatecontrol
    L.Map.mergeOptions({
        locateControl: false
    });
    L.Map.addInitHook(function () {
        //Remove old hash-tags not used anymore
        window.Url.updateHashParam('locate');
        window.Url.updateHashParam('follow');

        if (this.options.locateControl){
            this.locateControl = new L.Control.Locate();
            this.addControl(this.locateControl);
        }
    });

    //********************************************
    //routeControl: Install L.Control.Route
    L.Map.mergeOptions({
        routeControl: false
    });
    L.Map.addInitHook(function () {
        if (this.options.routeControl){
            this.routeControl = new L.Control.Route();
            this.addControl(this.routeControl);
        }
    });

    //********************************************
    //permalinkControl: Install L.Control.Permalink
    L.Map.mergeOptions({
        permalinkControl: true
    });
    L.Map.addInitHook(function () {

//MANGLER: Skal checke for om localStorage kan tilgås. Hvis ikke => ingen installation
        if (this.options.permalinkControl){
            this.permalinkControl = new L.Control.Permalink({
                useLocation    : !ns.standalone,
                useLocalStorage: ns.standalone,
                localStorageId : ns.localStorageTempKey,
                postfix        : this.options.mapIndex || ''
            });

            //Add the control when the map is ready
            this.whenReady(function(){
                this.addControl(this.permalinkControl);
                L.DomUtil.addClass( this.permalinkControl.getContainer(), 'hide-for-print' );
            }, this);
        }
    });

    //********************************************
    //Install leaflet-latlng-graticule.
    //If options.latLngGraticule !== true => use latLngGraticule as options.type for leaflet-latlng-graticule
    L.Map.mergeOptions({
        latLngGraticule       : false,
        latLngGraticuleOptions: {}
    });
    L.Map.addInitHook(function () {
        if (this.options.latLngGraticule){
            this.latLngGraticule = L.latLngGraticule(this.options.latLngGraticuleOptions);
            this.latLngGraticule.addTo(this);
        }
    });

    //********************************************
    //Simple parameter hidecontrols => hide all controls (bug fix: using opacity) - TODO: To be removed in later versions
    L.Map.addInitHook(function () {
        if (window.Url.queryString('hidecontrols'))
            $('.leaflet-control-container').css('opacity',0);
    });


}(jQuery, L, this, document));



