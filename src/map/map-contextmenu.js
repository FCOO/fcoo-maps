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
