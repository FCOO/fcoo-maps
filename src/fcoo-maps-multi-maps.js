/****************************************************************************
fcoo-maps-multi-maps
Objects and methods to handle multi maps and map sync
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
	"use strict";

    window.fcoo = window.fcoo || {};
    var ns = window.fcoo.map = window.fcoo.map || {},
        mapSyncIcon = ns.mapIcon('fa-sync');

    /*********************************************************************
    Map.onShowInMultiMaps, Map.onHideInMultiMaps
    Called when a map is visible/hidden in multi-maps.
    When the map is hidden:
        - Temporary disable map-sync
    *********************************************************************/
    L.Map.prototype.onShowInMultiMaps = function(){
        if (this.options.mapSync.save_enabled && !this.options.mapSync.enabled)
            ns.mapSync.enable(this);
    };

    L.Map.prototype.onHideInMultiMaps = function(){
        this.options.mapSync.save_enabled = this.options.mapSync.enabled;
        if (this.options.mapSync.enabled)
            ns.mapSync.disable(this);
    };

    /*********************************************************************
    setSyncMapOptions - Update the options for sync-maps incl bsPositionControl
    *********************************************************************/
    ns.setSyncMapOptions = function( options ){
        ns.mapSync.enableShadowCursor( options.showShadowCursor );
        ns.mapSync.enableOutline( options.showOutline );

        //Update multi-maps in bsPositionControl (if any)
        var mainMap = ns.mapSync.mainMap;
        if (mainMap.bsPositionControl)
            $.each(ns.multiMaps.mapList, function(id, map){
                if (map != mainMap){
                    if (options.showShadowCursor)
                        mainMap.bsPositionControl.addOther(map, true);
                    else
                        mainMap.bsPositionControl.removeOther(map);
                }
            });
    };

    /*********************************************************************
    editMultiAndSyncMapOptions - Create and display a modal window to select number of maps
    *********************************************************************/
    var multiMapsModalForm = null,
        $currentMapStructureIcon = null; //$-element with the current map-structure as icon

    function getMultiMapId( data ){
        return data[data.maps];
    }

    function updateCurrentMapStructureIcon(data){
        data =  data || multiMapsModalForm.getValues();
        $currentMapStructureIcon
            .removeClass()
            .addClass('far famm-'+getMultiMapId(data));
    }

    ns.editMultiAndSyncMapOptions = function(){
        if (!multiMapsModalForm){
            var list    = [],
                maxMaps = 0;

            //Find max number of maps
            $.each(ns.multiMaps.setupList, function(index, options){ maxMaps = Math.max(maxMaps, options.maps); });

            for (var i=1; i<=maxMaps; i++)
                list.push({id:'maps_'+i, text: ''+i});

            var content = [{
                    //Radio-group with nr of maps
                    id       :'maps',
                    label    : {da:'Antal kort', en:'Number of maps'},
                    fullWidth: true,
                    type     : 'radiobuttongroup',
                    list     : list,
                }];

            //Add radio-button-group - each for every nr of maps
            for (var maps=1; maps<=maxMaps; maps++){
                list = [];
                $.each( ns.multiMaps.setupList, function(index, options){
                    if (options.maps == maps)
                        list.push({id: options.id, icon: 'famm-'+options.id });
                });

                content.push({
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

            //Create content to display the selected map-structure. icon="current-map-structure-icon" is used to be able to find the element
            content.push({
                type: 'text',
                icon: 'current-map-structure-icon',
                insideFormGroup: false,
            });

            //checkbox for displaying the shadow cursor or map center-marker on all maps
            if (window.fcoo.modernizr.mouse)
                content.push({
                    id        :'showShadowCursor',
                    type      : 'checkbox',
                    lineBefore: true,
                    text      : {da:'Vis cursor på alle kort', en:'Show cursor on all maps'},
                    hideWhen  : {maps: 'maps_1'}
                });

            //checkbox for displaying the shadow cursor on all maps
            content.push({
                id        :'showOutline',
                type      : 'checkbox',
                lineBefore: !window.fcoo.modernizr.mouse,
                text      : {da:'Vis omrids, når et kort trækkes', en:'Show outline when dragging'},
                hideWhen  : {maps: 'maps_1'}
            });



            multiMapsModalForm = $.bsModalForm({
                header  : {da:'Antal kort', en:'Number of maps'},
                static  : false,
                keyboard: true,
                content : content,
                footer  : [{da:'Klik på', en:'Click on'}, {icon: mapSyncIcon}, {da:'&nbsp;i kortet for at sætte synkronisering', en:'&nbsp;in the map to set synchronization'}],
                onChanging: updateCurrentMapStructureIcon,
                onSubmit: function(data){
                    ns.multiMaps.set( getMultiMapId(data) );
                    ns.setSyncMapOptions(data);
                },
                closeWithoutWarning: true
            });

            $currentMapStructureIcon = multiMapsModalForm.$form.find('.current-map-structure-icon');
            $currentMapStructureIcon.parent().addClass('multi-maps-current');
        }

        var data = {
            maps            : 'maps_' + ns.multiMaps.setup.maps,
            showShadowCursor: ns.mapSync.options.showShadowCursor,
            showOutline     : ns.mapSync.options.showOutline
        };
        data[data.maps] = ns.multiMaps.options.id;

        updateCurrentMapStructureIcon( data );
        multiMapsModalForm.edit( data );
    };


    /*********************************************************************
    editSyncMapOptions - Create and display a modal window to select options for map-sync
    *********************************************************************/
    /*todo
        $.bsCheckboxButton({
//            text: [{da:'Uvalgt', en:'Unselected'}, {da:'Valgt', en:'Selected'}],
            text: {da:'Vælg mig', en:'Select me'},
            icon: ['fa-thumbs-down', 'fa-thumbs-up'],
            selected: false,
            onChange: function(id, selected){
                console.log('3: bsCheckboxButton',id,selected);
            }

    */
    L.Control.mapSyncControl = L.Control.BsButton.extend({
        options: {
            icon           : mapSyncIcon,
            semiTransparent: true,
            square         : true,
            position       : 'topleft',
        },
		onAdd: function (map) {
            this.options.onClick = $.proxy(editSyncMapOptions, map);
            return L.Control.BsButton.prototype.onAdd.call(this, map);
        }
    });

    function getZoomOffset(id){ return parseInt( id.split('_')[1] ); }

    L.Map.prototype._setMapSyncOptions = function( options ){
        var mapSync =  this._mapSync;

        options.enabled ? mapSync.enable(this) : mapSync.disable(this);
        if (options.enabled)
            mapSync.setZoomOffset( this, getZoomOffset(options.zoomOffset) );
    };

    var mapSyncModalForm,
        mapSyncModalForm_map,
        mapSyncModalForm_button,
        zoomOffsetMultiMaps,
        currentAndMainMapRatio;

    function updateMapSyncZoomOffset( offsetId ){
        var $mainInsideCurrent = zoomOffsetMultiMaps.$container.find('.current-map .outline'),
            $currentInsideMain = zoomOffsetMultiMaps.$container.find('.main-map .outline');

        if (offsetId === false){
            $mainInsideCurrent.hide();
            $currentInsideMain.hide();
            return;
        }

        var offset = $.isNumeric(offsetId) ? offsetId : getZoomOffset(offsetId),
            currentMapInMainMap = currentAndMainMapRatio * Math.pow(2, -offset),         //Dimention (percent) of current map inside main map
            mainMapIncurrentMap = 100*100/currentAndMainMapRatio * Math.pow(2,  offset), //Dimention (percent) of main map inside current map
            dim = Math.min(currentMapInMainMap, mainMapIncurrentMap),
            css = {width:dim+'%', height:dim+'%'};

        $mainInsideCurrent
            .css( css )
            .toggle( mainMapIncurrentMap < 100 );
        $currentInsideMain
            .css( css )
            .toggle( currentMapInMainMap < 100  );
    }

    function editSyncMapOptions(id, selected, $button){
        mapSyncModalForm_button = $button;

        if (!mapSyncModalForm){
            var content = [{
                    //Checkbx with "Sync with main map"
                    id  :'enabled',
                    text: {da:'Synkroniser med hovedkort', en:'Synchronize with main map'},
                    type: 'checkbox'
                }],
                items = [],
                maxZoomOffset = ns.setupData.multiMaps.maxZoomOffset;

            for (var zoomOffset = -1*maxZoomOffset; zoomOffset <= maxZoomOffset; zoomOffset++){
                var text = '';
                if (zoomOffset < 0)
                    text = {da: Math.abs(zoomOffset) + ' x zoom ud', en: Math.abs(zoomOffset) + ' x zoom out'};
                else
                    if (zoomOffset == 0)
                        text = {da: 'Samme som hovedkort', en:'Same as main map'};
                    else
                        text = {da: zoomOffset+ ' x zoom ind', en: zoomOffset+ ' x zoom ind'};

                items.push( {id: 'zoomOffset_'+zoomOffset, text: text} );
            }

            content.push({
                id      : 'zoomOffset',
                label   : {da:'Zoom-niveau', en:'Zoom level'},
                type    : 'select',
                items   : items,
                showWhen: {enabled: true}
            });
            content.push({
                type: 'text',
                icon: 'map-sync-zoom-offset',
                insideFormGroup: false
            });

            mapSyncModalForm = $.bsModalForm({
                header    : {icon: 'fa-sync', text:{da:'Synkronisering med hovedkort', en:'Synchronizing with main map'}},
                static    : false,
                keyboard  : true,
                content   : content,
                onChanging: function(data){
                    updateMapSyncZoomOffset(data.enabled ? data.zoomOffset : false);
                },
                onSubmit  : function(data){
                    mapSyncModalForm_button.toggleClass('active', !!data.enabled);
                    mapSyncModalForm_map._setMapSyncOptions(data);
                },
                closeWithoutWarning: true,

                footer: [
                    {icon:'fas fa-square-full text-multi-maps-current', text:{da:':&nbsp;Dette kort', en:':&nbsp;This map'}},
                    {text:'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'},
                    {icon:'fa-square-full text-multi-maps-main', text:{da:':&nbsp;Hovedkort',  en:':&nbsp;Main map'}}
                ]
            });

            //Create a mini-multi-maps to represent this and main-maps and there relative size
            var $container = mapSyncModalForm.$form.find('.map-sync-zoom-offset').parent();
            $container
                .removeClass()
                .empty()
                .windowRatio(120,160)
                .addClass('map-sync-zoom-offset');

            zoomOffsetMultiMaps = L.multiMaps($container, {
                id    : ns.multiMaps.options.id,
                update: function( index, map, $mapContainer ){
                    if ($mapContainer.find('.outline').length == 0)
                        $('<div/>')
                            .addClass('outline')
                            .appendTo($mapContainer);
                    if (mapSyncModalForm_map)
                        $mapContainer
                            .toggleClass('current-map', (mapSyncModalForm_map._multiMapsIndex == index))
                            .toggleClass('main-map',    (index == 0) );
                }
            });
        }


        //Show modal with sync-options

        //Reset main and current map in mini-multi-map
        zoomOffsetMultiMaps.$container.find('.current-map, .main-map').removeClass('current-map main-map');

        mapSyncModalForm_map = this;
        zoomOffsetMultiMaps.set(ns.multiMaps.options.id);
        zoomOffsetMultiMaps.updateSubMaps();

        //Calc height and width ratio of this / main-map
        var $thisContainer = $(this.getContainer()),
            $mainContainer = $(this._mapSync.mainMap.getContainer());

        currentAndMainMapRatio = Math.round( 100*$thisContainer.innerWidth() / $mainContainer.innerWidth() );

        updateMapSyncZoomOffset(this.options.mapSync.zoomOffset);
        mapSyncModalForm.edit({
            enabled   : this.options.mapSync.enabled,
            zoomOffset: 'zoomOffset_' + this.options.mapSync.zoomOffset
        });
    }

    /*********************************************************************
    Add button-control with sync-maps-options
    *********************************************************************/
    L.Map.mergeOptions({
        mapSyncControl: false,
        mapSyncOptions: {}
    });

    L.Map.addInitHook(function () {
        if (this.options.mapSyncControl) {
            this.mapSyncControl = new L.Control.mapSyncControl(this.options.mapSyncOptions);
            this.addControl(this.mapSyncControl);
        }
    });

}(jQuery, L, this, document));



