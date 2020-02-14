/****************************************************************************
fcoo-maps-leaflet
Objects and methods to handle leaflet-maps
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
	"use strict";

    window.fcoo = window.fcoo || {};
    var ns = window.fcoo.map = window.fcoo.map || {};

    //Create a list of all maps-object created
    ns.mapList = {};
    ns.mapIndex = [];
    var fcooMapId = 0;

    function whenReady(){
        ns.mapIndex[this.fcooMapIndex] = this;
        ns.mapList[this.fcooMapId] = this;
    }
    function onUnload() {
        ns.mapIndex[this.fcooMapIndex] = null;
        ns.mapList[this.fcooMapId] = null;
    }

    L.Map.addInitHook(function () {
        this.fcooMapIndex = fcooMapId;
        this.fcooMapId = 'fcooMap'+ fcooMapId;
        fcooMapId++;
        this.whenReady( whenReady );
        this.on('unload', onUnload);
    });

    //ns.visitAllMaps: Call method(map) for all maps
    ns.visitAllMaps = function(method){
        $.each(ns.mapIndex, function(index, map){
            if (map)
                method(map);
        });
    };

    //ns.callAllMaps: Call methodName with arg (array) for all maps
    ns.callAllMaps = function(methodName, arg){
        $.each(ns.mapList, function(id, map){
            if (map && map[methodName])
                map[methodName].apply(map, arg);
        });
    };



    /***********************************************************
    Default options for Leaflet.Map
    ***********************************************************/
    ns.mainMapOptions = {
        //Set default minZoom and maxZoom
        minZoom:  3,
        maxZoom: 12,

        zoomSnap: 0.25,

        //Adjust zoom-speed to be a bit slower
        wheelPxPerZoomLevel: 100,

        //Set zoom by mouse wheel to keep center
        //Both scrollWheelZoom and googleScrollWheelZoom is Boolean|String: Whether the map can be zoomed by using the mouse wheel.
        //If passed 'center', it will zoom to the center of the view regardless of where the mouse was.
        scrollWheelZoom      : true,    //false,
        googleScrollWheelZoom: false,   //true,

        //worldCopyJump: With this option enabled, the map tracks when you pan to another "copy" of the world and
        //seamlessly jumps to the original one so that all overlays like markers and vector layers are still visible.
        worldCopyJump: true,

        //Hide attribution
        attributionControl: false,

        //Replace default zoom-control with BsZoomControl
        zoomControl  : false,
        bsZoomControl: true,
        bsZoomOptions: {
            position           : 'bottomright',
            map_setView_options: L.Map.prototype._mapSync_NO_ANIMATION
        },

        //BsPosition = Show position of mouse or map center
        bsPositionControl: true,
        bsPositionOptions: {
            isExtended        : true,
            showCursorPosition: !window.bsIsTouch, //TODO Skal henter fra gemte settings
            inclContextmenu   : false,  //Set to true when contextmenu for the map is implemented
            selectFormat      : null,   //Await fcoo-settings with editing and saving settings
        },

        //bsScale - Scale with nm, km or both
        bsScaleControl: true,
        bsScaleOptions: {
            isExtended          : true,
            maxUnitsWidth       : 360, //Max width (default = 200)
            maxUnitsWidthPercent: 30,  //Max width as percent of map width. 35 is set to prevent the scale from hidding buttons in centerbottom-position
        },


//REMOVED        //languageControl: Install two buttons to change language between Danish and English
//REMOVED        languageControl: true,

//REMOVED        //saveControl: Install saveControl
//REMOVED        saveControl: true,

//REMOVED        //legendControl: Install L.Control.Legend
//REMOVED        legendControl: true,


//REMOVED        //locateControl: Install leaflet.locatecontrol
//REMOVED        locateControl: true,

        //routeControl: Install L.Control.Route
        routeControl: false,

        //permalinkControl: Install L.Control.Permalink
        permalinkControl: true,

//REMOVED        //doubleRightClickZoom: Install Leaflet.DoubleRightClickZoom
//REMOVED        doubleRightClickZoom: true,

        //No map sync control on main map
        mapSyncControl: false,

        //latLngGraticule: Install leaflet-latlng-graticule. If latLngGraticule !== true => use latLngGraticule as options.type for leaflet-latlng-graticule
        latLngGraticule       : false,//L.latLngGraticuleType.TYPE_MAJOR_LINE + L.latLngGraticuleType.TYPE_MINOR_TICK,
        latLngGraticuleOptions: null,
    };

    /***********************************************************
    Options for secondary maps (index 1-4)
    ***********************************************************/
    ns.secondaryMapOptions = $.extend({}, ns.mainMapOptions, {
        bsZoomControl: false,

        //BsPosition = Show position of mouse or map center
        bsPositionControl: false,

        //bsScale - Scale with nm, km or both
        bsScaleControl: false,

        //permalinkControl: Install L.Control.Permalink
        permalinkControl: false,

        //Add map-sync control
        mapSyncControl: true,
        mapSyncOptions: {active: false}
    });








}(jQuery, L, this, document));



