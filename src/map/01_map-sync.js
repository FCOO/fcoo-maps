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

            //Create zoom-mode-icon
            let outerIcon = 'fa-square-full', 
                innerIcon = '';
            switch (Math.abs(zoomOffset)){
                case 0:  innerIcon = outerIcon; break;
                case 1:  innerIcon = 'fa-square fa-1xzoom'; break;
                case 2:  innerIcon = 'fa-square-small fa-2xzoom'; break;
            }                

            if (zoomOffset < 0){
                outerIcon = 'fas text-multi-maps-current '  + outerIcon;
                innerIcon = 'far text-multi-maps-main '     + innerIcon;                
            }
            else {
                outerIcon = 'far text-multi-maps-main '     + outerIcon;
                innerIcon = 'fas text-multi-maps-current  ' + innerIcon;                
            }
                
            zoomItems.push({
                id: 'zoomOffset_'+zoomOffset, 
                icon: [[
                    zoomOffset ? outerIcon : innerIcon, 
                    zoomOffset ? innerIcon : outerIcon
                ]],
                text: text
            });
        }
        
        let showWhen = {};
        showWhen[controlId + (controlId?'_':'')+'enabled'+idPostfix] = true;
        content.push({
            id       : 'zoomOffset'+idPostfix,
            label    : {da:'Zoom-niveau', en:'Zoom level'},
            type     : 'selectbutton',
            fullWidth: true,            
            items    : zoomItems,
            showWhen : showWhen
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
