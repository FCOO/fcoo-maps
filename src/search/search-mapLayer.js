/****************************************************************************
search-mapLayer.js
****************************************************************************/
(function ($, L, i18next, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    var selectedSearchResultList = [],       //List of current selected SearchResult
        selectedSearchResult = null; //Current selected SearchResult in selectedSearchResultList

    /***********************************************************
    Add MapLayer_SearchResult to createMapLayer
    ***********************************************************/
    var id = "SEARCH-RESULT",
        header = {
            icon: L.bsMarkerAsIcon('search-result'),
            text: {da: 'Søgeresultater', en: 'Search Results'}
        };

    nsMap.createMapLayer[id] = function(options, addMenu){
        nsMap.searchResultMapLayer =
            nsMap._addMapLayer(id, MapLayer_SearchResult, {
                icon: header.icon,
                text: header.text,
                legendOptions: {}
            });


        addMenu( nsMap.searchResultMapLayer.menuItemOptions() );
    };


    /***********************************************************
    ************************************************************
    MapLayer_SearchResult
    MapLayer for showing search results
    ************************************************************
    ***********************************************************/
    var searchResultIndex = 0;
    var MapLayer_SearchResult = function(options = {}) {

        options.legendOptions = {
            buttonList : this.buttonList(),
        };
        options.menuOptions = {
            useLegendButtonList: true
        };

        nsMap.MapLayer.call(this, options);

        this.searchResults    = {}; //{ID: SearchResult} shown on the maps
        this.numberOfSearchResults = 0;
    };

    MapLayer_SearchResult.prototype = Object.create(nsMap.MapLayer.prototype);
    MapLayer_SearchResult.prototype = $.extend({}, nsMap.MapLayer.prototype, {

        /*****************************************************
        searchButton and buttonList = ´Buttons for legend, menu etc.
        *****************************************************/
        _searchButton_onClick: function(){
            if (this.searchResultListModal)
                this.searchResultListModal.close();
            nsMap.showSearchModalForm('', ns.showSearchResultInMap );
        },

        searchButton: function(){
            return {
                type   : 'button',
                icon   : 'fa-search',
                class  : 'min-width',
                text   : {da:'Søg', en:'Search'},
                onClick: this._searchButton_onClick,
                context: this
            };
        },

        buttonList: function(){
            var _this = this;
            return [
                {icon: 'fa-th-list',   text: {da: 'Alle',  en: 'All'},     class: 'min-width', onClick: _this._showList,  context: _this, lineBefore: true},
                {icon: 'fa-trash-alt', text: {da: 'Fjern', en: 'Remove' }, class: 'min-width', onClick: _this.removeAll,  context: _this},
                this.searchButton()
            ];
        },

        /*****************************************************
        createLayer
        *****************************************************/
        createLayer: function(layerOptions, map){
            var layerGroup = L.layerGroup({/*pane: 'MANGLER - TODO'*/});

            //Add contextmenu with items to show and remove all items
            layerGroup.setContextmenuHeader(header);
            layerGroup.addContextmenuItems(this.buttonList());

            //Add all searchResult to the new layerGroup
            $.each(this.searchResults, function(id, searchResult){
                searchResult.addTo(layerGroup, map);
            });

            return layerGroup;
        },

        /*************************************************************************
        add( searchResult )
        Maintain a list of SearchResult viewed on the maps
        *************************************************************************/
        add: function( searchResult ){
            var id = searchResult.id;
            if (this.searchResults[id])
                //Allready shown on the maps => use the saved version
                searchResult = this.searchResults[id];
            else {
                this.searchResults[id] = searchResult;
                searchResult.index = searchResultIndex++;

                searchResult.mapLayer = this;

                //Add marker and poly (if any) of the searchResult to the maps
                this.visitAllLayers( function(layerGroup){
                    if (layerGroup)
                        searchResult.addTo(layerGroup, layerGroup._map);
                });

                this.numberOfSearchResults++;

                this._saveSetting();
            }
            return searchResult;
        },

        /*************************************************************************
        remove
        *************************************************************************/
        remove: function( searchResult, dontSaveSetting ){
            //Remove the marker and poly from all maps
            this.visitAllLayers( function(layerGroup){
                if (layerGroup)
                    searchResult.removeFrom(layerGroup._map);
            });

            delete this.searchResults[searchResult.id];

            this.numberOfSearchResults--;

            if (!dontSaveSetting)
                this._saveSetting();
        },

        /*************************************************************************
        removeAll - Remove all search results
        *************************************************************************/
        removeAll: function(){
            if (this.numberOfSearchResults)
                window.notyConfirm({
                    type: 'warning',
                    text: {
                        da: nsMap.hasMultiMaps ? 'Fjern alle søgeresultater i alle kort' : 'Fjern alle søgeresultater',
                        en: nsMap.hasMultiMaps ? 'Remove all search results in all maps' : 'Remove all search results'
                    },
                    onOk: this._removeAll.bind(this)
                });
            else
                this._noSearchResult();
        },

        _removeAll: function(){
            var _this = this;
            $.each(this.searchResults, function(id, searchResult){
                _this.remove( searchResult, true );
            });

            this._saveSetting();
        },

        /*************************************************************************
        applyCommonSetting
        *************************************************************************/
        applyCommonSetting: function(list = []){
            if (this.isApplingCommonSetting || !list)
                return;

            this.isApplingCommonSetting = true;

            this.settingList = list;

            //Create list of 'dummy' SearchResult to past on to ns.getNominatimLookupUrl. Only include not already added SearchResults
            var nominatimList = [],
                _this = this;
            list.forEach( function( opt ){
                if (!opt.isPosition && !_this.searchResults['_'+opt.osm_id])
                    nominatimList.push({
                        options: $.extend(true, {}, opt)
                    });
            });

            if (nominatimList.length)
                Promise.getJSON(
                    ns.getNominatimLookupUrl(nominatimList, true), {},
                    this._nominatim_response.bind(this),
                    this._nominatim_reject.bind(this)
                );
            else
                this._nominatim_response([]);
        },

        _nominatim_response: function(list = []){
            //Create and add all new SearchResult from this.settingList with new options from list (if not a position)
            var _this = this;

            //Add all saved SearchResults
            this.settingList.forEach( function(opt){
                //If it alresdy exists => Do nothing
                if (_this.searchResults[opt.id])
                    return;

                var newSearchResultOptions = opt;

                //Find new options in list (for non-position)
                if (!opt.isPosition)
                    list.forEach( function( osmOptions ){
                        if (opt.osm_id == osmOptions.osm_id)
                            newSearchResultOptions = osmOptions;
                    });

                //Add The new saved SearchResult
                _this.add( new nsMap.SearchResult( newSearchResultOptions ) );

            });

            this.isApplingCommonSetting = false;
            return this;
        },

        _nominatim_reject: function(){
            this.isApplingCommonSetting = false;

            window.notyError({
                da: 'Indlæsning af tidligere søgeresultater mislykkedes desværre',
                en: 'The request for previous search results failed',
            }, {textAlign: 'center'});
        },


        /*************************************************************************
        saveCommonSetting
        *************************************************************************/
        saveCommonSetting: function(){
            var list = [];
            this.getList(true).forEach( function(searchResult){
                list.push(searchResult.saveOptions);
            });
            return list;
        },


        /*************************************************************************
        _noSearchResult - Modal with info-text when no SearchResult are selected
        *************************************************************************/
        _noSearchResult: function(){
            $.bsNoty({
                type     : 'alert',
                layout   : 'center',
                header   : {icon: 'fa-search', text:{da:'Søg', en:'Search'}},
                text     : {da:'Ingen søgeresultater er vist', en:'No search result are shown'},
                buttons  : [this.searchButton()],
                closeWith: ['click', 'button'],
                textAlign: 'center'
            });
            return this;

        },


        /*************************************************************************
        getList
        Return an array of shown SearcResult(s)
        *************************************************************************/
        getList: function( reverse ){
            var result = [];

            $.each(this.searchResults, function(id, searchResult){
                result.push(searchResult);
            });
            result.sort(
                reverse ?
                    function( sr1, sr2 ){ return sr1.index - sr2.index; } :
                    function( sr1, sr2 ){ return sr2.index - sr1.index; }
            );
            return result;
        },


        /*************************************************************************
        showList
        Show a modal with all the visible searchResults
        *************************************************************************/
        _showList: function(id, latlng, $button, map){
            this.showList( map );
        },

        showList: function( map, noError ){
            ns.showSearchResultInMap = map;


            if (!this.numberOfSearchResults){
                //Error on no searchResults on maps
                if (!noError)
                    this._noSearchResult();
                return;
            }

            //Move all searchResults into a array and sort them by index
            var searchResultListModal = null;
            selectedSearchResult = null;
            selectedSearchResultList = this.getList();

            var _this = this;


            //buttons = generel list for SearchResult = nsMap.searchResultButtonList
            var buttonList = [];
            nsMap.searchResultButtonList.forEach( function( options ){
                buttonList.push( $.extend(true, {}, options ) );
            });


            //*****************************************************
            function onClick(id){
                var buttonIndex = parseInt(id.split('_')[1]),
                    buttonOptions = buttonList[buttonIndex],
                    methodName = buttonOptions.method.split('_')[1]; //Method-name without '_' = method(map)

                if (buttonOptions.closeOnClick || buttonOptions.reloadOnClick)
                    searchResultListModal.close();

                selectedSearchResult[methodName]( ns.showSearchResultInMap );

                if (buttonOptions.reloadOnClick)
                    _this.showList( ns.showSearchResultInMap, true );
            }
            //*****************************************************


            buttonList.forEach( function( buttonOptions, index ){
                buttonOptions.id = 'item_'+ index;
                buttonOptions.title = buttonOptions.text;
                buttonOptions.text = null;
                buttonOptions.square = true;

                buttonOptions.onClick = onClick;

            });
            buttonList.push(this.searchButton());

            //Create options for modal with list of shown searchResults
            var contentList = [];
            $.each(selectedSearchResultList, function(index, searchResult){
                selectedSearchResult = selectedSearchResult || searchResult;
                contentList.push( searchResult.listContent( index ) );
            });

            //*****************************************************
            //Updates the enabled/disabled of the buttons related to the current selected SearchResult
            function update(){
                var $buttonContainer = searchResultListModal.bsModal.$buttonContainer,
                    buttonList = selectedSearchResult._getButtonList(true);

                buttonList.forEach( function( options ){
                    $buttonContainer.find('.'+options.className).toggleClass('disabled', !options.include);
                });
            }
            //*****************************************************

            var modalOptions = {
                    header   : {icon: 'fa-search', text:{da:'Søgeresultater', en:'Search Results'}},
                    static   : false,
                    keyboard : true,
                    flexWidth: true,
                    closeButton: false,
                    content : {
                        type    : 'selectlist',
                        list    : contentList,
                        onChange: function(id){
                            var index = parseInt(id.split('_')[1]);
                            selectedSearchResult = selectedSearchResultList[index];
                            update();
                        }
                    },
                    buttons: buttonList
                };

            searchResultListModal = this.searchResultListModal = this.searchResultListModal ? this.searchResultListModal.update(modalOptions) : $.bsModal(modalOptions);

            this.searchResultListModal.show();

            update();

        }

    });



}(jQuery, L, this.i18next, this, document));