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

    //Menu
    menuOptions: {
        buttonList         : []bsButton-options. options.onClick = function( id, selected, $button, map ). If useLegendButtonList = true map is null if the button is clicked from the menu
        useLegendButtonList: BOOLEAN, if true and menuOptions.buttonList is not given => use legendOptions.buttonList as in menu

        showAllways        : BOOLOAN. When true the buttons are visible even when the layer is not visible in any maps. Can also be set directly in buttonOptions
        buttonListMode     : {button-id: MODE} or MODE. When useLegendButtonList = true =>
                                buttonListMode[id]/buttonListMode = "allMaps", "selectedMaps", "mainMap", or "noMaps" (default)
                                The mode sets witch maps to be called with the onClick-method for the legend-button-list
                                The mode can also be set direct in the options for the button in buttonList as options.menuButtonMode

    },

    //Legend
    legendOptions: {
        buttonList : []bsButton-options + onlyShowWhenLayer: BOOLEAN. When true the button is only visible when the layer is visible.
        onInfo     : function()
        onWarning  : function()
    }



    buttonList: Same as legendOptions.buttonList kept for backward combability
    onInfo    : Same as legendOptions.onInfo kept for backward combability
    onWarning : Same as legendOptions.onWarning kept for backward combability


    //dataset = options for Dataset - see scr/common/dataset.js
    /dataset: {
        valueList,
        options,
        data
    }


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


SETTING
Map_Layer has the following methods to set and save settings the layer:

//applySetting - apply individual setting for the Map_layer
applySetting: function(setting, map, mapInfo, mapIndex){
    //Apply setting for this layer at map. setting = {..} with options for this layer on map/mapInfo/mapIndex
},

//saveSetting: function() - Return individual setting for the Map_layer
saveSetting: function(map, mapInfo, mapIndex){
    //Return {..} with options for this layer on map/mapInfo/mapIndex
},






