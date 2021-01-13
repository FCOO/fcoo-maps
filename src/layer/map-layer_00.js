/****************************************************************************
map-layer_00.js,

MapLayer represent a layer on the map with menu-item, legend-item, and
color-info in bsPositionControl plus the map-layer addable and removable
to/from multible maps

New MapLayers are created using nsMap._addMapLayer(id, Constructor, options)
options = {
    zIndex          : 0,        //Individuel z-index for the layer
    paneId          : '',       //If given use if to get z-index from fcoo.map.zIndex to use for pane (if createPane and/or createMarkerPane is true)
    createPane      : false,    //If true an individuel pane is created
    createMarkerPane: false,    //If true an individuel pane is created (incl. shadowPane)

    zIndex (*)          :
    deltaZIndex (*)     :
    minZoom (*)         :
    maxZoom (*)         :
    LayerConstructor (*):

    layerOptions    : {},       //Specific options for the Layer. Can include options marked (*)

    //colorInfo = options for showing info on the postion of the cursor/map center
    colorInfo: {
        icon     : STRING       //If the MapLayer also have a legend the icon from the legend is used
        text     : STRING       //If the MapLayer also have a legend the text from the legend is used
        onlyLand : BOOLEAN,     //Only show when cursor/map center is over land. Default = false
        onlyWater: BOOLEAN      //Only show when cursor/map center is over water/sea. Default = false
        show     : BOOLEAN      //Turn the update on/off. Default = true

        getColor : function(options)    //Return the color (hex) to use as background-color in the infoBox.
                                        //options = {colorRGBA, colorHex, latLng}
                                        //Default = return options.colorHex
                                        //Set to false if no background-color in the infoBox is needed
        allowTransparentColor: BOOLEAN  //If true getColor is also called on fully transparent colors

        getText : function(options)     //Return the content (STRING or {da:STRING, en:STRING} or {icon, text}) to be displayed in the infoBox.
                                        //options = {colorRGBA, colorHex, transparent, color (from getColor), latLng}
                                        //Default: return ""
    }
}




****************************************************************************/
(function ($, L, window, document, undefined) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {},

        defaultOptions = {
            zIndex          : 0,
            paneId          : '',
            createPane      : false,
            createMarkerPane: false,
            layerOptions    : {},
            colorInfo       : null,
        },

        defaultColorInfoOptions = {
            show: true,
            allowTransparentColor: false,
            getColor: function(  options  ){ return options.colorHex; },
            gettext : function(/*options*/){ return '';               },
        };

    function getMap(mapOrMapIndex){
        return mapOrMapIndex instanceof L.Map ? mapOrMapIndex : nsMap.mapIndex[mapOrMapIndex];
    }

    nsMap.getPaneName       = function(id){ return id.toUpperCase()+'Pane'; };
    nsMap.getMarkerPaneName = function(id){ return id.toUpperCase()+'MarkerPane'; };
    nsMap.getShadowPaneName = function(id){ return id.toUpperCase()+'ShadowPane'; };

    var maxLayerIndex = 0;

    /***********************************************************
    MapLayer
    ***********************************************************/
    function MapLayer(options) {
        this.options = $.extend(true, {}, defaultOptions, options || {});

        this.index = this.options.index || maxLayerIndex + 1;
        maxLayerIndex = Math.max(maxLayerIndex, this.index);

        this.id = this.options.id || 'layer'+this.index;

        this.info = []; //[] of {map, layer, legend, infoBox, colorInfoLayer, loading, timeout, updateColorInfoOnWorkingOff}

        this.showAndHideClasses = '';
        this.inversShowAndHideClasses = '';
        var minZoom = this.options.minZoom || this.options.layerOptions.minZoom || 0;
        if (minZoom){
            this.showAndHideClasses       = 'show-for-leaflet-zoom-'+minZoom+'-up';
            this.inversShowAndHideClasses = 'hide-for-leaflet-zoom-'+minZoom+'-up';
        }

        var maxZoom = this.options.maxZoom || this.options.layerOptions.maxZoom || 0;
        if (maxZoom){
            this.showAndHideClasses       += ' show-for-leaflet-zoom-'+maxZoom+'-down';
            this.inversShowAndHideClasses += ' hide-for-leaflet-zoom-'+maxZoom+'-down';
        }
    }
    nsMap.MapLayer = MapLayer;

    nsMap.MapLayer.prototype = {
        /*********************************************************
        isAddedTo(mapOrIndex) - return true if the MapLayer is added to the mal
        *********************************************************/
        isAddedToMap: function(mapOrIndex){
            var mapIndex = getMap(mapOrIndex).fcooMapIndex;
            return !!this.info[mapIndex] && !!this.info[mapIndex].map;
        },

        /*********************************************************
        addTo
        *********************************************************/
        addTo: function(mapOrIndex){
            var _this = this;
            if ($.isArray(mapOrIndex)){
                $.each(mapOrIndex, function(index, _map){ _this.addTo(_map); });
                return _this;
            }

            var map = getMap(mapOrIndex),
                mapIndex = map.fcooMapIndex;

            //Check if layer allready added
            if (this.isAddedToMap(mapIndex))
                return this;

            var info = this.info[mapIndex] = {};
            info.map = map;

            //Create and add legend
            if (map.bsLegendControl && !this.options.noLegend){
                var legend = info.legend = info.legend ||
                    new L.BsLegend({
                            index    : this.index,
                            icon     : this.options.icon,
                            text     : this.options.text || null,
                            content  : this.options.content,
                            onInfo   : this.options.onInfo,
                            onWarning: this.options.onWarning,
                            onRemove : $.proxy(this.removeViaLegend, this),
                            normalIconClass: this.showAndHideClasses,
                            hiddenIconClass: this.inversShowAndHideClasses,

                    });
                map.bsLegendControl.addLegend( legend );
                this.hasLegend = true;
            }

            //Create and add BsInfoBox for color-info
            if (this.options.colorInfo && !info.infoBox){

                this.hasColorInfo = true;

                var ciOptions = this.options.colorInfo = $.extend({}, defaultColorInfoOptions, this.options.colorInfo),
                    $outerContainer = $('<div/>').addClass('bsp-color-info-outer-container d-flex flex-column');

                //Append header: Use same text as in legend
                    $('<div/>')
                        .addClass('bsp-color-info-header show-for-no-cursor-on-map d-flex justify-content-center')
                        ._bsAddHtml(this.hasLegend ? this.options.text : ciOptions.text || null)
                        .appendTo($outerContainer);

                //Append contain-container. Need to be inside
                var $contentContainer = $('<div/>')
                        .addClass('flex-grow-1')
                        .addClass(this.showAndHideClasses)
                        .addClass(ciOptions.className)
                        .toggleClass('show-for-bsPosition-on-land', ciOptions.onlyLand)
                        .toggleClass('show-for-bsPosition-on-water', ciOptions.onlyWater)
                        .appendTo($outerContainer);


                info.$colorInfoBoxContent = $('<div/>')
                    .addClass('w-100 h-100 d-flex align-items-center justify-content-center text-monospace')
                    .appendTo($contentContainer);

                var infoBoxOptions = {
                        id           : this.options.id,
                        index        : this.options.index,
                        className    : 'bsp-color-info-outer input-group-sm',
                        alwaysVisible: true,
                        before   : {
                            className   : 'h-100',
                            useTouchSize: false,
                            icon        : ciOptions.icon
                        },
                        content: $outerContainer,
                        //after  : As options.before
                    };

                //Use the same icon(s) as for legend (if any)
                if (this.hasLegend)
                    infoBoxOptions.before.icon = info.legend.options.iconArray.slice();

                //Create the infoBox and its content
                var infoBox = info.infoBox = new L.Control.BsInfoBox(infoBoxOptions);
                infoBox._create$content();

                //Adjust infoBox padding and width
                infoBox.$contentContainer.css('padding', 0);
                if (ciOptions.width)
                    infoBox.$contentContainer.width(isNaN(ciOptions.width) ? ciOptions.width : ciOptions.width+'px');

                //Adjust icons if they are the same as for legend
                if (this.hasLegend){
                    infoBox.workingOn();

                    //Find and add show-for-, hide-for- classes to the icons
                    var icons = infoBox.$container.find('.input-group-prepend a > *');
                    $(icons[0])
                        .addClass( this.showAndHideClasses )
                        .addClass( 'fa-no-margin' )
                        .children().first().addClass('hide-for-bsl-working');
                    $(icons[1]).addClass( this.inversShowAndHideClasses || 'd-none');
                }
            }

            //Create pane(s) and layer (if not allready created)
            if (!info.layer){
                //Check and create the panes needed
                if (this.options.createPane || this.options.createMarkerPane){
                    var paneId = this.options.paneId || this.options.id,
                        zIndex = nsMap.zIndex[paneId.toUpperCase()];

                    if (this.options.createPane){
                        //Create pane in overlayPane
                        this.options.layerOptions.pane = nsMap.getPaneName(paneId);
                        map.createSubPane(this.options.layerOptions.pane, 'overlayPane', zIndex, this.showAndHideClasses);
                    }

                    if (this.options.createMarkerPane){
                        //Create pane in markerPane and shadowPane
                        this.options.layerOptions.markerPane = nsMap.getMarkerPaneName(paneId);
                        map.createSubPane(this.options.layerOptions.markerPane, 'markerPane', zIndex, this.showAndHideClasses);

                        this.options.layerOptions.shadowPane = nsMap.getShadowPaneName(paneId);
                        map.createSubPane(this.options.layerOptions.shadowPane, 'shadowPane', zIndex, this.showAndHideClasses);
                    }
                }

                info.layer = this.createLayer(this.options.layerOptions);
            }
            var layer = info.layer;

            //Add map to list and layer(s) to map
            layer.addTo(map);

            if ( this.hasColorInfo && !info.colorInfoLayer ){
                this.hasColorInfo = false;
                //Get the tileLayer used for colorInfo (if any)
                $.each(layer.getLayers ? layer.getLayers() : [layer], function(index, singleLayer){
                    //The layre used for color-info is the first GridLayer or the GridLayer with options.useForColorInfo
                    if  ( (singleLayer instanceof L.GridLayer) && (!info.colorInfoLayer || singleLayer.options.useForColorInfo) ){
                        info.colorInfoLayer = singleLayer;
                        _this.hasColorInfo = true;
                    }
                });

                //Add id and loading and load events to update legend and/or colorInfo icon
                var colorInfoLayer = info.colorInfoLayer;
                if (colorInfoLayer){
                        colorInfoLayer.options.id = this.options.id;
                        colorInfoLayer
                            .on('loading', this._onLoading, this)
                            .on('load',    this._onLoad,    this)
                            .on('color',   this._onColor,   this);
                }
            }

            if (this.hasColorInfo){
                this.toggleColorInfo(mapIndex, ciOptions.show);

                //Fire 'zoomend' on map to update color-info when the layer is loaded (in workingOff)
                info.updateColorInfoOnWorkingOff = true;
            }

            //If it is a radio-group layer => remove all other layers with same radioGroup
            if (this.options.radioGroup)
                $.each(nsMap.mapLayers, function(id, mapLayer){
                    if ((mapLayer.options.radioGroup == _this.options.radioGroup) && (mapLayer.id != _this.id))
                        mapLayer.removeFrom(mapOrIndex);
                });

            if (this.options.onAdd)
                this.options.onAdd(map, layer);

            return this;
        },

        /*********************************************************
        Methods to handle events regarding loading, load colorInfo:
        Updating legend and bsPosition.infoBox state and color-info
        *********************************************************/
        //_getMapIndex: Get mapIndex from event
        _getMapIndex: function(event){
            return event.sourceTarget._map.fcooMapIndex;
        },
        //callAllLegends: Call methodName with arg (array) for all legend
        callAllLegends: function( methodName, arg, onlyIndex ){
            $.each(this.info, function(index, info){
                if (info && info.legend && ((onlyIndex == undefined) || (index == onlyIndex)))
                    info.legend[methodName].apply(info.legend, arg);
            });
        },
        //callAllInfoBox: Call this.methodName with arg (array) for all infoBox (colorInfo)
        callAllInfoBox: function( methodName, arg, onlyIndex ){
            $.each(this.info, function(index, info){
                if (info && info.infoBox && ((onlyIndex == undefined) || (index == onlyIndex))){
                    info.infoBox[methodName].apply(info.infoBox, arg);
                }
            });
        },


        /*********************************************************
        Methods to remove MapLayer from a map
        *********************************************************/
        removeViaLegend: function(legend){
            this.wasRemovedViaLegend = true;
            this.removeFrom( legend.parent._map );
        },

        removeFrom: function(mapOrIndex){
            var _this = this;
            if ($.isArray(mapOrIndex)){
                $.each(mapOrIndex, function(index, _map){ _this.removeFrom(_map); });
                return this;
            }

            var map = getMap(mapOrIndex),
                mapIndex = map.fcooMapIndex;

            //Check if layer is already removed
            if (!this.isAddedToMap(mapIndex))
                return this;

            var info  = this.info[mapIndex];


            //Remove legned (if any) and use legend.onRemove to do the removing
            if (!this.wasRemovedViaLegend && map.bsLegendControl){
                map.bsLegendControl.removeLegend(info.legend);
                return this;
            }

            this.wasRemovedViaLegend = false;

            this.hideColorInfo(map);

            //Remove this from map
            info.map = null;
            info.layer.removeFrom(map);

            if (this.options.onRemove)
                this.options.onRemove(map, info.layer);

            return this;
        },

        /*******************************************************
        _onColor(options) = Called when the color at the cursor position/map center is changed
        options = {colorRGBA, colorHex, latLng}
        *******************************************************/
        _onColor: function(options){
            if (options.colorHex){
                var info = this.info[this._getMapIndex(options)];

                options.transparent = !options.colorRGBA[3];
                //Transparent colors are (by default) treaded as no-color
                options.color = !options.transparent || this.options.colorInfo.allowTransparentColor ? this.options.colorInfo.getColor(options) : null;

                if (info.lastColorInfoColor != options.color){
                    info.lastColorInfoColor = options.color;

                    info.$colorInfoBoxContent
                        .empty()
                        ._bsAddHtml(this.options.colorInfo.getText(options))
                        .css('background-color', options.color ? options.color : 'transparent')
                        .css('color', window.colorContrastHEX(options.color));
                }
            }
        },

        //Loading-events (working icon on/off in legend and/or info-box in bsPositionControl
        _onLoading: function(event){
            this._updateLoadingStatus(event, true);
        },
        _onLoad: function(event){
            this._updateLoadingStatus(event, false);
        },

        _updateLoadingStatus: function(event, loading){
            var _this = this,
                mapIndex = this._getMapIndex(event),
                info = this.info[mapIndex];
            info.loading = loading;

            window.clearTimeout(info.timeout);
            info.timeout = window.setTimeout( function(){ _this._updateLoadingIcon(mapIndex); }, 400);

        },
        _updateLoadingIcon: function(mapIndex){
            if (this.info[mapIndex].loading)
                this.workingOn(mapIndex);
            else
                this.workingOff(mapIndex);
        },

        workingOn : function(mapIndex){
            this.callAllLegends( 'workingOn',  null, mapIndex );
            this.callAllInfoBox( 'workingOn',  null, mapIndex );
        },
        workingOff: function(mapIndex){
            this.callAllLegends( 'workingOff', null, mapIndex );
            this.callAllInfoBox( 'workingOff', null, mapIndex );

            var info = this.info[mapIndex];
            if (info && info.updateColorInfoOnWorkingOff){
                info.updateColorInfoOnWorkingOff = false;

                //Fire 'zoomend' on map to update color-info when the layer is loaded
                var map = getMap(mapIndex);
                map.lastColorLatLngStr = 'NOT';
                map.fire('zoomend');
//HER                window.setTimeout(function(){ map.fire('zoomend'); }, 1000 );
            }

        },


        /*********************************************************
        createLayer: function(layerOptions)
        Set by the different types of MapLayer
        *********************************************************/
        createLayer: function(/*layerOptions*/){


        },


        /******************************************************************
        Methods regarding color-info = info in bsPositionControl about
        the 'value' of the layer on the position of the cursor/map-center
        *******************************************************************/
        showColorInfo: function(mapOrIndex){ return this.toggleColorInfo(mapOrIndex, true); },
        hideColorInfo: function(mapOrIndex){ return this.toggleColorInfo(mapOrIndex, false); },

        toggleColorInfo: function(mapOrIndex, show){
            var _this = this;
            if ($.isArray(mapOrIndex)){
                $.each(mapOrIndex, function(index, _map){ _this.toggleColorInfo(_map, show); });
                return _this;
            }
            var map = getMap(mapOrIndex),
                mapIndex = map.fcooMapIndex,
                bsPositionControl = map.bsPositionControl,
                infoBox = this.info[mapIndex].infoBox;

            if (infoBox){
                if (show)
                    bsPositionControl.addInfoBox(infoBox);
                else
                    bsPositionControl.removeInfoBox(infoBox);
            }
            return this;
        },




        /******************************************************************
        selectMaps
        Show modal window with checkbox or radio for each map
        Select/unseelct the layer in all visible maps
        *******************************************************************/
        selectMaps: function(){
            //If only one map is vissible => simple toggle
            if (!nsMap.hasMultiMaps || (nsMap.multiMaps.setup.maps == 1)){
                if (this.isAddedToMap(0))
                    this.removeFrom(0);
                else
                    this.addTo(0);
                return this;
            }

            var _this = this,
                maxMaps = nsMap.setupData.multiMaps.maxMaps,
                checkboxType = this.options.radioGroup ? 'radio' : 'checkbox',
                selectedOnMap = [],
                buttonList = [],
                $checkbox = $.bsCheckbox({
                    text: {da:'Vis på alle synlige kort', en:'Show on all visible maps'},
                    type: checkboxType,
                    onChange: function(id, selected){
                        $.each(buttonList, function(index, $button){
                            selectedOnMap[index] = selected;
                            $button._cbxSet(selected, true);
                        });
                        updateCheckbox();
                    }
                });

            //Get current selected state from all maps
            for (var i=0; i<maxMaps; i++)
                selectedOnMap[i] = this.isAddedToMap(i);

            //updateCheckbox: Update common checkbox when single map is selected/unselected
            function updateCheckbox(){
                var allSelected = true, semiSelected = false;
                $.each(buttonList, function(index/*, button*/){
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

            function miniMapContent($contentContainer){
                var $div =
                        $('<div/>')
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

            //Delete last used modal-form
            this.modalForm = null;
            if (mapLayerModalForm){
                mapLayerModalForm.$bsModal.close();
                mapLayerModalForm.$bsModal.modal('dispose');
            }

            mapLayerModalForm = this.modalForm = $.bsModalForm({
                width     : 240,
                header    : {icon: this.options.icon, text:  this.options.text},
                static    : false,
                keyboard  : true,
                closeWithoutWarning: true,

                content   : [$checkbox, miniMapContent],
                onSubmit  : function(){
                                nsMap.visitAllVisibleMaps( function(map){
                                    if (selectedOnMap[map.fcooMapIndex])
                                        _this.addTo(map);
                                    else
                                        _this.removeFrom(map);
                                });
                            }
            });

            updateCheckbox();
            this.modalForm.edit({});
        }
    };
    var mapLayerModalForm = null;

    /****************************************************************************
    *****************************************************************************
    map-layer-list

    Create methods
        fcoo.map._addMapLayers: Add a record to fcoo.maps.mapLayers
        fcoo.map.getMapLayer: function(id) return the MapLayer with id

    The id of the different layes can be used in setup-files to set witch
    layers to show in a given application

    *****************************************************************************
    ****************************************************************************/
    var mapLayers = nsMap.mapLayers = {};

    nsMap._addMapLayer = function(id, Constructor, options){
        id = id.toUpperCase();
        mapLayers[id] = new Constructor( $.extend({id: id}, options || {}) );
    };

    nsMap.getMapLayer = function(id){
        return mapLayers[id.toUpperCase()];
    };

    /****************************************************************************
    *****************************************************************************
    L.Control.BsInfoBox
    Extend the prototype with methods to update state and info
    *****************************************************************************
    ****************************************************************************/
    $.extend(L.Control.BsInfoBox.prototype, {
        workingToggle: function(on){return this.$container.modernizrToggle('bsl-working', on);},
        workingOn    : function(){ return this.workingToggle(true ); },
        workingOff   : function(){ return this.workingToggle(false); },




    });

}(jQuery, L, this, document));
