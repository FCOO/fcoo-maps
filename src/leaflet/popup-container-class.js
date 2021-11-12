/****************************************************************************
popup-container-class

A special feature that add classes to a popup's container if the popup's 'owner'
or any of its 'parent' layer has options._popupContainerClass

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    L.Map.mergeOptions({
        setPopupContainerClass: false
    });

    L.Map.addInitHook(function () {
        if (this.options.setPopupContainerClass)
            this.on('popupopen', setPopupContainerClass);
    });

    function setPopupContainerClass(event){
        var popup = event.popup,
            popupContainerClass = findOptions(popup, '_popupContainerClass');

        popup.$container.addClass(popupContainerClass);
    }

    //function findOptions( layer, optionsId )
    //Loop trough all 'parent' layers and return the first found
    //value of options[optionsId] (if any)
    function findOptions( layer, optionsId ){
        if (!layer)
            return '';

        if (layer.options && layer.options[optionsId])
            return layer.options[optionsId];

        var result = '';
        $.each(layer._parentLayerList, function(index, _layer){
            result = result || findOptions( _layer, optionsId );
        });

        //Special case when layer is a element on the map (Popup, Polygon etc.)
        $.each(['_source', '_parentPolyline'], function(index, id){
            result = result || findOptions( layer[id], optionsId );
        });

        return result;
    }

}(jQuery, L, this, document));