****************************************************************************/
(function ($, L, window, document, undefined) {
    "use strict";
/*
<script>
    L.Map.addInitHook(function(){
        this.on('popupopen', function( event ){
            console.log('popupopen', findLayer(event.popup));

        });
    });

function findLayer( layer ){
    if (!layer)
        return '';
    if (layer.options && layer.options.NIELS)
        return layer.options.NIELS;

    var result = '';
    $.each(layer._groups, function(index, _layer){
        result = result || findLayer( _layer );
    });

    ['_source', '_parentPolyline'].forEach( id => {
        result = result || findLayer( layer[id] );
    });

    return result;
}

L.LayerGroup.include({
    addLayer: function (layer) {
        var id = this.getLayerId(layer);
        this._layers[id] = layer;
        if (this._map) {
            this._map.addLayer(layer);
        }

        // Add this group to the layer's known groups
        layer._groups.push(this);

        return this;
    },

    removeLayer: function (layer) {
        var id = layer in this._layers ? layer : this.getLayerId(layer);
        if (this._map && this._layers[id]) {
            this._map.removeLayer(this._layers[id]);
        }
        delete this._layers[id];

        // Remove this group from the layer's known groups
        layer._groups.splice(layer._groups.indexOf(this), 1);

        return this;
    }
});

// Make sure to init a property in L.Layer
L.Layer.addInitHook(function(){
    this._groups = [];
});

    L.Map.mergeOptions({
        doubleRightClickZoom: true
    });

</script>
*/
    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {},

        defaultOptions = {
            zIndex          : 0,
            paneId          : '',
            createPane      : false,
            createMarkerPane: false,
            layerOptions    : {},
            legendOptions   : {},
            colorInfo       : null,

            //dataset: {valueList, options, data}

        },

        defaultColorInfoOptions = {
            show: true,
            allowTransparentColor: false,
            getColor: function(  options  ){ return options.colorHex; },
            gettext : function(/*options*/){ return '';               },
        };

    //Adjust default options for legend
    L.BsLegend_close_icon = [
        ['show-for-single-maps-selected far fa-map fa-scale-x-08', 'show-for-single-maps-selected fas fa-slash fa-scale-x-08'],
        ['show-for-multi-maps-selected fa-square-check']
    ];
    L.BsLegend_close_title = {da: 'Skjul/Vælg', en: 'Hide/Select'};


    //Overwrite L.BsLegend.remove to select for all maps if multi maps
    L.BsLegend.prototype.remove = function(e){
        //Since this.parent.removeLegend removed DOM-elements the event must stop propagation
        L.DomEvent.stopPropagation(e);

        this.options.mapLayer.selectMaps(this.parent._map);
    };



    nsMap.getMap = function(mapOrMapIndexOrMapId){
        return mapOrMapIndexOrMapId instanceof L.Map ?
                mapOrMapIndexOrMapId :
                nsMap.mapIndex[mapOrMapIndexOrMapId] || nsMap.mapList[mapOrMapIndexOrMapId];
    };

    nsMap.getPaneName       = function(id){ return id.toUpperCase()+'Pane'; };
    nsMap.getMarkerPaneName = function(id){ return id.toUpperCase()+'MarkerPane'; };
    nsMap.getShadowPaneName = function(id){ return id.toUpperCase()+'ShadowPane'; };

    var maxLayerIndex = 0;




    /***********************************************************
    nsMap.createMapLayer = {MAPLAYER_ID: CREATE_MAPLAYER_AND_MENU_FUNCTION}
    MAPLAYER_ID: STRING
    CREATE_MAPLAYER_AND_MENU_FUNCTION: function(options, addMenu: function(menuItem or []menuItem)
    Each mapLayer must add a CREATE_MAPLAYER_AND_MENU_FUNCTION-function to nsMap.createMapLayer:

        nsMap.createMapLayer[ID] = function(options, addMenu){
            //Somewhere inside the function or inside a response call
            //addMenu({id:ID, icon:..., text:..., type:...}, or
            //addMenu(this.menuItemOptions())
        };

    Eq. list[3] = {id: 'NAVIGATION_WARNING'}
    Some mapLayer "creator" has set nsMap.createMapLayer['NAVIGATION_WARNING'] = function(options, addMenu){...}
    This function is called to create the mapLayer and set the new menu-item-options (via addMenu-function)
    The code for nsMap.createMapLayerAndMenu is in src/layer/map-layer_00.js

    Javascrip notes:
        array.splice(index, 1)        = remove array[index]
        array.splice(index, 0, item)  = insert item at array[index]
        array.splice(index, 1, item)  = replace array[index] with item

    ***********************************************************/
    nsMap.createMapLayer = nsMap.createMapLayer || {};



    /***********************************************************
    MapLayer
    ***********************************************************/
    function MapLayer(options) {
        this.options = $.extend(true, {}, defaultOptions, options || {});

        //A list of options can for backward combability reasons be found both in options and in options.legendOptions
        ['buttonList', 'buttons', 'content', 'noVerticalPadding', 'noHorizontalPadding', 'onInfo', 'onWarning'].forEach( id => {
            let options = this.options,
                legendOptions = this.options.legendOptions;

            if ((legendOptions[id] === undefined) && (options[id] !== undefined)){
                legendOptions[id] = options[id];
                delete options[id];
            }
        }, this);

        this.index = this.options.index || maxLayerIndex + 1;
        maxLayerIndex = Math.max(maxLayerIndex, this.index);

        this.id = this.options.id || 'layer'+this.index;

        this.info = []; //[] of {map, layer, legend, infoBox, colorInfoLayer, loading, timeout, updateColorInfoOnWorkingOff, dataset}

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

        ns.appSetting.add({
            id          : this.id,
            callApply   : true,
            applyFunc   : $.proxy(this._applySetting, this),
            defaultValue: {}
        });

    }

    nsMap.MapLayer = MapLayer;

    nsMap.MapLayer.prototype = {
        /*********************************************************
        isAddedTo(mapOrIndex) - return true if the MapLayer is added to the map
        *********************************************************/
        isAddedToMap: function(mapOrIndex){
            var mapIndex = nsMap.getMap(mapOrIndex).fcooMapIndex;
            return !!this.info[mapIndex] && !!this.info[mapIndex].map;
        },

        /*********************************************************
        applySetting, applyCommonSetting and saveSetting, saveCommonSetting
        *********************************************************/
        //applySetting - apply individuel setting for the Map_layer at map
        applySetting: function(/*setting, map, mapInfo, mapIndex*/){

        },
        //applyCommonSetting - apply common setting for the Map_layer
        applyCommonSetting: function(/*setting*/){

        },

        _applySetting: function(data){
            //Apply common setting
            this.applyCommonSetting(data.common || null);

            //Apply individuel settings
            nsMap.visitAllMaps( function(map){
                var mapIndex = map.fcooMapIndex,
                    setting = data[mapIndex] || {};
                if (setting.show)
                    this.addTo(map);
                else
                    this.removeFrom(map);

                //colorInfo - TODO

                //Individual setting
                this.applySetting(setting, map, this.info[mapIndex], mapIndex);
            }.bind(this));
        },

        //saveSetting: function() - Return individuel setting for the Map_layer at map
        saveSetting: function(/*map, mapInfo, mapIndex*/){
            return {};
        },
        //saveCommonSetting: function() - Return common setting for the Map_layer
        saveCommonSetting: function(){
            return null;
        },

        _saveSetting: function(){
            var data = {},
                commonSetting = this.saveCommonSetting() || null;

            if (commonSetting !== null)
                data.common = commonSetting;

            $.each(this.info, function(index, info){
                data[index] =
                    $.extend({
                        show: this.isAddedToMap(index)
                        //colorInfo - TODO
                    },
                        this.saveSetting(info ? info.map : null, info, index) || {}
                    );
            }.bind(this));
            ns.appSetting.set(this.id, data);
            return ns.appSetting.save();
        },

        /*********************************************************
        addTo
        *********************************************************/
        addTo: function(mapOrIndex){
            if (Array.isArray(mapOrIndex)){
                mapOrIndex.forEach(map => this.addTo(map), this);
                return this;
            }

            var map = nsMap.getMap(mapOrIndex),
                mapIndex = map.fcooMapIndex;

            //Check if layer allready added
            if (this.isAddedToMap(mapIndex))
                return this;

            var info = this.info[mapIndex] = {};
            info.map = map;


            //Create dataset
            if (this.options.dataset && !info.dataset){
                info.dataset = nsMap.dataset(
                    this.options.dataset.valueList,
                    this.options.dataset.options,
                    this.dataset ? this.dataset.data : this.options.dataset.data
                 );
            }

            //this.dataset = point to first created dataset
            this.dataset = this.dataset || info.dataset;

            //Create and add legend
            if (map.bsLegendControl && !this.options.noLegend){

                if (!info.legend){
                    var legendOptions = this.options.legendOptions,
                        buttonList = legendOptions.buttonList || legendOptions.buttons || [];

                    //If a button has onlyShowWhenLayer = true => the button is only visible if the layer is visible/shown
                    buttonList.forEach( buttonOptions => {
                        if (buttonOptions.onlyShowWhenLayer)
                            buttonOptions.class = (buttonOptions.class || '') + ' ' + this.showAndHideClasses + '-visibility';
                    }, this);


                    //Find index for legend
                    var levelIndex = [],
                        menuItem = this.menuItem;
                    while (menuItem && menuItem._getParentIndex){
                        levelIndex.unshift(menuItem._getParentIndex());
                        menuItem = menuItem.parent;
                    }

                    //Convert levelIndex = [1,2,3,88] to integer 0102038800000000 via string "0102038800000000"
                    var indexAsStr = '';
                    for (var i=0; i<8; i++){
                        var nextLevel = levelIndex.length > i ? levelIndex[i] : 0;
                        indexAsStr = indexAsStr + (nextLevel < 10 ? '0' : '') + nextLevel;
                    }

                    legendOptions = $.extend(true, {}, {
                        index       : parseInt(indexAsStr),
                        icon        : this.options.legendIcon || this.options.icon,
                        iconClass   : this.options.legendIconClass || this.options.iconClass || null,
                        text        : this.options.legendText || this.options.text || null,

                        //content            : this.options.content,
                        contentArg         : [this, map],
                        //noVerticalPadding  : this.options.noVerticalPadding,
                        //noHorizontalPadding: this.options.noHorizontalPadding,

                        //buttonList  : buttonList.length ? buttonList : null,

                        //onInfo      : this.options.onInfo,
                        //onWarning   : this.options.onWarning,
                        onRemove    : $.proxy(this.removeViaLegend, this),
                        normalIconClass: this.showAndHideClasses,
                        hiddenIconClass: this.inversShowAndHideClasses,
                        mapLayer       : this,

                    }, legendOptions);


                    delete legendOptions.buttons;
                    legendOptions.buttonList = buttonList.length ? buttonList : null;

                    info.legend = new L.BsLegend( legendOptions );
                }

                map.bsLegendControl.addLegend( info.legend );
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
                    .addClass('w-100 h-100 d-flex align-items-center justify-content-center font-monospace')
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

                //Create layer with updated options/values
                var newLayerOptions = $.extend(true, {},
                        this.options.layerOptions,
                        this.dataset ? this.dataset.data || {} : {},
                        info.dataset ? info.dataset.data || {} : {}
                    );

                info.layer = this.createLayer(newLayerOptions, map);
                info.layer.fcooMapIndex = map.fcooMapIndex; //Prevent the index when the layer is removed => layer._map is set to null
                info.layer.mapLayer = this;

                //Sets options._popupContainerClass = this.showAndHideClasses to hide open popups when the layer is hidden and visa versa
                info.layer.options._popupContainerClass = this.showAndHideClasses;
            }
            var layer = info.layer;

            //Add map to list and layer(s) to map
            layer.addTo(map);
            if ( this.hasColorInfo && !info.colorInfoLayer ){
                this.hasColorInfo = false;
                //Get the tileLayer used for colorInfo (if any)
                (layer.getLayers ? layer.getLayers() : [layer]).forEach( singleLayer => {
                    //The layre used for color-info is the first GridLayer or the GridLayer with options.useForColorInfo
                    if  ( (singleLayer instanceof L.GridLayer) && (!info.colorInfoLayer || singleLayer.options.useForColorInfo) ){
                        info.colorInfoLayer = singleLayer;
                        this.hasColorInfo = true;
                    }
                }, this);

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

                //Call map._onColorPosition update color-info when the layer is loaded (in workingOff)
                info.updateColorInfoOnWorkingOff = true;
            }

            //Update dataset (if any)
            if (info.dataset){
                var data = $.extend(true, {}, this.dataset.data, info.dataset.data);
                this.dataset_setData(data, info.map.fcooMapIndex);
            }


            //If it is a radio-group layer => remove all other layers with same radioGroup
            if (this.options.radioGroup)
                $.each(nsMap.mapLayers, function(id, mapLayer){
                    if ((mapLayer.options.radioGroup == this.options.radioGroup) && (mapLayer.id != this.id))
                        mapLayer.removeFrom(mapOrIndex);
                }.bind(this));


            //Update checkbox/radio in menuItem
            this.updateMenuItem();

            if (this.options.onAdd)
                this.options.onAdd(map, layer);

            this._saveSetting();

            return this;
        },

        /*********************************************************
        getDataset( mapOrMapIndexOrMapId )
        Return the dataset for the map given by index_mapId_map
        *********************************************************/
        getDataset: function( mapOrMapIndexOrMapId ){
            var map = nsMap.getMap(mapOrMapIndexOrMapId),
                index = map ? map.fcooMapIndex : null,
                info = index === null ? null : this.info[index];

            return info ? info.dataset : null;
        },


        /*********************************************************
        dataset_setData( data, onlyIndexOrMapId )
        Set new data for each dataset in info
        *********************************************************/
        dataset_setData: function( data, onlyIndexOrMapId ){
            $.each(this._getAllInfoChild(null, onlyIndexOrMapId), function(index, info){
                info.dataset.setData(data, info.map ? info.map.$container : null);
            });
            return this;
        },

        /*********************************************************
        Methods to handle events regarding loading, load colorInfo:
        Updating layer, legend and bsPosition.infoBox state and color-info

        General methods to 'visit' or call a methods of layer, map, infoBox etc.
        for all or selected maps
        *********************************************************/
        //_getMapIndex: Get mapIndex from event
        _getMapIndex: function(event){
            return event.sourceTarget._map.fcooMapIndex;
        },


        /*********************************************************
        getMapInfoFromElement( element )
        Find mapInfo from a element (typical a button)
        *********************************************************/
        getMapInfoFromElement: function(element){
            var result = null,
                $element = element instanceof $ ? element : $(element),
                $mapContainer = $element.parents('.leaflet-container');

            if ($mapContainer.length)
                $.each(this._getAllInfoChild(), function(index, info){
                    if (info && info.map && info.map.$container && (info.map.$container.get(0) === $mapContainer.get(0)))
                        result = info;
                });
            return result;
        },


        //_getAllInfoChild: Get []info[childName] if it exists and if the index/map match onlyIndexOrMapId
        _getAllInfoChild: function(childName, onlyIndexOrMapId){
            var result = [];
            if (onlyIndexOrMapId !== undefined)
                onlyIndexOrMapId = $.isArray(onlyIndexOrMapId) ? onlyIndexOrMapId : [onlyIndexOrMapId];
            $.each(this.info, function(index, info){
                if (!info) return;

                var child = childName ? info[childName] : info, //If childName == null => return list of info
                    map   = info.map;

                if (!child) return;

                if (onlyIndexOrMapId){
                    if (
                        onlyIndexOrMapId.includes(index) ||
                        ( map && (onlyIndexOrMapId.includes(map.fcooMapId) || onlyIndexOrMapId.includes(map.fcooMapIndex)) )
                       )
                        result.push(child);
                }
                else
                    result.push(child);
            });
            return result;
        },

        //_callAllChild
        _callAllChild: function( childName, methodName, arg, onlyIndexOrMapId ){
            $.each( this._getAllInfoChild(childName, onlyIndexOrMapId), function(index, child){
                child[methodName].apply(child, arg);
            });
            return this;
        },

        //callAllLayers: Call methodName with arg (array) for all layer
        callAllLayers: function( methodName, arg, onlyIndexOrMapId ){
            return this._callAllChild( 'layer', methodName, arg, onlyIndexOrMapId );
        },


        //visitAllLayers: Call method( layer, mapLayer) for all layer
        visitAllLayers: function(method, onlyIndexOrMapId){
            this._getAllInfoChild('layer', onlyIndexOrMapId).forEach(layer => {
                method(layer, this);
            }, this);
            return this;
        },

        //callAllLegends: Call methodName with arg (array) for all legend
        callAllLegends: function( methodName, arg, onlyIndexOrMapId ){
            return this._callAllChild( 'legend', methodName, arg, onlyIndexOrMapId );
        },

        //callAllInfoBox: Call this.methodName with arg (array) for all infoBox (colorInfo)
        callAllInfoBox: function( methodName, arg, onlyIndexOrMapId ){
            return this._callAllChild( 'infoBox', methodName, arg, onlyIndexOrMapId );
        },


        /*********************************************************
        Methods to show/hide the legend and show/hide the content og the legend
        *********************************************************/
        showLegend: function( extended ){
            return this.callAllLegends('toggle', [true, extended]);
        },

        hideLegend: function( extended ){
            return this.callAllLegends('toggle', [false, extended]);
        },

        showLegendContent: function( extended ){
            return this.callAllLegends('toggleContent', [true, extended]);
        },

        hideLegendContent: function( extended ){
            return this.callAllLegends('toggleContent', [false, extended]);
        },

        /*********************************************************
        Methods to find all buttons in legend or popups on the layer
        *********************************************************/
        findAllLegendButtons: function(select = ''){
            var $result = $();
            $.each(this.info, function(index, info){
                if (info && info.legend && info.legend.$buttonContainer){
                    var $buttons = info.legend.$buttonContainer.children(select);
                    if ($buttons.length)
                        $result = $result.add($buttons);
                }
            });
            return $result;
        },

        findAllPopupButtons: function(select = '') {
            var $result = $();
            $.each(this.info, function(index, info){
                if (info && info.layer &&
                    info.layer._popup &&
                    info.layer._popup.bsModal &&
                    info.layer._popup.bsModal.$buttons &&
                    info.layer._popup.bsModal.$buttons.length){

                    //For (to Niels) unknown reasons filter(select) do not work as expected
                    //$result.add( $(info.layer._popup.bsModal.$buttons).filter(select) );
                    //Instead test each element
                    $( info.layer._popup.bsModal.$buttons ).each(function(){
                        var $this = $(this);
                        if ((!select) || $this.is(select))
                            $result = $result.add( $this );
                    });
                }
            });
            return $result;
        },


        /*********************************************************
        Methods to remove MapLayer from a map
        *********************************************************/
        removeViaLegend: function(legend){
            this.wasRemovedViaLegend = true;
            this.removeFrom( legend.parent._map );
        },

        removeFrom: function(mapOrIndex){
            if ($.isArray(mapOrIndex)){
                mapOrIndex.forEach( map => this.removeFrom(map), this);
                return this;
            }

            var map = nsMap.getMap(mapOrIndex),
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

            this.closePopupOnLayer( info.layer );


            //Remove this from map
            info.map = null;
            info.layer.removeFrom(map);

            //Update checkbox/radio in menuItem
            this.updateMenuItem();

            if (this.options.onRemove)
                this.options.onRemove(map, info.layer);

            this._saveSetting();

            return this;
        },

        removeFromAll: function(){
            nsMap.visitAllMaps( $.proxy(this.removeFrom, this) );
        },

        /*******************************************************
        closePopup(mapOrIndex)
        Close all popups on the layer in mapOrIndex
        *******************************************************/
        closePopup: function(mapOrIndex){
            return this.visitAllLayers(this.closePopupOnLayer, mapOrIndex);
        },

        /*******************************************************
        closePopupOnLayer(layer)
        Method to close all popups on layer
        Can be overwritten by descending classes
        *******************************************************/
        closePopupOnLayer: function(layer){

            function closePOL( layer ){
                if (layer.eachLayer)
                    layer.eachLayer( closePOL );
                else
                    if (layer._popup && layer.closePopup){
                        layer._popup._pinned = false;
                        layer.closePopup();
                    }
            }
            closePOL( layer );
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
            var mapIndex = this._getMapIndex(event),
                info = this.info[mapIndex];
            info.loading = loading;

            window.clearTimeout(info.timeout);
            info.timeout = window.setTimeout( function(){ this._updateLoadingIcon(mapIndex); }.bind(this), 400);

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

                //Call map._onColorPosition update color-info when the layer is loaded
                nsMap.getMap(mapIndex)._onColorPosition(true);
            }

        },


        /*********************************************************
        createLayer: function(layerOptions, map)
        Set by the different types of MapLayer
        *********************************************************/
        createLayer: function(/*layerOptions, map*/){

        },


        /******************************************************************
        Methods regarding color-info = info in bsPositionControl about
        the 'value' of the layer on the position of the cursor/map-center
        *******************************************************************/
        showColorInfo: function(mapOrIndex){ return this.toggleColorInfo(mapOrIndex, true); },
        hideColorInfo: function(mapOrIndex){ return this.toggleColorInfo(mapOrIndex, false); },

        toggleColorInfo: function(mapOrIndex, show){
            if ($.isArray(mapOrIndex)){
                mapOrIndex.forEach( map => this.toggleColorInfo(map, show), this);
                return this;
            }
            var map = nsMap.getMap(mapOrIndex),
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
        menuItemOptions
        Return options for this layer as MenuItem in Mmenu
        *******************************************************************/
        menuItemOptions: function(){
            var menuOptions   = this.options.menuOptions = this.options.menuOptions || {},
                legendOptions = this.options.legendOptions,
                result = $.extend({
                    id        : this.id,
                    icon      : this.options.icon,
                    iconClass : this.options.iconClass,
                    text      : this.options.text,
                    type      : this.options.radioGroup ? 'radio' : 'check',
                    mapLayerId: this.id,
                    onClick   : $.proxy(this.selectMaps, this)
                }, menuOptions);


            //Use legend-buttons if no direct menu-button is given
            if (!result.buttonList && menuOptions.useLegendButtonList && legendOptions.buttonList){

                let menuButtonList = [];
                legendOptions.buttonList.forEach( (buttonOptions, index) => {
                    let menuButtonOptions = $.extend(true, {}, buttonOptions );

                    menuButtonOptions.legendOnClick = menuButtonOptions.onClick;
                    menuButtonOptions.onClick = this._menuButton_onClick.bind(this, index);

                    menuButtonList.push(menuButtonOptions);
                });
                result.buttonList = menuButtonList;
            }

            if (result.buttonList){
                //Add class to buttons to control if the button is enabled/disabled when the layer is visible in any maps
                result.buttonList.forEach( buttonOptions => {
                    const showAllways = buttonOptions.showAllways !== undefined ? buttonOptions.showAllways : menuOptions.showAllways;
                    buttonOptions.class = (buttonOptions.class || '') + (showAllways ? '' : ' disabled-when-no-selected');
                });
            }

            return result;
        },

        _menuButton_onClick: function(buttonIndex, id, selected, $button/*, map*/){
            const buttonOptions = this.options && this.options.legendOptions && this.options.legendOptions.buttonList ? this.options.legendOptions.buttonList[buttonIndex] : null;

            if (!buttonOptions)
                return this;

            /*
            buttonListMode: {button-id: MODE}. When useLegendButtonList = true => buttonListMode[id] = "allMaps", "selectedMaps", "mainMap", or "noMaps" (default)
                                               The mode sets witch maps to be called with the onClick-method for the legend-button-list
                                            The mode can also be set direct in the options for the button in buttonList as options.menuButtonMode
            */
            const menuOptions = this.options.menuOptions;

            let mode = buttonOptions.menuButtonMode;

            if (!mode && menuOptions.buttonListMode);
                mode = Array.isArray(menuOptions.buttonListMode) ? menuOptions.buttonListMode[buttonIndex] : menuOptions.buttonListMode;
            mode = mode || "noMaps";

            let mapList = [];
            switch (mode.toUpperCase()){
                case "ALLMAPS"      :   nsMap.visitAllVisibleMaps( map => mapList.push(map) ); break;
                case "SELECTEDMAPS" :   nsMap.visitAllVisibleMaps( function(map){ if (this.isAddedToMap(map)) mapList.push(map); }.bind(this) ); break;
                case "MAINMAP"      :   mapList = [nsMap.mainMap]; break;
                default             :   mapList = [null];
            }

            let onClick = buttonOptions.onClick.bind(buttonOptions.context);
            mapList.forEach( map => onClick(id, selected, $button, map) );

            return this;
        },


        /******************************************************************
        updateMenuItem
        Update the menu-item checkbox/radio (false, 'semi' or true)
        *******************************************************************/
        updateMenuItem: function(){
            if (!this.menuItem) return;

                let notAdded = true;

            if (nsMap.hasMultiMaps){
                var maps        = nsMap.multiMaps.setup.maps,
                    addedToMaps = 0;

                nsMap.multiMaps.mapList.forEach( (map, index) => {
                    if (map.isVisibleInMultiMaps && this.isAddedToMap(index))
                        addedToMaps++;
                }, this);

                this.menuItem.setState(
                    addedToMaps == 0 ? false :
                    addedToMaps == maps ? true :
                    'semi'
               );
               notAdded = (addedToMaps == 0);
            }
            else {
                this.menuItem.setState(!!this.isAddedToMap(0));
                notAdded = !this.isAddedToMap(0);
            }

            this.menuItem.$li.toggleClass('not-shown-in-any-maps', !!notAdded);
            this.menuItem.$li.find('.disabled-when-no-selected').toggleClass('disabled', !!notAdded);
            if (this.menuItem.favoriteItem && this.menuItem.favoriteItem.$li)
                this.menuItem.favoriteItem.$li.find('.disabled-when-no-selected').toggleClass('disabled', !!notAdded);

        },

        /******************************************************************
        selectMaps
        Show modal window with checkbox or radio for each map
        Select/unselect the layer in all visible maps
        *******************************************************************/
        selectMaps: function( currentMap, state ){
            //If it is rest all selected => do that
            if (state == 'RESET'){
                this.removeFromAll();
                return this;
            }

            //Use nsMap.selectMap(...) to select maps
            nsMap.selectMaps({
                header    : {icon: this.options.icon, text:  this.options.text},

                isSelected: this.isAddedToMap.bind(this),
                select    : this.addTo.bind(this),
                unselect  : this.removeFrom.bind(this),

                singleMapAction: 'toggle',
                showAsRadio    : this.options.radioGroup,
                currentMap     : currentMap
            });
            return this;
        }
    };

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
        return mapLayers[id];
    };

    nsMap.getMapLayer = function(id){
        return mapLayers[id.toUpperCase()];
    };


    nsMap.mapLayer_updateMenuItem = function(){
        $.each(mapLayers, function(id, mapLayer){
            mapLayer.updateMenuItem();
        });
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
