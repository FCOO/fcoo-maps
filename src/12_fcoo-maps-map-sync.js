/****************************************************************************
fcoo-maps-map-sync
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
        nsMap.mapSync.enableShadowCursor( options.showShadowCursor );
        nsMap.mapSync.enableOutline( options.showOutline );

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

        this.options.mapSync.timeOffset = getOffset(options.timeOffset || '_0'); //MANGLER

        if (this.bsMapSyncInfoControl)
            this.bsMapSyncInfoControl.onChange();
    };


   /*********************************************************************
    L.Control.MapSyncControl = Hidden control used to update
    map-sync-options set by the map's SettingGroup
    *********************************************************************/
    L.Control.MapSyncControl = L.Control.extend({
        getState: function(){
            return this._map.options.mapSync ?
                {
                    enabled   : this._map.options.mapSync.enabled,
                    timeOffset: 'timeOffset_' + (this._map.options.mapSync.timeOffset || 0),
                    zoomOffset: 'zoomOffset_' + this._map.options.mapSync.zoomOffset

                } : {};
        },
        setState: function(options){
            this._map._setMapSyncOptions( options );
        }
    });

    /*********************************************************************
    L.Control.BsMapSyncInfoControl = Modal control with info on current sync-status
    *********************************************************************/
    L.Control.BsMapSyncInfoControl = L.Control.BsButtonBox.extend({
        options: {
            position       : "topcenter",
            small          : window.bsIsTouch,
            tooltipOnButton: true,
            width          : 'auto',
            content : {
                semiTransparent: true,
                clickable      : true,
                noHeader       : true,
                useTouchSize   : false,
                small          : true,
                content        : 'This is not empty',
            },
        },

        initialize: function(options){
            var msgHeader = nsMap.msgHeader[nsMap.msgSync];

            options = options || {};
            options.popupList = options.isMainMap ? [] : [{
                type        : 'button',
                icon        : msgHeader.icon,
                text        : msgHeader.smallText,
                onClick     : $.proxy(this.editSetting, this),
                closeOnClick: true,
                lineAfter   : true
            }];
            //Add links to settings for timezone and date & time-format
            $.each(['TIMEZONECHANGED','DATETIMEFORMATCHANGED'], function(index, id){
                var accOptions = ns.globalSettingAccordion(id);
                options.popupList.push({
                    type     : 'button',
                    icon     : accOptions.header.icon,
                    text     : accOptions.header.text,
                    onClick  : function(){ ns.globalSetting.edit(id); },
                    closeOnClick: true,
                });
            });
            L.Control.BsButtonBox.prototype.initialize.call(this, options);
        },

        onAdd: function(map){
            this._map = map;
            var isMainMap = this.options.isMainMap,
                isSecondaryMap = !isMainMap,
                result = L.Control.BsButtonBox.prototype.onAdd.call(this, map),
                $contentContainer = this.$contentContainer.bsModal.$body;

            if (isSecondaryMap)
                this.bsButton.removeClass('square');
            this.$container.css('cursor', 'default'); //Why do I need to do this?

            //Append time-icon and sync-icon to both button and content
            $contentContainer.empty()._bsAddHtml(
                isMainMap ? [
                    {icon: 'fa-clock', text:'12:00 am(+1)', textClass: 'current-time'}
                ] : [
                    {icon: 'fa-clock', text:'+24t', textClass: 'time-sync-info-text'},
                    {text:'12:00 am(+1)', textClass: 'current-time'},
                    {icon: 'fa-sync'}
                ]
            );
            this.bsButton
                .empty()
                .addClass('show-as-normal') //To allow the button to be 'normal' when disabled
                ._bsAddHtml(
                    isMainMap ? [
                        {icon: 'fa-clock fa-lg'}
                    ] : [
                        {icon: 'fa-clock', text:'not empty', textClass: 'time-sync-info-text'},
                        {icon: 'fa-sync'}
                    ]
                );

            this.timeSyncList = this.$container.find('span.time-sync-info-text');

            this.$currentTime = $contentContainer.find('span.current-time');
            if (isSecondaryMap)
                this.$currentTime.css({
                    'border-left' : '1px solid gray',
                    'padding-left': '.35em'
                });
            this.$currentTime.vfFormat('time_now_sup');

            this.syncIconList = this.$container.find('i.fa-sync');
            this.syncIconList.css({
                'border-left' : '1px solid gray',
                'padding-left': '.35em'
            });
            return result;
        },

        editSetting: function(){
            nsMap.editMapSetting( this._map.fcooMapIndex, {msgIndex: nsMap.msgSync} );
        },

        onChange: function(/*options*/){
            if (!this.options.isMainMap){
                var syncOptions = this._map.options.mapSync || {};

                this.bsButton.toggleClass('disabled', !this.options.show);

                //If timeOffset != 0 and the BsMapSyncInfoControl is hidden it is forced to be displayed to allways see the time-offset
                var forcedShown = !this.options.show && (syncOptions.timeOffset != 0);
                this.$container.toggleClass('forced-shown', forcedShown);
                if (forcedShown)
                    this.disable();
                else
                    this.enable();

                //Update sync time (relative time)
                this.timeSyncList.empty().hide();
                if (syncOptions.timeOffset != 0){
                    var text = (syncOptions.timeOffset > 0 ? '+' : '') + syncOptions.timeOffset;
                    this.timeSyncList.i18n({da: text+'t', en: text+'h'}, 'html').show();
                }
                //Update sync-icon ('blue' when sync is selected)
                this.syncIconList.toggleClass('icon-active', !!syncOptions.enabled);
            }

            //Update current time of the map
            this._map._updateTime();
        },
    });

    L.Map.mergeOptions({
        mapSyncControl: false
    });

    L.Map.addInitHook(function () {
        if (this.options.mapSyncControl) {
            this.mapSyncControl = new L.Control.MapSyncControl();
            this.mapSyncControl._map = this;

            this.bsMapSyncInfoControl = new L.Control.BsMapSyncInfoControl();
            this.addControl(this.bsMapSyncInfoControl);
        }
    });

    /*********************************************************************
    mapSettingGroup_mapSyncOptions
    Return the options used in mapSetting regarding mapSync
    *********************************************************************/
    nsMap.mapSettingGroup_mapSyncOptions = function(header){
        var content = [];

        if (nsMap.setupData.multiMaps.allowDifferentTime){
            //Select with zoom-offset
            var timeItems = [];
            $.each([-24,-12,-6,-3,-2,-1,0,1,2,3,6,12,24], function(index, offset){
                var text = (offset > 0 ? ' + ' : ' - ') + Math.abs(offset),
                    isOneHour = (Math.abs(offset) == 1);
                if (offset)
                    text = {da: 'Hovedkort' + text + (isOneHour ? ' time' : ' timer'), en: 'Main map' + text + (isOneHour ? ' hour' : ' hours')};
                else
                    text = {da: 'Samme som hovedkort', en:'Same as main map'};

                timeItems.push({
                    id  : 'timeOffset_'+offset,
                    text: text
                });
            });
            content.push({
                id      : 'timeOffset',
                //label   : {da:'Tidsforskel ift. hovedkort', en:'Time different comp. to main map'},
                label   : {da:'Tidspunkt', en:'Time'},
                type    : 'select',
                items   : timeItems
            });
        }

        //Checkbox with "Sync with main map"
        content.push({
            id  :'enabled',
            text: {da:'Synk. position/zoom med hovedkort', en:'Sync. position/zoom with main map'},
            type: 'checkbox'
        });

        //Select with zoom-offset
        var zoomItems = [],
            maxZoomOffset = nsMap.setupData.multiMaps.maxZoomOffset;
        for (var zoomOffset = -1*maxZoomOffset; zoomOffset <= maxZoomOffset; zoomOffset++){
            var text = '';
            if (zoomOffset < 0)
                text = {da: Math.abs(zoomOffset) + ' x zoom ud', en: Math.abs(zoomOffset) + ' x zoom out'};
            else
                if (zoomOffset == 0)
                    text = {da: 'Samme som hovedkort', en:'Same as main map'};
                else
                    text = {da: zoomOffset+ ' x zoom ind', en: zoomOffset+ ' x zoom ind'};
            zoomItems.push( {id: 'zoomOffset_'+zoomOffset, text: text} );
        }
        content.push({
            id      : 'zoomOffset',
            label   : {da:'Zoom-niveau', en:'Zoom level'},
            type    : 'select',
            items   : zoomItems,
            showWhen: {"mapSyncControl_enabled": true}
        });
        content.push({
            type: 'textbox',
            icon: 'map-sync-zoom-offset',
            insideFormGroup: false
        });

        return {
            controlId   : 'mapSyncControl',
            accordionId : header.accordionId,
            id          : ['enabled', 'zoomOffset'],
            header      : header,
            modalContent: content,
            modalFooter : [
                {icon:'fas fa-square-full text-multi-maps-current', text:{da:':&nbsp;Dette kort', en:':&nbsp;This map'}},
                {text:'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'},
                {icon:'fa-square-full text-multi-maps-main', text:{da:':&nbsp;Hovedkort',  en:':&nbsp;Main map'}}
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
}(jQuery, L, this, document));
