/****************************************************************************
00_fcoo-maps_initialize.js

Create and set different global variables and methods

****************************************************************************/
(function ($, moment, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /***********************************************************
    ICONS
    ***********************************************************/
    //Icon and header for map-settings (global)
    ns.icons.mapSettingGlobal = ns.iconSub('fa-map width-1-2em', 'fa-cog');
    ns.texts.mapSettingGlobal = {da:'Kortindstillinger', en:'Maps Settings'};

    //Icon and header for single map-settings
    ns.icons.mapSettingSingle = ns.iconSub('fa-map width-1-1em', 'fa-square-check'); //Alternative = fa-cog fa-sliders fa-ballot-check
    ns.texts.mapSettingSingle = {da:'Kortindstillinger', en: 'Map Settings'};


    //Icon for Number of Maps
    ns.icons.numberOfMaps = ns.iconSub('fa-map width-1-5em', 'fa-tally', true);
    ns.texts.numberOfMaps = {da:'Antal kort', en:'Number of Maps'},

    //Icon and header for legend
    ns.icons.mapLegend = 'fa-list';     //TODO fa-th-list when forecast@mouse-position is implemented <-- ??????? (remove line?)
    ns.texts.mapLegend = {da:'Signaturforklaring', en:'Legend'};

    ns.mapIcon = function(subIcon, subClassPostfix){
        return ns.iconSub('fa-map', subIcon, subClassPostfix);
    };

    nsMap.mapSettingIconWithStatus = function(fontSizeClass){
        //Return a icon with
        return [ns.icons.mapSettingSingle, ns.iconSub('fa-map', 'fa-sync icon-active fw-bold ' + fontSizeClass)];
    };

    nsMap.updateMapSettingIconWithStatus = function($parent, inSync){
        var icons = $parent.children('.container-stacked-icons').addClass('fa-no-margin');
        $(icons[0]).toggle( !inSync);
        $(icons[1]).toggle(!!inSync);
    };



    /***********************************************************
    EVENTS
    ***********************************************************/
    //nsMap.addFinallyEvent: Adds func (and context) to be fired when the application is created
    var finallyGlobalEventName = 'CREATEAPPLICATIONFINALLY';
    ns.events[ finallyGlobalEventName ] = finallyGlobalEventName;
    nsMap.addFinallyEvent = function(callback, context, options){
        ns.events.on(finallyGlobalEventName, callback, context, options);
    };


    /***********************************************************
    STANDARD OPTIONS
    nsMap.standard = {ID: function(options)}
    Is a set of response-methods for standard-options
    The methods are added in the src-files for the different type
    of settings (eq. src/layers/layer_wms.js)
    The ID must correspond with the IDs in default_setup in src/fcoo-maps.js
    ***********************************************************/
    nsMap.standard = {};


    /***********************************************************
    GLOBAL SETTINGS
    Globale variables used to add/remove some parts of the application
    ***********************************************************/
    nsMap.BOTTOM_MENU = null;   //Options for the buttom-menu. Used to set content from other packages not using a setup-file

}(jQuery, window.moment, L, this, document));




;
/****************************************************************************
map-sync

Objects and methods to handle map-sync
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /*********************************************************************
    setMapSyncCursorAndShadowOptions - Update the options showShadowCursor
    and showOutline for map-sync incl bsPositionControl
    *********************************************************************/
    nsMap.setMapSyncCursorAndShadowOptions = function( options ){
        nsMap.mapSync.enableShadowCursor( !!options.showShadowCursor );
        nsMap.mapSync.enableOutline( !!options.showOutline );

        //Enable/disable sync between bsPosition-controls of all maps
        var mapList = nsMap.multiMaps.mapList;
        for (var firstIndex = 0; firstIndex < mapList.length-2; firstIndex++)
            for (var secondIndex = firstIndex+1; secondIndex < mapList.length-1; secondIndex++){
                var firstMapBsPositionControl = mapList[firstIndex].bsPositionControl,
                    secondMap = mapList[secondIndex];

                if (firstMapBsPositionControl && secondMap.bsPositionControl){
                    if (options.showShadowCursor)
                        firstMapBsPositionControl.sync(secondMap);
                    else
                        firstMapBsPositionControl.desync(secondMap);
                }
            }
    };

    function getOffset(id){
        return parseInt( id.split('_')[1] );
    }

    /*********************************************************************
    Extend Map with method to update options for map-sync
    *********************************************************************/
    L.Map.prototype._setMapSyncOptions = function( options ){
        var mapSync =  this._mapSync;
        options.enabled ? mapSync.enable(this) : mapSync.disable(this);
        if (options.enabled)
            mapSync.setZoomOffset( this, getOffset(options.zoomOffset) );

/*
        this.options.mapSync.timeOffset = getOffset(options.timeOffset || '_0'); //TODO

        if (this.bsTimeInfoControl)
            this.bsTimeInfoControl.onChange();
*/
    };


   /*********************************************************************
    L.Control.MapSyncControl = Hidden control used to update
    map-sync-options set by the map's SettingGroup
    *********************************************************************/
    L.Control.MapSyncControl = L.Control.extend({
        getState: function(){
            return this._map.options.mapSync ? {
                       enabled   : this._map.options.mapSync.enabled,
                       zoomOffset: 'zoomOffset_' + this._map.options.mapSync.zoomOffset
                   } : {};
        },

        setState: function(options){
            this._map._setMapSyncOptions( options );
        }
    });


    L.Map.mergeOptions({
        mapSyncControl: false
    });

    L.Map.addInitHook(function () {
        if (this.options.mapSyncControl) {
            this.mapSyncControl = new L.Control.MapSyncControl();
            this.mapSyncControl._map = this;
        }
    });

    /*********************************************************************
    mapSettingGroup_mapSyncOptions
    Return the options used in mapSetting regarding mapSync
    *********************************************************************/
    function mapSync_ModalFooter(noSpace){
        return [
            {icon:'fas fa-square-full text-multi-maps-current', text:{da:':&nbsp;Dette kort', en:':&nbsp;This map'}},
            noSpace ? null : {text:'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'},
            {icon:'far fa-square-full text-multi-maps-main', text:{da:':&nbsp;Hovedkort',  en:':&nbsp;Main map'}}
        ];
    }

    function mapSyncOptions_singleMap(idPostfix='', controlId=''){
        var content = [];
        //Checkbox with "Sync with main map"
        content.push({
            id  : 'enabled'+idPostfix,
            text: {da:'Synk. position/zoom med hovedkort', en:'Sync. position/zoom with main map'},
            type: 'checkbox'
        });

        //Select with zoom-offset
        var zoomItems = [],
            maxZoomOffset = nsMap.setupOptions.multiMaps.maxZoomOffset;
        for (var zoomOffset = -1*maxZoomOffset; zoomOffset <= maxZoomOffset; zoomOffset++){
            var text = '';
            if (zoomOffset < 0)
                text = {da: Math.abs(zoomOffset) + ' x zoom ud', en: Math.abs(zoomOffset) + ' x zoom out'};
            else
                if (zoomOffset == 0)
                    text = {da: 'Samme som hovedkort', en:'Same as main map'};
                else
                    text = {da: zoomOffset+ ' x zoom ind', en: zoomOffset+ ' x zoom in'};
            zoomItems.push( {id: 'zoomOffset_'+zoomOffset, text: text} );
        }
        let showWhen = {};
        showWhen[controlId + (controlId?'_':'')+'enabled'+idPostfix] = true;
        content.push({
            id      : 'zoomOffset'+idPostfix,
            label   : {da:'Zoom-niveau', en:'Zoom level'},
            type    : 'select',
            items   : zoomItems,
            showWhen: showWhen
        });

        return content;
    }


    nsMap.mapSettingGroup_mapSyncOptions = function(accordionId, header){
        let content = mapSyncOptions_singleMap('', 'mapSyncControl');
        content.push({
            type: 'textbox',
            icon: 'map-sync-zoom-offset',
            insideFormGroup: false
        });

        return {
            controlId   : 'mapSyncControl',
            accordionId : accordionId,
            id          : ['enabled', 'zoomOffset'],
            header      : header,
            modalContent: content,
            modalFooter : mapSync_ModalFooter(),
            _modalFooter : [
                {icon:'fas fa-square-full text-multi-maps-current', text:{da:':&nbsp;Dette kort', en:':&nbsp;This map'}},
                {text:'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'},
                {icon:'far fa-square-full text-multi-maps-main', text:{da:':&nbsp;Hovedkort',  en:':&nbsp;Main map'}}
            ],
            onChanging: mapSettingGroup_mapSyncOptions_onChanging
        };
    };


    /*********************************************************************
    mapSettingGroup_mapSyncOptions_onChanging(options, $form)
    *********************************************************************/
    function mapSettingGroup_mapSyncOptions_onChanging(options, $form){
        var _this = this,
            _this_map = _this.control._map;

        if (!this.$zoomOffsetMultiMapsContainer){
            //Create a mini-multi-maps to represent this map and main-maps and there relative size
            this.$zoomOffsetMultiMapsContainer = $form.find('.map-sync-zoom-offset').parent();
            this.$zoomOffsetMultiMapsContainer
                .removeClass()
                .empty()
                .windowRatio(120,160)
                .addClass('map-sync-zoom-offset');

            this.zoomOffsetMultiMaps = L.multiMaps(this.$zoomOffsetMultiMapsContainer, {
                id    : nsMap.multiMaps.options.id,
                local : true,
                update: function( index, map, $mapContainer ){
                    var _this_map = _this.control._map;
                    if ($mapContainer.find('.outline').length == 0)
                        $('<div/>')
                            .addClass('outline')
                            .appendTo($mapContainer);
                    if (_this_map)
                        $mapContainer
                            .toggleClass('current-map', (_this_map._multiMapsIndex == index))
                            .toggleClass('main-map',    (index == 0) );
                }
            });

            //Calc height and width ratio of this map and main-map
            this.currentAndMainMapRatio = Math.round(
                100 * _this_map.$container.innerWidth() /
                      _this_map._mapSync.mainMap.$container.innerWidth()
            );
        }

        //Update the content of boxes representing ths map and main map
        var offsetId = options.enabled ? options.zoomOffset : false,
            $mainInsideCurrent = this.$zoomOffsetMultiMapsContainer.find('.current-map .outline'),
            $currentInsideMain = this.$zoomOffsetMultiMapsContainer.find('.main-map .outline');

        if (offsetId === false){
            $mainInsideCurrent.hide();
            $currentInsideMain.hide();
            return;
        }

        var offset = $.isNumeric(offsetId) ? offsetId : getOffset(offsetId),
            currentMapInMainMap = this.currentAndMainMapRatio * Math.pow(2, -offset),         //Dimention (percent) of current map inside main map
            mainMapIncurrentMap = 100*100/this.currentAndMainMapRatio * Math.pow(2,  offset), //Dimention (percent) of main map inside current map
            dim = Math.min(currentMapInMainMap, mainMapIncurrentMap),
            css = {width:dim+'%', height:dim+'%'};

        $mainInsideCurrent
            .css( css )
            .toggle( mainMapIncurrentMap < 100 );
        $currentInsideMain
            .css( css )
            .toggle( currentMapInMainMap < 100  );
    }




    /*********************************************************************
    **********************************************************************
    mapSettingGroup_mapSyncForm
    A form to edit any sync options for all maps at the same time
    **********************************************************************
    *********************************************************************/
    function buildMultiMaps( mapIndex ){
        let miniMapDim = 36,
            $outer = $('<div/>')
                        .width(1.5*miniMapDim)
                        .css('margin', '8px'),
            $div  =  $('<div/>')
                        .windowRatio(miniMapDim, 1.5*miniMapDim)
                        .addClass('mx-auto')
                        .appendTo($outer);

        L.multiMaps($div, {
            local : true,
            border: true,
            update: function( index, map, $container ){
                //Main map
                if (index == 0)
                    $container.addClass('border-multi-maps-main');

                //Current map
                if (index == mapIndex)
                    $container.addClass('bg-multi-maps-current');
            }
        }).set( nsMap.multiMaps.setup.id );

        return $outer;
    }


    nsMap.mapSettingGroup_mapSyncForm = function(options){
        let bsModalForm = null;
        let mapList = [];
        nsMap.mapIndex.forEach( map => {
            if (map && map.isVisibleInMultiMaps && !map.options.isMainMap)
                mapList.push(map);
        });

        if (!mapList.length)
            return;

        //Get the default value
        let mapSettingGroup = nsMap.getMapSettingGroup(mapList[0]),
            settings        = mapSettingGroup ? mapSettingGroup.settings[options.controlId] : null,
            settingsOptions = settings ? settings.options : null,
            defaultValue    = settingsOptions ? settingsOptions.defaultValue : null,
            defaultValues   = {};

        //Create default values = copy of defaultValue
        mapList.forEach( map => {
            let mapIndex = map.fcooMapIndex;
            $.each( defaultValue, (id, value) => { defaultValues[id+mapIndex] = value; } );
        });

        let buttons = defaultValue ? [{
                icon   : ns.icons.reset,
                text   : ns.texts.reset,
                onClick: () => { bsModalForm.setValues(defaultValues); }
            }] : [];

        buttons = buttons.concat(options.buttons || []);

        //Create content
        let contentList = [];
        mapList.forEach( map => {
            let mapIndex = map.fcooMapIndex;
            contentList.push({
                type      : 'inputgroup',
                label     : {da:'Kort #'+mapIndex, en:'Map #'+mapIndex},
                horizontal: true,
                noPadding : true,
                class     : 'align-items-center',
                content   : [{
                    type   : 'content',
                    content: buildMultiMaps( mapIndex )
                },{
                    type             : 'inputgroup',
                    noBorder         : true,
                    horizontalPadding: true,
                    class            :'flex-grow-1 p-0',
                    content          : options.getMapContent(mapIndex)
                }]
            });
        });

        if (options.desc || options.help ){
            contentList.push({
                label: {da: 'Vejledning', en:'Guidance'},
                type : 'text',
                small: window.bsIsTouch,
                textClass: 'font-size-0-9em',
                text : options.desc || options.help
            });
        }

        //Get data
        let data = {};
        mapList.forEach( map => $.extend(data, options.getMapSetting(map.fcooMapIndex, map)) );

        //Create form and edit data
        bsModalForm = $.bsModalForm({
            header: options.header,
            content: contentList,
            footer : mapSync_ModalFooter(),
            buttons: buttons,

            flexWidth   : options.flexWidth,
            noValidation: true,
            remove      : true,

            onSubmit: function( data ){
                mapList.forEach( map => {
                    options.setMapSetting(map.fcooMapIndex, map, data);
                    options.onSubmit ? options.onSubmit(map) : null;
                });
            }
        });
        bsModalForm.edit( data );
    };

    /*********************************************************************
    mapSettingGroup_editCommonMapSyncSetting
    Edit map sync (zoom and center) for all maps in one form
    *********************************************************************/
    nsMap.mapSettingGroup_editCommonMapSyncSetting = function(){
        nsMap.mapSettingGroup_mapSyncForm({
            controlId: 'mapSyncControl',
            header   : {ison: 'fa-sync', text: {da:'Synkronisering med hovedkort', en:'Synchronizing with main map'}},
            flexWidth: window.bsIsTouch,

            onSubmit: nsMap._onSubmit_mapSync,

            getMapContent: mapSyncOptions_singleMap,

            getMapSetting: function(mapIndex, map){
                let state = map.mapSyncControl.getState(),
                    data  = {};
                ['enabled', 'zoomOffset'].forEach( id => data[id+mapIndex] = state[id] );
                return data;
            },

            setMapSetting: function(mapIndex, map, data){
                let state = {};
                ['enabled', 'zoomOffset'].forEach( id => state[id] = data[id+mapIndex] );
                nsMap.getMapSettingGroup(map).saveParent({ mapSyncControl: state });
            }

        });
    };

}(jQuery, L, this, document));

;
/****************************************************************************
10_fcoo-maps_setup.js,

Default options DEFAULT-OPTIONS for fcoo.maps.createApplication( options: OPTIONS, defaultOptions: DEFAULT-OPTIONS,...}

The default options are an extended version of the defalut application options from fcoo-application: src/fcoo-application-default-options


****************************************************************************/
(function ($, moment, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /****************************************************************************
    OPTIONS and DEFAULT-OPTIONS are extended with
    {

        ** maps and multi-maps **
        //Default map
        map: {
            minZoom:  3,
            maxZoom: 12,
        },

        //Multi maps
        multiMaps: {
            enabled           : true, //OR {mobile:BOOLEAN, tablet:BOOLEAN, desktop:BOOLEAN}
            maxMaps           : 5, //OR {mobile:INTEGER, tablet:INTEGER, desktop:INTEGER}
            maxZoomOffset     : 2
        }
    }

    ****************************************************************************/


    /****************************************************************************
    adjustMenuItemIcon( icon )
    Allow the icon of menu-items to be given in different ways.

    In fcoo/jquery-bootstrap there are the method $.bsMarkerAsIcon:
        $.bsMarkerAsIcon(colorClassName, borderColorClassName, options)
        Return options to create a marker-icon = round icon with
        inner color given as color in colorClassName and
        border-color given as color in borderColorClassName
        options:
            faClassName: fa-class for symbol. Default = "fa-circle"
            extraClassName: string or string[]. Extra class-name added
            partOfList : true if the icon is part of a list => return [icon-name] instead of [[icon-name]]


    In fcoo/leaflet-bootstrap-marker there are the method L.bsMarkerAsIcon:
        L.bsMarkerAsIcon
        Return the options to create a icon locking like a bsMarker[TYPE]
        with the given color and border-color
        Can be used in four ways:
            1:  L.bsMarkerAsIcon(options: OBJECT)
                    options = same as for BsMarkerBase BsMarkerCircle

            2:  L.bsMarkerAsIcon(colorName: STRING, borderColorName: STRING, round: BOOLEAN = true)

            3:  L.bsMarkerAsIcon(colorName: STRING, borderColorName: STRING, faClassName: STRING)

            4:  L.bsMarkerAsIcon(colorName: STRING, borderColorName: STRING, options: OBJECT)
                    options = {
                        faClassName   : STRING (default = 'fa-circle'),
                        extraClassName: STRING (default = '')}
                    }

    function adjustMenuItemIcon( options )
        if options = {
                [colorClassName || borderColorClassName],
                faClassName   : STRING (optional)
                extraClassName: STRING (optional)
                round         : BOOLEAN (optional)
            }  => use $.bsMarkerAsIcon(colorClassName: STRING, borderColorClassName: STRING, options: OBJECT)
        if options = {
                [colorName || borderColorName],
                faClassName   : STRING (optional)
                extraClassName: STRING (optional)
                round         : BOOLEAN (optional)
            }  => use L.bsMarkerAsIcon(colorName: STRING, borderColorName: STRING, options: OBJECT)

    ****************************************************************************/
    function adjustMenuItemIcon( options ){
        if (!options || $.isArray(options))
            return options;

        if (typeof options == 'string')
            return [[options]];

        var result      = '',
            iconOptions = {
                faClassName   : options.faClassName ? options.faClassName : options.round ? 'fa-circle' : 'fa-square-full',
                extraClassName: options.extraClassName
            };

        if (options.colorClassName || options.borderColorClassName)
            //Use $.bsMarkerAsIcon(colorClassName, borderColorClassName, options)
            result = $.bsMarkerAsIcon(options.colorClassName, options.borderColorClassName, iconOptions );


        if (options.colorName || options.borderColorName)
            //Use L.bsMarkerAsIcon
            result = L.bsMarkerAsIcon(options.colorName, options.borderColorName, iconOptions);

        return result;
    }


    /****************************************************************************
    Extend ns.defaultApplicationOptions with default options for map-application
    ****************************************************************************/
    ns.defaultApplicationOptions = $.extend(true, ns.defaultApplicationOptions, {
        topMenu: {
            search   : true,                                    //true if use search
            nominatim: 'https://nominatim.openstreetmap.org',   //Path to OpenStreetMap Nominatin-service

            /*
            help, messages, warning = Path to messages-files. Two versions:
            1: Relative path locally e.q. "data/info.json"
            2: Using ns.dataFilePath (See fcoo-data-files): {subDir:STRING, fileName:STRING}. E.q. {subDir: "theSubDir", fileName:"fileName.json"} => "https://app.fcoo.dk/static/theSubDir/fileName.json"
            */
            help     : null, //null or STRING or {subDir:STRING, fileName:STRING}
            messages : null, //null or STRING or {subDir:STRING, fileName:STRING}
            warning  : null, //null or STRING or {subDir:STRING, fileName:STRING}

            helpId: {   //id in help message-file for different default modals
                globalSetting  : '',  //Modal with fcoo.globalSetting
                mapSetting     : '',  //Modal with settings for a single map
                multiMapSetting: '',  //Modal with multi-maps setting
            },

            //Add button before setting-button with settings for map(s)
            preSetting: {
                icon   : ns.icons.mapSettingGlobal,
                onClick: function(){
                    if (nsMap.hasMultiMaps)
                        nsMap.showMapSettingMain();
                    else
                        nsMap.editMapSetting(0);
                }
            },
            setting: false,
        },

        standardMenuOptions: {
            inclBar     : true,
            barCloseAll : true,

            favorites: true,

            resetIcon: 'far fa-layer-group',
            reset: {
                resetState  : "RESET",
            }
        },

        leftMenu: {
            width  : 359,   //Width of left-menu. Supports mobil device with screen width = 360+
            buttons: {
                reset  : true,
                setting: true
            },
            isStandardMenu : true,
            bsMenuOptions: {
                adjustIcon: adjustMenuItemIcon
            },
        },
        leftMenuIcon: 'fa-layer-group',

        //Default map
        map: {
            minZoom:  3,
            maxZoom: 12,
        },

        //Multi maps
        multiMaps: {
            enabled: true,
            maxMaps: {
                mobile : 3,
                tablet : 4,
                desktop: 5
            },
            maxZoomOffset: 2
        },

        //Standard setup/options
        standard: {
            wms: {subDir:"layers", fileName:"wms.json"} //Standard options for WMS-layers - see src/layer/layer_wms.js
            //time: {subDir, fileName} - options for time-dimention See github/fcoo/fcoo-maps-time
        }
    });

}(jQuery, window.moment, L, this, document));




;
/****************************************************************************
control-route.js
****************************************************************************/
(function ($, moment, L, window/*, document, undefined*/) {
    "use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {};


    //Slider-options for different speed-units
    var speedeSliderOptions = {};
    speedeSliderOptions[ns.unit.METRIC]   = { min: 1, max: 20 };
    speedeSliderOptions[ns.unit.METRIC2]  = { min: 4, max: 70 };
    speedeSliderOptions[ns.unit.NAUTICAL] = { min: 2, max: 40 };

    var routeChangeCount =  0; //'Dummy' variable increased every time the route is changed. Used to detect changes in the form

    L.Control.Route = L.Control.BsButton.extend({
        options: {
            //position: "bottomright",
            position: "topcenter",
            icon    : 'fa-route',
        },

        initialize: function(options) {
            L.Util.setOptions(this, options);

            var _this = this;

            this.data = {
                departure: moment(),
                arrival  : moment(),
                speed    : 10 //unit = dafault (= knots)
            };

            this.editData = {
                departure: 0,
                speed    : this.data.speed,
                dummy    : -1,
            };
            this.currentMomentValue = 0; // = The current relative time on the map. Is set using this.setMoment( moment )


            //Create the modalForm-control to edit depature time and speed
            var routeTutorial = [
                {da: '- Klik på kortet for at tilføje et punkt',  en: '- Click on the map to add a point'},
                {da: '- Klik på linie for at tilføje et punkt',   en: '- Click on a line to add a point'},
                {da: '- Træk i et punkt for at ændre det',        en: '- Drag a point to change it'},
                {da: '- Klik på et punkt for fjerne det',         en: '- Click on a point to remove it'},
            ];
            $.each( routeTutorial, function( index, text ){
                routeTutorial[index] = {type: 'text', noBorder: true, text: text};
            });

            this.modalFormControl = L.control.bsModalForm({
                id: 'formRoute',
                header: {icon: 'fa-route', text:{da: 'Rute', en:'Route'}},
                width: 320,
                _fixedContent: 'FIXED',
                isExtended: true,
                useExtended: true,
                content: '',
                extended: {
                    content: {
                        type: 'accordion',
                        list: [
                            {
                                icon: 'fa-route', text: {da:'Ruten', en:'The Route'},
                                content: routeTutorial
                            },
                            {
                                icon: 'fa-ship', text: {da:'Dit fartøj', en:'Your Vessel'},
                                content: [
                                    //Hidden element to register route change
                                    {   id: 'dummy', type: 'hidden' },

                                    //Slider for departure
                                    {
                                        id: 'departure', type:'timeslider',
                                        label: {icon: 'fa-clock', text:{da:'Afgang', en:'Departure'}},
                                        min:-24, max:48, majorTicksOffset:0, stepOffset:0,
                                        showFromTo: true, grid: true, handleFixed: true, mousewheel: true, showLineColor: false, resizable: false,

                                        lineColors        : [{ to: 0, color: '#7ABAE1'}, {color:'#4D72B8'}],
                                        labelColors       : [{value:0, backgroundColor:'green', color:'white'}],

                                        width: 3*360,
                                    },
                                    //Slider for speed
                                    {
                                        id: 'speed', type:'slider', _noBorder: false,
                                        label: [
                                            {
                                                icon: 'fa-tachometer',
                                                text: {da:'Hastighed', en:'Speed'},
                                            },
                                            {
                                                vfFormat :'speed_unit',
                                                //vfValue  :' ',
                                                vfOptions: {
                                                    prefix : '(',
                                                    postfix: ')'
                                                }
                                            }
                                        ],
                                        grid: true, min:2, max:30, _showFromTo: false, postfix: ' Kn',
                                    }
                                ]
                            },
                        ]
                    }, //end of content
                }, // end of extended
                onChanging: $.proxy( this.update, this ),
                onSubmit  : $.proxy( this.onSubmit, this ),
                onCancel  : $.proxy( this.onCancel, this ),
                onClose   : $.proxy( this.onClose, this )
            });

            //Create the route
            this.route = new L.Route({
                interactive: false,
                isPolygon: false,
                onUpdate: function( /*list, currentPoint*/ ){
                    //Update 'dummy' data to mark changing of the route
                    routeChangeCount = (routeChangeCount+1) % 1000000;
                    _this.modalFormControl.bsModalForm.originalValues.dummy = routeChangeCount;
                },
                events: {
//                    dragstart: function(){
//                    },
//                    dragend: function(){
//                    }
                }
            });

            //Add the vessel (a yellow boat)
//            this.route.addVessel(-1, {color: "yellow", shape: 'boat'});
            this.route.addVessel(-1, {color: "#4285F4", shape: 'boat'}); //#4285F4 = standard google maps. TODO: use colorName when vesselMarker is implemented in leaflet-bootstrap-marker

            this.options.onClick = $.proxy( this.edit, this );

        },


        /***********************************************
        onAdd
        ***********************************************/
        onAdd: function(map) {
            var result = L.Control.BsButton.prototype.onAdd.call(this, map);
            map.addControl( this.modalFormControl );
            this.route.addTo(map);

            return result;
        },

        /***********************************************
        setMoment - Set current moment and update route
        ***********************************************/
        setMoment: function( m ){
            function roundMoment( m ){ return m.floor(1, 'Hours'); }
            this.currentMomentValue = roundMoment( m ).diff(roundMoment(moment()), 'hours');
            this.update();
        },


        /***********************************************
        edit
        ***********************************************/
        edit: function(){
            $(this.getContainer()).hide();
            this.route.setInteractiveOn();
            this.modalFormControl.edit( this.editData );
        },

        onGlobalEvents: function(/*id, value*/){
            var newSpeedUnit = ns.globalSetting.get('speed');

            this.speedSlider = this.speedSlider || this.modalFormControl.bsModalForm.getInput('speed').getSlider();

            //Convert this.editData.speed from this.speedUnit/default unit => SI-unit => newSpeedUnit
            var speedIS = ns.unit.convertValueBack(this.editData.speed, 'speed', this.speedUnit || ns.globalSetting.settings['speed'].options.defaultValue);
            this.editData.speed = Math.round( ns.unit.getSpeed(speedIS) );

            this.speedUnit = newSpeedUnit;

            //Update this.editData.speed to new unit
            this.update({speed: this.editData.speed});

            //Update speed-slider
            $.extend(this.speedSlider.options, speedeSliderOptions[this.speedUnit]);

            var postfix;
            switch (this.speedUnit){
                case ns.unit.METRIC  : postfix = 'm/s'; break;
                case ns.unit.METRIC2 : postfix = window.i18next.sentence( {da:'km/t', en:'km/h'}); break;
                case ns.unit.NAUTICAL: postfix = 'kn'; break;
            }
            this.speedSlider.options.postfix = ' '+postfix;

            this.speedSlider.update();
            this.speedSlider.setValue(this.editData.speed);
        },

        onSubmit: function( data ){
            this.update( data );
        },
        onCancel: function( data ){
            this.route.restore();
            this.onSubmit( data );
        },
        onClose: function(){
            this.route.setInteractiveOff();
            $(this.getContainer()).show();

        },
        //update
        update: function( editData ){
            this.editData = $.extend( this.editData, editData || {} );
            var vessel = this.route.vesselList[0];
            vessel.distance = (this.currentMomentValue - this.editData.departure)*ns.unit.getSpeedBack(this.editData.speed)*60*60; //Converts speed [selected unit] to speed [m/hour]
            vessel.update();
        }
    }); //end of L.Control.Route
}(jQuery, window.moment, L, this, document));




;
/****************************************************************************
dataset-values.js,

define default DatasetValue used by fcoo-maps

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    //fcoo.map.datasetValues = options for default DatasetValue
    nsMap.datasetValues = nsMap.datasetValues || {};

    //Create standard/default DatasetValues
    function addDatasetValue(options){
        nsMap.datasetValues[options.id] = options;
    }

    /*************************************
    Position and position accuracy
    *************************************/
    //latLng
    addDatasetValue({
        id  : 'latLng',
        icon: 'fa-location-pin',
        text: {da:'Position', en:'Position'},

        vfFormat : 'latlng',
        vfOptions: function(createOptions){return createOptions.compact ? {separator: '<br>'} : {}; },
        saveValue: true,
        getOnClick: function( createOptions ){
            if (createOptions.noLinks)
                return null;
            else return function(event){
                $(this).data('dataSetValue').asModal();
                if (event && event.stopPropagation)
                    event.stopPropagation();
                return false;
            };
        }
    });

    //accuracy (position)
    addDatasetValue({
        id      : 'accuracy',
        icon    : 'fa-plus-minus',
        text    : {da: 'Nøjagtighed', en:'Accuracy'},
        vfFormat: 'number',
        vfOptions: {
            decimals: 0,
            prefix  : '~',
            postfix : ' m'
        },
    });


    /*************************************
    Altitude
    *************************************/
    var altitudeIcon = 'fa-arrow-to-top',
        altitudeText = {da:'Højde', en:'Altitude'};
    //altitude
    addDatasetValue({
        id       : 'altitude',
        icon     : altitudeIcon,
        text     : altitudeText,
        vfFormat : 'height',
        vfOptions: function( createOptions ){
            return {
                withUnitLink: !createOptions.noLinks
            };
        }
    });

    //altitude accuracy (internally)
    addDatasetValue({
        id      : 'altitudeAccuracy',
        icon    : altitudeIcon,
        text    : altitudeText,
        vfFormat: 'height',
        vfOptions: {
            prefix : '(&plusmn; ',
            postfix: ')',
        }
    });


    //altitude and accuracy
    addDatasetValue({
        id    : 'altitude_accuracy',
        icon  : altitudeIcon,
        text  : altitudeText,
        center: true,
        showPartially: true,
        datasetValueIdList: ['altitude', 'altitudeAccuracy']
    });

    /*************************************
    Direction
    *************************************/
    var directionIcon = 'fa-circle-location-arrow',
        directionText = {da:'Retning', en: 'Direction'};

    //direction (number)
    addDatasetValue({
        id      : 'direction',
        icon    : directionIcon,
        text    : directionText,
        vfFormat: 'direction',
        vfOptions: function( createOptions ){
            return {
                withUnitLink: !createOptions.noLinks
            };
        }
    });

    //direction_text
    addDatasetValue({
        id      : 'direction_text',
        dataId  : 'direction',
        icon    : directionIcon,
        text    : directionText,
        vfFormat: 'direction_text'
    });

    //direction_vector
    addDatasetValue({
        id      : 'direction_vector',
        dataId  : 'direction',
        icon    : directionIcon,
        text    : directionText,
        isVector: true
    });


    /*************************************
    Speed
    *************************************/
    var speedIcon = 'fa-tachometer';

    addDatasetValue({
        id      : 'speed',
        icon    : speedIcon,
        text    : {da:'Fart', en:'Speed'},
        vfFormat: 'speed',
        vfOptions: function( createOptions ){
            return {
                withUnitLink: !createOptions.noLinks
            };
        }
    });


    /*************************************
    Velocity (speed and direction)
    *************************************/
    var velocityIcon =  speedIcon,
        velocityText =  {da:'Hastighed', en:'Velocity'};

    addDatasetValue({
        id           : 'velocity',
        icon         : velocityIcon,
        text         : velocityText,
        showPartially: true,

        datasetValueIdList:['speed', 'direction_vector']
    });

    addDatasetValue({
        id           : 'velocity_extended',
        icon         : velocityIcon,
        text         : velocityText,
        showPartially: true,
        datasetValueIdList:['speed', 'direction_vector', 'direction_text', 'direction' ]
    });

