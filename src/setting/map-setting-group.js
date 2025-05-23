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