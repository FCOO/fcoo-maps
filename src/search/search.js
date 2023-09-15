/****************************************************************************
search.js
****************************************************************************/
(function ($, L, i18next, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /*************************************************************************
    **************************************************************************
    search( text )
    **************************************************************************
    *************************************************************************/
    var searchText             = '',
        selectedSearchResultId = '',
        searchLang             = '', //The language selected during last search
        minSearchLength        = 3;

    //showSearchResultInMap = The map where a SearchResult or list of SearchResults are shown
    ns.showSearchResultInMap = null;


    //Option polygon_threshold = Return a simplified version of the output geometry.
    //The parameter is the tolerance in degrees with which the geometry may differ from the original geometry.
    //Topology is preserved in the result. (Default: 0.0)
    ns.osm_polygon_threshold = 0.001;   //Reduce nr of pints in big polygons (eq. USA) by a factor 10!

    ns.events.on( ns.events.LANGUAGECHANGED, function(){
        searchText = '';
    });

    /* Just for test:
    var testList = [
            'Danmark',
            '55 12.001',
            'køln',
            //'xhil',
            'Hillerød',
            'usa'
        ];
    */
    nsMap.search = function( text, map ){
        /* TEST
        text = text || '12 12 - 12 12';
        text = text || "56° 28,619'N - 006° 05,055'E";
        text = text || 'Köln';
        text = text || '12 12.001';
        //*/
        /* Just for test
        if (testList.length)
            text = testList.pop();
        */

        //If no MayLayer to show search-results => No able to search
        if (!nsMap.searchResultMapLayer){
             $.bsNotyError({
                 da:'Lag med søgeresultater er ikke installeret',
                 en:'Layer with search results is not installed'
             });
            return;
        }

        var lang = ns.globalSetting.get('language');
        if (text === null){
            nsMap.showSearchModalForm(searchText, map);
            return;
        }
        text = (text || '').trim();

        //If text is same as last search => show same result!
        if ((text == searchText) && (searchLang == lang)){
            showSearchResultModal(searchResultList, map);
            return;
        }

        //If text to short => open modal to enter search
        if (text.length < minSearchLength){
            nsMap.showSearchModalForm(text, map);
            return;
        }

        //Set default map
        ns.showSearchResultInMap = map;

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
            showSearchResultModal(list, map);
        }
        else {
            //If no position was found => search in OpenStreetMap
            var params = {
                    'q'                : searchText,
                    'format'           : 'jsonv2',
                    'polygon_geojson'  : 1,
                    'polygon_threshold': ns.osm_polygon_threshold,
                    'extratags'        : 1,
                    'namedetails'      : 1,
                    'addressdetails'   : 1,
                    'accept-language'  : 'en',
                    'limit'            : 20,
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
        return showSearchResultModal(list, ns.showSearchResultInMap);
    }

    function nominatim_reject(){
        $.workingOff();
        window.notyError({
            da: 'Søgningen efter "'+searchText+'" mislykkedes<br>Prøv eventuelt igen senere',
            en: 'The search for "'+searchText+'" failed<br>Try again later',
        }, {textAlign: 'center'});
    }


    /*************************************************************************
    showSearchModalForm( text, map )
    *************************************************************************/
    var searchModalForm = null,
        searchHistoryList = new window.HistoryList({
            action: function( text ){
                if (searchModalForm)
                    searchModalForm.getInput('search').setValue(text);
            }
        });

    nsMap.showSearchModalForm = function( text, map ){
        ns.showSearchResultInMap = map;

        searchModalForm = searchModalForm || $.bsModalForm({
            header        : {icon: 'fa-search', text:{da:'Søg efter position eller lokation', en:'Search for Position or Location'}},
            static        : false,
            keyboard      : true,
            formValidation: true,
            content: {
                id         : 'search',
                type       : 'input',
                placeholder: {da:'Søg...', en:'Search..'},
                validators : ['required', {type: 'length', min: minSearchLength}]

            },
            closeWithoutWarning: true,
            historyList: searchHistoryList,
            submitIcon: 'fa-search',
            submitText: {da:'Søg', en:'Search'},
            onSubmit  : function(data){
                nsMap.search(data.search, ns.showSearchResultInMap);
            },
        });
        searchModalForm.edit({search: text});
        searchModalForm.getInput('search').$element.get(0).select();
    };


    /*************************************************************************
    showSearchResultModal( list, map )
    list = []{[icon,] text, [latLng,] [geoJSON]}
    Show modal with list of SearchResult
    *************************************************************************/
    ns.searchResultModal = null;

    var searchResultList = [],
        selectedSearchResultIndex = -1;


    /*************************************************************************
    getSearchResultMap
    Find the map where a SearchResult is fit/centered on when selected.
    Use:
    1: Previous used map (if still showing search-results, or
    2: main-map if search-result are shown, or
    3: any visible map with search-result shown, or
    4: main-map
    *************************************************************************/
    nsMap.getSearchResultMap = function( map ){
        var result = map;
        if (!result){
            var mapLayer = nsMap.searchResultMapLayer;

            if (mapLayer){
                if (ns.showSearchResultInMap && mapLayer.isAddedToMap(ns.showSearchResultInMap) )
                    //1: Previous used map (if still showing search-results
                    result = ns.showSearchResultInMap;
                else
                    nsMap.visitAllVisibleMaps( function( nextMap ){
                        //2: main-map if search-result are shown, or
                        //3: any visible map with search-result shown
                        if (!result && mapLayer.isAddedToMap( nextMap ) )
                            result = nextMap;
                    });

                //4: main-map
                result = result || nsMap.mainMap;
            }
            else
                /* search-result-layer not installed */;
        }

        return result;
    };

    function showSearchResultModal( list, map ){
        searchResultList = list;

        map = nsMap.getSearchResultMap( map );

        //If only ONE result => show direct on map
        if (list.length == 1){
            var result = nsMap.searchResultMapLayer.add( list[0] );
            result.showOnMap( map );
            return result;
        }

        ns.showSearchResultInMap = map;
        var searchAgainButton = {
                type: 'button',
                icon: 'fa-search',
                text: {da:'Søg igen', en:'New Search'},
                onClick: function(){
                    if (ns.searchResultModal)
                        ns.searchResultModal.close();
                    nsMap.showSearchModalForm(searchText, ns.showSearchResultInMap);
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
            selectlistItems.push( searchResult.listContent(index) );
        });

        if (selectlistItems.length){
            var onClick = function(){
                    ns.searchResultModal.close();
                    nsMap.searchResultMapLayer
                        .add( searchResultList[selectedSearchResultIndex] )
                        .showOnMap( ns.showSearchResultInMap );
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
                            onClick: function(){ searchResultList[selectedSearchResultIndex].showDetails( ns.showSearchResultInMap ); }
                        }, {
                            icon   : 'fa-location-plus',
                            text   : {da:'Vis på kort', en:'Show on map'},
                            onClick: onClick
                        }
                    ],
                    footer: {
                        text: {da:'Søgning efter positioner, byer, havområder og lign. - men ikke efter adresser', en:'Search for positions, cities, seas and the likes - but not for addresses'},
                        textClass: 'd-block text-wrap'
                    }
                };
            ns.searchResultModal = ns.searchResultModal ? ns.searchResultModal.update(options) : $.bsModal(options);

            ns.searchResultModal.bsModal.$buttons[1].toggle(inclDetails);

            ns.searchResultModal.show();
        }
        else {
            $.bsNoty({
                type     : 'alert',
                layout   : 'center',
                header   : {icon:'fa-search', text:{da:'Søg', en:'Search'}},
                text     : {da:'Søgning efter "'+searchText+'" gav ikke noget resultat', en:'Search for "'+searchText+'" gave no result'},
                buttons  : [searchAgainButton],
                closeWith: ['click', 'button'],
                timeout  : 4000,
                textAlign: 'center'
            });
        }

        return this;
    }

}(jQuery, L, this.i18next, this, document));