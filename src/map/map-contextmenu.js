/****************************************************************************
map-contextmenu.js

Global context-menu for all maps

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


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
            _width : 180,
            closeOnClick: false,

            onClick: function(id, latLng, $button, map){
                if (map)
                    map.setView(latLng, map.getZoom(), map._mapSync_NO_ANIMATION);
            },

        }];




    map_contextmenu_itemList.push({
        //Map-setting
        icon      : nsMap.mapSettingHeader.icon,
        text      : nsMap.mapSettingHeader.text,
        lineBefore: true,
        width     : '10em',
        onClick: function(id, latlng, $button, map){
            if (map)
                nsMap.editMapSetting(map.fcooMapIndex);
        }
    });


    L.Map.addInitHook(function () {
        //If the map has a BsPositionControl with contextmenu or a options.MANGLER = true
        if ( (this.options.bsPositionOptions && this.options.bsPositionOptions.inclContextmenu) || (this.options.MANGLER) ){
            this.setContextmenuHeader( map_contextmenu_header  );
            this.addContextmenuItems( map_contextmenu_itemList);
        }
    });
}(jQuery, L, this, document));
