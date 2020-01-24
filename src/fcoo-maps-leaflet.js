/****************************************************************************
fcoo-maps-leaflet
Objects and methods to handle leaflet-maps
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
	"use strict";

    window.fcoo = window.fcoo || {};
    var ns = window.fcoo.map = window.fcoo.map || {},
        multiMapsModalForm = null,
        $currentMapStructureIcon = null; //$-element with the current map-structure as icon

        function getMultiMapId( data ){
            return data[data.maps];
        }

        function updateCurrentMapStructureIcon(data){
            var id = getMultiMapId( data || multiMapsModalForm.getValues() );
            $currentMapStructureIcon
                .removeClass()
                .addClass('far famm-'+id);
        }

    /*********************************************************************
    selectMultiMaps - Create and display a modal window to select number of maps
    *********************************************************************/
    ns.selectMultiMaps = function(){
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

            //Create content to display the selected map-structure. icon="HERE_IT_IS" is used to be able to find the element
            content.push({
                type: 'text',
                icon: 'HERE_IT_IS',
                insideFormGroup: false,
            });

            multiMapsModalForm = $.bsModalForm({
                header  : {da:'Antal kort', en:'Number of maps'},
                static  : false,
                keyboard: true,
                content : content,
                onChanging: updateCurrentMapStructureIcon,
                onSubmit: function(data){ ns.multiMaps.set( getMultiMapId(data) ); },
                closeWithoutWarning: true
            });

            $currentMapStructureIcon = multiMapsModalForm.$form.find('.HERE_IT_IS');
            $currentMapStructureIcon.parent().addClass('multi-maps-current');
        }

        var data = {
                maps: 'maps_' + ns.multiMaps.setup.maps,
            };
        data[data.maps] = ns.multiMaps.options.id;

        updateCurrentMapStructureIcon();

        multiMapsModalForm.edit( data );
    };







}(jQuery, L, this, document));