/*
        vfFormat: 'number',
        vfOptions: {
            decimals: 0,
            prefix  : '~',
            postfix : ' m'
        },


                case 'velocity':
                    if (markerOptions.speed === null)
                        return null;

                    //If no direction is present => return info on speed
                    if (markerOptions.direction === null)
                        return this.getStandardPopupContent('speed', markerOptions.speed, extended);

                    content = {
                        label  : {icon: 'fa-tachometer', text: {da:'Hastighed', en:'Velocity'} },
                        type   : 'text',
                        text   : (extended ? this._createVelocityExtendedContent : this._createVelocityContent).bind(this),
                        vfValue: '',
                    };


                    break;

                case 'orientation':
                    content = {
                        label   : {icon: 'fa-mobile-android', text: {da:'Orientering', en:'Orientation'}},
                        vfFormat: 'direction'
                    };

*/



}(jQuery, L, this, document));




;
/****************************************************************************
dataset.js

****************************************************************************/

(function ($, L, window, document, undefined) {
	"use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /**********************************************************
    Dataset
    Represent at set of data given as a simple record {ID: VALUE}

    The Dataset has a list of DataSetValue (see below) that represent one or more of the {ID:VALUE}s
    When the data in the Dataset are changed, all the elements displaying the changed value(s) are updated

    Method:
    createContent: function( $container, createOptions = {})
        Create all elements of all DatasetValue inside $container
        createOptions = {small: BOOLEAN, compact: BOOLEAN, noLinks: BOOLEAN} = Options for jquery-methods

    setData      : function( data, $container )
        Update all datasetValues with data={ID:VALUE}.
        $container (optional): Only update elements under $container

    options:
        showWhenNull: function(datasetValue, createOptions) (optional) Return true/false for given datasetValue, createOptions. Overwrite datasetValue.options.showWhenNull



    Each Dataset can create DOM-element(s) displaying the value and creates one input in eq. a popup-container or a modal-window


    There are tree ways to link a DatasetValue to a value in the ID of data={ID:VALUE} in its Dataset:
    Simple  :
        id = ID in {ID:DATA}. Eq id="direction" will get {direction: 123}
    Indirect:
        id = NAME, dataId=ID in {ID:DATA}. Eq id="direction_as_text" dataId="direction"  will get {direction: 123}
    Multi:
        id = NAME, datasetValueIdList=[]ID/NAME Eq. id="all_direction" datasertIdList=["direction", "direction_as_text", ..] will get the two versions of {direction: 123} defined above

    DatasetValue
    options:
        column        : BOOLEAN - Only apply if the datasetValue has multi sub-values (datasetValueIdList). When true the sub-elemens are displayed in a column. If false (dafault) the elements are placed horizontal

        showForCompact: BOOLEAN - When true the DatasetValue are only shown when the createOptions.compact == true
        hideForCompact: BOOLEAN - When true the DatasetValue is hidden when the createOptions.compact == true
        showForSmall  : BOOLEAN - When true the DatasetValue are only shown when the createOptions.small == true
        hideForSmall  : BOOLEAN - When true the DatasetValue is hidden when the createOptions.small == true

        showPartially: BOOLEAN - If true the element is visible if one or more values are <> null. If false the elemnt is hidden if one value == null
        showWhenNull : BOOLEAN - If true and the element is 'hidden' due to values = null => the content of the element is replaced with a "Unknown"-textmore values == null))

        title        : STRING

    **********************************************************/

    //fcoo.map.datasetValues = options for default DatasetValue
    nsMap.datasetValues = nsMap.datasetValues || {};

    /**********************************************************
    ***********************************************************
    Dataset
    ***********************************************************
    **********************************************************/
    var defaultDatasetOptions = {
            showWhenNull : function(datasetValue/*, createOptions*/){
                return datasetValue.options.showWhenNull;
            }
        };

    nsMap.Dataset = function(datasetValueList, options, data = {}){
        var _this = this;

        this.options = $.extend(true, defaultDatasetOptions, options);
        this.datasetValueList = [];
        this.datasetValues    = {};

        function addDatasetValue( datasetValue_or_Options ){
            //If datasetValue_or_Options is id in nsMap.datasetValues
            if (typeof datasetValue_or_Options == 'string')
                datasetValue_or_Options = $.extend(true, {}, nsMap.datasetValues[datasetValue_or_Options]);

            var datasetValue = datasetValue_or_Options instanceof nsMap.DatasetValue ?
                                datasetValue_or_Options :
                                new nsMap.DatasetValue( datasetValue_or_Options );
            datasetValue.parent = _this;

            if (!_this.datasetValues[datasetValue.id]){
                _this.datasetValueList.push(datasetValue);
                _this.datasetValues[datasetValue.id] = datasetValue;
            }
            return datasetValue;
        }

        $.each(datasetValueList, function(index, datasetValue_or_Options){

            var datasetValue = addDatasetValue( datasetValue_or_Options );

            //Add sub-datasetValues other that self (if any)
            if (datasetValue.options.datasetValueIdList)
                $.each(datasetValue.datasetValueIdList || [], function(index, datasetValue_or_Options2){
                    addDatasetValue( datasetValue_or_Options2 );
                });
        });

        this.data = data;
    };

    nsMap.dataSet = nsMap.dataset = function(list, options, data){
        return new nsMap.Dataset(list, options, data);
    };

    nsMap.Dataset.prototype = {

        /*********************************************
        createContent
        Create all elements of all DatasetValue inside $container
        createOptions = {small: BOOLEAN, compact: BOOLEAN} = Options for jquery-methods
        *********************************************/
        createContent: function( $container, createOptions = {}){
            var _this = this,
                contentList = [];

            //Sort the list of DatasetValues (optional)
            if (this.options.sort)
                this.datasetValueList = this.options.sort(this.datasetValueList, createOptions, this) || this.datasetValueList;

            //Craete the content from each datasetValues
            $.each(this.datasetValueList, function(index, datasetValue){
                var defaultShow = _this.options.show ? _this.options.show(datasetValue.id, createOptions) : true,
                    elemOrOptions = datasetValue.create(createOptions, defaultShow, _this.options.showWhenNull(datasetValue, createOptions));

                if (elemOrOptions)
                    contentList.push(elemOrOptions);
            });

            $container
                .empty()
                ._bsAppendContent( contentList );

            //Add container-class to the outer elements of each dataset-value
            //and set class to hide outer-element if all value(s9 are null
            $container.children().each( function(index){
                $(this)
                    .addClass( _this.datasetValueList[index].outerContainerClassName )
                    .toggleClass( 'hide-for-dataset-value-is-null', !_this.options.showWhenNull( _this.datasetValueList[index], createOptions ) );
            });

            this.setData( this.data, $container );

        },

        /*********************************************
        setData
        Update all datasetValues with data={ID:VALUE}
        $container (optional): Only update elements under $container
        *********************************************/
        setData: function( data, $container ){
            data = this.data = $.extend(true, {}, this.data, data);

            $.each(this.datasetValueList, function(index, datasetValue){
                datasetValue.setData( data, $container );
            });
        }
    };



    /**********************************************************
    ***********************************************************
    DatasetValue - represent one value in a Dataset
    ***********************************************************
    **********************************************************/
    var datasetValueId = 0;
    nsMap.DatasetValue = function(options){
        this.id = options.id;
        this.dataId = options.dataId || this.id;
        this.datasetValueIdList = options.datasetValueIdList || [this.id];

        this.value = null;

        this.options = $.extend(true, {
            showPartially: false,
            showWhenNull : false,
            vectorIcon   : 'far fa-up',
            title        : ''
        }, options);

        datasetValueId++;
        this.className               = 'DSV_' + datasetValueId;     //Class-name for the element containing the value
        this.containerClassName      = 'DSV_C_' + datasetValueId;   //Class-name for the inner container of the element containing the value
        this.outerContainerClassName = 'DSV_OC_' + datasetValueId;  //Class-name for the outer container of the inner container element
    };

    nsMap.datasSetValue = nsMap.datasetValue = function(options){
        return new nsMap.DatasetValue(options);
    };


    function getElementsByClassName( $parentElement, className){
        return $parentElement ? $parentElement.find('.'+className) : $('.'+className);
    }

    nsMap.DatasetValue.prototype = {
        /*********************************************
        _getOptionsValue
        Gets this.options.ID
        Check for options.ID == value, function, or undefined
        *********************************************/
        _getOptionsValue: function(id, defaultValue = null, createOptions = {}){
            var value = this.options[id];
            if (value == undefined)
                return defaultValue;
            else
                return $.isFunction(value) ? value(createOptions) : value;
        },


        /*********************************************
        There are two main operations:
        1: Creating the elements
        2: Updating the elements with new values
        *********************************************/
        /*********************************************
        create
        Return options for one input with label, icons, text etc
        *********************************************/
        create: function(createOptions = {}, defaultShow, showWhenNull){
            if (this.options.create)
                return this.options.create.apply(this, arguments);

            var show      = null, //=unknown
                o         = this.options,
                isCompact = !!createOptions.compact,
                isSmall   = !!createOptions.small;

            //1. Check for own options
            if (o.showForCompact)
                show = isCompact;
            else
                if (o.hideForCompact)
                    show = !isCompact;
                else
                    if (o.showForSmall)
                        show = isSmall;
                    else
                        if (o.hideForSmall)
                            show = !isSmall;

            //2. Own show-function
            if ((show === null) && o.show)
                show = o.show(createOptions);

            //3. Default from Dataset
            if (show === null)
                show = defaultShow;

            return show ? {
                    label    : {icon: this.options.icon, text: this.options.text },
                    small    : !!createOptions.small,
                    fullWidth: true,
                    center   : true,

                    type     : createOptions.compact ? 'compact' : 'text',
                    text     : this.createContent.bind(this, createOptions, showWhenNull)
                }
                : null;
        },

        /*********************************************
        createContent
        *********************************************/
        createContent: function( createOptions, showWhenNull, $container ){
            //To prevent <span> inside <span> the <span> (= $container) is deleted and the content is created direct

            $container = $container.parent().empty();

            if (this.options.column)
                $container
                    .addClass('d-flex flex-column');
            else {
                $container
                    .addClass('w-100 d-flex flex-row')
                    .toggleClass('justify-content-evenly',  !this.options.center)
                    .toggleClass('justify-content-center', !!this.options.center);

                if (!this.options.center)
                    $container.css('justify-content', 'space-evenly');    //Bootstrap 4 do not support class justify-content-evenly

            }

            //Create this.datasetValueList = list of the datasetValue included in this.
            if (!this.datasetValueList){
                var datasetValues = this.parent.datasetValues,
                    list = this.datasetValueList = [];
                $.each(this.datasetValueIdList, function(index, datasetValue_or_id){
                    list.push(
                        datasetValue_or_id instanceof nsMap.DatasetValue ?
                            datasetValue_or_id :
                            datasetValues[datasetValue_or_id]
                    );
                });
            }


            $.each(this.datasetValueList, function(index, datasetValue){

                //Create and append the elements
                $container.append( datasetValue.createElement(createOptions) );

                //Set value for the new element
                datasetValue.setValue(datasetValue.parent.data[datasetValue.dataId], $container, true );

            });

            if (showWhenNull)
                $('<span/>')
                    .addClass("show-for-dataset-value-is-null")
                    ._bsAddHtml({ text: createOptions.compact ? '?' : {da:'* Ukendt *', en:'* Unknown *'} })
                    .appendTo($container);

        },

        /*********************************************
        createElement
        Create DOM-element(s) to display the value of this
        Return a element to be used to display the value
        *********************************************/
        createElement: function(createOptions){
            var o = this.options;
            if (o.createElement)
                return o.createElement(createOptions, this);

            if (o.isVector)
                //Create a icon-element
                return $._bsCreateIcon( {icon: o.vectorIcon}, null, o.title, this.className + ' '+ this.containerClassName + ' hide-for-dataset-value-is-null');
            else
                return $('<span/>')
                            .addClass('hide-for-dataset-value-is-null ' + this.containerClassName)
                            ._bsAddHtml({
                                textClass: this.className,
                                title    : o.title,
                                vfFormat : this._getOptionsValue('vfFormat',  null, createOptions ),
                                vfOptions: this._getOptionsValue('vfOptions', null, createOptions),
                                onClick  : o.getOnClick ? o.getOnClick( createOptions ) : o.onClick,
                            });
        },


        /*********************************************
        setData
        Update all datasetValue in datasetValueList
        *********************************************/
        setData: function( data, $parentElement ){

            //If this hasn't be created => do not update
            if (!this.datasetValueList) return;

            var nullCount = 0;
            $.each(this.datasetValueList, function(index, datasetValue){
                var value = data[datasetValue.dataId];
                if (value === null)
                    nullCount++;
                datasetValue.setValue( value, $parentElement );
            });

            /*
            Hide/show/update the outer container regarding if the elements.value are not/some/all null
            options.showPartially: BOOLEAN - If true the element is visible if one or more values are <> null. If false the elemnt is hidden if one value == null
            options.showWhenNull : BOOLEAN - If true and the element is 'hidden' due to values = null => the content of the element is replaced with a "Unknown"-textmore values == null))
            */
            var showValue = (nullCount == 0) || (this.options.showPartially && (nullCount < this.datasetValueList.length));

            if ((showValue === this.showValue)  && !$parentElement)
                return;

            this.showValue = showValue;

            //Find all outer elements
            getElementsByClassName($parentElement, this.outerContainerClassName).toggleClass('dataset-value-is-null', !showValue);
        },

        /*********************************************
        setValue
        Update all elements displaying the value
        *********************************************/
        setValue: function (value, $parentElement, force ){
            var _this  = this;

            //Only update elements if it is a new value or a new instance (created inside $parentElement)
            if ((this.value == value) && !$parentElement)
                return;

            var isNull = (value == null),
                needToToggle = force || (this.isNull != isNull),
                adjustedValue = isNull ? null : this.options.adjustValue ? _this.options.adjustValue( value ) : value;

            this.value = value;
            this.isNull = isNull;

            if (isNull && !needToToggle)
                return;

            //Hide/show outer elements
            if (needToToggle)
                getElementsByClassName($parentElement, this.containerClassName).toggle(!isNull);

            //Update value
            if (!isNull)
                getElementsByClassName($parentElement, this.className).each(function(){
                    _this.updateElement( $(this), adjustedValue );
                });

        },

        /*********************************************
        updateElement
        *********************************************/
        updateElement: function( $element, displayValue ){
            if (this.options.updateElement)
                this.options.updateElement( $element, displayValue );
            else
                if (this.options.vfFormat)
                    $element.vfValue( displayValue );
                else
                    if (this.options.isVector)
                        $element.css('transform', 'rotate('+displayValue+'deg)');
                    else
                        $element.html(displayValue);

            if (this.options.saveValue)
                $element.data('dataSetValue', displayValue);
        }
    };

}(jQuery, L, this, document));

;
/****************************************************************************
    fcoo-maps.js,

    (c) 2020, FCOO

    https://github.com/FCOO/fcoo-maps
    https://github.com/FCOO

****************************************************************************/
(function ($, moment, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /****************************************************************************
    To create an application call window.fcoo.map.createApplication(options, fileNameOrMenuOptions)
    options                = OPTIONS or FILENAME = filename with OPTIONS
    fileNameOrMenuOptions  = MENU-OPTIONS or FILENAME with menu-options. Default = FCOO Standard menu (see fcoo-applicaion)

    FILENAME = Path to file. Two versions:
        1: Relative path locally e.q. "data/info.json"
        2: Using ns.dataFilePath (See fcoo-data-files): {subDir, fileName}.
        E.q. {subDir: "theSubDir", fileName:"theFileName.json"} => "https://app.fcoo.dk/static/theSubDir/theFileName.json"

    OPTIONS = see src/10_fcoo-maps_setup.js and fcoo-application for description af default values = ns.defaultApplicationOptions

    The layer-menu are build either in the left- (default) or right-side menu

    createApplication(...) will use createApplication from fcoo-application to create the application with layer-menu and map(s)

    ****************************************************************************/

    /*************************************************************************
    createApplication
    *************************************************************************/
    nsMap.createApplication = function(options, fileNameOrMenuOptions){
        /*
        When resizing the main-container:
        - Turn zoom-history off to avoid many entries
        - Save all maps center and zoom
        */
        options.onResizeStart = function(){
            nsMap.visitAllMaps(function(map){
                //Disable history-list during resizing
                if (map.bsZoomControl && map.bsZoomControl.options.historyEnabled){
                    map.enableHistoryOnResizeEnd = true;
                    map.bsZoomControl.disableHistory();
                }

                //Hide center map position marker (if any)
                map.$container.addClass('hide-control-position-map-center');

                //If map visible and sync-enabled => disable it while resizing (Not quit sure why it works....)
                map._enableAfterResize = map.isVisibleInMultiMaps && map._mapSync && map.options.mapSync && map.options.mapSync.enabled && !map.options.mapSync.isMainMap;
                if (map._enableAfterResize)
                    map._mapSync.disable(map);
            });
        };

        //Update all maps and enable zoom-history again when main-container is resized
        options.onResizeEnd = function(){
            if (nsMap.mainMap){
                nsMap.mainMap._selfSetView();
                nsMap.mainMap.invalidateSize({pan:false, debounceMoveend:true});
            }

            nsMap.visitAllMaps(function(map){
                //Show center map position marker (if any)
                map.$container.removeClass('hide-control-position-map-center');

                map.invalidateSize({pan:false, debounceMoveend:true});

                if (map._enableAfterResize){
                    map._enableAfterResize = false;
                    map._mapSync.enable(map);
                }

                if (map.enableHistoryOnResizeEnd){
                    map.bsZoomControl.enableHistory();
                    map.enableHistoryOnResizeEnd = false;
                }
            });
        };

        //Create the application
        let menuOptions = {
                //Standard FCOO menu
                ownerList            : nsMap.createMapLayer,
                finallyFunc          : fcoo_maps_menu_finally,
                fileNameOrMenuOptions: fileNameOrMenuOptions
            };

        if (fileNameOrMenuOptions === false)
            menuOptions = null;

        ns.createApplication(
            options,
            fcoo_maps_create_content,
            menuOptions,
            fcoo_maps_resolve_setup,
            nsMap
        );
    };

    /*************************************************************************
    fcoo_maps_menu_finally( menuList, menuOptions )
    *************************************************************************/
    function fcoo_maps_menu_finally(/* menuList, menuOptions */){
        //Not used at the moment
    }

    /*************************************************************************
    fcoo_maps_resolve_setup( options )
    *************************************************************************/
    function fcoo_maps_resolve_setup( options ){
        //Get multi-maps and max-maps. Set modernizr-classes first
        window.modernizrOn ( 'single-maps-selected');
        window.modernizrOff( 'multi-maps-selected');

        function getDeviceDependendValue( obj ){
            if ($.isPlainObject(obj)){
                if (ns.modernizrDevice.isDesktop) return obj.desktop;
                if (ns.modernizrDevice.isTablet) return obj.tablet;
                return obj.mobile;
            }
            else
                return obj;
        }

        nsMap.hasMultiMaps = options.multiMaps && getDeviceDependendValue(options.multiMaps.enabled);
        if (nsMap.hasMultiMaps)
            //Get max-maps
            options.multiMaps.maxMaps = getDeviceDependendValue(options.multiMaps.maxMaps);


        //Adjust text on reset-button for the layer-menu and/or map-options
        var resetLayerText;
        if (nsMap.hasMultiMaps){
            if (options.multiMaps.maxMaps == 2)
                resetLayerText = {
                    da: 'Fravælg alle lag i begge kort',
                    en: 'Unselect all layers in both maps'
                };
            else
                resetLayerText = {
                    da: 'Fravælg alle lag i alle kort',
                    en: 'Unselect all layers in all maps'
                };
        }
        else
            resetLayerText = {
                da: 'Fravælg alle lag i kortet',
                en: 'Unselect all layers in the map'
            };

        if (options.layerMenuOptions)
            options.layerMenuOptions.resetText = resetLayerText;

        if (options.standardMenuOptions.reset)
            options.standardMenuOptions.resetText = resetLayerText;


        //Do not create MapLayer with search-results if search is not pressent AND only include search if MapLayer with is included
        if (!options.topMenu.search)
            delete nsMap.createMapLayer[nsMap.searchMapLayerId];
    }

    /*************************************************************************
    fcoo_maps_create_content($mainContainer, setupOptions)
    *************************************************************************/
    function fcoo_maps_create_content($mainContainer, setupOptions){
        //Link standard-menu-items and the corresponding mapLayer
        function link(menuItem){
            if (menuItem.options.mapLayerId){
                menuItem.mapLayer = nsMap.getMapLayer(menuItem.options.mapLayerId);
                menuItem.mapLayer.menuItem = menuItem;
            }
            var subItem = menuItem.first;
            while (subItem){
                link(subItem);
                subItem = subItem.next;
            }
        }

        if (nsMap.setupOptions.standardMenuId)
            link( nsMap.main[nsMap.setupOptions.standardMenuId].mmenu );

        //Update search-button
        if (setupOptions.topMenu.search){
            var topMenuSearchInput = nsMap.main.topMenuObject.searchInput,
                submitSearch = function(){
                    topMenuSearchInput.select().focus();
                    nsMap.search( topMenuSearchInput.val() );
                },
                clickSearch = function(){
                    //If search-input is hidden => show search-input-modal else click == submit
                    if (topMenuSearchInput.hasClass('top-menu-element-hide'))
                        nsMap.search( null );
                    else
                        submitSearch();
                };
            nsMap.main.topMenuObject.search.on('submit', submitSearch );
            nsMap.main.topMenuObject.searchButton.on('click', clickSearch );
        }

        //Set min- and max-zoom for main-map
        $.extend(nsMap.mainMapOptions, {
            //Set default minZoom and maxZoom
            minZoom: setupOptions.map.minZoom,
            maxZoom: setupOptions.map.maxZoom
        });

        //zoomModernizrOptions = options for leaflet-zoom-modernizr
        $.extend(nsMap.mainMapOptions.zoomModernizrOptions, {
            //Set default minZoom and maxZoom
            minZoom: setupOptions.map.minZoom,
            maxZoom: setupOptions.map.maxZoom
        });

        //nsMap.layerMinMaxZoom = zoom-options for any layer
        nsMap.layerMinMaxZoom = {
            minZoom: setupOptions.map.minZoom,
            maxZoom: setupOptions.map.maxZoom
        };

        if (nsMap.hasMultiMaps){
            $.extend(nsMap.secondaryMapOptions, {
                minZoom: nsMap.mainMapOptions.minZoom,
                maxZoom: nsMap.mainMapOptions.maxZoom,
            });
            $.extend(nsMap.secondaryMapOptions.zoomModernizrOptions, {
                minZoom: setupOptions.map.minZoom,
                maxZoom: setupOptions.map.maxZoom
            });

            //backgroundLayerMinMaxZoom = zoom-options for layers visible in all zooms
            //incl outside zoom-range given in setup => allows background to be visible
            //in secondary maps when main maps is at min or max zoom and secondary maps
            nsMap.backgroundLayerMinMaxZoom = {
                minZoom: Math.max(0, setupOptions.map.minZoom - setupOptions.multiMaps.maxZoomOffset),
                maxZoom: setupOptions.map.maxZoom + setupOptions.multiMaps.maxZoomOffset
            };

            //Create multi-maps
            nsMap.multiMaps = L.multiMaps(
                $('<div/>').prependTo(/*nsMap.main.*/$mainContainer), {
                border : false,
                maxMaps: setupOptions.multiMaps.maxMaps
            });

            //Create may-sync
            nsMap.mapSync = new L.MapSync({
                inclDisabled: true, // => Show shadow-cursor and outline on disabled maps (when shadow-cursor or outline is enabled)
                mapIsVisible: function( map ){
                    //Using isVisibleInMultiMaps from multi-maps to report if a map is visible
                    return map.isVisibleInMultiMaps;
                },
                //maxZoomOffset = Expected max different in zoom-level between any maps. Since it can be +/- nsMap.setupOptions.multiMaps.maxZoomOffset => 2*
                maxZoomOffset: 2 * nsMap.setupOptions.multiMaps.maxZoomOffset,


            });

            //Create main map
            nsMap.mainMap = nsMap.multiMaps.addMap( nsMap.mainMapOptions );
            nsMap.mainMap.setView(nsMap.defaultCenterZoom.center, nsMap.defaultCenterZoom.zoom);

            nsMap.mapSync.add(nsMap.mainMap);

            for (var i=1; i<setupOptions.multiMaps.maxMaps; i++){
                var map = nsMap.multiMaps.addMap( $.extend({}, nsMap.secondaryMapOptions ) );

                map.on('showInMultiMaps', map.onShowInMultiMaps, map );
                map.on('hideInMultiMaps', map.onHideInMultiMaps, map );

                nsMap.mapSync.add(map, {enabled: false});

                map.setView(nsMap.defaultCenterZoom.center, nsMap.defaultCenterZoom.zoom);

                map.onHideInMultiMaps();
            }
        }
        else {
            //Create single map
            nsMap.mainMap = L.map($mainContainer.get(0), nsMap.mainMapOptions);
            nsMap.mainMap.setView(nsMap.defaultCenterZoom.center, nsMap.defaultCenterZoom.zoom);
        }
    }
}(jQuery, window.moment, L, this, document));




;
/****************************************************************************
global-events.js
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /*****************************************************************************
    ControlGlobalEvents = Object to add methods to be called on global-events for
    different classes of L.Control and L.Layer
    *****************************************************************************/
    var ControlGlobalEvents = function(){
        var _this = this;
        this.events = {};
        $.each( ns.events.eventNames, function(index, eventName){
            ns.events.onLast(eventName, $.proxy(_this.onEvent, _this, eventName));
        });
    };

    $.extend(ControlGlobalEvents.prototype, {
        // add(objectName, eventNames, method) addes a class and event
        add: function(objectName, eventNames, method){
            var _this = this;
            eventNames = $.isArray(eventNames) ? eventNames : eventNames.split(' ');
            $.each(eventNames, function(index, eventName){
                _this.events[eventName] = _this.events[eventName] || {};
                _this.events[eventName][objectName] = method;
            });
        },


        onEvent: function(eventName){
            if (!this.events[eventName])
                return;

            var _this = this;
            //Find all Controls with given 'name' in all maps and call the event-method
            $.each(nsMap.mapList, function(id, map){
                $.each(_this.events[eventName], function(objectName, method){
                    var control = map[objectName];
                    if (control){
                        var func = $.isFunction(method) ? method : control[method];
                        func.call(control, eventName);
                    }
                });
            });
        },
    });
    ns.controlGlobalEvents = new ControlGlobalEvents();


    /*****************************************************************************
    Add methods to different global-events for different controls
    *****************************************************************************/
    //bsScaleControl = L.Control.BsScale
    ns.controlGlobalEvents.add(
        'bsScaleControl',
        [ns.events.UNITCHANGED, ns.events.NUMBERFORMATCHANGED],
        function(){
            var lengthMode = ns.globalSetting.get('length');
            this.setState({
                mode: lengthMode == 'METRIC2' ? 'METRIC' : lengthMode
            });
        }
    );

    //bsPositionControl = L.Control.BsPosition
    //Notyhing - is taken care of by value-format

    //latLngGraticule = L.latLngGraticule
    ns.controlGlobalEvents.add('latLngGraticule', ns.events.NUMBERFORMATCHANGED, '_draw');

    //routeControl = L.Control.Route
    ns.controlGlobalEvents.add('routeControl', [ns.events.UNITCHANGED, ns.events.LANGUAGECHANGED], 'onGlobalEvents');

}(jQuery, L, this, document));




;
/****************************************************************************
L.Control.bsToggleBottomMenu.js
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

        L.Control.BsToggleBottomMenu = L.Control.BsButton.extend({
            options: {
                bigIcon     : true,
                icon        : ['far fa-circle-chevron-up hide-for-bottom-menu-open fa-no-margin', 'far fa-circle-chevron-down show-for-bottom-menu-open'],
                position    : 'bottomcenter',
                transparent : true,
                //semiTransparent : true,
                onClick     : function(){ nsMap.main.bottomMenu.toggle(); }
            }
        });

    //Install L.Control.BsCompass
    L.Map.mergeOptions({
        bsToggleBottomMenuControl: false,
        bsToggleBottomMenuOptions: {}
    });

    L.Map.addInitHook(function () {
        if (this.options.bsToggleBottomMenuControl){
            this.bsToggleBottomMenuControl = new L.Control.BsToggleBottomMenu( this.options.bsToggleBottomMenuOptions );
            this.addControl(this.bsToggleBottomMenuControl);
        }
    });

}(jQuery, L, this, document));




;
/****************************************************************************
latlng-format.js
****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";


    /***************************************************
    Extend the format 'latlng' from fcoo-value-format
    to also accept Leaflet.LatLng as input
    ***************************************************/
    var latlngFormat = $.valueFormat.formats['latlng'];

    latlngFormat.convert = function(input){
        return input instanceof L.LatLng ? [input.lat, input.lng] : input;
    };

    /* convertBack not used since no element only contains 'copy' of input-object
    latlngFormat.convertBack = function(latLngArray){
        return latLngArray ? L.latLng(latLngArray) : null;
    }
    */

}(jQuery, L, this, document));




