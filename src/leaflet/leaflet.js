/****************************************************************************
leaflet

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


    /***********************************************************
    Map.createSubPane - Creates a new pane under the main pane
    ***********************************************************/
    L.Map.prototype.createSubPane = function(name, parentPaneName, zIndex, classNames=''){
        var newPane = this.getPane(name);
        if (!newPane){
            var parentPane = this.getPane(parentPaneName) || this.getPane(parentPaneName+'Pane');
            newPane = this.createPane(name, parentPane);
            newPane.style.zIndex = zIndex;
            $(newPane).addClass(classNames);
        }
        return newPane;
    };


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
        this.$container = $(this.getContainer());

        //BUGFIX - in Chrome and IE on desktop leaflet L.Browser.touch will get set to true - instead using Modernizr.touchevents to remove
        if (window.Modernizr && window.Modernizr.touchevents === false)
            this.$container.removeClass('leaflet-touch');

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
                method(map, index);
        });
    };

    //nsMap.visitAllVisibleMaps: Call method(map) for all visible maps
    nsMap.visitAllVisibleMaps = function(method){
        $.each(nsMap.mapIndex, function(index, map){
            if (map && map.isVisibleInMultiMaps)
                method(map, index);
        });
    };

    //nsMap.callAllMaps: Call methodName with arg (array) for all maps
    nsMap.callAllMaps = function(methodName, arg){
        $.each(nsMap.mapList, function(id, map){
            if (map && map[methodName])
                map[methodName].apply(map, arg);
        });
    };
    //nsMap.callAllVisibleMaps: Call methodName with arg (array) for all visible maps
    nsMap.callAllVisibleMaps = function(methodName, arg){
        $.each(nsMap.mapList, function(id, map){
            if (map && map[methodName] && map.isVisibleInMultiMaps)
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


        //Allow double right click to zoom out - see src/leaflet/rightclick-zoom.js
        doubleRightClickZoom: true,


        /* *** For map-sync to work no bounds are set ***
        //Set default bounding to prevent panning round
        maxBounds: L.latLngBounds([-90, -230],  //southWest
                                  [+90, +230]), //northEast
        */

        /*
        maxBoundsViscosity:
        If maxBounds is set, this option will control how solid the bounds are when dragging the map around.
        The default value of 0.0 allows the user to drag outside the bounds at normal speed,
        higher values will slow down map dragging outside bounds, and 1.0 makes the bounds fully solid,
        preventing the user from dragging outside the bounds.
        */
        //maxBoundsViscosity: 0.0,

    });


    /***********************************************************
    2: Options for the main map
    ***********************************************************/
    nsMap.mainMapOptions = {
        //Marking main map
        isMainMap: true,


        //Animation Options
//        zoomAnimation	        :       , //Boolean	true    Whether the map zoom animation is enabled. By default it's enabled in all browsers that support CSS3 Transitions except Android.
//        zoomAnimationThreshold	:       , //Number	4	    Won't animate zoom if the zoom difference exceeds this value.
        fadeAnimation	        : false , //Boolean	true    Whether the tile fade animation is enabled. By default it's enabled in all browsers that support CSS3 Transitions except Android.
//        markerZoomAnimation	    :       , //Boolean	true    Whether markers animate their zoom with the zoom animation, if disabled they will disappear for the length of the animation. By default it's enabled in all browsers that support CSS3 Transitions except Android.
//        transform3DLimit	    :       , //Number	2^23    Defines the maximum size of a CSS translation transform. The default value should not be changed unless a web browser positions layers in the wrong place after doing a large panBy.



        //Replace default attribution-control with bsAttributionControl
        attributionControl: false,
        bsAttributionControl: true,
        bsAttributionOptions: {
            position: 'bottomright',
            prefix  : false
        },

        //backgroundLayerControl Add background-layer
        backgroundLayerControl: true,

        //Replace default zoom-control with BsZoomControl
        zoomControl  : false,
        bsZoomControl: true,
        bsZoomOptions: {
            position           : 'topleft',
            map_setView_options: L.Map.prototype._mapSync_NO_ANIMATION,

            icon       : 'fas fa-plus-minus',
            text       : '',
            bigIcon    : false

        },

        //Add zoom-modernizr (leaflet-zoom-modernizr)
        zoomModernizr       : true,
        zoomModernizrOptions: {},        //{minZoom,maxZoom}

        //BsPosition = Show position of mouse or map center
        bsPositionControl: true,
        bsPositionOptions: {
            position       : "bottomright",
            semiTransparent: true,
            content: {
                semiTransparent: false
            },
            isExtended        : true,
            showCursorPosition: !window.bsIsTouch,
            showLandSeaColor  : true,

            inclContextmenu   : false,  //Set to true when contextmenu for the map is implemented
            selectFormat      : function(){ ns.globalSetting.edit(ns.events.LATLNGFORMATCHANGED); },
            popupList: [
                //Add options showLandSeaColor to bsPositionControl
                {id:'showLandSeaColor', type:'checkbox', selected: true, text: {da:'Vis land/hav farver', en:'Show land/sea colours'}}
            ]
        },

        //bsScale - Scale with nm, km or both
        bsScaleControl: true,
        bsScaleOptions: {
            position            : "bottomleft",
            isExtended          : true,
            maxUnitsWidth       : 360, //Max width (default = 200)
            maxUnitsWidthPercent: 30,  //Max width as percent of map width. 35 is set to prevent the scale from hidding buttons in centerbottom-position
            selectFormat        : function(){ ns.globalSetting.edit(ns.events.UNITCHANGED); },
        },

        //bsLegendControl: Install L.Control.BsLegend
        bsLegendControl: true,
        bsLegendOptions: {
            position: 'topright',
            content: {
                header: nsMap.mapLegendHeader,
                noVerticalPadding   : true,
                noHorizontalPadding : false,
width : 250,    //TODO
            }
        },


        //bsCompassControl = Show device orientation
        bsCompassControl: ns.modernizrDevice.isMobile,
        bsCompassOptions: {
            position: 'topcenter',
            icons: {
                //Original = device   : 'compass-device fa-mobile',
                device   : 'compass-device fa-mobile-screen-button',

                //Original = landscape: 'compass-device-landscape fa-image text-light',
                landscape: 'compass-device-landscape fa-mountains',

                //Original = portrait : 'compass-device-portrait fa-portrait text-light',
                portrait : 'compass-device-portrait fa-user',

                //Original = arrow    : 'compass-arrow fa-caret-up'
                arrow    : 'compass-arrow fa-caret-up'
            },
            //Original = iconCompass: 'fa-arrow-alt-circle-up',
            iconCompass: 'fa-arrow-alt-circle-up', //'fa-compass lb-compass-adjust', or adjusted version of 'fa-circle-location-arrow'


            selectFormat: function(){ ns.globalSetting.edit(ns.events.UNITCHANGED); },

            adjustOrientationElement: function( $element/*, control */){
                $element.vfFormat('direction');
            },
            setOrientationNumber: function( orientation, $element/*, control */){
                $element.vfValue(orientation);
            }
        },




        //routeControl: Install L.Control.Route
        routeControl: false,

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
        bsSettingOptions: {
            position: 'topcenter'
        },

        //No map sync control on main map
        mapSyncControl: false,


        //Set popup container class when a popup is opende - See src/leaflet/popup-container-class.js and src/mapLayer/map-layer_00.js for details
        setPopupContainerClass: true
    };

    /***********************************************************
    2: Options for secondary maps (index 1-4)
    ***********************************************************/
    nsMap.secondaryMapOptions = $.extend(true, {}, nsMap.mainMapOptions, {
        isMainMap: false,


        //bsZoomControl without history and default hidden
        bsZoomControl: true,
        bsZoomOptions: {
            isExtended    : false,
            showHistory   : false,
            historyEnabled: false,
            show          : false,
        },

        //BsPosition - default hidden
        bsPositionControl: true,
        bsPositionOptions: { show : false },

        //bsScale - default hidden
        bsScaleControl: true,
        bsScaleOptions: { show : false },


        //legendControl: Install L.Control.Legend
        legendControl: false,

        //bsCompassControl: Show device orientation
        bsCompassControl: false,

        //routeControl: Install L.Control.Route
        routeControl: false,

        //latLngGraticule: Default hidden and no label
        latLngGraticule       : true,
        latLngGraticuleOptions: {
            showLabel: false,
            show     : false
        },

        //Add map-sync control
        mapSyncControl: true,

    });


    /***********************************************************
    ************************************************************
    Install Leaflet controls
    ************************************************************
    ***********************************************************/

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

