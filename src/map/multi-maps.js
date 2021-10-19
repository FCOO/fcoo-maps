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

    ns.appSetting.add({
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
    editMultiMapsAndSyncMapsSetting
    Create and display a modal-form window to edit settings
    multi-maps, common settings for map-sync and for each of the visible maps
    *********************************************************************/
    var mapSettingModalForm    = null,
        mapSettingMiniMultiMap = null;

    nsMap.editMultiMapsAndSyncMapsSetting = function(){
        if (!mapSettingModalForm){
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
                id        :'showOutline',
                type      : 'checkbox',
                text      : {da:'Vis omrids, når et kort trækkes', en:'Show outline when dragging'},
                lineBefore: true,
                hideWhen  : {maps: 'maps_1'}
            });

            //checkbox for displaying the shadow cursor or map center-marker on all maps
            if (ns.modernizr.mouse)
                content.push({
                    id      :'showShadowCursor',
                    type    : 'checkbox',
                    text    : {da:'Vis cursor på alle kort', en:'Show cursor on all maps'},
                    hideWhen: {maps: 'maps_1'}
                });

            mapSettingModalForm = $.bsModalForm({
                header    : nsMap.mapSettingHeader,
                static    : false,
                keyboard  : true,
                content   : content,
                helpId    : nsMap.setupOptions.topMenu.helpId.multiMapSetting,
                helpButton: true,
                footer    : [{da:'Klik på', en:'Click on'}, {icon: nsMap.mapSettingIcon}, {da:'&nbsp;i kortet for at sætte synkronisering', en:'&nbsp;in the map to set synchronization'}],

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
        mapSettingModalForm.edit( data );
    };
}(jQuery, L, this, document));