;
/****************************************************************************
latlng-modal.js
Methods to adjust and display latLng-values
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    //latLngAsModal(latLng) - Display a modal with latLng in different formats
    //Two different versions tryed: 1: With selectbox, 2: With selectlist
    var latLngModal,
        copyToClipboardFormat,
        latLngFormats,
        clipboard;

    nsMap.latLngAsModal = function(latLng, options){
        options = options || {};
        var modalOptions = {
                header: options.header || {
                    icon: ['fa-location-dot', 'fa-arrow-alt-right','fa-copy'],
                    text: {da:'Kopier position til udklipsholder', en:'Copy Position to Clipboard'}
                },
                content: [],
                //version 2:
                buttons: [{
                    id  : 'btn_copy_to_clipboard',
                    icon: 'fa-copy',
                    text: {da:'Kopier til udklipsholder', en:'Copy to Clipboard'},
                }],
                footer: window.bsIsTouch ? null : {
                    icon: 'far fa-computer-mouse',
                    text: {da: 'Dobbelt-klik på format for at kopier', en: 'Double click on format to copy'}
                },
                show: false
            };

        copyToClipboardFormat = copyToClipboardFormat || 'format' + ns.globalSetting.get('latlng') + '0';
        latLngFormats = {};

        if (clipboard)
            clipboard.destroy();

        //Box with position in current format
        modalOptions.fixedContent = {
            type     : 'textbox',
            label    : {icon:'fa-map-marker-alt', text: {da:'Position', en:'Position'}},
            text     : (options.text ? options.text+'<br>' : '') + '<b>'+latLng.format()+'</b>',
            textStyle:'center',
            center   : true
        };

        //select with different formats
        var saveCurrentFormatId = ns.globalSetting.get('latlng'),
            formatItems = [];

        for (var formatId = window.latLngFormat.LATLNGFORMAT_FIRST; formatId <= window.latLngFormat.LATLNGFORMAT_LAST; formatId++){
            window.latLngFormat.setTempFormat(formatId);
            formatItems.push({ text: window.latLngFormat.options.text[formatId] });

            var formatList = latLng.outputs();
            $.each(formatList, function(index, format){
                var id = 'format'+formatId+index;
                latLngFormats[id] = format;
                formatItems.push({
                    id: id,
                    text: format,
                    onDblClick: function(){
                        //Trigger copy to clipboard
                        clipboard.onClick( {currentTarget: $('#btn_copy_to_clipboard').get(0)} );
                    }
                });
            });
        }


        window.latLngFormat.setTempFormat(saveCurrentFormatId);

        modalOptions.content.push({
            //type      : 'selectlist', //version 1
            type      : 'selectlist',   //version 2
            //label     : {icon: 'fa-copy', text: {da:'Kopier til udklipsholder', en:'Copy to Clipboard'}}, //version 1
            fullWidth : true,
            center    : true,
            //size      : 4,    //version 1
            items     : formatItems,
            selectedId: copyToClipboardFormat,
            onChange  : function(id){ copyToClipboardFormat = id; },
            //version 1
            //after: {
            //    id  : 'btn_copy_to_clipboard',
            //    type: 'button',
            //    icon: 'fa-copy',
            //}
        });

        if (latLngModal)
            latLngModal.update(modalOptions);
        else
            latLngModal = $.bsModal(modalOptions);

        latLngModal.show();
        clipboard = new window.ClipboardJS('#btn_copy_to_clipboard', {
            container: latLngModal.bsModal.$modalContent[0],
            text     : function(/*trigger*/) { return latLngFormats[copyToClipboardFormat]; }
        });
        clipboard.on('success', function(/*e*/){
             window.notySuccess({da:'Kopieret!', en:'Copied!'}, {timeout: 500} );
        });
        clipboard.on('error', function(e){
             window.notyError(
                 ['"'+e.text+'"<br>', {da:' blev <b>ikke</b> kopieret til udklipsholder', en:' was <b>not</b> copied to the Clipboard'}],
                 {layout: 'center', defaultHeader: false}
             );
        });


    };

    //Extend LatLng with asModal-method
    L.extend( L.LatLng.prototype, {
        asModal: function(options){ nsMap.latLngAsModal(this, options); },
    });

}(jQuery, L, this, document));




;
/****************************************************************************
layer_color.js

Extensions to L.Map and L.TileLayer to allow tile-layers to fire event "color" with
color and layLng at the cursor/map center using the map's position-control (L.Control.BsPosition)

Each Map using its bsPositionControl (if any) to get current position of the cursor/mouse or map-center
and use this position (if any) to fire event 'color' on all the tileLayers at the map
To get the best resolution the map checks all the other maps in its mapSync to see
if there are other maps with the same tileLayer (options.id) at a higher zoom-level
that includes current position, and use this other map to get the color
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    function rgba2Hex( n ){
        var result = Number(n).toString(16);
        return (result.length < 2 ? '0' : '') + result;
    }

    /***********************************************************
    Add initHook to get bsPosition-control (if any) and use it to
    get cursor-/center-position
    /***********************************************************/
    L.Map.addInitHook(function() {
        var bsPositionOptions = this.bsPositionControl ? this.bsPositionControl.options : this.options.bsPositionControl ? this.options.bsPositionOptions : null;
        if (bsPositionOptions){
            bsPositionOptions.onCenterPosition = bsPositionOptions.onMousePosition = $.proxy(this._onColorPosition, this);
            this.on('zoomend', onZoomend_fireColor, this);
        }
    });

    function onZoomend_fireColor(){
        if (this.bsPositionControl && (this.bsPositionControl.options.mode == 'MAPCENTER'))
            this._onColorPosition( this.getCenter() );
    }

    /***********************************************************
    Extend L.Map with methods to get color at given position
    for the layers on the map
    /***********************************************************/
    L.Map.include({
        lastColorLatLng   : null,
        lastColorLatLngStr: '',

        /***********************************************************
        _onColorPosition(latLng)
        latLng =
            position => Update
            null     => cursor outside map
            true     => update with last position - e.q. when time change
        ***********************************************************/
        _onColorPosition: function(latLng){
            if (nsMap.hasMultiMaps && !this.isVisibleInMultiMaps) return;

            var _this = this;

            if (latLng === true){
                //Force all layers to fire getColor-event
                latLng = this.lastColorLatLng;
                this.lastColorLatLngStr = 'FORCE';
            }
            else
                this.lastColorLatLng = latLng;

            var colorLatLngStr = (latLng ? latLng.toString() : 'null') + +this.getZoom();
            if (colorLatLngStr == this.lastColorLatLngStr) return;

            this.lastColorLatLngStr = colorLatLngStr;

            //Create a list of maps that includes latLng and has zoom > this map's zoom
            var mapList = [];
            if (latLng && this._mapSync){
                this._mapSync.forEachMap( function(id, map){
                    if ((map !== _this) && (map.getZoom() > _this.getZoom()) && map.getBounds().contains(latLng))
                        mapList.push(map);
                });
                mapList.sort(function(map1, map2){ return map1.getZoom() - map2.getZoom(); });
            }

            //Find all layers (if any) that has a color-event
            this.eachLayer(function(layer){
                if ( layer.listens('color') ){
                    var layerColorRGBA = null;
                    if (latLng){
                        var layerToUse = layer;
                        //Check if the same layer also is pressent in one of the maps in mapList => use that version of the layer instead
                        $.each(mapList, function(index, map){
                            return map.eachLayer( function(layer){
                                if (layer.options.id == layerToUse.options.id){
                                    layerToUse = layer;
                                    return true;
                                }
                            });
                        });
                        layerColorRGBA = layerToUse.getColor(latLng);

                        //Fire color-event if the layer returned a color else force next event to try again
                        if (layerColorRGBA)
                            layer._fireOnColor(layerColorRGBA, latLng);
                        else
                            _this.lastColorLatLngStr = '';
                    }
                    else
                        //Cursor is outside the map
                        layer._fireOnColor(null, null);
                }
            });
        }
    });

    /***********************************************************
    Extend L.TileLayer with options and methods to get color from position
    ***********************************************************/
    L.TileLayer.mergeOptions({id:''});

    L.TileLayer.include({
        /******************************************************************
        getColor(latLng) return the color (rgb-array) from the position latLng
        Taken from https://github.com/frogcat/leaflet-tilelayer-colorpicker
        ******************************************************************/
        getColor: function(latLng){

            if (!this._map)
                return null;

            var size = this.getTileSize(),
                point = this._map.project(latLng, this._tileZoom).floor(),
                coords = point.unscaleBy(size).floor(),
                offset = point.subtract(coords.scaleBy(size));
            coords.z = this._tileZoom;
            var tile = this._tiles[this._tileCoordsToKey(coords)];

            if (!tile || !tile.loaded)
                return null;
            try {
                var canvas = document.createElement("canvas");
                canvas.width = 1;
                canvas.height = 1;
                var context = canvas.getContext('2d');

                context.drawImage(tile.el, -offset.x, -offset.y, size.x, size.y);

                return context.getImageData(0, 0, 1, 1).data;
            }
            catch (e) {
                return null;
            }
        },

        /******************************************************************
        _fireOnColor
        Fire the event 'color' on the layer with the color and position
        ******************************************************************/
        _fireOnColor: function(colorRGBA, latLng){
            this.fire('color', {
                colorRGBA : colorRGBA,
                colorHex  : colorRGBA ? '#' + rgba2Hex(colorRGBA[0]) + rgba2Hex(colorRGBA[1]) + rgba2Hex(colorRGBA[2]) + rgba2Hex(colorRGBA[3]) : null,
                latLng    : latLng
            });
        }
    });

}(jQuery, L, this, document));

;
/****************************************************************************
    layer_wms.js,

    Load and set standard options for WMS-layers

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /*
    From Leaflet documentation:
    L.tileLayer.wms(<String> baseUrl, <TileLayer.WMS options> options)

    baseUrl = URL template = A string of the following form:
    "http://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png"

    {s} means one of the available subdomains (used sequentially to help with browser parallel requests per domain limitation; subdomain values are specified in options; a, b or c by default, can be omitted),
    {z} — zoom level,
    {x} and {y} — tile coordinates.
    {r} can be used to add "@2x" to the URL to load retina tiles.

    You can use custom keys in the template, which will be evaluated from TileLayer options, like this:

    L.tileLayer('http://{s}.somedomain.com/{foo}/{z}/{x}/{y}.png', {foo: 'bar'});

    options (gridLayer):
        tileSize            Number|Point 256        Width and height of tiles in the grid. Use a number if width and height are equal, or L.point(width, height) otherwise.
        opacity             Number    1.0           Opacity of the tiles. Can be used in the createTile() function.
        updateWhenIdle      Boolean    (depends)    Load new tiles only when panning ends. true by default on mobile browsers, in order to avoid too many requests and keep smooth navigation.
                                                        false otherwise in order to display new tiles during panning, since it is easy to pan outside the keepBuffer option in desktop browsers.
        updateWhenZooming   Boolean    true         By default, a smooth zoom animation (during a touch zoom or a flyTo()) will update grid layers every integer zoom level.
                                                        Setting this option to false will update the grid layer only when the smooth animation ends.
        updateInterval      Number    200           Tiles will not update more than once every updateInterval milliseconds when panning.
        zIndex              Number    1             The explicit zIndex of the tile layer.
        bounds              LatLngBounds undefined  If set, tiles will only be loaded inside the set LatLngBounds.
        minZoom             Number    0             The minimum zoom level down to which this layer will be displayed (inclusive).
        maxZoom             Number    undefined     The maximum zoom level up to which this layer will be displayed (inclusive).
        maxNativeZoom       Number    undefined     Maximum zoom number the tile source has available. If it is specified, the tiles on all zoom levels higher than maxNativeZoom will
                                                        be loaded from maxNativeZoom level and auto-scaled.
        minNativeZoom       Number    undefined     Minimum zoom number the tile source has available. If it is specified, the tiles on all zoom levels lower than minNativeZoom will
                                                        be loaded from minNativeZoom level and auto-scaled.
        noWrap              Boolean    false        Whether the layer is wrapped around the antimeridian. If true, the GridLayer will only be displayed once at low zoom levels.
                                                    Has no effect when the map CRS doesn't wrap around. Can be used in combination with bounds to prevent requesting tiles outside the CRS limits.
        pane                String    'tilePane'    Map pane where the grid layer will be added.
        className           String    ''            A custom class name to assign to the tile layer. Empty by default.
        keepBuffer          Number    2             When panning the map, keep this many rows and columns of tiles before unloading them.


    options (tileLayer):
        subdomains          String|String[] 'abc'   Subdomains of the tile service. Can be passed in the form of one string (where each letter is a subdomain name) or an array of strings.
        errorTileUrl        String    ''                URL to the tile image to show in place of the tile that failed to load.
        zoomOffset          Number     0            The zoom number used in tile URLs will be offset with this value.
        tms                 Boolean    false        If true, inverses Y axis numbering for tiles (turn this on for TMS services).
        zoomReverse         Boolean    false        If set to true, the zoom number used in tile URLs will be reversed (maxZoom - zoom instead of zoom)
        detectRetina        Boolean    false            If true and user is on a retina display, it will request four tiles of half the specified size and
                                                        a bigger zoom level in place of one to utilize the high resolution.
        crossOrigin         Boolean|String false    Whether the crossOrigin attribute will be added to the tiles. If a String is provided, all tiles will have their crossOrigin
                                                        attribute set to the String provided. This is needed if you want to access tile pixel data. Refer to CORS Settings for valid String values.

    options (wms):
        layers              String    ''(required)  Comma-separated list of WMS layers to show.
        styles              String    ''            Comma-separated list of WMS styles.
        format              String    'image/jpeg'  WMS image format (use 'image/png' for layers with transparency).
        transparent         Boolean    false        If true, the WMS service will return images with transparency.
        version             String     '1.1.1'      Version of the WMS service to use
        crs                 CRS        null         Coordinate Reference System to use for the WMS requests, defaults to map CRS. Don't change this if you're not sure what it means.
        uppercase           Boolean    false        If true, WMS request parameter keys will be uppercase.

    https://wms01.fcoo.dk/mapproxy/service?
        service=WMS&
        request=GetMap&
        layers=background-iho_latest&
        styles=&
        format=image%2Fpng&transparent=true&version=1.1.1&
        width=512&
        height=512&
        srs=EPSG%3A3857&
        bbox=-626172.1357121639,8766409.899970293,0,9392582.035682464


    https://wms02.fcoo.dk/webmap/v2/data/DMI/HARMONIE/DMI_NEA_MAPS_v005C.nc.wms?
        service=WMS&
        request=GetMap&
        version=1.3.0&
        layers=UGRD%3AVGRD&
        styles=plot_method%3Dcolor_quiver1%3Bvector_spacing%3D80%3Bvector_offset%3D20%3Blegend%3DWind_ms_BGYRP_11colors&format=image%2Fpng&
        transparent=TRUE&
        cmap=Wind_ms_BGYRP_11colors&
        width=512&
        height=512&
        time=2020-11-06T09%3A00%3A00.000Z&
        crs=EPSG%3A3857&
        bbox=1252344.2714243277,7514065.628545967,1878516.407136492,8140237.764258131
    */

    var defaultWMSOptions = {
            defaultOptions: {
                protocol    : 'https:',
                tileSize    : 512,
                opacity     : 1.0,

                subdomains  : ["wms01", "wms02", "wms03", "wms04"],
                errorTileUrl: {subDir:"error-tiles", fileName:"empty_{tileSize}.png"},

                zoomOffset  : false,
                tms         : false,
                zoomReverse : false,
                detectRetina: false,
                crossOrigin : false,

                layers      : '',
                styles      : '',
                format      : 'image/png',
                transparent : true,
                crs         : "L.CRS.EPSG3857",
                uppercase   : false,

                //leaflet.edgebuffer disabled
                edgeBufferTiles: 0,

            },
            staticUrl: "{protocol}//{s}.fcoo.dk/mapproxy/service",
            staticOptions: {
                version: '1.1.1'
            },
            dynamicUrl: "{protocol}//{s}.fcoo.dk/webmap/v2/data/{dataset}.wms",
            dynamicOptions: {
                updateInterval: 50,
                transparent   : 'TRUE',
                version       : '1.3.0'
            }
        };


    //adjustString - Replaces "{ID}" in str with the value at options.ID
    function adjustString( str, options ){
        $.each(options, function(id, content){
            if (    (typeof content == 'string') ||
                    (typeof content == 'number') ||
                    (typeof content == 'boolean')
                )
                str = str.split('{'+id+'}').join(content);
        });

        return str;
    }


    //adjustOptions - Replaces {ID} with the value at options.ID
    function adjustOptions( options, defaultOptions = options ){
        var optionsStr = adjustString(window.JSON.stringify(options), defaultOptions);
        return $.extend(true, {}, options, window.JSON.parse(optionsStr) );
    }

    //Response for loading wms-options from setup-file
    nsMap.standard.wms = function(options){

        options = $.extend(true, {}, defaultWMSOptions, options);

        options.defaultOptions = adjustOptions( options.defaultOptions );

        //Convert errorTileUrl: {subDir:STRING, fileName:STRING} => STRING (path)
        function convert_errorTileUrl(options){
            if ($.isPlainObject(options))
                $.each(options, function(id, value){
                    if (id == 'errorTileUrl')
                        options[id] = ns.path.dataFileName(value);
                    else
                        convert_errorTileUrl(value);
                });
        }
        convert_errorTileUrl(options);

        //crs can be a ref to a Leaflet-object
        var crs = options.defaultOptions.crs,
            crsResolve = new Function('crs','return eval(crs);');
        try{
            options.defaultOptions.crs = crsResolve(options.defaultOptions.crs);
        }
        catch (error){
            options.defaultOptions.crs = crs;
        }

        nsMap.wmsStatic = {
            url    : adjustOptions( options, options.defaultOptions ).staticUrl,
            options: $.extend(true, {}, options.defaultOptions, options.staticOptions )
        };
        nsMap.wmsDynamic = {
            url    : adjustOptions( options, options.defaultOptions ).dynamicUrl,
            options: $.extend(true, {}, options.defaultOptions, options.dynamicOptions )
        };
    };


    /***********************************************************
    layer_wms - Creates a L.tileLayer.wms with options for
    static or dynamic layers
    options = {
        url             : STRING
        LayerConstructor: CONSTRUCTOR (optional)
        service         : STRING ("WMS")
        request         : STRING ("GetMap")
        layers          : STRING,
        zIndex          : NUMBER
        deltaZIndex     : NUMBER (optional)
        minZoom         : NUMBER (optional)
        maxZoom         : NUMBER (optional)
    }
    ***********************************************************/
    nsMap.layer_wms = function(options, map, defaultOptions, url, LayerConstructor = L.TileLayer.WMS){
        //Adjust options
        if (typeof options == 'string')
            options = {layers: options};
        options.zIndex = options.zIndex || nsMap.zIndex.STATIC_LAYER + (options.deltaZIndex || 0);
        options =   $.extend(true, {
                        service         : "WMS",
                        request         : "GetMap",
                    }, defaultOptions, options );


        //Convert layers: []STRING => STRING,STRING and styles = {ID: VALUE} => ID:VALUE;ID:VALUE
        function convertToStr(id, separator){
            if ($.isArray(options[id]))
                options[id] = options[id].join(separator);
            else
                if ($.isPlainObject(options[id])){
                    var list = [];
                    $.each(options[id], function(id, value){
                        list.push(id+'='+value);
                    });
                    options[id] = list.join(separator);
                }
        }

        convertToStr('layers', ',');
        convertToStr('styles', ';');

        //Remove none-wms-options from options
        options = $.extend(true, {}, options);
        ['protocol', 'dataset'].forEach( id => delete options[id] );

        return new LayerConstructor(url, options );
    };


    /***********************************************************
    layer_static - Creates a L.TileLayer.WMS (layer_wms) with options for static layers
    ***********************************************************/
    nsMap.layer_static = function(options, map, defaultOptions = nsMap.wmsStatic.options, url = nsMap.wmsStatic.url, LayerConstructor){
        return nsMap.layer_wms(options, map, defaultOptions, url, LayerConstructor);
    };


    /***********************************************************
    layer_dynamic - Creates a L.TileLayer.WMS (layer_wms) with options for dynamic layers
    ***********************************************************/
    nsMap.layer_dynamic = function(options, map, defaultOptions = nsMap.wmsDynamic.options, url = nsMap.wmsDynamic.url, LayerConstructor){
        //Adjust url to include eq. dataset
        url = adjustString(url, options);

        return nsMap.layer_wms(options, map, defaultOptions, url, LayerConstructor);
    };

}(jQuery, L, this, document));

;
/****************************************************************************
layer_z-index.js,

fcoo.map.zIndex contains constants with z-index for different type of panes

------------------------------------------------------------------------------
Leaflet has one parent-pane and six different panes for different layers.
See https://leafletjs.com/reference-1.7.1.html#map-overlaypane

Pane	    Z-index	Description
mapPane	      auto	Pane that contains all other map panes
tilePane	  200	Pane for GridLayers and TileLayers
overlayPane   400	Pane for vectors (Paths, like Polylines and Polygons), ImageOverlays and VideoOverlays
shadowPane	  500	Pane for overlay shadows (e.g. Marker shadows)
markerPane	  600	Pane for Icons of Markers
tooltipPane	  650	Pane for Tooltips.
popupPane	  700	Pane for Popups.


Map.createPane(<String> name, <HTMLElement> container?)
Map.getPane(<String|HTMLElement> pane)	HTMLElement
Map.getPanes()
------------------------------------------------------------------------------


All tile-layers (and other grid-layers) has options.zIndex controling the order

If a Layer contains Marker and/or polylines etc. each layer gets its own pane inside
overlayPane, shadowPane, and/or markerPane with z-index given directly in options or
via the layers id in fcoo.map.zIndex[id]

****************************************************************************/
(function ($, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    nsMap.zIndex = {

        //Z-index for layers in overlayPane and markerPane. Typical geoJSON-layer
        'NAVIGATION_PILOT_BOARDING_POSITIONS': 100,


        'NAVIGATION_NIORD'                   : 90,


        //Z-index for tile-layer in tilePane


        //BACKGROUND_LAYER_COASTLINE: Must be above all dynamic layers
        "BACKGROUND_LAYER_COASTLINE": 2000,




        //STATIC_LAYER = Default static layer eq. EEZ, VTS-lines, SAR-areas etc.
        "STATIC_LAYER_LAND"         : 1000,

        "STATIC_LAYER"              : 900,  //TODO




        //BACKGROUND_LAYER_LAND, BACKGROUND_LAYER_WATER = Layer with background land and water
        "BACKGROUND_LAYER_LAND"     : 500,

        "STATIC_LAYER_WATER"        : 400,




        "BACKGROUND_LAYER_WATER"    : 300   //TODO


    };

//sæt window.L_GEOPOLYLINE_ZINDEX = 100; i relation til de andre ting TODO


}(jQuery, this, document));

;
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
    From leaflet 1.7.1 documentation:
    Renderer
    Base class for vector renderer implementations (SVG, Canvas).
    Handles the DOM container of the renderer, its bounds, and its zoom animation.

    A Renderer works as an implicit layer group for all Paths - the renderer itself can be added or removed to the map.
    All paths use a renderer, which can be implicit (the map will decide the type of renderer and use it automatically) or
    explicit (using the renderer option of the path).

    Do not use this class directly, use SVG and Canvas instead.

    Options
    Option	    Type	Default Description
    padding	    Number	0.1	    How much to extend the clip area around the map view (relative to its size) e.g. 0.1 would be 10% of map view in each direction
    tolerance	Number	0	    How much to extend click tolerance round a path/object on the map


    Note:
    Setting L.Renderer.prototype.options.padding higher that default .1 will increase the drawing of SVGs on the map
    and reduce the time swhere a drawing is cut off when dragging the map.
    Setting L.Renderer.prototype.options.padding = 1.0 will prevent any drawing from being cut off,
    but will require a 3x3 redraw of the map hence increasing the load with a factor 9ish.

    For now the value is set to .5 meaning that dragging the map from the center to any of the edges will not create a svg cut off
    and it will 'only' require a (.5 + 1 + .5) x (.5 + 1 + .5) = 4 redraw

    The finally number for L.Renderer.prototype.options.padding must be desided after some tryout and experience

    ***********************************************************/
    L.Renderer.prototype.options.padding = .5;

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

    //nsMap.visitAllMaps: Call method(map, arg[0], arg[1],...) for all maps
    nsMap.visitAllMaps = function(method, arg = [], onlyVisibleMaps){
        arg.unshift('');

        $.each(nsMap.mapIndex, function(index, map){
            arg[0] = map;
            if (map && (!onlyVisibleMaps || map.isVisibleInMultiMaps))
                method.apply(map, arg);
        });
    };

    //nsMap.visitAllVisibleMaps: Call method(map, arg[0], arg[1],...) for all visible maps
    nsMap.visitAllVisibleMaps = function(method, arg = []){
        nsMap.visitAllMaps(method, arg, true);
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
            semiTransparent: false, //true,
            content: {
                semiTransparent: false
            },
            isExtended        : true,
            showCursorPosition: !window.bsIsTouch,
            showLandSeaColor  : true,

            inclContextmenu   : true,
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
                header: {
                    icon: ns.icons.mapLegend,
                    text: ns.texts.mapLegend
                },
                noVerticalPadding   : true,
                noHorizontalPadding : false,
                width: '20em',  //<= TODO Adjust
            }
        },


        //bsCompassControl = Show device orientation
        bsCompassControl: ns.modernizrDevice.isMobile,
        bsCompassOptions: {
            show    : false,
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
                //Add two elements with direction as text and as number
                $element.addClass('flex-column');
                if (!$element.children().length){
                    $('<div/>')
                        .vfFormat('direction_text')
                        .appendTo($element);
                    $('<div/>')
                        .vfFormat('direction')
                        .appendTo($element);
                }
            },
            setOrientationNumber: function( orientation, $element/*, control */){
                $element.children().vfValue(orientation);
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
            show    : false,        //bsSettingControl is not shown on any maps.
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
        bsScaleOptions: { show: false },


        //bsLegendControl - default hidden
        bsLegendOptions: { show: false },

        //bsCompassControl  - default hidden
        bsCompassOptions: { show: false },

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


}(jQuery, L, this, document));


;
/****************************************************************************
map-center-zoom.js

Objects and methods to handle save and setting of map center-position and zoom
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    nsMap.defaultCenterZoom = {center: [56.2, 11.5], zoom: 6};

   /*********************************************************************
    L.Control.MapCenterZoomControl = Hidden control used to set and get
    the maps center-position and zoom in the map's SettingGroup
    *********************************************************************/
    L.Control.MapCenterZoomControl = L.Control.extend({

        initialize: function(map){
            this.id = map.fcooMapId + '_center_zoom';
            this._map = map;
            this.lastCenterZoomStr = '';

            ns.appSetting.add({
                id          : this.id,
                applyFunc   : $.proxy(this.applyFunc, this),
                defaultValue: nsMap.defaultCenterZoom
            });
            map.on('moveend mapsyncdisabled', this.onMoveend, this);

            return L.Control.prototype.initialize.apply(this, arguments);
        },

        useCenterZoom: function(centerZoom){
            if (this._map._mapSync && this._map.options.mapSync && this._map.options.mapSync.enabled && !this._map.options.mapSync.isMainMap)
                return false;

            var centerZoomStr = centerZoom.center.toString()+'_'+centerZoom.zoom;
            if (centerZoomStr != this.lastCenterZoomStr){
                this.lastCenterZoomStr = centerZoomStr;
                return true;
            }
            return false;
        },

        onMoveend: function(){
            var centerZoom = {
                    center: this._map.getCenter(),
                    zoom  :this._map.getZoom()
                };

            if ( this.useCenterZoom(centerZoom)){
                ns.appSetting.set(this.id, {
                    center: [centerZoom.center.lat, centerZoom.center.lng],
                    zoom  : centerZoom.zoom
                });
                this.doNotApply = true;
                //ns.appSetting.save();
                this.doNotApply = false;
            }
        },

        applyFunc: function(centerZoom){
            if (this.doNotApply)
                return;

            centerZoom.center = L.latLng(centerZoom.center);
            if (this.useCenterZoom(centerZoom))
                this._map.setView(centerZoom.center, centerZoom.zoom, {animate: false});
        }
    });


    L.Map.mergeOptions({
        mapCenterZoomControl: true//TODO = false
    });

    L.Map.addInitHook(function () {
        if (this.options.mapCenterZoomControl)
            this.mapCenterZoomControl = new L.Control.MapCenterZoomControl(this);
    });
}(jQuery, L, this, document));

;
/****************************************************************************
map-contextmenu.js

Global context-menu for all maps

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    /***********************************************
    nsMap._addMapContextmenu = function(header, method, index=-1)
    Add extra common map context-menu items from specific layers
    ***********************************************/
    var mapContextmenu = nsMap.mapContextmenu = [];
    nsMap._addMapContextmenu = nsMap._addMapContextMenu = function(header, method, index=-1){
        index = index == -1 ? mapContextmenu.length : index;
        mapContextmenu.push({header: header, method: method, index: index});
        mapContextmenu.sort((obj1, obj2) => obj1.index - obj2.index);
    };

    var map_contextmenu_header = {
            icon: 'fa-map',
            text: {da:'Kort', en:'Map'}
        };


    var map_contextmenu_itemList = [{
            //Position in modal-window
            icon   : 'fa-location-dot',
            text   : {da:'Position...', en: 'Position...'},
            onClick: function(id, latLng){
                latLng.asModal();
            }
        },{
            //Center map
            icon   : 'fa-crosshairs',
            text   : {da:'Centrér her', en:'Center here'},
            closeOnClick: false,

            onClick: function(id, latLng, $button, map){
                if (map)
                    map.setView(latLng, map.getZoom(), map._mapSync_NO_ANIMATION);
            },

        }];




    map_contextmenu_itemList.push({
        //Map-setting
        icon       : ns.icons.mapSettingSingle,
        text       : ns.texts.mapSettingSingle,
        spaceBefore: true,
        width      : '11em',
        onClick: function(id, latlng, $button, map){
            if (map)
                nsMap.editMapSetting(map.fcooMapIndex);
        }
    });


    L.Map.addInitHook(function () {
        //Convert context-menu-items from nsMap.mapContextmenu
        let list = [];
        mapContextmenu.forEach( (item,index) => {
            list.push({
                icon: item.header.icon,
                text: item.header.text,
                spaceBefore: index == 0,
                spaceAfter: index == mapContextmenu.length-1,
                onClick: function(id, latlng, $button, map){ item.method(latlng, map); }
            });
        });

        //If the map has a BsPositionControl with contextmenu or a options.MANGLER = true
        if ( (this.options.bsPositionOptions && this.options.bsPositionOptions.inclContextmenu) || (this.options.MANGLER) ){
            this.setContextmenuHeader( map_contextmenu_header );
            this.addContextmenuItems( list );
            this.addContextmenuItems( map_contextmenu_itemList );
        }
    });
}(jQuery, L, this, document));

