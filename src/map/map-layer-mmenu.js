/****************************************************************************
map-layer-mmenu

Objects and methods to show a modal with select of layer for one map
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    let ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    function map_reset(){
        $.each(nsMap.mapLayers, function(id, mapLayer){
            if (mapLayer.isAddedToMap(this))
                mapLayer.removeFrom(this);
        }.bind(this));
    }


    nsMap.selectLayerInModal = function( map ){
        let bsMenu = nsMap.main[nsMap.setupOptions.standardMenuId].mmenu;

        if (!bsMenu) return;

        let clonedBsMenu = bsMenu.clone({
			isFullClone: false,

            getState: function(menuItem){
                let mapLayer = nsMap.getMapLayer(menuItem.id);
                return mapLayer.isAddedToMap(this);
            }.bind(map),

            forceOnClick: function(id, state, menuItem){
                let mapLayer = nsMap.getMapLayer(menuItem.id);
                if (mapLayer){
                    if (mapLayer.isAddedToMap(this))
                        mapLayer.removeFrom(this);
                    else
                        mapLayer.addTo(this);
                }
            }.bind(map)
        });

        //Create fixed-content
        const miniMapDim  = 80;
        let $fixedContent = null;
        if (nsMap.hasMultiMaps && (nsMap.multiMaps.setup.maps > 1)){
            $fixedContent = $('<div></div>')
                                .windowRatio(miniMapDim, miniMapDim*2)
                                .addClass('mx-auto map-sync-zoom-offset') //map-sync-zoom-offset to have claasses for sub-maps
                                .css('margin', '5px');

            L.multiMaps($fixedContent, {
                local : true,
                border: true,
                update: function( index, map, $mapContainer ){
                    $mapContainer.toggleClass('current-map', this._multiMapsIndex == index);
                }.bind(map)
            }).set( nsMap.multiMaps.setup.id );
        }

        clonedBsMenu.showInModal({
            header: {
                icon: 'fa-layer-group',
                text: {da:'Vælg lag', en:'Select layers'},
            },
			show              : false,
			minHeight         : 300,
			sameWidthAsCloneOf: true,
            fixedContent      : $fixedContent,
            buttons: [{
                icon    : ns.icons.reset,
                text    : ns.texts.reset,
                onClick : map_reset.bind(map)
            }]
        });

        //Destroy the cloned menu on close + show it!
        clonedBsMenu.bsModal
            .on({'hidden.bs.modal': () => clonedBsMenu.destroy()})
            .show();
    };

}(jQuery, L, this, document));
