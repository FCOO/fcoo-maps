/****************************************************************************
search.js
****************************************************************************/
(function ($, L, i18next, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {},

        searchText             = '',
        selectedSearchResultId = '',
        searchLang             = '', //The language selected during last search
        minSearchLength        = 3;


    ns.events.on( ns.events.LANGUAGECHANGED, function(){
        searchText = '';
    });


    /*************************************************************************
    search( text )
    *************************************************************************/
var testList = ['Danmark', '55 12.001', 'Hillerød' ];

    nsMap.search = function( text ){
        /* TEST
        text = text || '12 12 - 12 12';
        text = text || "56° 28,619'N - 006° 05,055'E";
        text = text || 'Köln';
        text = text || '12 12.001';
        //*/
if (testList.length)
    text = testList.pop();

        var lang = ns.globalSetting.get('language');
        if (text === null){
            showSearchModalForm(searchText);
            return;
        }
        text = (text || '').trim();

        //If text is same as last search => show same result!
        if ((text == searchText) && (searchLang == lang)){
            showSearchResultModal(searchResultList);
            return;
        }

        //If text to short => open modal to enter search
        if (text.length < minSearchLength){
            showSearchModalForm(text);
            return;
        }

        //Save text and lang as last search
        searchText = text;
        searchLang = lang;

        //Add search to end of history-list
        searchHistoryList.goLast();
        searchHistoryList.add(text);

        //Update input in top-menu with latest search
        nsMap.main.topMenuObject.searchInput.val(searchText);

        //First: Search for position
        var latLngList = nsMap.text2LatLng(text);

        if (latLngList.length){
            var currentGroupHeaderId = null,
                list = [];
            $.each(latLngList, function(index, rec){
                if (rec.groupHeaderId !== currentGroupHeaderId)
                    currentGroupHeaderId = rec.groupHeaderId;
                list.push(
                    new nsMap.SearchResult({
                            latLng    : rec.latLng,
                            name      : rec.text,
                            type      : rec.groupHeader,
                            isPosition: true
                        })
                );
            });
            showSearchResultModal(list);
        }
        else {
            //If no position was found => search in OpenStreetMap
            var params = {
                    'q'               : searchText,
                    'format'          : 'jsonv2',
                    'polygon_geojson' : 1,
                    'extratags'       : 1,
                    'namedetails'     : 1,
                    'addressdetails'  : 1,
                    'accept-language' : 'en',
                    'limit'           : 20,
                };

            if (lang != 'en')
                params['accept-language'] = lang + ',en';
            $.workingOn();
            Promise.getJSON( nsMap.setupOptions.topMenu.nominatim + '/search' + L.Util.getParamString(params), {}, nominatim_response, nominatim_reject );
        }
    };

    function nominatim_response(json){
        $.workingOff();

        var list = [], noToInclude = 10;
        $.each(json, function(index, nominatim){
            var searchResult = new nsMap.SearchResult(nominatim);
            if (searchResult.options.include && noToInclude){
                noToInclude--;
                list.push(searchResult);
            }
        });
        showSearchResultModal(list);
    }

    function nominatim_reject(){
        $.workingOff();
        window.notyError({
            da: 'Søgningen efter "'+searchText+'" mislykkedes<br>Prøv eventuelt igen senere',
            en: 'The search for "'+searchText+'" failed<br>Try again later',
        }, {textAlign: 'center'});
    }


    /*************************************************************************
    showSearchModalForm( text )
    *************************************************************************/
    var searchModalForm = null,
        searchHistoryList = new window.HistoryList({
            action: function( text ){
                if (searchModalForm)
                    searchModalForm.getInput('search').setValue(text);
            }
        });

    function showSearchModalForm( text ){
        searchModalForm = searchModalForm || $.bsModalForm({
            header        : {icon: 'fa-search', text:{da:'Søg efter position eller lokation', en:'Search for Position or Location'}},
            static        : false,
            keyboard      : true,
            formValidation: true,
            content: {
                id         : 'search',
                type       : 'input',
                placeholder: {da:'Søg...', en:'Search..'},
                validators : [ {'stringLength': {min:minSearchLength, trim:true}}, 'notEmpty' ]
            },
            closeWithoutWarning: true,
            historyList: searchHistoryList,
            submitIcon: 'fa-search',
            submitText: {da:'Søg', en:'Search'},
            onSubmit  : function(data){ nsMap.search(data.search); },
        });
        searchModalForm.edit({search: text});
        searchModalForm.getInput('search').$element.get(0).select();
    }


    /*************************************************************************
    showSearchResultModal( list )
    list = []{[icon,] text, [latLng,] [geoJSON]}
    *************************************************************************/
    var searchResultModal = null,
        searchResultList = [],
        selectedSearchResultIndex = -1;

    function showSearchResultModal( list ){

        searchResultList = list;

        //If only ONE result => show direct on map
        if (list.length == 1){
            list[0].showOnMainMap();
            return;
        }

        var searchAgainButton = {
                type: 'button',
                icon: 'fa-search',
                text: {da:'Søg igen', en:'New Search'},
                onClick: function(){
                    if (searchResultModal)
                        searchResultModal.close();
                    showSearchModalForm(searchText);
                }
            },
            selectlistItems = [];

        //Create result-list
        selectedSearchResultIndex = 0;
        $.each(list, function(index, searchResult){
            if (searchResult.id == selectedSearchResultId)
                selectedSearchResultIndex = index;
        });
        var inclDetails = true;
        $.each(list, function(index, searchResult){
            if (searchResult.options.isPosition)
                inclDetails = false;
            selectlistItems.push(
                    searchResult.listContent({
                        id       : searchResult.options.latLng ? 'item_'+index : null,
                        selected : index == selectedSearchResultIndex,
                        textClass: 'text-wrap'
                    })
            );
        });

        if (selectlistItems.length){
            var onClick = function(){
                    searchResultModal.close();
                    searchResultList[selectedSearchResultIndex].showOnMainMap();
                },
                options = {
                    header   : {icon: 'fa-search', text:{da:'Søgeresultater', en:'Search Results'}},
                    static   : false,
                    keyboard : true,
                    flexWidth: true,
                    fixedContent: {
                        type : 'text',
                        label: {da:'Søgte efter', en:'Searched for'},
                        text : searchText,
                        after: searchAgainButton
                    },
                    content : {
                        type  : 'selectlist',
                        list  : selectlistItems,
                        onChange: function(id){
                            selectedSearchResultIndex = parseInt(id.split('_')[1]);
                            selectedSearchResultId = searchResultList[selectedSearchResultIndex].id;
                        },
                        onDblClick: onClick
                    },
                    buttons : [
                        {
                            icon   : 'fa-info-circle',
                            className: 'btn_search_result_detail',
                            text   : {da:'Detaljer', en:'Details'},
                            onClick: function(){ searchResultList[selectedSearchResultIndex].showDetails(); }
                        }, {
                            icon   : 'fa-map-marker',
                            text   : {da:'Vis på kort', en:'Show on map'},
                            onClick: onClick
                        }
                    ],
                    footer: {
                        text: {da:'Søgning efter positioner, byer, havområder og lign. - men ikke efter adresser', en:'Search for positions, cities, seas and the likes - but not for addresses'},
                        textClass: 'd-block text-wrap'
                    }
                };
            searchResultModal = searchResultModal ? searchResultModal.update(options) : $.bsModal(options);

            searchResultModal.bsModal.$buttons[1].toggle(inclDetails);

            searchResultModal.show();
        }
        else {
            $.bsNoty({
                type     : 'alert',
                layout   : 'center',
                header   : {icon:'fa-search', text:{da:'Søg', en:'Search'}},
                text     : {da:'Søgning after "'+searchText+'" gav ikke noget resultat', en:'Search for "'+searchText+'" gave no result'},
                buttons  : [searchAgainButton],
                closeWith: ['click', 'button'],
                timeout  : 4000,
                textAlign: 'center'
            });
        }
    }

}(jQuery, L, this.i18next, this, document));