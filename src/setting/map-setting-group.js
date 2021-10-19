/****************************************************************************
1_fcoo-maps-map-setting-group.js,
Create mapSettingGroup = setting-group for each maps with settings for the map
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

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
            accordionId: 'sync',
            excludeFromCommon: true,
            header  : {
                icon       : 'fa-sync',
                text       : {da:'Synkronisering med hovedkort', en:'Synchronizing with main map'},
                //smallText  : {da:'Synk.', en:'Sync.'}
                smallText  : {da:'Synkronisering', en:'Synchronizing'}
            }
        }),

        msgBackground = nsMap.msgAccordionAdd({
            accordionId: 'background',
            header: {
                icon     : 'far fa-map',
                text     : {da:'Baggrundskort', en:'Background Map'},
                smallText: ''
            }
        }),

        msgGraticule = nsMap.msgAccordionAdd({
            accordionId: 'graticule',
            header: {
                icon     : [['fa-grip-lines-vertical', 'fa-grip-lines']],
                text     : {da:'Gitterlinjer', en:'Graticule'},
                smallText: ''
            }
        }),

        msgControls = nsMap.msgAccordionAdd({
            accordionId: 'controls',
            header: {
                icon     : 'fa-tools',
                text     : {da: 'Værktøjer og information', en:'Tools and Information'},
                smallText: {da: 'Værktøj. & info', en:'Tools & Info'}
            }
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
    nsMap.bsControls = {
        //Zoom (L.Control.BsZoom@leaflet-latlng)
        'bsZoomControl': {
            header   : {icon: ['fa-plus-square', 'fa-minus-square'], text: {da: 'Zoom-knapper', en:'Zoom-buttons'} },
            position : ''
        },
        //Length scale (L.Control.BsScale@leaflet-latlng)
        'bsSettingControl': {
            header   : nsMap.mapSettingHeader,
            position : ''
        },
        //Legend (L.Control.BsLegend@leaflet-latlng)
        'bsLegendControl': {
            header   : nsMap.mapLegendHeader,
            position : ''
        },
        //Scale (L.Control.BsScale@leaflet-latlng)
        'bsScaleControl': {
            header   : {icon: 'fa-ruler-horizontal', text: {da: 'Længdeskala (in situ)', en:'Length Scale (in situ)'} },
            position : ''
        },
        //Position (L.Control.BsPosition@leaflet-latlng)
        'bsPositionControl': {
            header   : window.bsIsTouch ?
                           {icon: 'fa-lb-center-marker', text: {da: 'Kortcenter-position', en:'Map Center Position'} } :
                           {icon: 'fa-mouse-pointer',    text: {da: 'Cursor/Kortcenter-position', en:'Cursor/Map Center Position'} },
            position : ''
        }
    };

    //Get the position from main-map settings in nsMap.mainMapOptions
    $.each(nsMap.bsControls, function(controlId, options){
        var optionsId = controlId.replace('Control', 'Options');
        options.position = nsMap.mainMapOptions[optionsId].position;
    });



    /*******************************************************
    nsMap.mswcFunctionList (Map Setting With Control Function List)
    Is a list of functions used to create Settings in MapSettingGroup using
    method addMapSettingWithControl when the MapSetting for each amps are created

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
    nsMap.mswcFunctionList.push(function(map){
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
    nsMap.mswcFunctionList.push( function(/*map*/){
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
            /* TODO
            var showWhen = {};
            showWhen[controlId+'_show'] = true;
            */

            _this.addMapSettingWithControl({
                controlId      : options.controlId,
                id             : 'show',
                accordionId    : msgControls,
                modalContent   : {
                    type   : 'inputGroup',
                    label  : options.header,
                    content: [
                        {id:'show', type:'checkbox', text: {da: 'Vis på kortet', en:'Show on the map'}, smallBottomPadding: true},
                        /* TODO button to open settings for each control = items from its popupList
                            class for form-group:
                                display: inline-block;
                                position: absolute;
                                top: 0px;
                                right: 0px;

                        {id: 'setting', type:'button', icon:'fa-cog fa-fw', insideFormGroup: true, showWhen: showWhen, onClick: function(){ alert('mangler'); } },
                        */
                    ]
                }
            });
        });
    });

    /*****************************************************************************
    MapSettingGroup = SettingGroup with NxSettings - one for each subset of options for a map
    *****************************************************************************/
    var MapSettingGroup = function(map){
        ns.SettingGroup.call(this, {
            id           : 'NOT_USED',
            dontSave     : true,    //<-- MUST be true!!
            modalHeader  : nsMap.mapSettingHeader,
            modalOptions : {
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
        var _this = this;
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
                SettingGroup_onSubmit.call(this, data); //sætter this.data = data
                this.options.simpleMode = false;

                this.saveParent(data);
            };
        }(ns.SettingGroup.prototype.onSubmit),

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
            semiTransparent: true,
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
    editMapSetting(mapIndex, options)
    Show the modal with settings for one map with index in nsMap.mapIndex
    options = {
        applyToAll      : if applyToAll == true => the settings are applied to all maps
        msgAccordionId  : if msgAccordionId is given => Only edit data inside accordion with accordionId == msgAccordionId
        multiMapSetupId : if given use this as id for mini-multi-map else use global setting
    *****************************************************************************/
    function getMapSettingGroup(map){
        var bsSettingControl = map ? map.bsSettingControl : null,
            mapSettingGroup = bsSettingControl ? bsSettingControl.mapSettingGroup : null;
        return mapSettingGroup;
    }

    nsMap.editMapSetting = function(mapIndex, options){
        var mapSettingGroup = getMapSettingGroup(nsMap.mapIndex[mapIndex]);
        if (!mapSettingGroup) return;

        options = options || {};

        var msgAccordion = nsMap.msgAccordions[options.msgAccordionId],
            preEdit = msgAccordion ?
                function(settingGroup/*, data*/){
                    //Hide all accordions except the one gíven by
                    settingGroup.modalForm.$bsModal.find('.card').addClass('d-none');
                    settingGroup.modalForm.$bsModal.find('.card[data-user-id="'+options.msgAccordionId+'"]').removeClass('d-none');
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
                                if (setting.options.accordionId != options.msgAccordionId)
                                    mapData[id] = nextMapSettingGroup.data[id];
                            });
                        nextMapSettingGroup.saveParent(mapData);
                    }
                });
            };

            mapSettingGroup.options.onClose = function(){
                mapSettingGroup.data = mapSettingGroup.backupData;
            };

        }
        else {
            mapSettingGroup.options.onSubmit = null;
            mapSettingGroup.options.onClose = null;
        }

        //Reset all accordions to be visible
        if (mapSettingGroup.modalForm)
            mapSettingGroup.modalForm.$bsModal.find('.card').removeClass('d-none');


        //Convert mapSettingGroup.data into 1-dim record
        var editData = {};
        $.each(mapSettingGroup.data, function(groupId, groupData){
            $.each(groupData, function(id, value){
                editData[groupId+'_'+id] = value;
            });
        });

        mapSettingGroup.edit( msgAccordion ? msgAccordion.id : null, editData, preEdit );
    };

    /*****************************************************************************
    editAllMapSettings()
    Show the modal with
    *****************************************************************************/
    var mapSettingModal        = null,
        mapSettingMiniMultiMap = null;

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
                                        class  : 'w-100 h-100 ' + (index ? '' : 'border-multi-maps-main'),
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
            $.each(nsMap.msgAccordionList, function(index, options){
                if (!options.excludeFromCommon)
                    itemContent.push({
                        id      : 'msgId_'+index,
                        icon    : options.header.icon,
                        text    : options.header.text,
                        onClick : function(){ nsMap.editMapSetting(0, {applyToAll: true, msgAccordionId: options.accordionId} ); }
                    });
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
                header    : nsMap.mapSettingHeader,
                helpId    : nsMap.setupOptions.topMenu.helpId.mapSetting,
                helpButton: true,

                static    : false,
                keyboard  : true,
                content   : content,
            });
        }

        //update minimap
        mapSettingMiniMultiMap.set( nsMap.multiMaps.setup.id );

        mapSettingModal.show();
    }


    /*****************************************************************************
    showMapSettingMain()
    Show the modal with two buttons to edit multi-maps or map-setting (both individual and all)
    *****************************************************************************/
    function createBigIconButton(icon, header, content){
        var $result = [];
        $result.push(
            $('<div/>')
                ._bsAddHtml({icon: icon})
                .addClass('fa-2x align-self-center flex-shrink-0 text-left')
                .css('padding-left', '10px')
                .width('1.75em')
        );
        $.each(content, function(index, text){
            content[index] = {
                text     : text,
                textClass: typeof text == 'string' ? 'no-margin' : 'text-nowrap'
            };
        });
        content.unshift('<br>');
        content.unshift({
            text     : header,
            textClass: 'font-weight-bold font-size-1-2em'
        });

        $result.push(
            $('<div/>')
                .addClass('flex-grow-1 no-margin-children')
                .height('6em')
                ._bsAddHtml(content)
        );
        return $result;
    }

    var mapSettingMainModal;
    nsMap.showMapSettingMain = function(){
        if (!mapSettingMainModal){
            var list        = [],
                contentList = [];

            //Button witch opens form with multi-map-settinge
            list.push({
                id     : 'multiMapSetting',
                content: createBigIconButton(
                             ns.iconSub('fa-map', 'fa-tally', true),
                             {da:'Antal kort', en:'Number of Maps'},
                             [
                                 {da:'Vis 1-'+nsMap.setupOptions.multiMaps.maxMaps+' kort samtidig', en:'View 1-'+nsMap.setupOptions.multiMaps.maxMaps+' maps at the same time'},
                                 '<br>',
                                 {da:'Klik for at vælge...', en:'Click to select...'}
                             ]
                         ),
                allowContent: true,
                class       : 'w-100 d-flex',
                onClick     : nsMap.editMultiMapsAndSyncMapsSetting,
            });


            //Button witch opens modal with individuel map-settings
            contentList = [];
            $.each(nsMap.msgAccordionList, function(index, options){
                if (!options.header.dontInclude){
                    if (contentList.length)
                        contentList.push('&nbsp;-&nbsp;');
                    contentList.push(options.header.smallText || options.header.text);
                }
            });

            list.push({
                id     : 'allMapSettings',
                content: createBigIconButton(
                             nsMap.mapSettingIcon,
                             {da:'Indstillinger for hvert kort', en:'Settings for each map'},
                             contentList
                         ),
                allowContent: true,
                class       : 'w-100 d-flex',
                onClick     : function(){
                    //If only one map is visible => edit its settings
                    if (nsMap.multiMaps.setup.maps == 1)
                        nsMap.editMapSetting(0);
                    else
                        editAllMapSettings();
                },
            });


            mapSettingMainModal = $.bsModal({
                noHorizontalPadding: true,
                header     : nsMap.mapSettingHeader,
                closeButton: true,
                helpId     : nsMap.setupOptions.topMenu.helpId.multiMapSetting,
                helpButton : true,
                content    : {
                    type          : 'buttongroup',
                    centerInParent: true,
                    list          : list
                }
            });
        }
        mapSettingMainModal.show();
    };

}(jQuery, L, this, document));