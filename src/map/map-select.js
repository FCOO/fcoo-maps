/****************************************************************************
map-select

Objects and methods to handle to select maps
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /*********************************************************************
    selectMaps
    Show modal window with checkbox or radio for each map
    Select/unselect the layer in all visible maps
    options = {
        header,
        text,
        isSelected: function(mapOrMapIndex) return BOOLEAN
        select    : function(mapOrMapIndex)
        unselect  : function(mapOrMapIndex)

        singleMapAction: 'toggle', 'select' or 'unselect'
        showAsRadio    : BOOLEAN, true => show checkbox as radio
        currentMap     : map or mapIndex for map to be highlighted
    }
    *********************************************************************/
    nsMap.selectMaps = function( options ){
        let o = $.extend(true, {
                    text      : {da:'Vis på alle synlige kort', en:'Show on all visible maps'},
                    modalWidth: 240,
                }, options);

        //If only one map is vissible => simple toggle or select or unselect
        if (!nsMap.hasMultiMaps || (nsMap.multiMaps.setup.maps == 1)){
            if (o.singleMapAction)
                switch (o.singleMapAction.toLowerCase()){
                    case 'toggle'  :  o.isSelected(0) ? o.unselect(0) : o.select(0); break;
                    case 'select'  :  o.select(0); break;
                    case 'unselect':  o.unselect(0); break;
                }
            return;
        }

        let currentMapIndex = o.currentMap && o.currentMap instanceof L.Map ? o.currentMap.fcooMapIndex : null,
            maxMaps         = nsMap.setupOptions.multiMaps.maxMaps,
            checkboxType    = o.showAsRadio ? 'radio' : 'checkbox',
            selectedOnMap  = [],
            buttonList     = [],

            $checkbox = $.bsCheckbox({
                text    : o.text,
                type    : checkboxType,
                onChange: function(id, selected){
                    $.each(buttonList, (index, $button) => {
                        selectedOnMap[index] = selected;
                        $button._cbxSet(selected, true);
                    });
                    updateCheckbox();
                }
            });

        //Get current selected state from all maps
        for (var mapIndex=0; mapIndex<maxMaps; mapIndex++)
            selectedOnMap[mapIndex] = o.isSelected(mapIndex);

        //updateCheckbox: Update common checkbox when single map is selected/unselected
        function updateCheckbox(){
            var allSelected = true, semiSelected = false;
            $.each(buttonList, (index/*, button*/) => {
                if (!selectedOnMap[index])
                    allSelected = false;
                if (selectedOnMap[index] != selectedOnMap[0])
                    semiSelected = true;
            });

            $checkbox.find('input')
                ._cbxSet(allSelected || semiSelected, true)
                .prop('checked', allSelected || semiSelected)
                .toggleClass('semi-selected', semiSelected);
        }

        //miniMapContent: Create content with checkbox inside each map-frame
        function miniMapContent($contentContainer){
            let $div = $('<div/>')
                    .windowRatio(1.2*120, 1.2*180)
                    .addClass('mx-auto')
                    .css('margin', '5px')
                    .appendTo($contentContainer);

            //Append a mini-multi-map to the container
            L.multiMaps($div, {
                id    : nsMap.multiMaps.setup.id,
                local : true,
                border: false,
                update: function( index, map, $container ){
                    $container.empty();

                    //Create checkbox- or radio-button inside the mini-map
                    buttonList[index] =
                        $.bsStandardCheckboxButton({
                            square  : true,
                            selected: selectedOnMap[index],
                            class   : index === currentMapIndex ? 'active' : '',
                            type    : checkboxType,
                            onChange: function(id, selected){
                                selectedOnMap[index] = selected;
                                updateCheckbox();
                            }
                        })
                        .addClass('font-size-1-2rem w-100 h-100 ' + (index ? '' : 'border-multi-maps-main'))
                        .appendTo( $container );
                }
            });
        }

        var mapLayerModalForm = $.bsModalForm({
                width     : o.modalWidth,
                header    : o.header,
                static    : false,
                keyboard  : true,
                closeWithoutWarning: true,
                remove    : true,

                content   : [$checkbox, miniMapContent],
                onSubmit  : () => nsMap.visitAllVisibleMaps( (map) => selectedOnMap[map.fcooMapIndex] ? o.select(map) : o.unselect(map) )
            });

        updateCheckbox();
        mapLayerModalForm.edit({});
    };


}(jQuery, L, this, document));