;
/****************************************************************************
map-layer_00.js,

MapLayer represent a layer on the map with menu-item, legend-item, and
color-info in bsPositionControl plus the map-layer addable and removable
to/from multible maps

New MapLayers are created using nsMap._addMapLayer(id, Constructor, options)
options = {
    zIndex          : 0,        //Individuel z-index for the layer
    paneId          : '',       //If given use if to get z-index from fcoo.map.zIndex to use for pane (if createPane and/or createMarkerPane is true)
    createPane      : false,    //If true an individuel pane is created
    createMarkerPane: false,    //If true an individuel pane is created (incl. shadowPane)

    zIndex (*)          :
    deltaZIndex (*)     :
    minZoom (*)         :
    maxZoom (*)         :
    LayerConstructor (*):

    layerOptions    : {},       //Specific options for the Layer. Can include options marked (*)

    //Menu
    menuOptions: {
        buttonList : []bsButton-options
        useLegendButtonList: BOOLEAN, if true and menuOptions.buttonList is not given => use legendOptions.buttonList as in menu
    },

    //Legend
    legendOptions: {
        buttonList : []bsButton-options + onlyShowWhenLayer: BOOLEAN. When true the button is only visible when the layer is visible.
        onInfo     : function()
        onWarning  : function()
    }



    buttonList: Same as legendOptions.buttonList kept for backward combability
    onInfo    : Same as legendOptions.onInfo kept for backward combability
    onWarning : Same as legendOptions.onWarning kept for backward combability


    //dataset = options for Dataset - see scr/common/dataset.js
    /dataset: {
        valueList,
        options,
        data
    }


    //colorInfo = options for showing info on the postion of the cursor/map center
    colorInfo: {
        icon     : STRING       //If the MapLayer also have a legend the icon from the legend is used
        text     : STRING       //If the MapLayer also have a legend the text from the legend is used
        onlyLand : BOOLEAN,     //Only show when cursor/map center is over land. Default = false
        onlyWater: BOOLEAN      //Only show when cursor/map center is over water/sea. Default = false
        show     : BOOLEAN      //Turn the update on/off. Default = true

        getColor : function(options)    //Return the color (hex) to use as background-color in the infoBox.
                                        //options = {colorRGBA, colorHex, latLng}
                                        //Default = return options.colorHex
                                        //Set to false if no background-color in the infoBox is needed
        allowTransparentColor: BOOLEAN  //If true getColor is also called on fully transparent colors

        getText : function(options)     //Return the content (STRING or {da:STRING, en:STRING} or {icon, text}) to be displayed in the infoBox.
                                        //options = {colorRGBA, colorHex, transparent, color (from getColor), latLng}
                                        //Default: return ""
    }
}


SETTING
Map_Layer has the following methods to set and save settings the layer:

//applySetting - apply individual setting for the Map_layer
applySetting: function(setting, map, mapInfo, mapIndex){
    //Apply setting for this layer at map. setting = {..} with options for this layer on map/mapInfo/mapIndex
},

//saveSetting: function() - Return individual setting for the Map_layer
saveSetting: function(map, mapInfo, mapIndex){
    //Return {..} with options for this layer on map/mapInfo/mapIndex
},






****************************************************************************/
(function ($, L, window, document, undefined) {
    "use strict";
/*
<script>
    L.Map.addInitHook(function(){
        this.on('popupopen', function( event ){
            console.log('popupopen', findLayer(event.popup));

        });
    });

function findLayer( layer ){
    if (!layer)
        return '';
    if (layer.options && layer.options.NIELS)
        return layer.options.NIELS;

    var result = '';
    $.each(layer._groups, function(index, _layer){
        result = result || findLayer( _layer );
    });

    ['_source', '_parentPolyline'].forEach( id => {
        result = result || findLayer( layer[id] );
    });

    return result;
}

L.LayerGroup.include({
    addLayer: function (layer) {
        var id = this.getLayerId(layer);
        this._layers[id] = layer;
        if (this._map) {
            this._map.addLayer(layer);
        }

        // Add this group to the layer's known groups
        layer._groups.push(this);

        return this;
    },

    removeLayer: function (layer) {
        var id = layer in this._layers ? layer : this.getLayerId(layer);
        if (this._map && this._layers[id]) {
            this._map.removeLayer(this._layers[id]);
        }
        delete this._layers[id];

        // Remove this group from the layer's known groups
        layer._groups.splice(layer._groups.indexOf(this), 1);

        return this;
    }
});

// Make sure to init a property in L.Layer
L.Layer.addInitHook(function(){
    this._groups = [];
});

    L.Map.mergeOptions({
        doubleRightClickZoom: true
    });

</script>
*/
    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {},

        defaultOptions = {
            zIndex          : 0,
            paneId          : '',
            createPane      : false,
            createMarkerPane: false,
            layerOptions    : {},
            legendOptions   : {},
            colorInfo       : null,

            //dataset: {valueList, options, data}

        },

        defaultColorInfoOptions = {
            show: true,
            allowTransparentColor: false,
            getColor: function(  options  ){ return options.colorHex; },
            gettext : function(/*options*/){ return '';               },
        };

    //Adjust default options for legend
    L.BsLegend_close_icon = [
        ['show-for-single-maps-selected far fa-map fa-scale-x-08', 'show-for-single-maps-selected fas fa-slash fa-scale-x-08'],
        ['show-for-multi-maps-selected fa-square-check']
    ];
    L.BsLegend_close_title = {da: 'Skjul/Vælg', en: 'Hide/Select'};


    //Overwrite L.BsLegend.remove to select for all maps if multi maps
    L.BsLegend.prototype.remove = function(e){
        //Since this.parent.removeLegend removed DOM-elements the event must stop propagation
        L.DomEvent.stopPropagation(e);

        this.options.mapLayer.selectMaps(this.parent._map);
    };



    nsMap.getMap = function(mapOrMapIndexOrMapId){
        return mapOrMapIndexOrMapId instanceof L.Map ?
                mapOrMapIndexOrMapId :
                nsMap.mapIndex[mapOrMapIndexOrMapId] || nsMap.mapList[mapOrMapIndexOrMapId];
    };

    nsMap.getPaneName       = function(id){ return id.toUpperCase()+'Pane'; };
    nsMap.getMarkerPaneName = function(id){ return id.toUpperCase()+'MarkerPane'; };
    nsMap.getShadowPaneName = function(id){ return id.toUpperCase()+'ShadowPane'; };

    var maxLayerIndex = 0;




    /***********************************************************
    nsMap.createMapLayer = {MAPLAYER_ID: CREATE_MAPLAYER_AND_MENU_FUNCTION}
    MAPLAYER_ID: STRING
    CREATE_MAPLAYER_AND_MENU_FUNCTION: function(options, addMenu: function(menuItem or []menuItem)
    Each mapLayer must add a CREATE_MAPLAYER_AND_MENU_FUNCTION-function to nsMap.createMapLayer:

        nsMap.createMapLayer[ID] = function(options, addMenu){
            //Somewhere inside the function or inside a response call
            //addMenu({id:ID, icon:..., text:..., type:...}, or
            //addMenu(this.menuItemOptions())
        };

    Eq. list[3] = {id: 'NAVIGATION_WARNING'}
    Some mapLayer "creator" has set nsMap.createMapLayer['NAVIGATION_WARNING'] = function(options, addMenu){...}
    This function is called to create the mapLayer and set the new menu-item-options (via addMenu-function)
    The code for nsMap.createMapLayerAndMenu is in src/layer/map-layer_00.js

    Javascrip notes:
        array.splice(index, 1)        = remove array[index]
        array.splice(index, 0, item)  = insert item at array[index]
        array.splice(index, 1, item)  = replace array[index] with item

    ***********************************************************/
    nsMap.createMapLayer = nsMap.createMapLayer || {};



    /***********************************************************
    MapLayer
    ***********************************************************/
    function MapLayer(options) {
        this.options = $.extend(true, {}, defaultOptions, options || {});

        //A list of options can for backward combability reasons be found both in options and in options.legendOptions
        ['buttonList', 'buttons', 'content', 'noVerticalPadding', 'noHorizontalPadding', 'onInfo', 'onWarning'].forEach( id => {
            let options = this.options,
                legendOptions = this.options.legendOptions;

            if ((legendOptions[id] === undefined) && (options[id] !== undefined)){
                legendOptions[id] = options[id];
                delete options[id];
            }
        }, this);

        this.index = this.options.index || maxLayerIndex + 1;
        maxLayerIndex = Math.max(maxLayerIndex, this.index);

        this.id = this.options.id || 'layer'+this.index;

        this.info = []; //[] of {map, layer, legend, infoBox, colorInfoLayer, loading, timeout, updateColorInfoOnWorkingOff, dataset}

        this.showAndHideClasses = '';
        this.inversShowAndHideClasses = '';
        var minZoom = this.options.minZoom || this.options.layerOptions.minZoom || 0;
        if (minZoom){
            this.showAndHideClasses       = 'show-for-leaflet-zoom-'+minZoom+'-up';
            this.inversShowAndHideClasses = 'hide-for-leaflet-zoom-'+minZoom+'-up';
        }

        var maxZoom = this.options.maxZoom || this.options.layerOptions.maxZoom || 0;
        if (maxZoom){
            this.showAndHideClasses       += ' show-for-leaflet-zoom-'+maxZoom+'-down';
            this.inversShowAndHideClasses += ' hide-for-leaflet-zoom-'+maxZoom+'-down';
        }

        ns.appSetting.add({
            id          : this.id,
            callApply   : true,
            applyFunc   : $.proxy(this._applySetting, this),
            defaultValue: {}
        });

    }

    nsMap.MapLayer = MapLayer;

    nsMap.MapLayer.prototype = {
        /*********************************************************
        isAddedTo(mapOrIndex) - return true if the MapLayer is added to the map
        *********************************************************/
        isAddedToMap: function(mapOrIndex){
            var mapIndex = nsMap.getMap(mapOrIndex).fcooMapIndex;
            return !!this.info[mapIndex] && !!this.info[mapIndex].map;
        },

        /*********************************************************
        applySetting, applyCommonSetting and saveSetting, saveCommonSetting
        *********************************************************/
        //applySetting - apply individuel setting for the Map_layer at map
        applySetting: function(/*setting, map, mapInfo, mapIndex*/){

        },
        //applyCommonSetting - apply common setting for the Map_layer
        applyCommonSetting: function(/*setting*/){

        },

        _applySetting: function(data){
            var _this = this;

            //Apply common setting
            this.applyCommonSetting(data.common || null);

            //Apply individuel settings
            nsMap.visitAllMaps( function(map){
                var mapIndex = map.fcooMapIndex,
                    setting = data[mapIndex] || {};
                if (setting.show)
                    _this.addTo(map);
                else
                    _this.removeFrom(map);

                //colorInfo - TODO

                //Individual setting
                _this.applySetting(setting, map, _this.info[mapIndex], mapIndex);
            });
        },

        //saveSetting: function() - Return individuel setting for the Map_layer at map
        saveSetting: function(/*map, mapInfo, mapIndex*/){
            return {};
        },
        //saveCommonSetting: function() - Return common setting for the Map_layer
        saveCommonSetting: function(){
            return null;
        },

        _saveSetting: function(){
            var _this = this,
                data = {},
                commonSetting = this.saveCommonSetting() || null;

            if (commonSetting !== null)
                data.common = commonSetting;

            $.each(this.info, function(index, info){
                data[index] =
                    $.extend({
                        show: _this.isAddedToMap(index)
                        //colorInfo - TODO
                    },
                        _this.saveSetting(info ? info.map : null, info, index) || {}
                    );
            });
            ns.appSetting.set(this.id, data);
            return ns.appSetting.save();
        },

        /*********************************************************
        addTo
        *********************************************************/
        addTo: function(mapOrIndex){

            var _this = this;
            if ($.isArray(mapOrIndex)){
                $.each(mapOrIndex, function(index, _map){ _this.addTo(_map); });
                return _this;
            }

            var map = nsMap.getMap(mapOrIndex),
                mapIndex = map.fcooMapIndex;

            //Check if layer allready added
            if (this.isAddedToMap(mapIndex))
                return this;

            var info = this.info[mapIndex] = {};
            info.map = map;


            //Create dataset
            if (this.options.dataset && !info.dataset){
                info.dataset = nsMap.dataset(
                    this.options.dataset.valueList,
                    this.options.dataset.options,
                    this.dataset ? this.dataset.data : this.options.dataset.data
                 );
            }

            //this.dataset = point to first created dataset
            this.dataset = this.dataset || info.dataset;

            //Create and add legend
            if (map.bsLegendControl && !this.options.noLegend){

                if (!info.legend){
                    var legendOptions = this.options.legendOptions,
                        buttonList = legendOptions.buttonList || legendOptions.buttons || [];

                    //If a button has onlyShowWhenLayer = true => the button is only visible if the layer is visible/shown
                    $.each(buttonList, function(dummy, buttonOptions){
                        if (buttonOptions.onlyShowWhenLayer)
                            buttonOptions.class = (buttonOptions.class || '') + ' ' + _this.showAndHideClasses + '-visibility';
                    });


                    //Find index for legend
                    var levelIndex = [],
                        menuItem = this.menuItem;
                    while (menuItem && menuItem._getParentIndex){
                        levelIndex.unshift(menuItem._getParentIndex());
                        menuItem = menuItem.parent;
                    }

                    //Convert levelIndex = [1,2,3,88] to integer 0102038800000000 via string "0102038800000000"
                    var indexAsStr = '';
                    for (var i=0; i<8; i++){
                        var nextLevel = levelIndex.length > i ? levelIndex[i] : 0;
                        indexAsStr = indexAsStr + (nextLevel < 10 ? '0' : '') + nextLevel;
                    }

                    legendOptions = $.extend(true, {}, {
                        index       : parseInt(indexAsStr), //this.index,
                        icon        : this.options.legendIcon || this.options.icon,
                        iconClass   : this.options.legendIconClass || this.options.iconClass || null,
                        text        : this.options.legendText || this.options.text || null,

                        //content            : this.options.content,
                        contentArg         : [_this, map],
                        //noVerticalPadding  : this.options.noVerticalPadding,
                        //noHorizontalPadding: this.options.noHorizontalPadding,

                        //buttonList  : buttonList.length ? buttonList : null,

                        //onInfo      : this.options.onInfo,
                        //onWarning   : this.options.onWarning,
                        onRemove    : $.proxy(this.removeViaLegend, this),
                        normalIconClass: this.showAndHideClasses,
                        hiddenIconClass: this.inversShowAndHideClasses,
                        mapLayer       : this,

                    }, legendOptions);


                    delete legendOptions.buttons;
                    legendOptions.buttonList = buttonList.length ? buttonList : null;

                    info.legend = new L.BsLegend( legendOptions );
                }

                map.bsLegendControl.addLegend( info.legend );
                this.hasLegend = true;
            }

            //Create and add BsInfoBox for color-info
            if (this.options.colorInfo && !info.infoBox){

                this.hasColorInfo = true;

                var ciOptions = this.options.colorInfo = $.extend({}, defaultColorInfoOptions, this.options.colorInfo),
                    $outerContainer = $('<div/>').addClass('bsp-color-info-outer-container d-flex flex-column');

                //Append header: Use same text as in legend
                    $('<div/>')
                        .addClass('bsp-color-info-header show-for-no-cursor-on-map d-flex justify-content-center')
                        ._bsAddHtml(this.hasLegend ? this.options.text : ciOptions.text || null)
                        .appendTo($outerContainer);

                //Append contain-container. Need to be inside
                var $contentContainer = $('<div/>')
                        .addClass('flex-grow-1')
                        .addClass(this.showAndHideClasses)
                        .addClass(ciOptions.className)
                        .toggleClass('show-for-bsPosition-on-land', ciOptions.onlyLand)
                        .toggleClass('show-for-bsPosition-on-water', ciOptions.onlyWater)
                        .appendTo($outerContainer);


                info.$colorInfoBoxContent = $('<div/>')
                    .addClass('w-100 h-100 d-flex align-items-center justify-content-center font-monospace')
                    .appendTo($contentContainer);

                var infoBoxOptions = {
                        id           : this.options.id,
                        index        : this.options.index,
                        className    : 'bsp-color-info-outer input-group-sm',
                        alwaysVisible: true,
                        before   : {
                            className   : 'h-100',
                            useTouchSize: false,
                            icon        : ciOptions.icon
                        },
                        content: $outerContainer,
                        //after  : As options.before
                    };

                //Use the same icon(s) as for legend (if any)
                if (this.hasLegend)
                    infoBoxOptions.before.icon = info.legend.options.iconArray.slice();

                //Create the infoBox and its content
                var infoBox = info.infoBox = new L.Control.BsInfoBox(infoBoxOptions);
                infoBox._create$content();

                //Adjust infoBox padding and width
                infoBox.$contentContainer.css('padding', 0);
                if (ciOptions.width)
                    infoBox.$contentContainer.width(isNaN(ciOptions.width) ? ciOptions.width : ciOptions.width+'px');

                //Adjust icons if they are the same as for legend
                if (this.hasLegend){
                    infoBox.workingOn();

                    //Find and add show-for-, hide-for- classes to the icons
                    var icons = infoBox.$container.find('.input-group-prepend a > *');
                    $(icons[0])
                        .addClass( this.showAndHideClasses )
                        .addClass( 'fa-no-margin' )
                        .children().first().addClass('hide-for-bsl-working');
                    $(icons[1]).addClass( this.inversShowAndHideClasses || 'd-none');
                }
            }

            //Create pane(s) and layer (if not allready created)
            if (!info.layer){
                //Check and create the panes needed
                if (this.options.createPane || this.options.createMarkerPane){
                    var paneId = this.options.paneId || this.options.id,
                        zIndex = nsMap.zIndex[paneId.toUpperCase()];

                    if (this.options.createPane){
                        //Create pane in overlayPane
                        this.options.layerOptions.pane = nsMap.getPaneName(paneId);
                        map.createSubPane(this.options.layerOptions.pane, 'overlayPane', zIndex, this.showAndHideClasses);
                    }

                    if (this.options.createMarkerPane){
                        //Create pane in markerPane and shadowPane
                        this.options.layerOptions.markerPane = nsMap.getMarkerPaneName(paneId);
                        map.createSubPane(this.options.layerOptions.markerPane, 'markerPane', zIndex, this.showAndHideClasses);

                        this.options.layerOptions.shadowPane = nsMap.getShadowPaneName(paneId);
                        map.createSubPane(this.options.layerOptions.shadowPane, 'shadowPane', zIndex, this.showAndHideClasses);
                    }
                }

                //Create layer with updated options/values
                var newLayerOptions = $.extend(true, {},
                        this.options.layerOptions,
                        this.dataset ? this.dataset.data || {} : {},
                        info.dataset ? info.dataset.data || {} : {}
                    );

                info.layer = this.createLayer(newLayerOptions, map);
                info.layer.fcooMapIndex = map.fcooMapIndex; //Prevent the index when the layer is removed => layer._map is set to null

                //Sets options._popupContainerClass = this.showAndHideClasses to hide open popups when the layer is hidden and visa versa
                info.layer.options._popupContainerClass = this.showAndHideClasses;
            }
            var layer = info.layer;

            //Add map to list and layer(s) to map
            layer.addTo(map);

            if ( this.hasColorInfo && !info.colorInfoLayer ){
                this.hasColorInfo = false;
                //Get the tileLayer used for colorInfo (if any)
                $.each(layer.getLayers ? layer.getLayers() : [layer], function(index, singleLayer){
                    //The layre used for color-info is the first GridLayer or the GridLayer with options.useForColorInfo
                    if  ( (singleLayer instanceof L.GridLayer) && (!info.colorInfoLayer || singleLayer.options.useForColorInfo) ){
                        info.colorInfoLayer = singleLayer;
                        _this.hasColorInfo = true;
                    }
                });

                //Add id and loading and load events to update legend and/or colorInfo icon
                var colorInfoLayer = info.colorInfoLayer;
                if (colorInfoLayer){
                        colorInfoLayer.options.id = this.options.id;
                        colorInfoLayer
                            .on('loading', this._onLoading, this)
                            .on('load',    this._onLoad,    this)
                            .on('color',   this._onColor,   this);
                }
            }

            if (this.hasColorInfo){
                this.toggleColorInfo(mapIndex, ciOptions.show);

                //Call map._onColorPosition update color-info when the layer is loaded (in workingOff)
                info.updateColorInfoOnWorkingOff = true;
            }

            //Update dataset (if any)
            if (info.dataset){
                var data = $.extend(true, {}, this.dataset.data, info.dataset.data);
                this.dataset_setData(data, info.map.fcooMapIndex);
            }


            //If it is a radio-group layer => remove all other layers with same radioGroup
            if (this.options.radioGroup)
                $.each(nsMap.mapLayers, function(id, mapLayer){
                    if ((mapLayer.options.radioGroup == _this.options.radioGroup) && (mapLayer.id != _this.id))
                        mapLayer.removeFrom(mapOrIndex);
                });


            //Update checkbox/radio in menuItem
            this.updateMenuItem();

            if (this.options.onAdd)
                this.options.onAdd(map, layer);

            this._saveSetting();

            return this;
        },

        /*********************************************************
        getDataset( mapOrMapIndexOrMapId )
        Return the dataset for the map given by index_mapId_map
        *********************************************************/
        getDataset: function( mapOrMapIndexOrMapId ){
            var map = nsMap.getMap(mapOrMapIndexOrMapId),
                index = map ? map.fcooMapIndex : null,
                info = index === null ? null : this.info[index];

            return info ? info.dataset : null;
        },


        /*********************************************************
        dataset_setData( data, onlyIndexOrMapId )
        Set new data for each dataset in info
        *********************************************************/
        dataset_setData: function( data, onlyIndexOrMapId ){
            $.each(this._getAllInfoChild(null, onlyIndexOrMapId), function(index, info){
                info.dataset.setData(data, info.map ? info.map.$container : null);
            });
            return this;
        },

        /*********************************************************
        Methods to handle events regarding loading, load colorInfo:
        Updating layer, legend and bsPosition.infoBox state and color-info

        General methods to 'visit' or call a methods of layer, map, infoBox etc.
        for all or selected maps
        *********************************************************/
        //_getMapIndex: Get mapIndex from event
        _getMapIndex: function(event){
            return event.sourceTarget._map.fcooMapIndex;
        },


        /*********************************************************
        getMapInfoFromElement( element )
        Find mapInfo from a element (typical a button)
        *********************************************************/
        getMapInfoFromElement: function(element){
            var result = null,
                $element = element instanceof $ ? element : $(element),
                $mapContainer = $element.parents('.leaflet-container');

            if ($mapContainer.length)
                $.each(this._getAllInfoChild(), function(index, info){
                    if (info && info.map && info.map.$container && (info.map.$container.get(0) === $mapContainer.get(0)))
                        result = info;
                });
            return result;
        },


        //_getAllInfoChild: Get []info[childName] if it exists and if the index/map match onlyIndexOrMapId
        _getAllInfoChild: function(childName, onlyIndexOrMapId){
            var result = [];
            if (onlyIndexOrMapId !== undefined)
                onlyIndexOrMapId = $.isArray(onlyIndexOrMapId) ? onlyIndexOrMapId : [onlyIndexOrMapId];
            $.each(this.info, function(index, info){
                if (!info) return;

                var child = childName ? info[childName] : info, //If childName == null => return list of info
                    map   = info.map;

                if (!child) return;

                if (onlyIndexOrMapId){
                    if (
                        onlyIndexOrMapId.includes(index) ||
                        ( map && (onlyIndexOrMapId.includes(map.fcooMapId) || onlyIndexOrMapId.includes(map.fcooMapIndex)) )
                       )
                        result.push(child);
                }
                else
                    result.push(child);
            });
            return result;
        },

        //_callAllChild
        _callAllChild: function( childName, methodName, arg, onlyIndexOrMapId ){
            $.each( this._getAllInfoChild(childName, onlyIndexOrMapId), function(index, child){
                child[methodName].apply(child, arg);
            });
            return this;
        },

        //callAllLayers: Call methodName with arg (array) for all layer
        callAllLayers: function( methodName, arg, onlyIndexOrMapId ){
            return this._callAllChild( 'layer', methodName, arg, onlyIndexOrMapId );
        },


        //visitAllLayers: Call method( layer, mapLayer) for all layer
        visitAllLayers: function(method, onlyIndexOrMapId){
            var _this = this;
            $.each( this._getAllInfoChild('layer', onlyIndexOrMapId), function(index, layer){
                method(layer, _this);
            });
            return this;
        },

        //callAllLegends: Call methodName with arg (array) for all legend
        callAllLegends: function( methodName, arg, onlyIndexOrMapId ){
            return this._callAllChild( 'legend', methodName, arg, onlyIndexOrMapId );
        },

        //callAllInfoBox: Call this.methodName with arg (array) for all infoBox (colorInfo)
        callAllInfoBox: function( methodName, arg, onlyIndexOrMapId ){
            return this._callAllChild( 'infoBox', methodName, arg, onlyIndexOrMapId );
        },


        /*********************************************************
        Methods to show/hide the legend and show/hide the content og the legend
        *********************************************************/
        showLegend: function( extended ){
            return this.callAllLegends('toggle', [true, extended]);
        },

        hideLegend: function( extended ){
            return this.callAllLegends('toggle', [false, extended]);
        },

        showLegendContent: function( extended ){
            return this.callAllLegends('toggleContent', [true, extended]);
        },

        hideLegendContent: function( extended ){
            return this.callAllLegends('toggleContent', [false, extended]);
        },

        /*********************************************************
        Methods to find all buttons in legend or popups on the layer
        *********************************************************/
        findAllLegendButtons: function(select = ''){
            var $result = $();
            $.each(this.info, function(index, info){
                if (info && info.legend && info.legend.$buttonContainer){
                    var $buttons = info.legend.$buttonContainer.children(select);
                    if ($buttons.length)
                        $result = $result.add($buttons);
                }
            });
            return $result;
        },

        findAllPopupButtons: function(select = '') {
            var $result = $();
            $.each(this.info, function(index, info){
                if (info && info.layer &&
                    info.layer._popup &&
                    info.layer._popup.bsModal &&
                    info.layer._popup.bsModal.$buttons &&
                    info.layer._popup.bsModal.$buttons.length){

                    //For (to Niels) unknown reasons filter(select) do not work as expected
                    //$result.add( $(info.layer._popup.bsModal.$buttons).filter(select) );
                    //Instead test each element
                    $( info.layer._popup.bsModal.$buttons ).each(function(){
                        var $this = $(this);
                        if ((!select) || $this.is(select))
                            $result = $result.add( $this );
                    });
                }
            });
            return $result;
        },


        /*********************************************************
        Methods to remove MapLayer from a map
        *********************************************************/
        removeViaLegend: function(legend){
            this.wasRemovedViaLegend = true;
            this.removeFrom( legend.parent._map );
        },

        removeFrom: function(mapOrIndex){
            var _this = this;
            if ($.isArray(mapOrIndex)){
                $.each(mapOrIndex, function(index, _map){ _this.removeFrom(_map); });
                return this;
            }

            var map = nsMap.getMap(mapOrIndex),
                mapIndex = map.fcooMapIndex;

            //Check if layer is already removed
            if (!this.isAddedToMap(mapIndex))
                return this;

            var info  = this.info[mapIndex];


            //Remove legned (if any) and use legend.onRemove to do the removing
            if (!this.wasRemovedViaLegend && map.bsLegendControl){
                map.bsLegendControl.removeLegend(info.legend);
                return this;
            }

            this.wasRemovedViaLegend = false;

            this.hideColorInfo(map);

            this.closePopupOnLayer( info.layer );


            //Remove this from map
            info.map = null;
            info.layer.removeFrom(map);

            //Update checkbox/radio in menuItem
            this.updateMenuItem();

            if (this.options.onRemove)
                this.options.onRemove(map, info.layer);

            this._saveSetting();

            return this;
        },

        removeFromAll: function(){
            nsMap.visitAllMaps( $.proxy(this.removeFrom, this) );
        },

        /*******************************************************
        closePopup(mapOrIndex)
        Close all popups on the layer in mapOrIndex
        *******************************************************/
        closePopup: function(mapOrIndex){
            return this.visitAllLayers(this.closePopupOnLayer, mapOrIndex);
        },

        /*******************************************************
        closePopupOnLayer(layer)
        Method to close all popups on layer
        Can be overwritten by descending classes
        *******************************************************/
        closePopupOnLayer: function(layer){

            function closePOL( layer ){
                if (layer.eachLayer)
                    layer.eachLayer( closePOL );
                else
                    if (layer._popup && layer.closePopup){
                        layer._popup._pinned = false;
                        layer.closePopup();
                    }
            }
            closePOL( layer );
        },

        /*******************************************************
        _onColor(options) = Called when the color at the cursor position/map center is changed
        options = {colorRGBA, colorHex, latLng}
        *******************************************************/
        _onColor: function(options){
            if (options.colorHex){
                var info = this.info[this._getMapIndex(options)];

                options.transparent = !options.colorRGBA[3];
                //Transparent colors are (by default) treaded as no-color
                options.color = !options.transparent || this.options.colorInfo.allowTransparentColor ? this.options.colorInfo.getColor(options) : null;

                if (info.lastColorInfoColor != options.color){
                    info.lastColorInfoColor = options.color;

                    info.$colorInfoBoxContent
                        .empty()
                        ._bsAddHtml(this.options.colorInfo.getText(options))
                        .css('background-color', options.color ? options.color : 'transparent')
                        .css('color', window.colorContrastHEX(options.color));
                }
            }
        },

        //Loading-events (working icon on/off in legend and/or info-box in bsPositionControl
        _onLoading: function(event){
            this._updateLoadingStatus(event, true);
        },
        _onLoad: function(event){
            this._updateLoadingStatus(event, false);
        },

        _updateLoadingStatus: function(event, loading){
            var _this = this,
                mapIndex = this._getMapIndex(event),
                info = this.info[mapIndex];
            info.loading = loading;

            window.clearTimeout(info.timeout);
            info.timeout = window.setTimeout( function(){ _this._updateLoadingIcon(mapIndex); }, 400);

        },
        _updateLoadingIcon: function(mapIndex){
            if (this.info[mapIndex].loading)
                this.workingOn(mapIndex);
            else
                this.workingOff(mapIndex);
        },

        workingOn : function(mapIndex){
            this.callAllLegends( 'workingOn',  null, mapIndex );
            this.callAllInfoBox( 'workingOn',  null, mapIndex );
        },
        workingOff: function(mapIndex){
            this.callAllLegends( 'workingOff', null, mapIndex );
            this.callAllInfoBox( 'workingOff', null, mapIndex );

            var info = this.info[mapIndex];
            if (info && info.updateColorInfoOnWorkingOff){
                info.updateColorInfoOnWorkingOff = false;

                //Call map._onColorPosition update color-info when the layer is loaded
                nsMap.getMap(mapIndex)._onColorPosition(true);
            }

        },


        /*********************************************************
        createLayer: function(layerOptions, map)
        Set by the different types of MapLayer
        *********************************************************/
        createLayer: function(/*layerOptions, map*/){

        },


        /******************************************************************
        Methods regarding color-info = info in bsPositionControl about
        the 'value' of the layer on the position of the cursor/map-center
        *******************************************************************/
        showColorInfo: function(mapOrIndex){ return this.toggleColorInfo(mapOrIndex, true); },
        hideColorInfo: function(mapOrIndex){ return this.toggleColorInfo(mapOrIndex, false); },

        toggleColorInfo: function(mapOrIndex, show){
            var _this = this;
            if ($.isArray(mapOrIndex)){
                $.each(mapOrIndex, function(index, _map){ _this.toggleColorInfo(_map, show); });
                return _this;
            }
            var map = nsMap.getMap(mapOrIndex),
                mapIndex = map.fcooMapIndex,
                bsPositionControl = map.bsPositionControl,
                infoBox = this.info[mapIndex].infoBox;

            if (infoBox){
                if (show)
                    bsPositionControl.addInfoBox(infoBox);
                else
                    bsPositionControl.removeInfoBox(infoBox);
            }
            return this;
        },


        /******************************************************************
        menuItemOptions
        Return options for this layer as MenuItem in Mmenu
        *******************************************************************/
        menuItemOptions: function(){
            var menuOptions   = this.options.menuOptions = this.options.menuOptions || {},
                legendOptions = this.options.legendOptions,
                result = $.extend({
                    id        : this.id,
                    icon      : this.options.icon,
                    iconClass : this.options.iconClass,
                    text      : this.options.text,
                    type      : this.options.radioGroup ? 'radio' : 'check',
                    mapLayerId: this.id,
                    onClick   : $.proxy(this.selectMaps, this)
                }, menuOptions);


            //Use legend-buttons if no direct menu-button is given
            if (!result.buttonList && menuOptions.useLegendButtonList && legendOptions.buttonList)
                result.buttonList = legendOptions.buttonList;

            return result;
        },

        /******************************************************************
        updateMenuItem
        Update the menu-item checkbox/radio (false, 'semi' or true)
        *******************************************************************/
        updateMenuItem: function(){
            if (!this.menuItem) return;

            if (nsMap.hasMultiMaps){
                var _this       = this,
                    maps        = nsMap.multiMaps.setup.maps,
                    addedToMaps = 0;

                $.each(nsMap.multiMaps.mapList, function(index, map){
                    if (map.isVisibleInMultiMaps && _this.isAddedToMap(index))
                        addedToMaps++;
                });

                this.menuItem.setState(
                    addedToMaps == 0 ? false :
                    addedToMaps == maps ? true :
                    'semi'
               );
            }
            else
                this.menuItem.setState(!!this.isAddedToMap(0));
        },

        /******************************************************************
        selectMaps
        Show modal window with checkbox or radio for each map
        Select/unselect the layer in all visible maps
        *******************************************************************/
        selectMaps: function( currentMap, state ){
            //If it is rest all selected => do that
            if (state == 'RESET'){
                this.removeFromAll();
                return this;
            }

            //Use nsMap.selectMap(...) to select maps
            nsMap.selectMaps({
                header    : {icon: this.options.icon, text:  this.options.text},

                isSelected: this.isAddedToMap.bind(this),
                select    : this.addTo.bind(this),
                unselect  : this.removeFrom.bind(this),

                singleMapAction: 'toggle',
                showAsRadio    : this.options.radioGroup,
                currentMap     : currentMap
            });
            return this;
        }
    };

    /****************************************************************************
    *****************************************************************************
    map-layer-list

    Create methods
        fcoo.map._addMapLayers: Add a record to fcoo.maps.mapLayers
        fcoo.map.getMapLayer: function(id) return the MapLayer with id

    The id of the different layes can be used in setup-files to set witch
    layers to show in a given application

    *****************************************************************************
    ****************************************************************************/
    var mapLayers = nsMap.mapLayers = {};

    nsMap._addMapLayer = function(id, Constructor, options){
        id = id.toUpperCase();
        mapLayers[id] = new Constructor( $.extend({id: id}, options || {}) );
        return mapLayers[id];
    };

    nsMap.getMapLayer = function(id){
        return mapLayers[id.toUpperCase()];
    };


    nsMap.mapLayer_updateMenuItem = function(){
        $.each(mapLayers, function(id, mapLayer){
            mapLayer.updateMenuItem();
        });
    };

    /****************************************************************************
    *****************************************************************************
    L.Control.BsInfoBox
    Extend the prototype with methods to update state and info
    *****************************************************************************
    ****************************************************************************/
    $.extend(L.Control.BsInfoBox.prototype, {
        workingToggle: function(on){return this.$container.modernizrToggle('bsl-working', on);},
        workingOn    : function(){ return this.workingToggle(true ); },
        workingOff   : function(){ return this.workingToggle(false); },




    });

}(jQuery, L, this, document));

