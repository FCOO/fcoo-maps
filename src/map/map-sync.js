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

        if (this.bsTimeInfoControl)
            this.bsTimeInfoControl.onChange();
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