;
/****************************************************************************
layer_wms.js

Classes to creraet static and dynamic WMS-layers

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /***********************************************************
    MapLayer_wms - Creates a MapLayer with a wms-layer
    options = {
        icon,
        text,
        static      : BOOLEAN
        creatLayer  : FUNCTION - Create the Leaflet-layer
        layerOptions: OBJECT
        layers      : STRING,
        zIndex      : NUMBER
        deltaZIndex : NUMBER (optional)
        minZoom     : NUMBER (optional)
        maxZoom     : NUMBER (optional)
    }
    ***********************************************************/
    function MapLayer_wms(options) {
        //Move options regarding tileLayer into layerOptions
        options.layerOptions = options.layerOptions || {};
        ['layers', 'zIndex', 'deltaZIndex', 'minZoom', 'maxZoom', 'LayerConstructor'].forEach( id => {
            options.layerOptions[id] = options[id];
            delete options[id];
        });
        nsMap.MapLayer.call(this, options);
    }
    nsMap.MapLayer_wms = MapLayer_wms;

    MapLayer_wms.prototype = Object.create(nsMap.MapLayer.prototype);
    MapLayer_wms.prototype.createLayer = nsMap.layer_wms;

    /***********************************************************
    MapLayer_static - Creates a MapLayer with static WMS-layer
    options = {
        icon,
        text,
        layers     : STRING,
        zIndex     : NUMBER
        deltaZIndex: NUMBER (optional)
        minZoom    : NUMBER (optional)
        maxZoom    : NUMBER (optional)
    }
    ***********************************************************/
    function MapLayer_static(options) {
        nsMap.MapLayer_wms.call(this, options);
    }
    nsMap.MapLayer_static = MapLayer_static;

    MapLayer_static.prototype = Object.create(nsMap.MapLayer_wms.prototype);
    MapLayer_static.prototype.createLayer = nsMap.layer_static;





}(jQuery, L, this, document));

;
/****************************************************************************
map-layer_background.js

Create MapLayers with different layers that gives the background-layer,
coast-lines, and name of cites and places

****************************************************************************/
(function ($, L, window, document, undefined) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /***********************************************************
    A background layer contains of tree parts
    water: Either set as the background-color of the map or as a tile-layer
    land : Either set as a tile-layer or as the background-color of the map
    coastline and labels: A tile-layer with coastline and names of locations

    This makes it possible to mask out either land or water:
        1: Mask out land : Water as bg-color + land as tile-layer
        2: Mask out water: Water as tile-layer + land as bg-color

    This current version only implement 1.

    In the current version of ifm-maps there it is only possible to set
    land-color and water-color and using the default wms-layer "land-mask_latest"
    together with coastline and labels in "top-dark_latest"

    land-iho_latest         = Old version
    background-iho_latest   = Old version

    top-dark_latest         = Coastline and place-names
    land-mask_latest        = New version: black land-mask
    water-mask_latest       = New version: black water/sea-mask

    The different filters is calculated using the demo in
    https://stackoverflow.com/questions/42966641/how-to-transform-black-into-any-given-color-using-only-css-filters/43960991

    ***********************************************************/
    var backgroundColorList = nsMap.backgroundColorList = [{
        id   : 'standard', //Google maps - standard
        name : {da: 'Standard', en:'Standard'},
        land : {color: '#F5F5F5', filter: 'invert(99%) sepia(1%) saturate(251%) hue-rotate(271deg) brightness(115%) contrast(92%)'},
        water: {color: '#AADAFF', filter: 'invert(79%) sepia(23%) saturate(751%) hue-rotate(181deg) brightness(99%) contrast(107%)'}
    },{
        id   : 'charts', //Charts
        name : {da: 'Søkort', en:'Charts'},
        land : {color: '#FEF9D1', filter: 'invert(92%) sepia(4%) saturate(1495%) hue-rotate(9deg) brightness(106%) contrast(99%)'},
        water: {color: '#C9E9F7', filter: 'invert(85%) sepia(6%) saturate(1848%) hue-rotate(181deg) brightness(108%) contrast(94%)'}
    },{
        id   : 'gray', //Gray
        name : {da: 'Grå', en:'Gray'},
        land : {color: '#EFEFEF', filter: 'invert(99%) sepia(7%) saturate(143%) hue-rotate(213deg) brightness(115%) contrast(87%)'},
        water: {color: '#CBCBCB', filter: 'invert(100%) sepia(0%) saturate(1194%) hue-rotate(316deg) brightness(104%) contrast(59%)'}
    },{
        id   : 'retro', //Retro
        name : {da: 'Retro', en:'Retro'},
        land : {color: '#DFD2AE', filter: 'invert(91%) sepia(21%) saturate(351%) hue-rotate(356deg) brightness(90%) contrast(95%)'},
        water: {color: '#B9D3C2', filter: 'invert(90%) sepia(14%) saturate(281%) hue-rotate(88deg) brightness(91%) contrast(88%)'}
    }];

    L.Map.include({
        /***********************************************************
        L.Map.setBackground(landColor, waterColor)
        Add/alter land-mask-layer and sets background-color of the map
        ***********************************************************/
        setBackground: function(idOrIndex){
            if (typeof idOrIndex == 'string')
                $.each(backgroundColorList, function(index, options){
                    if (idOrIndex == options.id)
                        idOrIndex = index;
                });
            var oldBackgroundLayerIndex = this.backgroundLayerIndex;
            this.backgroundLayerIndex = idOrIndex;
            var backgroundColor = this.backgroundLayerColor = backgroundColorList[Math.min(idOrIndex, 3)];

            //Update or create land-layer
            var colorFilter = backgroundColor.land.filter;
            if (this.backgroundLandLayer){
                if (oldBackgroundLayerIndex != this.backgroundLayerIndex){
                    this.backgroundLandLayer.options.colorFilter = colorFilter;
                    this.backgroundLandLayer._container.style.filter = colorFilter;
                }
            }
            else {
                this.backgroundLandLayer = nsMap.layer_static({
                        id         : 'BACKGROUND_LAYER_LAND',
                        crossOrigin: 'anonymous',
                        layers     : 'land-mask_latest',
                        opacity    : 1,
                        colorFilter: colorFilter,
                        zIndex     : nsMap.zIndex.BACKGROUND_LAYER_LAND
                    },                  //options
                    undefined,          //map
                    undefined,          //defaultOptions
                    undefined,          //url
                    BackgroundLandLayer //LayerConstructor
                );

                this.backgroundLandLayer.on('color', this.backgroundLandLayer._onColor , this.backgroundLandLayer);

                this.backgroundLandLayer.$colorInfoBoxContent =
                    $()
                        .add(this.bsPositionControl.$cursorPosition)
                        .add(this.bsPositionControl.$centerPosition);

                this.backgroundLandLayer.addTo(this);
            }
            this.backgroundLandLayer.redraw();

            //Save backgroundColor in background-layer
            this.backgroundLandLayer.backgroundColor = backgroundColor;

            //Use Map.container as water-color
            this.getContainer().style.backgroundColor = backgroundColor.water.color;

            //Update bsPositionControl
            this.backgroundLandLayer._onColor(true);

            //Create coast-line-layer
            this.backgroundCoastlineLayer = this.backgroundCoastlineLayer ||
                nsMap.layer_static({
                    layers: 'top-dark_latest',
                    zIndex: nsMap.zIndex.BACKGROUND_LAYER_COASTLINE
                }).addTo(this);
        },


        /***********************************************************
        L.Map.isOverLand(latLng)
        Return true if lastLng is over land, false if over water and
        null if backgroundLayer not added
        ***********************************************************/
        isOverLand: function(latLng){
            var colorRGBA = this.backgroundLandLayer ? this.backgroundLandLayer.getColor(latLng) : null;
            return colorRGBA ? !!colorRGBA[3] : null;
        },

        getBackgroundLayerColor: function(latLng){
            var color;
            switch (this.isOverLand(latLng)){
                case true :  color = this.backgroundLayerColor.land.color; break;
                case false:  color = this.backgroundLayerColor.water.color; break;
                default   :  color = null;
            }
            return color;
        }
    });


    /****************************************************************************
    BackgroundLandLayer
    Overwrite L.TileLayer.WMS method _onColor to update bsPositionControl
    regarding the location (land/water/out) of the cursor or map-center
    ****************************************************************************/
    var BackgroundLandLayer = L.TileLayer.WMS.extend({

            positionState   : 'OUT', //= 'LAND', 'WATER' or 'OUT'

            _onColor: function(options){
                if (!this._map) return this;

                var newPositionState = '';
                if (options === true){
                    //Force using the last state
                    newPositionState = this.positionState;
                    this.positionState = '';
                }
                else
                    if (!options.colorRGBA)
                        newPositionState = 'OUT';
                    else
                        newPositionState = options.colorRGBA[3] ? 'LAND' : 'WATER';


                if (this.positionState != newPositionState){
                    this.positionState = newPositionState;

                    //Set background-color of the position containers
                    var showLandSeaColor = this._map.bsPositionControl && this._map.bsPositionControl.options.showLandSeaColor;
                    this.$colorInfoBoxContent.css(
                        'background-color',
                            !showLandSeaColor || (newPositionState == 'OUT') ?
                            'initial' :
                            newPositionState == 'LAND' ? this.backgroundColor.land.color : this.backgroundColor.water.color
                    );

                    //Update modernizr classes to show/hide info-boxes only visible over land or water
                    this._map.bsPositionControl.$container
                        .modernizrToggle( 'bsPosition-on-land',  newPositionState ==  'LAND' )
                        .modernizrToggle( 'bsPosition-on-water', newPositionState == 'WATER' );
                }
            }
        });
    /****************************************************************************
    L.Control.BackgroundLayer
    Hidden control that set the selected background colors
    ****************************************************************************/
    L.Control.BackgroundLayer = L.Control.extend({
        options: {
            position  : 'bottomright',
            background: 'standard', //'charts'
        },
        onAdd: function (map) {
            var container = L.DomUtil.create('div');
            L.DomEvent.disableClickPropagation(container);
            this._map = map;
            this.setState(this.options);

            return container;
        },

        getState: function(){
            return {background: this.options.background};
        },

        setState: function(options){
            this.options.background = options.background;
            this._map.setBackground(this.options.background);
        }
    });


    L.Map.mergeOptions({
        backgroundLayerControl: false
    });

    L.Map.addInitHook(function () {
        if (this.options.backgroundLayerControl) {
            this.backgroundLayerControl = new L.Control.BackgroundLayer();
            this.addControl(this.backgroundLayerControl);
        }
    });

}(jQuery, L, this, document));

;
/****************************************************************************
map-select

Objects and methods to handle to select maps
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /*********************************************************************
    selectMaps
    Show modal window with checkbox or radio for each map
    Select/unselect the layer in all visible maps
    options = {
        header,
        text,
        isSelected: function(mapOrMapIndex) return BOOLEAN
        select    : function(mapOrMapIndex)
        unselect  : function(mapOrMapIndex)

        singleMapAction: 'toggle', 'select' or 'unselect'
        showAsRadio    : BOOLEAN, true => show checkbox as radio
        currentMap     : map or mapIndex for map to be highlighted
    }
    *********************************************************************/
    nsMap.selectMaps = function( options ){
        let o = $.extend(true, {
                    text      : {da:'Vis på alle synlige kort', en:'Show on all visible maps'},
                    modalWidth: 240,
                }, options);

        //If only one map is vissible => simple toggle or select or unselect
        if (!nsMap.hasMultiMaps || (nsMap.multiMaps.setup.maps == 1)){
            if (o.singleMapAction)
                switch (o.singleMapAction.toLowerCase()){
                    case 'toggle'  :  o.isSelected(0) ? o.unselect(0) : o.select(0); break;
                    case 'select'  :  o.select(0); break;
                    case 'unselect':  o.unselect(0); break;
                }
            return;
        }

        let currentMapIndex = o.currentMap && o.currentMap instanceof L.Map ? o.currentMap.fcooMapIndex : null,
            maxMaps         = nsMap.setupOptions.multiMaps.maxMaps,
            checkboxType    = o.showAsRadio ? 'radio' : 'checkbox',
            selectedOnMap  = [],
            buttonList     = [],

            $checkbox = $.bsCheckbox({
                text    : o.text,
                type    : checkboxType,
                onChange: function(id, selected){
                    $.each(buttonList, (index, $button) => {
                        selectedOnMap[index] = selected;
                        $button._cbxSet(selected, true);
                    });
                    updateCheckbox();
                }
            });

        //Get current selected state from all maps
        for (var mapIndex=0; mapIndex<maxMaps; mapIndex++)
            selectedOnMap[mapIndex] = o.isSelected(mapIndex);

        //updateCheckbox: Update common checkbox when single map is selected/unselected
        function updateCheckbox(){
            var allSelected = true, semiSelected = false;
            $.each(buttonList, (index/*, button*/) => {
                if (!selectedOnMap[index])
                    allSelected = false;
                if (selectedOnMap[index] != selectedOnMap[0])
                    semiSelected = true;
            });

            $checkbox.find('input')
                ._cbxSet(allSelected || semiSelected, true)
                .prop('checked', allSelected || semiSelected)
                .toggleClass('semi-selected', semiSelected);
        }

        //miniMapContent: Create content with checkbox inside each map-frame
        function miniMapContent($contentContainer){
            let $div = $('<div/>')
                    .windowRatio(1.2*120, 1.2*180)
                    .addClass('mx-auto')
                    .css('margin', '5px')
                    .appendTo($contentContainer);

            //Append a mini-multi-map to the container
            L.multiMaps($div, {
                id    : nsMap.multiMaps.setup.id,
                local : true,
                border: false,
                update: function( index, map, $container ){
                    $container.empty();

                    //Create checkbox- or radio-button inside the mini-map
                    buttonList[index] =
                        $.bsStandardCheckboxButton({
                            square  : true,
                            selected: selectedOnMap[index],
                            class   : 'rounded-0 ' + (index === currentMapIndex ? 'active' : ''),
                            type    : checkboxType,
                            onChange: function(id, selected){
                                selectedOnMap[index] = selected;
                                updateCheckbox();
                            }
                        })
                        .addClass('font-size-1-2rem w-100 h-100 ' + (index ? '' : 'border-multi-maps-main'))
                        .appendTo( $container );
                }
            });
        }

        var mapLayerModalForm = $.bsModalForm({
                width     : o.modalWidth,
                header    : o.header,
                static    : false,
                keyboard  : true,
                closeWithoutWarning: true,
                remove    : true,

                content   : [$checkbox, miniMapContent],
                onSubmit  : () => nsMap.visitAllVisibleMaps( (map) => selectedOnMap[map.fcooMapIndex] ? o.select(map) : o.unselect(map) )
            });

        updateCheckbox();
        mapLayerModalForm.edit({});
    };


}(jQuery, L, this, document));

;
/****************************************************************************
map-setting-group.js,
Create mapSettingGroup = setting-group for each maps with settings for the map
****************************************************************************/
(function ($, L, i18next, window/*, document, undefined*/) {
    "use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    //min-height for buttons in reset-form = contains two lines of subtext
    ns.resetButtonMinHeight = '3em';

    //id, icon, text, short-text for the accordions in MapSetting
    nsMap.msgAccordions = {};
    nsMap.msgAccordionList = [];

    nsMap.msgAccordionAdd = function( options, prepend ){
        var id = options.id = options.accordionId = options.accordionId || options.id;
        nsMap.msgAccordions[id] = options;
        if (prepend)
            nsMap.msgAccordionList.unshift(options);
        else
            nsMap.msgAccordionList.push(options);
        return id;
    };

    var msgSync = nsMap.msgAccordionAdd({
            accordionId  : 'sync',
            editCommon   : nsMap.mapSettingGroup_editCommonMapSyncSetting,
            onlyMultiMaps: true,
            header  : {
                icon      : 'fa-sync',
                text      : {da:'Synkronisering med hovedkort', en:'Synchronizing with main map'},
                smallText: {da:'Synk.', en:'Sync.'},
            }
        }),

        msgBackground = nsMap.msgAccordionAdd({
            accordionId: 'background',
            header: {
                icon     : 'far fa-map',
                text     : {da:'Baggrundskort', en:'Background Map'},
                smallText: {da:'Baggrund', en:'Background'}
            }
        }),

        msgGraticule = nsMap.msgAccordionAdd({
            accordionId: 'graticule',
            header: {
                icon     : [['fa-grip-lines-vertical', 'fa-grip-lines']],
                text     : {da:'Gitterlinjer', en:'Graticule'},
                smallText: {da:'Gitter', en:'Graticule'},
            }
        }),

        msgControls = nsMap.msgAccordionAdd({
            accordionId: 'controls',
            header: {
                icon     : 'fa-tools',
                text     : {da: 'Værktøjer og information', en:'Tools and Information'},
                smallText: {da: 'Værktøj.&nbsp;&&nbsp;info', en:'Tools&nbsp;&&nbsp;Info'}
            }
        });


    //Set and create title and subTitle for Editing settings for all maps
    //ns.texts.allMapsSettings = {da:'Indstillinger for hvert kort', en:'Settings for each map'};
    var allMapsSetting_text =  {da:'Indstillinger for kortene', en:'Settings for the maps'},
        allMapsSetting_subtext,
        allMapsSetting_subtextSeparator = ', &nbsp;';

    $.each(nsMap.msgAccordionList, function(index, options){
        if (options.header.dontInclude)
            return;
        allMapsSetting_subtext = allMapsSetting_subtext || [];
        allMapsSetting_subtext.push( options.header.smallText || options.header.text );
    });




    //Add reset of position and zoom to ns.resetList
    ns.resetList.push({
        id   : 'positionAndZoom',
        icon : 'fal fa-lb-center-marker',
        text : {da:'Nulstil position og zoom', en:'Reset position and zoom'},
        reset: function(){
            nsMap.visitAllMaps( function( map ){
                //If it is the main map or the map is not in sync => set default position and zoom
                if (map.options.isMainMap || !map.options.mapSync || !map.options.mapSync.enabled)
                    map.setView(
                        nsMap.defaultCenterZoom.center,
                        nsMap.defaultCenterZoom.zoom,
                        map._mapSync_NO_ANIMATION
                    );
            });
        }
    });

    //Add reset of all map-options to ns.resetList
    ns.resetList.push({
        id     : 'allMapsSetting',
        icon   : ns.icons.mapSettingSingle,
        text   : allMapsSetting_text,
        subtext: allMapsSetting_subtext,
        subtextSeparator: allMapsSetting_subtextSeparator,
        reset  : function(){ nsMap.resetMapSetting(null); }
    });




    /*******************************************************
    nsMap.bsControls = A list of info on controls added to the map
    The show/hide of the controls are set in by adding the lists elements to addMapSettingWithControl
    nsMap.bsControls = = {CONTROLID: {
        controlId: STRING = The id of the control
        header   : {icon, text},
        position : The controls position on the maps
    }}

    The settings are added in 4:
    *******************************************************/
    // Including bsSettingControl require that map.options.bsSettingOptions.show == true. See src/leaflet/leaflet.js
    var includeSettingControl = nsMap.mainMapOptions.bsSettingOptions.show;

    nsMap.bsControls = {
        //Zoom (L.Control.BsZoom@leaflet-latlng)
        'bsZoomControl': {
            icon    : [['far fa-plus-minus transform-scale-0-65', 'fa-square transform-scale-1-2']],
            text    : {da: 'Zoom-knapper', en:'Zoom-buttons'},
            position: ''
        },

    // Removed bsSettingControl to make room for compass.
        'bsSettingControl': includeSettingControl ? {
            icon    : ns.icons.mapSettingSingle,
            text    : ns.texts.mapSettingSingle,
            position: ''
        } : null,

        //Legend (L.Control.BsLegend@leaflet-latlng)
        'bsLegendControl': {
            icon    : ns.icons.mapLegend,
            text    : ns.texts.mapLegend,
            position: ''
        },

        //Scale (L.Control.BsScale@leaflet-latlng)
        'bsScaleControl': {
            icon    : 'fa-ruler-horizontal',
            text    : {da: 'Længdeskala (in situ)', en:'Length Scale (in situ)'},
            position: ''
        },

        //Position (L.Control.BsPosition@leaflet-latlng)
        'bsPositionControl': {
            icon    : window.bsIsTouch ? 'fa-lb-center-marker' : 'fa-mouse-pointer',
            text    : window.bsIsTouch ? {da: 'Kortcenter-position', en:'Map Center Position'} : {da: 'Cursor/Kortcenter-position', en:'Cursor/Map Center Position'},
            position: ''
        }
    };

    //Add Compass (L.Control.bsControlCompass) if mobile device
    if (ns.modernizrDevice.isMobile)
        nsMap.bsControls['bsCompassControl'] = {
            icon    : 'fa-compass',
            text    : {da: 'Kompas', en: 'Compass'},
            position: ''
        };


    //Get the position from main-map settings in nsMap.mainMapOptions
    $.each(nsMap.bsControls, function(controlId, options){
        if (!options){
            delete nsMap.bsControls[controlId];
            return;
        }
        var optionsId = controlId.replace('Control', 'Options');
        options.position = nsMap.mainMapOptions[optionsId].position;
    });



    /*******************************************************
    nsMap.mswcFunctionList (Map Setting With Control Function List)
    Is a list of functions used to create Settings in MapSettingGroup using
    method addMapSettingWithControl when the MapSetting for each maps are created

    nsMap.mswcFunctionList = []FUNCTION(map) {this == SettingGroup )

    The settings are added in 4:
    *******************************************************/
    nsMap.mswcFunctionList = nsMap.mswcFunctionList || [];


    /*****************************************************************************
    Adding common MapSetting
    *****************************************************************************/

    /************************************
    mapSync
    ************************************/
    nsMap.mswcFunctionList.push( function(map){
        if (!map.options.isMainMap)
            this.addMapSettingWithControl( nsMap.mapSettingGroup_mapSyncOptions( msgSync, nsMap.msgAccordions[msgSync].header ) );
    });

    /************************************
    Map background
    ************************************/
    nsMap.mswcFunctionList.push( function(/*map*/){
        var list = [];
        $.each( nsMap.backgroundColorList, function(index, bgOptions){
            var imgStr =
                    '<img ' +
                        'src="images/map-background-line.png" ' +
                        'class="align-self-center" ' +
                        'style="background-color:' + bgOptions.water.color +';" ' +
                    '/>' +
                    '<img ' +
                        'src="images/map-background-land.png" ' +
                        'class="align-self-center" ' +
                        'style="filter:'+ bgOptions.land.filter + ';" '+
                    '/>' +
                    '<img ' +
                        'src="images/map-background-line.png" ' +
                        'class="coastline align-self-center" ' +
                    '/>';
            list.push({
                id       : bgOptions.id,
                text     : [bgOptions.name, imgStr],
                textClass: ['text-center d-block', 'background-image-container d-flex flex-column justify-content-center']
            });

        });

        this.addMapSettingWithControl({
            controlId   : 'backgroundLayerControl',
            accordionId : msgBackground,
            id          : ['background'],
            header      : nsMap.msgAccordions[msgBackground].header,
            modalContent: {id:'background', type:'selectlist', list: list}
        });
    });

    /************************************
    Graticule (leaflet-latlng-graticule)
    ************************************/
    nsMap.mswcFunctionList.push( function(map){
        var nsllgt = L.latLngGraticuleType;
        function graticuleListItem(id, fileNamePrefix){
            return  {
                id       : id,
                text     : '<img src="images/' + fileNamePrefix + '-label.png" class="show-for-graticule-label"/>'+
                           '<img src="images/' + fileNamePrefix + '-nolabel.png" class="hide-for-graticule-label"/>',
                textClass: 'text-center d-block'
            };
        }
        var content = [
            {id:'show',      type:'checkbox', text: {da:'Vis gitterlinjer', en:'Show graticule'}},
            {id:'showLabel', type:'checkbox', text: {da: 'Vis etiketter', en:'Show labels'},      showWhen: {'latLngGraticule_show': true}},
            {id:'type',      type:'selectlist',                                                   showWhen: {'latLngGraticule_show': true},
            list:[
                graticuleListItem(nsllgt.TYPE_MAJOR_TICK                         , 'tick-none'),
                graticuleListItem(nsllgt.TYPE_MAJOR_TICK + nsllgt.TYPE_MINOR_TICK, 'tick-tick'),
                graticuleListItem(nsllgt.TYPE_MAJOR_LINE + nsllgt.TYPE_MINOR_TICK, 'line-tick'),
                graticuleListItem(nsllgt.TYPE_MAJOR_LINE + nsllgt.TYPE_MINOR_LINE, 'line-line'),
            ]}
        ];

        if (map.latLngGraticule)
            map.latLngGraticule.theMap = map;

        this.addMapSettingWithControl({
            controlId  : 'latLngGraticule',
            accordionId: msgGraticule,
            id         : ['show', 'type', 'showLabel'],
            getState   : function(){
                return {
                    'show'     : this.options.show,
                    'type'     : this.options.type,
                    'showLabel': this.options.showLabel
                };
            },
            setState : function(options){
                $.extend(this.options, options);
                if (this.options.show){
                    this.addTo(this.theMap);
                    this.setType(this.options.type);
                }
                else
                    this.remove();
                //this.setType(this.options.type);
            },
            header      : nsMap.msgAccordions[msgGraticule].header,
            modalContent: content,
            onChanging  : function(options, $form){
                $form.modernizrToggle('graticule-label', options.showLabel);
            },
        });
    });


    /************************************
    Controls from nsMap.bsControls
    ************************************/
    nsMap.mswcFunctionList.push( function( map ){
        var _this = this;
        this.options.accordionList.push({
            id    : msgControls,
            header: nsMap.msgAccordions[msgControls].header
        });

        //Sort nsMap.bsControls by position (top > bottom, left > right)
        var bsControlList = [];

        $.each(nsMap.bsControls, function(id, options){
            var pos = options.position,
                positionValue =
                    (pos.includes("top")    ? 30 : 0) +
                    (pos.includes("middle") ? 20 : 0) +
                    (pos.includes("bottom") ? 10 : 0) +
                    (pos.includes("left")   ?  3 : 0) +
                    (pos.includes("center") ?  2 : 0) +
                    (pos.includes("right")  ?  1 : 0);

            bsControlList.push($.extend(options, {controlId: id, positionValue: positionValue}) );
        });

        bsControlList.sort(function(c1, c2){return c2.positionValue - c1.positionValue;} );

        $.each(bsControlList, function(index, options){
           _this.addMapSettingWithControl({
                controlId      : options.controlId,
                id             : 'show',
                accordionId    : msgControls,
                modalContent   : {
                    type             : 'inputGroup',
                    noBorder         : true,
                    noVerticalPadding: true,
                    noPadding        : true,
                    content : [{
                        id      : 'show',
                        type    : 'standardcheckboxbutton',
                        icon    : options.icon,
                        text    : options.text,
                        class   : 'flex-grow-1',
                        checkboxAtLeft      : true,
                        insideFormGroup     : true,
                        noVerticalPadding   : true,
                        //smallBottomPadding  : true,

                        //Button with setting for the bsControl (if any). = items from its popupList
                        after: {
                            id    : options.controlId+'_options',
                            type  : 'button',
                            square: true,
                            icon  : 'fa-cog fa-fw',
                            onClick: function(){
                                nsMap.editControlOptions(options.controlId, map, getMapSettingGroup(map).options.applyToAll);
                            }
                        }
                    }]
                }
            });
        });
    });

    /*****************************************************************************
    editControlOptions(controlId, map, applyToAll)
    Edit the options for control with id == controlId for map. If applyToAll == true =>
    apply the data to all visible maps
    *****************************************************************************/
    var currentControlOptionsForm_options = {}; //Settings and data for the current form displayed and the control beeing edited

    //****************************************************************************
    function controlOptionsForm_preEdit(mapSetting/*, data */ ){
        var applyToAll  = mapSetting.options.applyToAll,
            mapList     = applyToAll ? [] : [mapSetting.map],
            $modalBody  = mapSetting.modalForm.$bsModal.bsModal.$body;

        if (applyToAll)
            $.each(nsMap.mapIndex, function(index, nextMap){
                if (nextMap && nextMap.isVisibleInMultiMaps)
                    mapList.push(nextMap);
            });

        //Show/hide all edit-options button for all controls. Show if the control has any popup-items (single map) or all maps has the same popups
        $.each(nsMap.bsControls, function(controlId){

            var hideOptionsButton = false,
                popupIdStr        = '';     //= string of all ids in given popup. Used to check if a control has the same popup-items in all maps

            $.each(mapList, function(mapIndex, map){
                var control         = map[controlId],
                    state           = control ? control.getState() : {},
                    popupList       = control ? control.options.popupList || []: [],
                    nextPopupIdStr  = '';

                //Create nextPopupIdStr
                $.each(popupList, function(index, popupItem){
                    var type = popupItem.type || 'text',
                        id   = popupItem.id || popupItem.radioGroupId;
                    if ((type != 'text') && id && (state[id] !== undefined))
                        nextPopupIdStr = nextPopupIdStr + '_' + id;
                });

                if (!nextPopupIdStr || (popupIdStr && (popupIdStr != nextPopupIdStr)))
                    hideOptionsButton = true;
                else
                    popupIdStr = nextPopupIdStr;
            });

            var $optionsButton = $modalBody.find('#' + controlId + '_options'),
                $checkboxButton = $optionsButton.prev();

            $optionsButton.toggleClass('invisible', hideOptionsButton);
            $checkboxButton.toggleClass('btn-round-border', hideOptionsButton);
        });
    }

    //****************************************************************************
    function controlOptionsForm_submit(data){
        var newData = {},
            ccofo   = currentControlOptionsForm_options;

        $.each(ccofo.stateIds, function(id){
            if (ccofo.originalData[id] !== data[id])
                newData[id] = data[id];
        });

        $.each(ccofo.mapList, function(index, map){
            map[ccofo.controlId].setState( newData );
        });
    }

    //****************************************************************************
    nsMap.editControlOptions = function(controlId, map, applyToAll){
        var control = map[controlId],
            state   = control.getState();



        var formOptions = {
                header: {
                    icon: nsMap.bsControls[controlId].icon,
                    text: nsMap.bsControls[controlId].text
                },
                width   : '15em',//<= Adjust
                show    : false,
                remove  : true,
                onSubmit: controlOptionsForm_submit,
                closeWithoutWarning: true
            };

        //Find items in popup for the control to include in edit-options
        var content     = formOptions.content = [],
            fo_stateIds = formOptions.stateIds = {},
            lastLabel   = null;

        $.each(control.options.popupList, function(index, popupItem){
            var type = popupItem.type || 'text',
                id   = popupItem.id || popupItem.radioGroupId;

            if (type == 'text')
                lastLabel = {icon: popupItem.icon, text: popupItem.text};
            else {
                //Only include popup-items with id in the control state
                if (id && (state[id] !== undefined)){
                    fo_stateIds[id] = type;
                    if (type == 'checkbox'){
                        //Convert to checkboxbutton
                        content.push({
                            type: 'checkboxbutton',
                            id  : id,
                            icon: popupItem.icon,
                            text: popupItem.text,
                            fullWidth: true
                        });
                    }
                    if (type == 'radio'){
                        //Convert to 'radiobuttongroup'
                        content.push({
                            type     : 'radiobuttongroup',
                            id       : id,
                            list     : popupItem.list,
                            vertical : true,
                            fullWidth: true,
                            label    : lastLabel
                        });
                    }
                }
                lastLabel = null;
            }
        });

        var controlOptionsForm = $.bsModalForm( formOptions );

        //Save current settings and options in currentControlOptionsForm_options to be used by controlOptionsForm_submit
        currentControlOptionsForm_options = {
            controlId : controlId,
            stateIds  : controlOptionsForm.options.stateIds,
            mapList   : applyToAll ? [] : [map],
            applyToAll: applyToAll,
        };

        //Find data (= state) from the map or all visible maps
        var data     = {},
            forceData = {},
            stateIds = currentControlOptionsForm_options.stateIds,
            mapList  = currentControlOptionsForm_options.mapList;

        if (applyToAll)
            $.each(nsMap.mapIndex, function(index, nextMap){
                if (nextMap && nextMap.isVisibleInMultiMaps)
                    mapList.push(nextMap);
            });

        //Save current values for all stateIds in all maps/the map in data and originalData
        $.each(mapList, function(index, nextMap){
            var nextState = nextMap[controlId].getState();
            $.each(stateIds, function(id, type){
                var nextValue = nextState[id];

                //If any boolean-value are different on different maps => mark the checkbox as semi-selected (value = STRING)
                if (type == 'checkbox'){
                    if ((typeof data[id] == 'boolean') && (nextValue != data[id]))
                        data[id] = 'NOT_CHANGED';
                    else
                        data[id] = data[id] || nextValue;
                }

                if (type == 'radio'){
                    if (data[id] && (data[id] != nextValue)){
                        data[id] = [nextValue, 'semi'];
                        forceData[id] = data[id][1];    //Set = 'semi' to ensure that original and new data are the same
                    }
                    else
                        data[id] = data[id] || nextValue;
                }
            });
        });

        currentControlOptionsForm_options.originalData = $.extend({}, data, forceData);

        controlOptionsForm.edit( data );
    };


    /*****************************************************************************
    MapSettingGroup = SettingGroup with NxSettings - one for each subset of options for a map
    *****************************************************************************/
    var MapSettingGroup = function(map){
        var _this = this;
        ns.SettingGroup.call(this, {
            id           : 'NOT_USED',
            dontSave     : true,    //<-- MUST be true!!
            modalHeader  : {
                icon: ns.icons.mapSettingSingle,
                text: ns.texts.mapSettingSingle
            },
            modalOptions : {
                static             : false,
                closeWithoutWarning: true,
                buttons: [{
                    icon: ns.icons.reset,
                    text: ns.texts.reset,
                    onClick: function() { nsMap.resetMapSetting( map ); }
                }],
                helpId    : nsMap.setupOptions.topMenu.helpId.mapSetting,
                helpButton: true
            },
            accordionList: [],
            onChanging   : $.proxy(this.onChanging, this)
        });
        this.map = map;

        /*****************************************************************************
        ******************************************************************************
        Create the different Setting for the different Controls etc.
        ******************************************************************************
        *****************************************************************************/
        $.each(nsMap.mswcFunctionList, function(index, func){
            func.call(_this, map);
        });
    };

    /*****************************************************************************
    Prototype for MapSettingGroup
    *****************************************************************************/
    MapSettingGroup.prototype = Object.create(ns.SettingGroup.prototype);
    $.extend(MapSettingGroup.prototype, {
        /*****************************************************************************
        addMapSettingWithControl: function(options)
        Create Setting for a Control on the map and incl. it in nsMap.editMapSetting
        Each Setting is extended with
        options :
        - controlId      : The id of the Control
        - id             : []STRING. Ids of the values edited by the Setting
        - getControlValue: function(map) to get the value from the map/control
        - setControlValue: function(map, options) to set the value for the map/control
        *****************************************************************************/
        addMapSettingWithControl: function(options){
            var control = this.control = this.map[options.controlId];
            if (!control)
                return;

            //Add getState and setState if control do not have it
            control.getState = control.getState || options.getState;
            control.setState = control.setState || options.setState;

            //'Hide' onChanging. It is called via SettingGroup.onChanging
            if (options.onChanging){
                options._onChanging = options.onChanging;
                delete options.onChanging;
            }

            $.extend(options, {
                valueIds      : $.isArray(options.id) ? options.id : [options.id],
                id            : options.controlId,
                control       : control,
                callApply     : true,
                defaultValue  : control.getState(),
                getValue      : $.proxy(control.getState, control),
                applyFunc     : $.proxy(control.setState, control),
            });

            this.add(options);

            //Get the Setting-object
            var setting = this.settings[options.id];
            setting.map = this.map;

            //Add state from control popover to the setting values
            control.options.onChange = $.proxy(onChangingViaControl, setting);

            var accordionId = options.accordionId || options.id;
            if (options.header)
                this.options.accordionList.push({id: accordionId, header: options.header});

            function adjustModalContent(content){
                content = content || [];
                content = $.isArray(content) ? content : [content];
                $.each(content, function(index, contentPart){
                    if (contentPart.id)
                        contentPart.id = options.id + '_' + contentPart.id;
                    if (contentPart.content)
                        contentPart.content = adjustModalContent(contentPart.content);
                });
                return content;
            }
            this.addModalContent(accordionId, adjustModalContent(options.modalContent), options.modalFooter);
        },

        //_editDataToData: Convert data from {controlId_id: value}xN => { controlId: {id: value}xN }
        _editDataToData: function( editData ){
            var data = {};
            $.each(editData, function(controlId_id, value){
                var idArray   = controlId_id.split('_'),
                    controlId = idArray[0],
                    id        = idArray[1];
                data[controlId] = data[controlId] || {};
                data[controlId][id] = value;
            });
            return data;
        },

        onChanging: function(editData){
            $.each(editData, function(id, value){
                if (value == 'NOT_CHANGED')
                    delete editData[id];
            });

            var data = this._editDataToData(editData);

            $.each(this.settings, function(settingId, setting){
                if (setting.options._onChanging)
                    setting.options._onChanging(data[settingId], setting.group.modalForm.$form);
            });
        },

        //Overwrite onSubmit to convert data from {controlId_id: value}xN => { controlId: {id: value}xN }, remove unchanged values, and save the data in ns.globalSetting
        onSubmit: function(SettingGroup_onSubmit){
            return function(editData){
                $.each(editData, function(id, value){
                    if (value == 'NOT_CHANGED')
                        delete editData[id];
                });

                var data = this._editDataToData(editData);

                this.options.simpleMode = true;
                SettingGroup_onSubmit.call(this, data); //Sets this.data = data
                this.options.simpleMode = false;
                this.saveParent(data);
            };
        }(ns.SettingGroup.prototype.onSubmit),


        //reset - Reset all settings or settings in onlyAccordionId
        reset: function(onlyAccordionId){
            var data = {};
            $.each(this.settings, function(settingId, setting){
                if (!onlyAccordionId || (onlyAccordionId == setting.options.accordionId))
                    data[settingId] = setting.options.defaultValue || {};
            });

            if (this.modalForm)
                this.modalForm.$bsModal.close();

            this.saveParent(data);
        },

        //saveParent - Save data in 'parent' = appSetting
        saveParent: function(data, dontSaveParent){
            if (this.isSavingParent)
                return;
            this.isSavingParent = true;

            this.set(data);

            if (!dontSaveParent){
                ns.appSetting.set(this.map.fcooMapId, this.data);
                ns.appSetting.save();
            }
            this.isSavingParent = false;
        }
    });

    function onChangingViaControl(state){
        if (this.group.isSavingParent)
            return;

        //Check if the new state is different from the current one
        var _this = this,
            isDifferent = false;
        $.each( state, function(id, value){
            if (!_this.value.hasOwnProperty(id) || (_this.value[id] != value)){
                isDifferent = true;
                return false;
            }
        });

        $.extend(this.value, state);
        if (isDifferent){
            //Save the changes to appSetting via it parent-SettingGroup = MapSettingGroup
            var data = {};
            data[this.options.id] = this.value;
            this.group.saveParent(data);
        }
    }

    /*****************************************************************************
    L.Control.Setting = A Leaflet control for showing settings for a map.
    There are two icons: One for 'normal' and one for 'sync' ie. when the map is sync with the main map
    *****************************************************************************/
    L.Control.BsSetting = L.Control.BsButton.extend({
        options: {
            position       : "topcenter",
            icon           : nsMap.mapSettingIconWithStatus('font-size-0-65em'),
            bigIcon        : true,
            semiTransparent: false, //true,
        },

        initialize: function(options) {
            options.onClick = $.proxy(this.onClick, this);
            L.Control.BsButton.prototype.initialize.call(this, options);
            this.data = {};
        },

        onAdd: function(map){
            var result = L.Control.BsButton.prototype.onAdd.call(this, map);
            this.mapSettingGroup = new MapSettingGroup(map);

            //Create a Setting in application-setting-group to hold the settings for this map
            ns.appSetting.add({
                id          : map.fcooMapId,
                callApply   : false,
                applyFunc   : $.proxy(this.mapSettingGroup.onLoad, this.mapSettingGroup),
                defaultValue: {}
            });
            return result;
        },
        onClick: function(){
            nsMap.editMapSetting( this._map.fcooMapIndex );
        },
        onChange: function(/*options*/){
            var mapSyncControl = this._map.mapSyncControl,
                inSync         = mapSyncControl && mapSyncControl.getState().enabled;

            //If there are a button given for the map in the edit-all-modal => update its icon
            if (mapSyncControl && mapSyncControl.$buttonInEditAll)
                nsMap.updateMapSettingIconWithStatus( mapSyncControl.$buttonInEditAll, inSync);
            //Update icon in button
            nsMap.updateMapSettingIconWithStatus( this.$container, inSync);
        }
    }); //end of L.Control.Setting

    //Install L.Control.BsSetting
    L.Map.mergeOptions({
        bsSettingControl: false,
        bsSettingOptions: {}
    });

    /*
    Creating the bsSettingControl need to wait
    for all controls to be added to include all settings
    Therefore the creation is moved to the load-event
    */
    L.Map.prototype._createBsSettingControl = function(){
        this.bsSettingControl = new L.Control.BsSetting( this.options.bsSettingOptions );
        this.addControl(this.bsSettingControl);
    };
    L.Map.addInitHook(function () {
        if (this.options.bsSettingControl)
            this.on('load', L.Map.prototype._createBsSettingControl, this);
    });

    /*****************************************************************************
    resetMapSetting(mapOrMapIndexOrMapId, accordionId)
    *****************************************************************************/
    let getMapSettingGroup = nsMap.getMapSettingGroup = function(mapOrMapIndexOrMapId){
        var map = nsMap.getMap(mapOrMapIndexOrMapId),
            bsSettingControl = map ? map.bsSettingControl : null,
            mapSettingGroup = bsSettingControl ? bsSettingControl.mapSettingGroup : null;
        return mapSettingGroup;
    };

    nsMap.resetMapSetting = function(mapOrMapIndexOrMapId, accordionId){
        //accordionId is given direct i call or once by editMapSetting_options
        accordionId = accordionId || editMapSetting_options.msgAccordionId;
        var singleMap  = mapOrMapIndexOrMapId && !editMapSetting_options.applyToAll;

        editMapSetting_options = {};
        /*
        There are tree different mode
            All4All: Reset ALL settings for ALL maps
            All4One: reset ALL settings for ONE map
            One4All: Reset ONE specific setting for ALL maps
            One4One: Reset ONE specific setting for ONE map is not supported
        */

        if (singleMap){
            var mapSettingGroup = getMapSettingGroup(mapOrMapIndexOrMapId);
            if (!mapSettingGroup) return;
            //All4One
            mapSettingGroup.reset();
        }
        else
            //All4All (accordionId undefined) or One4All (accordionId given)
            nsMap.visitAllMaps( nsMap.resetMapSetting, accordionId ? [accordionId] : undefined);
    };


    /*****************************************************************************
    editMapSetting(mapOrMapIndexOrMapId, options)
    Show the modal with settings for one map with index in nsMap.mapIndex
    options = {
        applyToAll      : if applyToAll == true => the settings are applied to all maps
        msgAccordionId  : if msgAccordionId is given => Only edit data inside accordion with accordionId == msgAccordionId
        multiMapSetupId : if given use this as id for mini-multi-map else use global setting
    *****************************************************************************/
    var editMapSetting_options = {},
        clear_editMapSetting_options = function(){
            editMapSetting_options = {};
        },

		editMapSetting_onSubmit = function(){
			clear_editMapSetting_options();
            nsMap._onSubmit_mapSync( this.map );
		};


	nsMap.editMapSetting = function(mapOrMapIndexOrMapId, options = {}){
        var mapSettingGroup = getMapSettingGroup(mapOrMapIndexOrMapId);
        editMapSetting_options = options;
        if (!mapSettingGroup) return;

        var msgAccordion = nsMap.msgAccordions[options.msgAccordionId],
            preEdit = msgAccordion ?
                function(settingGroup/*, data*/){
                    //Hide all accordions except the one gíven by accordion-item
                    settingGroup.modalForm.$bsModal.find('.accordion-item').addClass('d-none');
                    settingGroup.modalForm.$bsModal.find('.accordion-item[data-user-id="'+options.msgAccordionId+'"]').removeClass('d-none');

                } : null;

        //If it is one accordion applyed to all maps (options.applyToAll and msgAccordion) => save current settings for all maps and get common data from all maps as data for main (dataToEdit)
        if (options.applyToAll && msgAccordion){
            var dataToEdit = $.extend(true, {}, mapSettingGroup.data);

            //Backup main-maps data
            mapSettingGroup.backupData = $.extend(true, {}, mapSettingGroup.data);

            nsMap.visitAllVisibleMaps(function(map){
                var nextMapSettingGroup = getMapSettingGroup(map),
                    mapData = $.extend(true, {}, nextMapSettingGroup.data);

                $.each(mapData, function(groupId, groupData){
                    $.each(groupData, function(id, value){
                        //If any boolean-value are different on different maps => mark the checkbox as semi-selected (value = STRING)
                        if ((typeof value == 'boolean') && dataToEdit[groupId] && (typeof dataToEdit[groupId][id] == 'boolean') && (value != dataToEdit[groupId][id]))
                            dataToEdit[groupId][id] = 'NOT_CHANGED';
                    });
                });
            });
            mapSettingGroup.data = dataToEdit;
        }

        mapSettingGroup.options.applyToAll = options.applyToAll;

        //If options.applyToAll => the settings is applied to all maps
        if (options.applyToAll){
            mapSettingGroup.options.onSubmit = function(data){
                //Reset main-map setting to remove any "NOT_CHANGED" values
                mapSettingGroup.data         = $.extend(true, {}, mapSettingGroup.backupData);
                mapSettingGroup.originalData = $.extend(true, {}, mapSettingGroup.backupData);

                //Set common setting for all maps
                nsMap.visitAllVisibleMaps(function(map){
                    var nextMapSettingGroup = getMapSettingGroup(map),
                        mapData = $.extend(true, {}, data);

                    if (nextMapSettingGroup){
                        //If msgAccordion is given => only set data from the settings with the same accordionId
                        if (msgAccordion)
                            $.each(nextMapSettingGroup.settings, function(id, setting){
                                if (setting.options.accordionId != options.msgAccordionId){
                                    mapData[id] = nextMapSettingGroup.data[id];
                                }
                            });
                        nextMapSettingGroup.saveParent(mapData);
                    }
                });

                //Update backup-data for main MapSettingGroup and reset editMapSetting_options
                mapSettingGroup.backupData = $.extend(true, {}, mapSettingGroup.data);
                clear_editMapSetting_options();
            };

            mapSettingGroup.options.onClose = function(){
                mapSettingGroup.data = mapSettingGroup.backupData;
                clear_editMapSetting_options();
            };
        }
        else
            mapSettingGroup.options.onClose  = editMapSetting_onSubmit.bind(mapSettingGroup);

        //Reset all accordions to be visible
        if (mapSettingGroup.modalForm)
            mapSettingGroup.modalForm.$bsModal.find('.accordion-item').removeClass('d-none');

        //Convert mapSettingGroup.data into 1-dim record
        var editData = {};
        $.each(mapSettingGroup.data, function(groupId, groupData){
            $.each(groupData, function(id, value){
                editData[groupId+'_'+id] = value;
            });
        });

        //Extend preEdit with function to hide/show setting-buttons in XXX (not so pretty)
        var fullPreEdit =
                preEdit ?
                    function(){
                        preEdit.apply(this, arguments);
                        controlOptionsForm_preEdit.apply(this, arguments);
                    } :
                    controlOptionsForm_preEdit;
        mapSettingGroup.edit( msgAccordion ? msgAccordion.id : null, editData, fullPreEdit );
    };

    /*****************************************************************************
    editAllMapSettings()
    Show the modal with Map settings for all maps
    *****************************************************************************/
    var mapSettingModal        = null,
        mapSettingMiniMultiMap = null;


    nsMap._onSubmit_mapSync = function( map ){
        if (map.mapSyncControl && map.mapSyncControl.$buttonInEditAll)
            nsMap.updateMapSettingIconWithStatus( map.mapSyncControl.$buttonInEditAll, map.mapSyncControl.getState().enabled );
    };


    function editAllMapSettings(){
        if (!mapSettingModal){
            var content = [];

            //Outline of selected multi-maps with button to open and edit settings for each maps
            var miniMapDim = 120;//maxMaps > 3 ? 120 : 80;
            content.push({
                type : 'inputgroup',
                label: {da: 'Synkronisering og Indstillinger', en:'Synchronization and Settings'},
                content: function($contentContainer){
                    var $div =  $('<div/>')
                                    .windowRatio(miniMapDim, miniMapDim*2)
                                    .addClass('mx-auto')
                                    .css('margin', '5px')
                                    .appendTo($contentContainer);
                    mapSettingMiniMultiMap =
                        L.multiMaps($div, {
                            local : true,
                            border: false,
                            update: function( index, map, $container ){
                                $container.empty();
                                var $button = $.bsButton({
                                        icon   : nsMap.mapSettingIconWithStatus('font-size-0-75em'),
                                        square : true,
                                        class  : 'rounded-0 w-100 h-100 ' + (index ? '' : 'border-multi-maps-main'),
                                        onClick: function(){
                                            nsMap.editMapSetting(index, {multiMapSetupId: mapSettingMiniMultiMap.setup.id});
                                        }
                                    })
                                    .appendTo( $container );

                                //Find the corresponding sync-setting
                                var _map = nsMap.mapIndex[index];

                                //Update icon when setting is changed
                                if (_map.mapSyncControl)
                                    _map.mapSyncControl.$buttonInEditAll = $button;
                                nsMap.updateMapSettingIconWithStatus( $button, _map.mapSyncControl && _map.mapSyncControl.getState().enabled );
                            }
                        });
                }
            });

            //button-group for setting same settings for all maps
            var itemContent = [];
            nsMap.msgAccordionList.forEach( (options,index) => {
                if (!options.excludeFromCommon){
                    let editFunc = options.editCommon || nsMap.editMapSetting;
                    itemContent.push({
                        id      : 'msgId_'+index,
                        icon    : options.header.icon,
                        text    : options.header.text,
                        onClick : editFunc.bind(null, 0, {applyToAll: true, msgAccordionId: options.accordionId})
                    });
                }
            });

            content.push({
                id      : 'msmf_common_options',
                type    : 'inputgroup',
                label   : {da: 'Sæt Indstillinger for alle synlige kort', en:'Set Settings for all visible maps'},
                content : {
                    type           : 'buttongroup',
                    vertical       : true,
                    fullWidth      : true,
                    insideFormGroup: true,
                    list           : itemContent,
                },
            });

            mapSettingModal = $.bsModal({
                header    : {
                    icon: ns.icons.mapSettingSingle,
                    text: ns.texts.mapSettingSingle
                },
                helpId    : nsMap.setupOptions.topMenu.helpId.mapSetting,
                helpButton: true,
                buttons: [{
                    icon   : ns.icons.reset,
                    text   : ns.texts.reset,
                    onClick: ns.reset.bind(null, {allMapsSetting: true})
                }],
                static    : false,
                keyboard  : true,
                content   : content,
            });
        }

        //update minimap
        mapSettingMiniMultiMap.set( nsMap.multiMaps.setup.id );
        mapSettingModal.show();
    }


    var mapSettingMainModal;
    nsMap.showMapSettingMain = function(){
        if (!mapSettingMainModal){
            var list = [];

            //Button witch opens form with multi-map-settinge
            list.push({
                id     : 'multiMapSetting',
                content: $._bsBigIconButtonContent({
                    icon: ns.icons.numberOfMaps,
                    text: ns.texts.numberOfMaps,
                    subtext: {
                        da:'Vis 1-'+nsMap.setupOptions.multiMaps.maxMaps+' kort samtidig<br>Klik for at vælge...',
                        en:'View 1-'+nsMap.setupOptions.multiMaps.maxMaps+' maps at the same time<br>Click to select...'
                    },
                    big : true,
                    bold: true,
                    minHeight: '5em'
                }),
                allowContent: true,
                class       : 'w-100 d-flex',
                onClick     : nsMap.editMultiMapsAndSyncMapsSetting,
            });


            //Button witch opens modal with individuel map-settings
            var text = {};
            $.each(nsMap.msgAccordionList, function(index, options){
                if (!options.header.dontInclude)
                    $.each(i18next.languages, function(index, lang){
                        var langText = text[lang] || '';
                        if (langText.length)
                            langText += '&nbsp;- ';
                        langText = langText + (options.header.smallText || options.header.text)[lang];
                        text[lang] = langText;
                    });
            });

            list.push({
                id     : 'allMapSettings',
                content: $._bsBigIconButtonContent({
                    icon   : ns.icons.mapSettingSingle,
                    text   : allMapsSetting_text,
                    subtext: allMapsSetting_subtext,
                    subtextSeparator: allMapsSetting_subtextSeparator,
                    big    : true,
                    bold   : true,
                    minHeight: '5em'
                }),


                allowContent: true,
                class       : 'w-100 d-flex',
                onClick     : function(){
                    //If only one map is visible => edit its settings
                    if (nsMap.multiMaps.setup.maps == 1)
                        nsMap.editMapSetting(0);
                    else
                        editAllMapSettings();
                }
            });

            mapSettingMainModal = $.bsModal({
                noHorizontalPadding: true,
                header    : {
                    icon: ns.icons.mapSettingGlobal,
                    text: ns.texts.mapSettingGlobal
                },
                closeButton: true,
                helpId     : nsMap.setupOptions.topMenu.helpId.multiMapSetting,
                scroll     : false,
                helpButton : true,
                buttons: [{
                    icon: ns.icons.reset,
                    text: ns.texts.reset,
                    onClick: ns.reset.bind(null, { multiMaps: true, allMapsSetting: true })
                }],
                content    : {
                    type          : 'buttongroup',
                    vertical      : true,
                    fullWidth     : true,
                    centerInParent: true,
                    list          : list
                }
            });
        }

        mapSettingMainModal.show();
    };

}(jQuery, L, this.i18next, this, document));
;
/****************************************************************************
multi-maps

Objects and methods to handle multi maps and
related issues in map sync
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
	"use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    /*********************************************************************
    Map.onShowInMultiMaps, Map.onHideInMultiMaps
    Called when a map is visible/hidden in multi-maps.
    When the map is hidden:
        - Temporary disable map-sync
        - Fire event hideinmultimaps
    When the map is shown:
        - Fire event showinmultimaps

    *********************************************************************/
    L.Map.prototype.onShowInMultiMaps = function(){
        if (this.options.mapSync.save_enabled && !this.options.mapSync.enabled)
            nsMap.mapSync.enable(this);
        this.fire('showinmultimaps');
    };

    L.Map.prototype.onHideInMultiMaps = function(){
        this.options.mapSync.save_enabled = this.options.mapSync.enabled;
        if (this.options.mapSync.enabled)
            nsMap.mapSync.disable(this);
        this.fire('hideinmultimaps');
    };

    /***********************************************
    Add Setting 'multi-map to application-settings
    ***********************************************/
    function getMultiMapId( data ){
        return data[data.maps];
    }

    var multiMapsSetting = ns.appSetting.add({
        id       : 'multi-maps',
        callApply: false,
        applyFunc: function(options){
            if (nsMap.hasMultiMaps){
                //Update number of maps
                nsMap.multiMaps.set( getMultiMapId(options) );

                //Update the options showShadowCursor and showOutline for map-sync (See map/map-sync.js)
                nsMap.setMapSyncCursorAndShadowOptions( options );

                //Update menu-items in layerMenu (if any)
                nsMap.mapLayer_updateMenuItem();

                //Update modernizr-classe regarding single or multi maps selected
                var nrOfMaps = parseInt(options.maps.split('_')[1]);
                window.modernizrToggle( 'single-maps-selected', nrOfMaps == 1);
                window.modernizrToggle( 'multi-maps-selected',  nrOfMaps > 1 );
            }
        },
        defaultValue: {
            maps  : "maps_1",
            maps_1: "1",
            showOutline     : true,
            showShadowCursor: false
        }
    });


    /*********************************************************************
    Add multi-maps reset to reset-list: Only if it is multi maps and with closing the form
    *********************************************************************/
    ns.resetList.unshift({
        id       : 'multiMaps',
        icon     : ns.icons.numberOfMaps,
        text     : {da: 'Vis kun ét kort', en: 'Show only one map'},
        //subtext  : 'MANGLER (måske)',
        prepend  : true,
        closeForm: function(){ return nsMap.mapSettingModalForm; },
        include  : function(){ return nsMap.hasMultiMaps;        },
        setting  : multiMapsSetting,
    });


    /*********************************************************************
    editMultiMapsAndSyncMapsSetting
    Create and display a modal-form window to edit settings
    multi-maps, common settings for map-sync and for each of the visible maps
    *********************************************************************/
    nsMap.mapSettingModalForm = null;
    var mapSettingMiniMultiMap = null;

    nsMap.editMultiMapsAndSyncMapsSetting = function(){
        if (!nsMap.mapSettingModalForm){
            var list    = [],
                maxMaps = nsMap.setupOptions.multiMaps.maxMaps;

            for (var i=1; i<=maxMaps; i++)
                list.push({id:'maps_'+i, text: ''+i});

            var content = [];

            //Group with No Of Maps
            var itemContent = [{
                    //Radio-group with nr of maps
                    id       :'maps',
                    fullWidth: true,
                    type     : 'radiobuttongroup',
                    noBorder : true,
                    list     : list,
                }];

            //Add radio-button-group - each for every nr of maps
            for (var maps=1; maps<=maxMaps; maps++){
                list = [];
                $.each( nsMap.multiMaps.setupList, function(index, options){
                    if (options.maps == maps)
                        list.push({id: options.id, icon: 'famm-'+options.id });
                });

                itemContent.push({
                    id                 : 'maps_'+maps,
                    type               : 'radiobuttongroup',
                    //'hide' when only one mode by making the radiogroup opacity = 0
                    class              : list.length <= 1 ? 'opacity-0' : '',
                    centerInParent     : true,
                    list               : list,
                    noBorder           : true,
                    showWhen           : {'maps': 'maps_'+maps },
                    freeSpaceWhenHidden: true,
                    buttonOptions      : { extraLargeIcon: true },
                });
            }

            content.push({
                type   : 'inputgroup',
                label  : {da:'Antal kort', en:'Number of maps'},
                content: itemContent
            });


            //checkbox for displaying the shadow cursor on all maps
            itemContent = [{
                id        :'showOutline',
                type      : 'checkbox',
                text      : {da:'Vis omrids, når et kort trækkes', en:'Show outline when dragging'},
                hideWhen: {maps: 'maps_1'}
            }];

            //Outline of selected multi-maps with button to open and edit settings for each maps
            var miniMapDim = maxMaps > 3 ? 120 : 80;
            content.push(function($contentContainer){
                var $div =  $('<div/>')
                                .windowRatio(miniMapDim, miniMapDim*2)
                                .addClass('mx-auto')
                                .css('margin', '5px')
                                .appendTo($contentContainer);
                mapSettingMiniMultiMap =
                    L.multiMaps($div, {
                        local : true,
                        border: true,
                        update: function( index, map, $container ){
                            $container.toggleClass('border-multi-maps-main', !index);
                        }
                    });
            });

            content.push({
                id         :'showOutline',
                type       : 'checkbox',
                text       : {da:'Vis omrids, når et kort trækkes', en:'Show outline when dragging'},
                spaceBefore: true,
                hideWhen   : {maps: 'maps_1'}
            });

            //checkbox for displaying the shadow cursor or map center-marker on all maps
            if (ns.modernizr.mouse)
                content.push({
                    id      :'showShadowCursor',
                    type    : 'checkbox',
                    text    : {da:'Vis cursor på alle kort', en:'Show cursor on all maps'},
                    hideWhen: {maps: 'maps_1'}
                });

            nsMap.mapSettingModalForm = $.bsModalForm({
                header    : {
                    icon: ns.icons.numberOfMaps,
                    text: ns.texts.numberOfMaps
                },
                static    : false,
                keyboard  : true,
                content   : content,
                helpId    : nsMap.setupOptions.topMenu.helpId.multiMapSetting,
                helpButton: true,
                buttons: [{
                    icon   : ns.icons.reset,
                    text   : ns.texts.reset,
                    onClick: ns.reset.bind(null, {multiMaps: true})
                }],

                //Removed since mapSetting-control is removed
                //footer    : [{da:'Klik på', en:'Click on'}, {icon: ns.icons.mapSettingSingle}, {da:'&nbsp;i kortet for at sætte synkronisering', en:'&nbsp;in the map to set synchronization'}],

                onChanging : function( data ){
                    mapSettingMiniMultiMap.set( getMultiMapId(data) );
                },
                onSubmit  : function(data){
                    ns.appSetting.set('multi-maps', data);
                    ns.appSetting.save();
                },
                closeWithoutWarning: true
            });
        }

        var data = ns.appSetting.get('multi-maps');
        nsMap.mapSettingModalForm.edit( data );
    };
}(jQuery, L, this, document));




;
/****************************************************************************
offline.js

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    /*
    Add events to Offline to detect if a map have been changed during offline
    If so the map is redraw when the browser in online again
    */

    function map_offline_down(){
        this.centerAndZoomWhenOffline = {
            center: this.getCenter(),
            zoom  : this.getZoom()
        };
    }
    function map_offline_up(){
        if (!this.centerAndZoomWhenOffline) return;

        if (!this.centerAndZoomWhenOffline.center.equals(this.getCenter()) || (this.centerAndZoomWhenOffline.center.zoom != this.getZoom()))
            this.eachLayer(function(layer){
                if (layer.redraw)
                    layer.redraw();
            });
        this.centerAndZoomWhenOffline = null;
    }
    function map_offline_off(){
        window.Offline.off('down', map_offline_down, this);
        window.Offline.off('up',   map_offline_up,   this);
    }


    L.Map.addInitHook(function () {
        window.Offline.on('down', map_offline_down, this);
        window.Offline.on('up',   map_offline_up,   this);
        this.on('unload', map_offline_off, this);
    });

}(jQuery, L, this, document));




;
/****************************************************************************
parent-layer.js

Implement L.Layer._parentLayerList = []L.LayerGroup = The 'parent' L.Layer(Group) the L.Layer belong to

Based on https://stackoverflow.com/questions/40884232/how-to-get-name-id-of-featuregroup-when-layer-is-clicked
****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    L.Layer.addInitHook(function(){
        this._parentLayerList = [];
    });


    L.LayerGroup.include({
        addLayer: function(_addLayer){
            return function(layer){
                layer._parentLayerList.push(this);
                return _addLayer.apply(this, arguments);
            };
        }(L.LayerGroup.prototype.addLayer),

        removeLayer: function(_removeLayer){
            return function(layer){
                layer._parentLayerList.splice(layer._parentLayerList.indexOf(this), 1);
                return _removeLayer.apply(this, arguments);
            };
        }(L.LayerGroup.prototype.removeLayer)
    });

/* ORIGINAL CODE
L.LayerGroup.include({
    addLayer: function (layer) {
        var id = this.getLayerId(layer);
        this._layers[id] = layer;
        if (this._map) {
            this._map.addLayer(layer);
        }

        // Add this group to the layer's known groups
        layer._groups.push(this);

        return this;
    },

    removeLayer: function (layer) {
        var id = layer in this._layers ? layer : this.getLayerId(layer);
        if (this._map && this._layers[id]) {
            this._map.removeLayer(this._layers[id]);
        }
        delete this._layers[id];

        // Remove this group from the layer's known groups
        layer._groups.splice(layer._groups.indexOf(this), 1);

        return this;
    }
});

// Make sure to init a property in L.Layer
L.Layer.addInitHook(function(){
    this._groups = [];
});

*/
}(jQuery, L, this, document));

;
/****************************************************************************
popup-container-class

A special feature that add classes to a popup's container if the popup's 'owner'
or any of its 'parent' layer has options._popupContainerClass

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    L.Map.mergeOptions({
        setPopupContainerClass: false
    });

    L.Map.addInitHook(function () {
        if (this.options.setPopupContainerClass)
            this.on('popupopen', setPopupContainerClass);
    });

    function setPopupContainerClass(event){
        var popup = event.popup,
            popupContainerClass = findOptions(popup, '_popupContainerClass');

        $(popup._container).addClass(popupContainerClass);
    }

    //function findOptions( layer, optionsId )
    //Loop trough all 'parent' layers and return the first found
    //value of options[optionsId] (if any)
    function findOptions( layer, optionsId ){
        if (!layer)
            return '';

        if (layer.options && layer.options[optionsId])
            return layer.options[optionsId];

        var result = '';
        $.each(layer._parentLayerList, function(index, _layer){
            result = result || findOptions( _layer, optionsId );
        });

        //Special case when layer is a element on the map (Popup, Polygon etc.)
        ['_source', '_parentPolyline'].forEach( id => result = result || findOptions( layer[id], optionsId ) );

        return result;
    }

}(jQuery, L, this, document));

;
/****************************************************************************
rightclick-zoom.js
Implement zoom-out on double right click.
Based on https://github.com/GhostGroup/Leaflet.DoubleRightClickZoom
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    L.Map.mergeOptions({
        doubleRightClickZoom: true
    });

    L.Map.DoubleRightClickZoom = L.Handler.extend({
        addHooks: function() {
            this._rightClicks = 0;
            this._map.on('contextmenu', this._onDoubleRightClick, this);
        },

        removeHooks: function(){
            this._map.off('contextmenu', this._onDoubleRightClick, this);
        },

        _onDoubleRightClick: function(){
            this._rightClicks++;
            if (this._rightClicks == 1)
                window.setTimeout( $.proxy(this._handleDoubleRightClick, this), 300);
            return false;
        },

        _handleDoubleRightClick: function(){
            if (this._rightClicks > 1)
                this._map.setZoom(Math.ceil(this._map.getZoom()) - 1);
            this._rightClicks = 0;
        }
    });

    L.Map.addInitHook('addHandler', 'doubleRightClickZoom', L.Map.DoubleRightClickZoom);

}(jQuery, L, this, document));

;
/****************************************************************************
search-category.js
****************************************************************************/
(function (window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    var categories = {

            aeroway: {
                _all: true,
                aerodrome: {da: 'lufthavn/flyveplads'},
                //apron
                //control_tower
                //control_center
                //gate
                //hangar
                //helipad
                //heliport
                //navigationaid
                //runway
                //taxilane
                //taxiway
                //terminal
                //windsock
                //highway_strip
            },

            amenity: false, //for describing useful and important facilities for visitors and residents. facilities include for example toilets, telephones, banks, pharmacies, prisons and schools.

            boundary: {
                _all: true,
                administrative  : {da: 'adminstrativ'},
                postal_code     : {da: 'postnummer'},
                //landuse,
                //political,
                //national_park,
                //marker,
                //lot,
                //forest_compartment,
                //census,
                //religious_administration,
                //forestry_compartment,
                //health,
                maritime        : {da: 'maritimt'},
                //civil_parish,
                //historic,
                //place,
                //aboriginal_lands,
                //historic_parish,
                //civil,
                local_authority: {da: 'lokal myndighed'}
                //natural ,
                //marker,
                //protected_area,
            },

            building    : false,

            changing_table: false,

            emergency   : false,

            highway     : false,

            historic    : false,

            landuse     : false,

            leisure     : false,

            man_made    : false,

            natural: {
                _all: true,
                //wood
                //tree_row
                //tree
                //scrub
                //heath
                //moor
                //grassland
                //fell
                //bare_rock
                //scree
                //shingle
                //sand
                //mud
                water       : {da: 'vand'},
                //wetland
                glacier     : {da: 'gletscher'},
                bay         : {da: 'bugt'},
                cape        : {da: 'kap'},
                strait      : {da: 'stræde'},
                beach       : {da: 'strand'},
                coastline   : {da: 'kystlinje'},
                reef        : {da: 'rev'},
                //spring
                //hot_spring
                //geyser
                //peak
                //dune
                //hill
                //volcano
                valley      :  {da: 'dal'},
                //ridge
                //arete
                //cliff
                //saddle
                //isthmus
                //peninsula
                //rock
                //stone
                //sinkhole
                //cave_entrance
            },

            office: false,

            place: {
                country     : { da: 'land' },
                state       : { da: 'stat' },
                region      : { da: 'region' },
                province    : { da: 'provins' },
                district    : { da: 'distrikt' },
                county      : { da: 'region' },
                municipality: { da: 'kommune' },
                city        : { da: 'by' },
                borough     : false,
                suburb      : {da: 'forstad'},
                postcode    : {da: 'postnummer'},
                quarter     : false,
                neighbourhood: false,
                city_block  : false,
                plot        : false,
                town        : { da: 'by' },
                village     : { da: 'landsby' },
                hamlet      : { da: 'landsby' },
                isolated_dwelling: false,
                farm        : false,
                allotments  : false,
                continent   : {da: 'kontinent'},
                archipelago : {da: 'øhav'},
                island      : {da: 'ø'},
                islet       : {da: 'holm'},
                square      : false,
                locality    : false,
                sea         : {da: 'hav'},
                ocean       : {da: 'ocean'},
            },

            railway : false,

            shop    : false,

            tourism : false,

            waterway: {
                _all: true,
                river       : {da: 'flod'},
                riverbank   : {da: 'flodbred'},
                stream      : {da: 'strøm'},
                tidal_channel: {da: 'tidevandskanal '},
                //wadi
                //drystream
                canal       : {da: 'kanal'},
                //pressurised
                //drain
                //ditch
                //fairway
                dock        : {da: 'dok'},
                boatyard    : {da: 'værft'},
                //dam
                //weir
                //waterfall
                //lock_gate
                //turning_point
                //water_point
                //fuel
            },

        };//end of categories

    nsMap.osm_include = function(options){
        if (options && categories[options.category] && (categories[options.category]._ALL || categories[options.category][options.type]))
            return true;
        return false;
    };

    nsMap.osm_type_text = function(options){
        if (!nsMap.osm_include(options))
            return null;

        var result = {en: options.type.replace('_', ' ')};
        if (categories[options.category] && categories[options.category][options.type] && $.isPlainObject(categories[options.category][options.type]))
            $.extend(result, categories[options.category][options.type]);

        //Detect if it is a country - not completely the correct way to do it
        if (options.extratags && (options.extratags.flag || options.extratags.capital_city) )
            result = {da:'land', en:'country'};



        return result;
    };

    nsMap.osm_display_name = function(options){
        if (!nsMap.osm_include(options) || !options.display_name)
            return null;

        /*
        Acording to https://github.com/osm-search/Nominatim/issues/1662
        options.address cabn contain fields with id "addressNN" where NN >= 29
        This is used to seperat "real" addresses from "other" eq. seas
        */
        var addressAsStr = JSON.stringify(options.address),
            regex = /address(29|3\d|(4-9)\d|\d{3,})/g,
            found = addressAsStr.match(regex);

        if (found && found.length)
            return null;
        else
            return options.display_name;
    };

}(this, document));

;
/****************************************************************************
search-details.js
****************************************************************************/
(function (window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    //details = same structure as json result from nominatim.openstreetmap.org/details?osmtype=R&osmid=2263653&format=json&pretty=1&addressdetails=1&keywords=0&group_hierarchy=0
    //with {da:STRING,en:STRING} for the values to include



    var details = {
            "typeText": {da:'Type', en:'Type', options:{textClass: 'd-block text-center w-100 text-capitalize'}},
            "options" : {
                "display_name": { da: "Detaljer", en:"Details"},
                "extratags"   : {
                    "sqkm"            : {da:'Areal', en:'Area', vfFormat:'area', convert:function(km2){return parseInt(km2)*1000*1000;}},
                    "population"      : {da:'Befolkning', en:'Population', vfFormat:'number'},
                    "capital_city"    : {da:'Hovedstad', en:'Capital City'},
                    "default_language": {da:'Sprog (standard)', en:'Language (default)', convert:ns.getLanguageName},
                    "timezone"        : {da:'Tidszone', en:'Time zone'},
                    "currency"        : {da:'Valuta', en:'Currency'},
                    "contact:website" : {da:'Hjemmeside', en:'Homepage', isLink: true},
                    "opendata_portal" : {da:'Hjemmeside (Open Data)', en:'Homepage (Open Data)', isLink: true},
                },
            },
        };

    nsMap.osm_details_list = function(data, defaultOptions){
        var result = [];
        //****************************
        function extractFrom(ids, subData){
            $.each(ids, function(id, opt){
                if (subData && subData[id]){
                    if (opt.da){
                        var data = subData[id],
                            item = {
                                label: {da: opt.da, en:opt.en}
                            };
                        item.text = opt.convert ? opt.convert(data) : data;
                        if (opt.vfFormat){
                            $.extend(item, {
                                vfFormat : opt.vfFormat,
                                vfValue  : item.text,
                                vfOptions: opt.vfOptions
                            });
                            delete item.text;
                        }
                        if (opt.isLink)
                            item.link = item.text;

                        result.push($.extend({}, item, defaultOptions, opt.options));
                    }
                    else
                        extractFrom(opt, subData[id]);
                }
            });
        }
        //****************************
        extractFrom(details, data);

        return result;
    };
}(this, document));

;
/****************************************************************************
search-latlng
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {},

        llf = window.latLngFormat,

        //groupHeader = header of different groups of results
        groupHeader = [], //[groudId]text

        //Create two new special groups for lat-lng-formats: Lattitude/Longitude and Longitude/Latitude. All other uses formatId as groupId
        latLngGroupId = 0,
        lngLatGroupId = 1;

    groupHeader[latLngGroupId] = {da: 'Bredde/Længdegrader', en: 'Latitude/Longitude'};
    groupHeader[lngLatGroupId] = {da: 'Længde/Breddegrader', en: 'Longitude/Latitude'};
    //For all none-latlng formats: Use header from window.latLngFormat
    for (var formatId = llf.LATLNGFORMAT_LAST_LATLNG + 1; formatId <= llf.LATLNGFORMAT_LAST; formatId++)
        groupHeader[formatId] = llf.options.text[formatId];

    /***************************************************************
    compareTwoStrings(first, second)
    Adjusted version from https://github.com/aceakash/string-similarity
    ***************************************************************/
    function compareTwoStrings(first, second) {
        first = first.replace(/\s+/g, '');
        second = second.replace(/\s+/g, '');

        if (!first.length && !second.length) return 1;                   // if both are empty strings
        if (!first.length || !second.length) return 0;                   // if only one is empty string
        if (first === second) return 1;                                    // identical
        if (first.length === 1 && second.length === 1) return 0;         // both are 1-letter strings
        if (first.length < 2 || second.length < 2) return 0;             // if either is a 1-letter string

        var firstBigrams = new Map(),
            i, bigram, count;
        for (i=0; i < first.length-1; i++) {
            bigram = first.substring(i, i + 2);
            count = firstBigrams.has(bigram)
                    ? firstBigrams.get(bigram) + 1
                    : 1;
            firstBigrams.set(bigram, count);
        }

        var intersectionSize = 0;
        for (i=0; i<second.length-1; i++) {
            bigram = second.substring(i, i + 2),
            count = firstBigrams.has(bigram)
                    ? firstBigrams.get(bigram)
                    : 0;
            if (count > 0) {
                firstBigrams.set(bigram, count - 1);
                intersectionSize++;
            }
        }

        return (2.0 * intersectionSize) / (first.length + second.length - 2);
    }

    /*************************************************************************
    text2LatLng( text, options )
    Try to convert a position as string into a valid latLng
    options:
        onlyLatLng
        onlyLngLat
    Return []{formatId, latlng, text, priority, groupHeader}
    *************************************************************************/
    nsMap.text2LatLng = function( text, options = {}){

        //***************************************************
        function addResult(formatId, value, isLngLat){
            if (value){
                var latLng = L.latLng(value);
                latLng.isLngLat = !!isLngLat;
                formatResult.push( latLng );
            }
        }
        //***************************************************
        function checkLatLngPair(formatId, latLngText){
            if (!options.onlyLngLat)
                addResult(formatId, llf(latLngText[0], latLngText[1]).value());
            if (!options.onlyLatLng && (options.onlyLngLat || (latLngText[0] != latLngText[1])))
                addResult(formatId, llf(latLngText[1], latLngText[0]).value(), true);
        }
        //***************************************************
        //Convert all latLng to {formatId, latLng, text, priority}
        function getText(latLng, trunc, useEditMask){
            var options = {asArray: true, useEditMask:useEditMask},
                array = trunc ? latLng.formatTrunc(options) : latLng.format(options);
            return latLng.isLngLat ? array[1]+'  '+array[0] : array.join('  ');
        }
        //***************************************************

        //First: Search for valid positions
        var saveFormatId = llf.options.formatId,
            formatResult = [],
            positionList = [];

        //Trim for multi space, and space around "," and "."
        var trimmedText = text
                            .replace(/\s{2,}/mg, ' ')
                            .replace(/\s*[.]\s*/mg, '.')
                            .replace(/\s*[,]\s*/mg, ',');

        //Check if search match a position in any of the avaiable formats
        for (var formatId = llf.LATLNGFORMAT_FIRST; formatId <= llf.LATLNGFORMAT_LAST; formatId++){

            formatResult = [];

            llf.setFormat( formatId, true/*dontCallOnChange*/ );

            if ((formatId >= llf.LATLNGFORMAT_FIRST_LATLNG) && (formatId <= llf.LATLNGFORMAT_LAST_LATLNG)){
                //lat-lng-format => split in two

                /*
                Special case:
                1: text contains one or tree comma => split at the middle comma
                2: text contains one - => split at -
                */
                var splitAtList = [' '],
                    commas = (trimmedText.match(/\,/g) || []).length;
                if (commas == 1)
                    splitAtList.push(',');
                if ((trimmedText.match(/\-/g) || []).length == 1)
                    splitAtList.push('-');

                if (commas == 3)
                    //split at 2. comma
                    checkLatLngPair(formatId, [
                        trimmedText.split(',', 2).join(','),
                        trimmedText.split(',').slice(2).join(',')
                    ]);
                else
                    $.each(splitAtList, function(index, splitAt){
                        //Check all combi of split the text in two
                        var array = trimmedText.split(splitAt);
                        for (var i=1; i<array.length; i++)
                        checkLatLngPair(formatId, [
                            array.slice(0,i).join(splitAt),
                            array.slice(i).join(splitAt)
                        ]);
                    });
            }
            else
                //Single text format
                addResult(formatId, llf(text).value());

            if (formatResult.length){
                //Convert all found latlng to {formatId, latLng, groupId, text, priority}
                $.each( formatResult, function(index, latLng){
                    var text1 = getText(latLng),
                        text2 = getText(latLng, true),
                        //Calc the priority as best of normal-mode and edit-mode since offen there are no degree or minut sign in input. Trunc gets the overhand
                        priority1 = Math.max( compareTwoStrings(text1, text), compareTwoStrings(getText(latLng, false, true), text) ),
                        priority2 = Math.max( compareTwoStrings(text2, text), compareTwoStrings(getText(latLng, true,  true), text) ) * 1.05,
                        newRec = {
                            formatId: formatId,
                            latLng  : latLng,
                            priority: Math.max(priority1, priority2),
                            text    : priority1 > priority2 ? text1 : text2
                        };

                    //Set groupId = index in groupHeader
                    newRec.groupHeaderId = formatId;
                    if (formatId <= llf.LATLNGFORMAT_LAST_LATLNG)
                        newRec.groupHeaderId = newRec.latLng.isLngLat ? lngLatGroupId : latLngGroupId;
                    newRec.groupHeader = groupHeader[newRec.groupHeaderId];
                    newRec.isCurrentFormat = (formatId == saveFormatId);

                    positionList.push( newRec );
                });
            }
        } //for (var formatId =
        llf.setFormat( saveFormatId, true );


        //Sort positionList
        positionList.sort(function(pos1, pos2){
            var result = 0;
            if (!result)
                result = pos1.groupHeaderId - pos2.groupHeaderId;
            if (!result)
                result = (pos2.isCurrentFormat ? 1 : 0) - (pos1.isCurrentFormat ? 1 : 0);
            if (!result)
                result = pos2.priority - pos1.priority;
            return result;
        });

        //Remove duplicates
        $.each(positionList, function(index, rec){
            for (var i=index+1; i<positionList.length; i++)
                if ((rec.groupId == positionList[i].groupId) && (rec.latLng.lat == positionList[i].latLng.lat) && (rec.latLng.lng == positionList[i].latLng.lng))
                    positionList[i].text = '';
        });
        //Clean up
        var result = [];
        $.each(positionList, function(index, rec){
            if (rec.text)
                result.push(rec);
        });
        return result;
    };



}(jQuery, L, this, document));




;
/****************************************************************************
search-mapLayer.js
****************************************************************************/
(function ($, L, i18next, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    var selectedSearchResultList = [],  //List of current selected SearchResult
        selectedSearchResult = null;    //Current selected SearchResult in selectedSearchResultList

    /***********************************************************
    Add MapLayer_SearchResult to createMapLayer
    ***********************************************************/
    var id = nsMap.searchMapLayerId = "SEARCH-RESULT",
        header = {
            icon: L.bsMarkerAsIcon('search-result'),
            text: {da: 'Søgeresultater', en: 'Search Results'}
        },
        smallHeader = {
            icon: L.bsMarkerAsIcon('search-result'),
            text: {da: 'Søgeres.', en: 'Search Res.'}
        };

    nsMap.createMapLayer[id] = function(options, addMenu){
        nsMap.searchResultMapLayer =
            nsMap._addMapLayer(id, MapLayer_SearchResult, {
                icon: header.icon,
                text: header.text,
                legendOptions: {}
            });


        addMenu( nsMap.searchResultMapLayer.menuItemOptions() );
    };


    /***********************************************************
    ************************************************************
    MapLayer_SearchResult
    MapLayer for showing search results
    ************************************************************
    ***********************************************************/
    var searchResultIndex = 0;
    var MapLayer_SearchResult = function(options = {}) {

        options.legendOptions = {
            buttonList : this.buttonList(),
        };
        options.menuOptions = {
            useLegendButtonList: true
        };

        nsMap.MapLayer.call(this, options);

        this.searchResults    = {}; //{ID: SearchResult} shown on the maps
        this.numberOfSearchResults = 0;
    };

    MapLayer_SearchResult.prototype = Object.create(nsMap.MapLayer.prototype);
    MapLayer_SearchResult.prototype = $.extend({}, nsMap.MapLayer.prototype, {

        /*****************************************************
        searchButton and buttonList = ´Buttons for legend, menu etc.
        *****************************************************/
        _searchButton_onClick: function(id, selected, $button, map){
            if (this.searchResultListModal)
                this.searchResultListModal.close();
            nsMap.showSearchModalForm('', map || ns.showSearchResultInMap );
        },

        searchButton: function(){
            return {
                type   : 'button',
                icon   : 'fa-search',
                class  : 'min-width',
                text   : {da:'Søg', en:'Search'},
                onClick: this._searchButton_onClick,
                context: this
            };
        },
        removeAllButton: function(){
            return {
                type   : 'button',
                icon   : 'fa-trash-alt',
                text   : {da: 'Fjern', en: 'Remove' },
                class  : 'min-width',
                onClick: this.removeAll,
                context: this
            };
        },

        buttonList: function(){
            var _this = this;
            return [
                {icon: 'fa-th-list',   text: {da: 'Alle',  en: 'All'},     class: 'min-width', onClick: _this._showList,  context: _this},
                this.removeAllButton(),
                this.searchButton()
            ];
        },

        /*****************************************************
        createLayer
        *****************************************************/
        createLayer: function(layerOptions, map){
            var layerGroup = L.layerGroup({/*pane: 'MANGLER - TODO'*/});

            //Add contextmenu with items to show and remove all items
            layerGroup.setContextmenuHeader(smallHeader);
            layerGroup.setContextmenuWidth('9em');

            layerGroup.addContextmenuItems(this.buttonList());

            //Add all searchResult to the new layerGroup
            $.each(this.searchResults, function(id, searchResult){
                searchResult.addTo(layerGroup, map);
            });

            return layerGroup;
        },

        /*************************************************************************
        add( searchResult )
        Maintain a list of SearchResult viewed on the maps
        *************************************************************************/
        add: function( searchResult ){
            var id = searchResult.id;
            if (this.searchResults[id])
                //Allready shown on the maps => use the saved version
                searchResult = this.searchResults[id];
            else {
                this.searchResults[id] = searchResult;
                searchResult.index = searchResultIndex++;

                searchResult.mapLayer = this;

                //Add marker and poly (if any) of the searchResult to the maps
                this.visitAllLayers( function(layerGroup){
                    if (layerGroup)
                        searchResult.addTo(layerGroup, layerGroup._map);
                });

                this.numberOfSearchResults++;

                this._saveSetting();
            }
            return searchResult;
        },

        /*************************************************************************
        remove
        *************************************************************************/
        remove: function( searchResult, dontSaveSetting ){
            //Remove the marker and poly from all maps
            this.visitAllLayers( function(layerGroup){
                if (layerGroup)
                    searchResult.removeFrom(layerGroup._map);
            });

            delete this.searchResults[searchResult.id];

            this.numberOfSearchResults--;

            if (!dontSaveSetting)
                this._saveSetting();
        },

        /*************************************************************************
        removeAll - Remove all search results
        *************************************************************************/
        removeAll: function(){
            if (this.numberOfSearchResults)
                window.notyConfirm({
                    type: 'warning',
                    text: {
                        da: nsMap.hasMultiMaps ? 'Fjern alle søgeresultater i alle kort' : 'Fjern alle søgeresultater',
                        en: nsMap.hasMultiMaps ? 'Remove all search results in all maps' : 'Remove all search results'
                    },
                    onOk: this._removeAll.bind(this)
                });
            else
                this._noSearchResult();
        },

        _removeAll: function(){
            var _this = this;
            $.each(this.searchResults, function(id, searchResult){
                _this.remove( searchResult, true );
            });

            this._saveSetting();
        },

        /*************************************************************************
        applyCommonSetting
        *************************************************************************/
        applyCommonSetting: function(list = []){
            if (this.isApplingCommonSetting || !list)
                return;

            this.isApplingCommonSetting = true;

            this.settingList = list;

            //Create list of 'dummy' SearchResult to past on to ns.getNominatimLookupUrl. Only include not already added SearchResults
            var nominatimList = [],
                _this = this;
            list.forEach( function( opt ){
                if (!opt.isPosition && !_this.searchResults['_'+opt.osm_id])
                    nominatimList.push({
                        options: $.extend(true, {}, opt)
                    });
            });

            if (nominatimList.length)
                Promise.getJSON(
                    ns.getNominatimLookupUrl(nominatimList, true), {},
                    this._nominatim_response.bind(this),
                    this._nominatim_reject.bind(this)
                );
            else
                this._nominatim_response([]);
        },

        _nominatim_response: function(list = []){
            //Create and add all new SearchResult from this.settingList with new options from list (if not a position)
            var _this = this;

            //Add all saved SearchResults
            this.settingList.forEach( function(opt){
                //If it alresdy exists => Do nothing
                if (_this.searchResults[opt.id])
                    return;

                var newSearchResultOptions = opt;

                //Find new options in list (for non-position)
                if (!opt.isPosition)
                    list.forEach( function( osmOptions ){
                        if (opt.osm_id == osmOptions.osm_id)
                            newSearchResultOptions = osmOptions;
                    });

                //Add The new saved SearchResult
                _this.add( new nsMap.SearchResult( newSearchResultOptions ) );

            });

            this.isApplingCommonSetting = false;
            return this;
        },

        _nominatim_reject: function(){
            this.isApplingCommonSetting = false;

            window.notyError({
                da: 'Indlæsning af tidligere søgeresultater mislykkedes desværre',
                en: 'The request for previous search results failed',
            }, {textAlign: 'center'});
        },


        /*************************************************************************
        saveCommonSetting
        *************************************************************************/
        saveCommonSetting: function(){
            var list = [];
            this.getList(true).forEach( function(searchResult){
                list.push(searchResult.saveOptions);
            });
            return list;
        },


        /*************************************************************************
        _noSearchResult - Modal with info-text when no SearchResult are selected
        *************************************************************************/
        _noSearchResult: function(){
            $.bsNoty({
                type     : 'alert',
                layout   : 'center',
                header   : {icon: 'fa-search', text:{da:'Søg', en:'Search'}},
                text     : {da:'Ingen søgeresultater er vist', en:'No search result are shown'},
                buttons  : [this.searchButton()],
                closeWith: ['click', 'button'],
                textAlign: 'center'
            });
            return this;

        },


        /*************************************************************************
        getList
        Return an array of shown SearcResult(s)
        *************************************************************************/
        getList: function( reverse ){
            var result = [];

            $.each(this.searchResults, function(id, searchResult){
                result.push(searchResult);
            });
            result.sort(
                reverse ?
                    function( sr1, sr2 ){ return sr1.index - sr2.index; } :
                    function( sr1, sr2 ){ return sr2.index - sr1.index; }
            );
            return result;
        },


        /*************************************************************************
        showList
        Show a modal with all the visible searchResults
        *************************************************************************/
        _showList: function(id, latlng, $button, map){
            this.showList( nsMap.getSearchResultMap( map ) );
        },

        showList: function( map, noError ){
            ns.showSearchResultInMap = map;

            if (!this.numberOfSearchResults){
                //Error on no searchResults on maps
                if (!noError)
                    this._noSearchResult();
                return;
            }

            //Move all searchResults into a array and sort them by index
            var searchResultListModal = null;
            selectedSearchResult = null;
            selectedSearchResultList = this.getList();

            var _this = this;


            //buttons = generel list for SearchResult = nsMap.searchResultButtonList
            var buttonList = [];
            nsMap.searchResultButtonList.forEach( function( options ){
                buttonList.push( $.extend(true, {}, options ) );
            });


            //*****************************************************
            function onClick(id){
                var buttonIndex = parseInt(id.split('_')[1]),
                    buttonOptions = buttonList[buttonIndex],
                    methodName = buttonOptions.method.split('_')[1]; //Method-name without '_' = method(map)

                if (buttonOptions.closeOnClick || buttonOptions.reloadOnClick)
                    searchResultListModal.close();

                selectedSearchResult[methodName]( ns.showSearchResultInMap );

                if (buttonOptions.reloadOnClick)
                    _this.showList( ns.showSearchResultInMap, true );
            }
            //*****************************************************

            buttonList.forEach( function( buttonOptions, index ){
                buttonOptions.id = 'item_'+ index;
                buttonOptions.title = buttonOptions.text;
                buttonOptions.text = null;
                buttonOptions.square = true;

                buttonOptions._class = buttonOptions.className; //Needed in BsButtonBar

                buttonOptions.onClick = onClick;
            });

            //Create options for modal with list of shown searchResults
            var contentList = [];
            $.each(selectedSearchResultList, function(index, searchResult){
                selectedSearchResult = selectedSearchResult || searchResult;
                contentList.push( searchResult.listContent( index ) );
            });

            //*****************************************************
            //Updates the enabled/disabled of the buttons related to the current selected SearchResult
            function update(){
                var $footer = searchResultListModal.bsModal.$footer,
                    buttonList = selectedSearchResult._getButtonList(true);

                buttonList.forEach( function( options ){
                    $footer.find('.'+options.className).toggleClass('disabled', !options.include);
                });
            }
            //*****************************************************
            var modalOptions = {
                    header   : {icon: 'fa-search', text:{da:'Søgeresultater', en:'Search Results'}},
                    static   : false,
                    keyboard : true,
                    flexWidth: true,
                    closeButton: false,
                    content : {
                        type    : 'selectlist',
                        list    : contentList,
                        onChange: function(id){
                            var index = parseInt(id.split('_')[1]);
                            selectedSearchResult = selectedSearchResultList[index];
                            update();
                        }
                    },

                    footer: $.bsButtonBar({
                        justify: 'start',
                        list   : buttonList
                    }),

                    buttons: [
                        this.removeAllButton(),
                        this.searchButton()
                    ]
                };

            searchResultListModal = this.searchResultListModal = this.searchResultListModal ? this.searchResultListModal.update(modalOptions) : $.bsModal(modalOptions);
            this.searchResultListModal.show();

            update();

        }

    });



}(jQuery, L, this.i18next, this, document));
;
/****************************************************************************
search-result.js
****************************************************************************/
(function ($, L, i18next, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    var searchResultLineColor = 'black',
        searchResultColor     = 'search-result';

    /*************************************************************************
    searchResultButtonList = []options for all buttons used
    options = button-options plus
    isPosition   : BOOLEAN: Only for SearchResult with options.isPosition
    isNotPosition: BOOLEAN: Only for SearchResult with not options.isPosition
    hasPosition  : BOOLEAN: Only for SearchResult with inclPositionIsDetails
    hasPoly      : BOOLEAN: Only for SearchResult with showPoly

    *************************************************************************/
    nsMap.searchResultButtonList = [
        {                     icon: 'fa-crosshairs',   text: {da:'Centrér',  en:'Center'  },                    className: 'sr-center-on-map',     method: '_centerOnMap',     closeOnClick: true  },
        {hasPoly      : true, icon: 'fa-expand',       text: {da:'Udvid',    en:'Expand'  },                    className: 'sr-expand-on-map',     method: '_expandOnMap',     closeOnClick: true  },
        {hasPosition  : true, icon: 'fa-location-dot', text: {da:'Position', en:'Position'},                    className: 'sr-show-latlng-modal', method: '_showLatLngModal', },
        {isNotPosition: true, icon: 'fa-info-circle',  text: {da:'Detaljer', en:'Details' },                    className: 'sr-show-details',      method: '_showDetails',     },
        {                     icon: 'fa-trash-alt',    text: {da:'Fjern',    en:'Remove'  }, spaceBefore: true, className: 'sr-remove-from',       method: '_remove',          reloadOnClick: true }
    ];


    /*************************************************************************
    SearchResult
    Represent one result of a search
    *************************************************************************/
    nsMap.searchResults = {};
    var searchResultDetailModal = null;

    var SearchResult = nsMap.SearchResult = function(options){
        //Save options needed to recreate the SearchResult: Position: All, Location: Just
        if (options.isPosition)
            this.saveOptions = $.extend(true, {}, options);
        else
            this.saveOptions = {
                osm_type: options.osm_type,
                osm_id  : options.osm_id
            };

        //Allow both format = "json" and "jsonv2"
        options.category = options.category || options.class;

        options.include = nsMap.osm_include(options);
        options.address = options.address || {};

        //Create a L.LatLng from the options
        var lat = options.latLng ? options.latLng.lat : options.lat,
            lng = options.latLng ? options.latLng.lng : options.lon,
            isLngLat = options.latLng && options.latLng.isLngLat;
        options.latLng = L.latLng(lat, lng);
        options.latLng.isLngLat = isLngLat;

        this.id = '_' + (options.osm_id || options.latLng.lat+'_'+options.latLng.lng);
        this.saveOptions.id = this.id;

        this.update(options);

        this.showMarker = true;
        this.showPoly   = false;

        this.markers = {}; //{MAPINDEX:  L.bsMarkerSimpleRound}
        this.polys   = {}; //{MAPINDEX: L.polygon}

        if (this.options.geojson && this.options.geojson.coordinates && (this.options.geojson.type != 'Point') && (this.options.geojson.type != 'MultiPoint')){
            var map        = nsMap.mainMap,
                markerSize = 14;
            /*
            Calculate dimentions of the polygon/line at max-zoom see if it is big enough to be visible at max-zoom eq bigger than the marker
            If it is => hide the marker at the zoom-level where the polygon/line has approx. the same size as the marker
            else => Only show the marker
            */
            var minZoom = map.getMinZoom(),
                maxZoom = map.getMaxZoom();

            this.latLngs = L.GeoJSON.coordsToLatLngs(this.options.geojson.coordinates, this.options.geojson.type == 'MultiPolygon' ? 2 : this.options.geojson.type == 'LineString' ? 0 : 1);

            var bounds = L.latLngBounds(this.latLngs),
                /* All is shown as line
                isLine      = (options.geojson.type == 'LineString') || (options.geojson.type == 'MultiLineString'),
                */
                widthAtMaxZoom  = Math.abs(map.project(bounds.getNorthWest(), maxZoom).x - map.project(bounds.getNorthEast(), maxZoom).x ),
                heightAtMaxZoom = Math.abs(map.project(bounds.getNorthWest(), maxZoom).y - map.project(bounds.getSouthWest(), maxZoom).y ),
                maxDimAtMaxZoom = Math.max(widthAtMaxZoom, heightAtMaxZoom),
                zoomDiff        = Math.log2(maxDimAtMaxZoom / markerSize);

            this.visibleAtZoom = Math.ceil(maxZoom - zoomDiff),
            this.showPoly      = maxDimAtMaxZoom > markerSize;
            this.showMarker    = this.visibleAtZoom > minZoom;
        }

        //inclPositionIsDetails: true if the search-result has a single point and no polygons OR the polygon is smaller that a given size. It is to give small cities a point but not big areas like countries etc.
        this.inclPositionIsDetails = options.latLng && this.showMarker && (!this.showPoly || (this.visibleAtZoom >= 6 /* OR 5*/));

        //Create BsModalContentPromise to update modal-content in modal-window
        this.bsModalContentPromise = new $.BsModalContentPromise({
            url             : $.proxy(this._getUrl, this),
            update          : $.proxy(this._update, this),
            afterUpdate     : $.proxy(this._afterUpdate, this),
            reject          : this._reject,
            needToUpdate    : $.proxy(this._needToUpdate, this),
            getModalOptions : $.proxy(this._getModalOptions, this),
        });

        this.bsModalContentPromise.addBsModalOwner(this);
    };


    ns.getNominatimLookupUrl = function( searchResultList, inclPolygon ){
        searchResultList = $.isArray(searchResultList) ? searchResultList : [searchResultList];

        var osm_ids = '';
        searchResultList.forEach( function(searchResult){
            if (osm_ids.length)
                osm_ids += ',';
            osm_ids += searchResult.options.osm_type.toUpperCase()[0] + searchResult.options.osm_id;
        });

        var lang = ns.globalSetting.get('language'),
            params = {
                'osm_ids'          : osm_ids,
                'format'           : 'jsonv2',
                'addressdetails'   : 1,
                'extratags'        : 1,
                'namedetails'      : 1,
                'polygon_geojson'  : inclPolygon ? 1 : 0,
                'polygon_threshold': ns.osm_polygon_threshold,
                'accept-language'  : 'en'
            };
        if (lang != 'en')
            params['accept-language'] = lang + ',en';

        return nsMap.setupOptions.topMenu.nominatim + '/lookup' + L.Util.getParamString(params);
    };

	//Extend the prototype
	SearchResult.prototype = {
        //Internal methods used by this.bsModalContentPromise
        _getUrl: function(){
            return ns.getNominatimLookupUrl( this );
        },

        _needToUpdate: function(){
            if (this.langDetails && this.langDetails[ ns.globalSetting.get('language') ])
                return false;
            return true;
        },

        _update: function(options){
            if (searchResultDetailModal)
                searchResultDetailModal._bsModalPromise_Update(options);
        },

        _afterUpdate: function(){
            if (searchResultDetailModal && searchResultDetailModal.showAfterUpdate){
                searchResultDetailModal.showAfterUpdate = false;
                searchResultDetailModal.show();
            }
        },

        _reject: function(){
            if (searchResultDetailModal)
                searchResultDetailModal._bsModalPromise_Reject();
        },

        _getModalOptions: function(options){
            this.update(options[0]);

            //Create the dynamic part of the modal-options
            var lang = ns.globalSetting.get('language'),
                content = [{
                    label    : {da:'Navn(e)', en:'Name(s)'},
                    type     : 'text',
                    text     : this.names[lang].split('&nbsp;/&nbsp;').join('<br>'),
                    center   : true,
                    textStyle: 'fw-bold'
                }];

            //Add position.
            if (this.inclPositionIsDetails)
                content.push({
                    label    : {da:'Position', en:'Position'},
                    type     : 'text',
                    vfFormat : 'latlng',
                    vfValue  : this.options.latLng,
                    center   : true,
                    textStyle: 'center',

                    onClick  : $.proxy(this.showLatLngModal, this)
                });


            //Add content from details
            content = content.concat( nsMap.osm_details_list(this, {type: 'text', center: true} ) );

            //Special case: Add flag
            if (this.options.extratags && this.options.extratags.flag)
                content.push({
                    label    : {da:'Flag', en:'Flag'},
                    type     : 'text',
                    text     : '<img src="'+this.options.extratags.flag+'" style="border: 1px solid gray; height:100px"/>',
                    center   : true
                });

            this.langDetails = this.langDetails || {};
            this.langDetails[lang] = this.langDetails[lang] || {
                header      : this.header,
                content     : content,
            };
            return this.langDetails[lang];
        },

        /**********************************************
        //update - append new options and update object
        **********************************************/
        update: function(newOptions){
            var _this = this;

            this.optionsLang = ns.globalSetting.get('language'); //The lang used to get the new options

            this.options = this.options || {};
            $.extend(true, this.options, newOptions);

            var opt = this.options;

            this.countryCode = opt.address && opt.address.country_code ? opt.address.country_code : '';
            this.flagIcon = this.countryCode ? 'fa fa-flag-' + this.countryCode : '';
            this.typeText = nsMap.osm_type_text(opt) || opt.type;
            this.name = opt.name || '';
            this.displayName = nsMap.osm_display_name(opt);

            if (opt.isPosition)
                this.names = this.name;
            else {
                if (!this.name && opt.namedetails){
                    //Construct name and name = {lang:STRING} for all lang in i18next.languages and the local language (if found)
                    var localLang = ns.country2lang(this.countryCode),
                        localName = opt.namedetails.name || opt.namedetails['name:'+localLang] || '',
                        defaultName = opt.namedetails['name:en'] || '';

                    //Set local name (if not allerady set)
                    opt.namedetails['name:'+localLang] = opt.namedetails['name:'+localLang] || localName;
                    $.each(i18next.languages, function(index, lang){
                        //Create list of language-code with localLang, lang, all other
                        var namedetailsId = [localLang, lang].concat(i18next.languages);

                        //Find all names in namedetils with language-code in namedetailsId
                        var nameList = [];
                        $.each(namedetailsId, function(index, id){
                            var name = opt.namedetails['name:'+id];
                            if (name && (nameList.indexOf(name) == -1))
                                nameList.push(name);

                            _this.name = _this.name || {};
                            name = name || defaultName;
                            if (name){
                                //Add [localname / ]name/defaultNme as name[id]
                                if (localName && (localName != name))
                                    _this.name[id] = localName + ' / ' + name;
                                else
                                    _this.name[id] = name;
                            }
                        });
                        _this.names = _this.names || {};
                        _this.names[lang] = nameList.join('&nbsp;/&nbsp;');
                    });
                }

                //If only one name is given => convert to {lang:name}
                if (this.name && (typeof this.name == 'string')){
                    var nameStr = this.name;
                    this.name = {};
                    this.name[this.optionsLang] =  nameStr;
                }

                //Sync between name and names
                this.name = this.name || {};
                this.names = this.names || {};

                $.each(this.names, function(lang, names){
                    if (!_this.name[lang])
                        _this.name[lang] = names.split('&nbsp;/&nbsp;')[0];
                });
                $.each(this.name, function(lang, name){
                    if (!_this.names[lang])
                        _this.names[lang] = name;
                });
            }

            //Remove display_name if if it is contained in names
            if (this.names[this.optionsLang] && this.options.display_name && (this.names[this.optionsLang].indexOf(this.options.display_name) > -1))
                this.options.display_name = '';

            this.header = {
                icon: this.flagIcon,
                text: this.name
            };
        },

        /**********************************************
		listContent - Return content for the list of results
        **********************************************/
		listContent: function( listIndex ){
            var thisOpt     = this.options,
                options = {
                    id       : 'item_'+listIndex,
                    selected : !listIndex,
                    textClass: 'text-wrap'
                },
                content     = [],
                displayName = nsMap.osm_display_name(thisOpt);

            function add(opt){
                content.push( $('<div/>').addClass('search-result-row')._bsAddHtml(opt) );
            }
            /*Only test:
            content.push({
                text     : thisOpt.category+'  / '+thisOpt.type,
                textClass: 'd-block search-result-type'
            });
            */

            //Extend the display with other informations
            if (this.typeText)
                add({
                    text     : this.typeText,
                    textClass: 'd-block search-result-type'
                });

            if (this.names)
                add({
                    icon     : this.flagIcon,
                    text     : this.names,
                    textClass: 'd-inline-block search-result-name'
                });

            if (displayName)
                add({
                    icon     : this.names ? '' : this.flagIcon,
                    text     : displayName,
                    textClass: 'd-inline-block ' + (this.names ? 'search-result-display' : 'search-result-name')
                });

            options.content = content;
            return options;
		},


        /**********************************************
        addTo(layerGroup, map) - Create marker and/or polyline and add them to layerGroup
        **********************************************/
        addTo: function(layerGroup, map){
            var mapIndex = map ? map.fcooMapIndex : layerGroup.fcooMapIndex,
                markerClassName = '';

            if (this.showPoly){
                markerClassName = 'show-for-leaflet-zoom-'+this.visibleAtZoom+'-down';

                if (this.polys[mapIndex])
                    poly = this.polys[mapIndex];
                else {
                    //Create polyline
                    var poly = L.polyline(this.latLngs, {
                            fill         : false,
                            lineColorName: searchResultColor,
                            weight       : 5,
                            border       : true,
                            shadow       : true,
                            hover        : true,
                            transparent  : true,

                            tooltipHideWhenPopupOpen: true,
                            shadowWhenPopupOpen     : true,
                            shadowWhenInteractive   : true,

                            addInteractive     : true,
                            interactive        : true,
                        });

                    poly.bindTooltip(this.header);
                    this._addPopupAndContextMenu(poly, layerGroup);

                    this.polys[mapIndex] = poly;
                }

                layerGroup.addLayer( this.polys[mapIndex] );

                //Add class to hide  on when marker is visible - done after the poly is added
                poly._addClass(null, 'hide-for-leaflet-zoom-'+this.visibleAtZoom+'-down');


            }

            //Create the marker - is allways created to be used for initial popup
            if (!this.markers[mapIndex]){
                var marker = L.bsMarkerSimpleRound(this.options.latLng, {
                        size           : 'small',
                        colorName      : searchResultColor,
                        borderColorName: searchResultLineColor,
                        transparent    : true,
                        hover          : true,
                        puls           : false,
                        interactive    : true,
                        tooltip                 : this.header,
                        tooltipPermanent        : false,
                        tooltipHideWhenDragging : true,
                        tooltipHideWhenPopupOpen: true,
                        shadowWhenPopupOpen     : true
                    });

                this._addPopupAndContextMenu(marker, layerGroup);
                if (this.showMarker)
                    marker.addClass(markerClassName);
                else
                    marker.setOpacity(0);

                this.markers[mapIndex] = marker;
            }

            layerGroup.addLayer(this.markers[mapIndex]);
        },

        /**********************************************
        _getPoly, _getMarker
        **********************************************/
        _getPoly  : function( mapOrMapIndexOrMapId ){ return this._getObj(mapOrMapIndexOrMapId, 'polys'); },
        _getMarker: function( mapOrMapIndexOrMapId ){ return this._getObj(mapOrMapIndexOrMapId, 'markers'); },

        _getObj   : function( mapOrMapIndexOrMapId, listId ){
            if (!this.mapLayer) return null;

            var map = nsMap.getMap(mapOrMapIndexOrMapId),
                mapIndex = map ? map.fcooMapIndex : -1;

            return mapIndex > -1 ? this[listId][mapIndex] : null;
        },

        /**********************************************
        _getButtonList
        Return a copy of nsMap.searchResultButtonList with each button marked included: true/false
            isPosition   : BOOLEAN: Only for SearchResult with options.isPosition
            isNotPosition: BOOLEAN: Only for SearchResult with not options.isPosition
            hasPosition  : BOOLEAN: Only for SearchResult with options.inclPositionIsDetails
            hasPoly      : BOOLEAN: Only for SearchResult with showPoly
        **********************************************/
        _getButtonList: function(onlySetInclude){
            var _this   = this,
                thisOpt = this.options,
                list    = [];

            $.each($.extend(true, {}, nsMap.searchResultButtonList), function(index, o /*=button options */){
                var include = (
                    (!o.isPosition    || thisOpt.isPosition) &&
                    (!o.isNotPosition || !thisOpt.isPosition) &&
                    (!o.hasPosition   || _this.inclPositionIsDetails) &&
                    (!o.hasPoly       || _this.showPoly)
                );
                if (onlySetInclude)
                    o.include = include;

                if (include || onlySetInclude)
                    list.push(o);
            });
            return list;
        },

        /**********************************************
        _addPopupAndContextMenu
        **********************************************/
        _addPopupAndContextMenu: function( obj, layerGroup ){
            var _this = this,
                menuList = [];

            $.each(this._getButtonList(), function(index, buttonOptions){
                menuList.push({
                    icon       : buttonOptions.icon,
                    text       : buttonOptions.text,
                    spaceBefore: buttonOptions.spaceBefore,
                    class      : buttonOptions.className,
                    onClick    : _this[buttonOptions.method],
                    context    : _this
                });
            });

            obj.setContextmenuParent(layerGroup);
            obj.setContextmenuOptions({alsoAsPopup: true});
            obj.setContextmenuHeader(this.header);
            obj.excludeMapContextmenu();

            obj.addContextmenuItems(menuList);

            return this;
        },


        /**********************************************
        Internal methods to find correct arguments from
        arguments = (id, latLng,   $button, map, owner)
        See fcoo/leaflet-bootstrap src/00_leaflet-bootstrap.js
        **********************************************/
        _centerOnMap    : function(id, latLng, $button, map/*, owner*/){ this.centerOnMap( map );     },
        _expandOnMap    : function(id, latLng, $button, map/*, owner*/){ this.expandOnMap( map );     },
        _showLatLngModal: function(id, latLng, $button, map/*, owner*/){ this.showLatLngModal( map ); },
        _showDetails    : function(id, latLng, $button, map/*, owner*/){ this.showDetails( map );     },
        _remove         : function(id, latLng, $button, map/*, owner*/){ this.remove( map );          },


        /**********************************************
        _closePopup( map )
        **********************************************/
        _closePopup: function( map ){
            var marker = this._getMarker(map),
                poly   = this._getPoly(map);

            if (marker)
                marker.closePopup();
            if (poly)
                poly.closePopup();
        },

        /**********************************************
        centerOnMap( map )
        **********************************************/
        centerOnMap: function( map = nsMap.mainMap ){
            this.mapLayer.addTo(map);
            this._closePopup( map );
            map.setView(this.options.latLng, map.getZoom(), map._mapSync_NO_ANIMATION);
        },


        /**********************************************
        expandOnMap( map )
        **********************************************/
        expandOnMap: function( map = nsMap.mainMap ){
            this.mapLayer.addTo(map);
            this._closePopup( map );
            var poly = this._getPoly( map );
            if (poly)
                map.fitBounds(poly.getBounds(), map._mapSync_NO_ANIMATION);
        },


        /**********************************************
        showLatLngModal - show modal with position
        **********************************************/
        showLatLngModal: function( map ){
            this._closePopup( map );
            nsMap.latLngAsModal(this.options.latLng, {header: this.header});
        },

        /**********************************************
        showDetails - create and show modal with detalis
        **********************************************/
        showDetails: function( map ){
            this._closePopup( map );

            searchResultDetailModal =
                $.bsModal({
                    scroll : true,
                    content: ' ',
                    footer : [{icon:'fa-copyright', text: 'OpenStreetMap', link: 'https://www.openstreetmap.org/copyright'},{text:'contributors'}],
                    show   : false,
                    remove : true
                });

            searchResultDetailModal.showAfterUpdate = true;
            this.bsModalContentPromise.update();
        },

        /**********************************************
        remove()
        **********************************************/
        remove: function(){
            this.mapLayer.remove( this );
        },

        /**********************************************
        removeFrom( map ) - Remove marker and/or polyline from map
        **********************************************/
        removeFrom: function( map ){
            this._getMarker(map) ? this._getMarker(map).remove() : null;
            this._getPoly(map)   ? this._getPoly(map).remove()   : null;
        },

        /**********************************************
        showOnMap - Makes the SearchResult visible on map
        Enable the mapLayer on map and center this
        **********************************************/
        showOnMap: function( map ){
            //Add the mapLayer to the map
            this.mapLayer.addTo(map);

            //Fit to poly or center marker
            if (this.showPoly)
                map.fitBounds(
                    this._getPoly(map).getBounds(),
                    $.extend(
                        {maxZoom: map.getZoom()},
                        map._mapSync_NO_ANIMATION
                    )
                );
            else
                this.centerOnMap( map );

            //Open popup
            var popupOwner = this._getMarker(map) || this._getPoly(map);
            if (popupOwner)
                popupOwner.openPopup();
        }
    };
}(jQuery, L, this.i18next, this, document));
;
/****************************************************************************
search.js
****************************************************************************/
(function ($, L, i18next, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /*************************************************************************
    **************************************************************************
    search( text )
    **************************************************************************
    *************************************************************************/
    var searchText             = '',
        selectedSearchResultId = '',
        searchLang             = '', //The language selected during last search
        minSearchLength        = 3;

    //showSearchResultInMap = The map where a SearchResult or list of SearchResults are shown
    ns.showSearchResultInMap = null;


    //Option polygon_threshold = Return a simplified version of the output geometry.
    //The parameter is the tolerance in degrees with which the geometry may differ from the original geometry.
    //Topology is preserved in the result. (Default: 0.0)
    ns.osm_polygon_threshold = 0.001;   //Reduce nr of pints in big polygons (eq. USA) by a factor 10!

    ns.events.on( ns.events.LANGUAGECHANGED, function(){
        searchText = '';
    });

    /* Just for test:
    var testList = [
            'Danmark',
            '55 12.001',
            'køln',
            //'xhil',
            'Hillerød',
            'usa'
        ];
    */
    nsMap.search = function( text, map ){
        /* TEST
        text = text || '12 12 - 12 12';
        text = text || "56° 28,619'N - 006° 05,055'E";
        text = text || 'Köln';
        text = text || '12 12.001';
        //*/
        /* Just for test
        if (testList.length)
            text = testList.pop();
        */

        //If no MayLayer to show search-results => No able to search
        if (!nsMap.searchResultMapLayer){
             $.bsNotyError({
                 da:'Lag med søgeresultater er ikke installeret',
                 en:'Layer with search results is not installed'
             });
            return;
        }

        var lang = ns.globalSetting.get('language');
        if (text === null){
            nsMap.showSearchModalForm(searchText, map);
            return;
        }
        text = (text || '').trim();

        //If text is same as last search => show same result!
        if ((text == searchText) && (searchLang == lang)){
            showSearchResultModal(searchResultList, map);
            return;
        }

        //If text to short => open modal to enter search
        if (text.length < minSearchLength){
            nsMap.showSearchModalForm(text, map);
            return;
        }

        //Set default map
        ns.showSearchResultInMap = map;

        //Save text and lang as last search
        searchText = text;
        searchLang = lang;

        //Add search to end of history-list
        searchHistoryList.goLast();
        searchHistoryList.add(text);

        //Update input in top-menu with latest search
        nsMap.main.topMenuObject.searchInput.val(searchText);

        //First: Search for position
        var latLngList = nsMap.text2LatLng(text);
        if (latLngList.length){
            var currentGroupHeaderId = null,
                list = [];
            $.each(latLngList, function(index, rec){
                if (rec.groupHeaderId !== currentGroupHeaderId)
                    currentGroupHeaderId = rec.groupHeaderId;
                list.push(
                    new nsMap.SearchResult({
                            latLng    : rec.latLng,
                            name      : rec.text,
                            type      : rec.groupHeader,
                            isPosition: true
                        })
                );
            });
            showSearchResultModal(list, map);
        }
        else {
            //If no position was found => search in OpenStreetMap
            var params = {
                    'q'                : searchText,
                    'format'           : 'jsonv2',
                    'polygon_geojson'  : 1,
                    'polygon_threshold': ns.osm_polygon_threshold,
                    'extratags'        : 1,
                    'namedetails'      : 1,
                    'addressdetails'   : 1,
                    'accept-language'  : 'en',
                    'limit'            : 20,
                };

            if (lang != 'en')
                params['accept-language'] = lang + ',en';
            $.workingOn();
            Promise.getJSON( nsMap.setupOptions.topMenu.nominatim + '/search' + L.Util.getParamString(params), {}, nominatim_response, nominatim_reject );
        }
    };

    function nominatim_response(json){
        $.workingOff();
        var list = [], noToInclude = 10;
        $.each(json, function(index, nominatim){
            var searchResult = new nsMap.SearchResult(nominatim);
            if (searchResult.options.include && noToInclude){
                noToInclude--;
                list.push(searchResult);
            }
        });
        return showSearchResultModal(list, ns.showSearchResultInMap);
    }

    function nominatim_reject(){
        $.workingOff();
        window.notyError({
            da: 'Søgningen efter "'+searchText+'" mislykkedes<br>Prøv eventuelt igen senere',
            en: 'The search for "'+searchText+'" failed<br>Try again later',
        }, {textAlign: 'center'});
    }


    /*************************************************************************
    showSearchModalForm( text, map )
    *************************************************************************/
    var searchModalForm = null,
        searchHistoryList = new window.HistoryList({
            action: function( text ){
                if (searchModalForm)
                    searchModalForm.getInput('search').setValue(text);
            }
        });

    nsMap.showSearchModalForm = function( text, map ){
        ns.showSearchResultInMap = map;

        searchModalForm = searchModalForm || $.bsModalForm({
            header        : {icon: 'fa-search', text:{da:'Søg efter position eller lokation', en:'Search for Position or Location'}},
            static        : false,
            keyboard      : true,
            formValidation: true,
            content: {
                id         : 'search',
                type       : 'input',
                placeholder: {da:'Søg...', en:'Search..'},
                validators : ['required', {type: 'length', min: minSearchLength}]

            },
            closeWithoutWarning: true,
            historyList: searchHistoryList,
            submitIcon: 'fa-search',
            submitText: {da:'Søg', en:'Search'},
            onSubmit  : function(data){
                nsMap.search(data.search, ns.showSearchResultInMap);
            },
        });
        searchModalForm.edit({search: text});
        searchModalForm.getInput('search').$element.get(0).select();
    };


    /*************************************************************************
    showSearchResultModal( list, map )
    list = []{[icon,] text, [latLng,] [geoJSON]}
    Show modal with list of SearchResult
    *************************************************************************/
    ns.searchResultModal = null;

    var searchResultList = [],
        selectedSearchResultIndex = -1;


    /*************************************************************************
    getSearchResultMap
    Find the map where a SearchResult is fit/centered on when selected.
    Use:
    1: Previous used map (if still showing search-results, or
    2: main-map if search-result are shown, or
    3: any visible map with search-result shown, or
    4: main-map
    *************************************************************************/
    nsMap.getSearchResultMap = function( map ){
        var result = map;
        if (!result){
            var mapLayer = nsMap.searchResultMapLayer;

            if (mapLayer){
                if (ns.showSearchResultInMap && mapLayer.isAddedToMap(ns.showSearchResultInMap) )
                    //1: Previous used map (if still showing search-results
                    result = ns.showSearchResultInMap;
                else
                    nsMap.visitAllVisibleMaps( function( nextMap ){
                        //2: main-map if search-result are shown, or
                        //3: any visible map with search-result shown
                        if (!result && mapLayer.isAddedToMap( nextMap ) )
                            result = nextMap;
                    });

                //4: main-map
                result = result || nsMap.mainMap;
            }
            else
                /* search-result-layer not installed */;
        }

        return result;
    };

    function showSearchResultModal( list, map ){
        searchResultList = list;

        map = nsMap.getSearchResultMap( map );

        //If only ONE result => show direct on map
        if (list.length == 1){
            var result = nsMap.searchResultMapLayer.add( list[0] );
            result.showOnMap( map );
            return result;
        }

        ns.showSearchResultInMap = map;
        var searchAgainButton = {
                type: 'button',
                icon: 'fa-search',
                text: {da:'Søg igen', en:'New Search'},
                onClick: function(){
                    if (ns.searchResultModal)
                        ns.searchResultModal.close();
                    nsMap.showSearchModalForm(searchText, ns.showSearchResultInMap);
                }
            },
            selectlistItems = [];

        //Create result-list
        selectedSearchResultIndex = 0;
        $.each(list, function(index, searchResult){
            if (searchResult.id == selectedSearchResultId)
                selectedSearchResultIndex = index;
        });
        var inclDetails = true;
        $.each(list, function(index, searchResult){
            if (searchResult.options.isPosition)
                inclDetails = false;
            selectlistItems.push( searchResult.listContent(index) );
        });

        if (selectlistItems.length){
            var onClick = function(){
                    ns.searchResultModal.close();
                    nsMap.searchResultMapLayer
                        .add( searchResultList[selectedSearchResultIndex] )
                        .showOnMap( ns.showSearchResultInMap );
                },
                options = {
                    header   : {icon: 'fa-search', text:{da:'Søgeresultater', en:'Search Results'}},
                    static   : false,
                    keyboard : true,
                    flexWidth: true,
                    fixedContent: {
                        type : 'text',
                        label: {da:'Søgte efter', en:'Searched for'},
                        text : searchText,
                        after: searchAgainButton
                    },
                    content : {
                        type  : 'selectlist',
                        list  : selectlistItems,
                        onChange: function(id){
                            selectedSearchResultIndex = parseInt(id.split('_')[1]);
                            selectedSearchResultId = searchResultList[selectedSearchResultIndex].id;
                        },
                        onDblClick: onClick
                    },
                    buttons : [
                        {
                            icon   : 'fa-info-circle',
                            className: 'btn_search_result_detail',
                            text   : {da:'Detaljer', en:'Details'},
                            onClick: function(){ searchResultList[selectedSearchResultIndex].showDetails( ns.showSearchResultInMap ); }
                        }, {
                            icon   : 'fa-location-plus',
                            text   : {da:'Vis på kort', en:'Show on map'},
                            onClick: onClick
                        }
                    ],
                    footer: {
                        text: {da:'Søgning efter positioner, byer, havområder og lign. - men ikke efter adresser', en:'Search for positions, cities, seas and the likes - but not for addresses'},
                        textClass: 'd-block text-wrap'
                    }
                };
            ns.searchResultModal = ns.searchResultModal ? ns.searchResultModal.update(options) : $.bsModal(options);

            ns.searchResultModal.bsModal.$buttons[1].toggle(inclDetails);

            ns.searchResultModal.show();
        }
        else {
            $.bsNoty({
                type     : 'alert',
                layout   : 'center',
                header   : {icon:'fa-search', text:{da:'Søg', en:'Search'}},
                text     : {da:'Søgning efter "'+searchText+'" gav ikke noget resultat', en:'Search for "'+searchText+'" gave no result'},
                buttons  : [searchAgainButton],
                closeWith: ['click', 'button'],
                timeout  : 4000,
                textAlign: 'center'
            });
        }

        return this;
    }

}(jQuery, L, this.i18next, this, document));
;
/****************************************************************************
tile-filter.js

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

/*
    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};
*/

    /***********************************************************
    Extend L-TileLayer with options and methods to grayscale, filter
    and change color of tile-layer
    Based on https://github.com/Zverik/leaflet-grayscale

    Tree possible filter:
        options.grayscale: true => Grayscale with options.quotaRed, options.quotaGreen, options.quotaBlue
        options.filterOneColor: [red, green, blue[,alpha] => Replacing all non-transparent color with options.filterOneColor
        options.colorFilter: STRING with css-filter. See map-layer_background.js

    ***********************************************************/
    L.TileLayer.include({
        onAdd: function (L_TileLayer_onAdd) {
            return function(){
                var options = this.options,
                    allreadyHasFilter = options.hasFilter;

                //crossOrigin = 'anonymous' needed for both filter and getColor-method
                options.crossOrigin = 'anonymous';

                if (!allreadyHasFilter){
                    options.hasFilter = true;
                    if (options.grayscale){
                        options =   $.extend(true, {
                                        quotaRed        : 21,
                                        quotaGreen      : 71,
                                        quotaBlue       : 8,
                                        quotaDividerTune: 0
                                    }, options );
                        options.quotaDivider = options.quotaRed + options.quotaGreen + options.quotaBlue + options.quotaDividerTune;
                        options.filterFunc = this._tileGrayscale;
                    }

                    else

                    if (options.filterOneColor){
                        options.filterFunc = this._tileFilterOneColor;
                    }

                    else

                    if (options.colorFilter){
                        //No filterFunc needed
                        options.filterFunc = null;
                    }
                    else
                        options.hasFilter = false;
                }
                this.options = options;
                var result = L_TileLayer_onAdd.apply(this, arguments);

                if (!allreadyHasFilter && options.hasFilter && options.filterFunc){
                    this.on('tileload', this._onTileLoad_filter, this);
                }

                return result;
            };
        }(L.TileLayer.prototype.onAdd),



        _initContainer: function (L_TileLayer__initContainer) {
            return function(){
                var result = L_TileLayer__initContainer.apply(this, arguments);
                if (this.options.colorFilter)
                    this._container.style.filter = this.options.colorFilter;
                return result;
            };
        }(L.TileLayer.prototype._initContainer),

        _onTileLoad_filter: function(event) {
            var image = event.tile;
            if (image.getAttribute('data-filtered'))
                return;

            image.crossOrigin = '';
            var canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0);

            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            this.options.filterFunc(imageData.data, this.options);

            ctx.putImageData(imageData, 0, 0);

            image.setAttribute('data-filtered', true);
            image.src = canvas.toDataURL();

        },

        _tileGrayscale: function (pixels, options) {
            for (var i = 0, n = pixels.length; i < n; i += 4)
                pixels[i] = pixels[i + 1] = pixels[i + 2] = (options.quotaRed * pixels[i] + options.quotaGreen * pixels[i + 1] + options.quotaBlue * pixels[i + 2]) / options.quotaDivider;
        },

        _tileFilterOneColor: function (pixels, options) {
            var i, pLng = pixels.length, j, cLng = options.filterOneColor.length;
            for (i = 0; i < pLng; i += 4)
                if (pixels[i+3] != 0)
                    for (j = 0; j < cLng; j++)
                        pixels[i+j] = options.filterOneColor[j];
        }
    });

}(jQuery, L, this, document));
