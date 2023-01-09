/****************************************************************************
map-layer_background.js

Create MapLayers with different layers that gives the background-layer,
coast-lines, and name of cites and places

****************************************************************************/
(function ($, L, window, document, undefined) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /***********************************************************
    A background layer contains of tree parts
    water: Either set as the background-color of the map or as a tile-layer
    land : Either set as a tile-layer or as the background-color of the map
    coastline and labels: A tile-layer with coastline and names of locations

    This makes it possible to mask out either land or water:
        1: Mask out land : Water as bg-color + land as tile-layer
        2: Mask out water: Water as tile-layer + land as bg-color

    This current version only implement 1.

    In the current version of ifm-maps there it is only possible to set
    land-color and water-color and using the default wms-layer "land-mask_latest"
    together with coastline and labels in "top-dark_latest"

    land-iho_latest         = Old version
    background-iho_latest   = Old version

    top-dark_latest         = Coastline and place-names
    land-mask_latest        = New version: black land-mask
    water-mask_latest       = New version: black water/sea-mask

    The different filters is calculated using the demo in
    https://stackoverflow.com/questions/42966641/how-to-transform-black-into-any-given-color-using-only-css-filters/43960991

    ***********************************************************/
    var backgroundColorList = nsMap.backgroundColorList = [{
        id   : 'standard', //Google maps - standard
        name : {da: 'Standard', en:'Standard'},
        land : {color: '#F5F5F5', filter: 'invert(99%) sepia(1%) saturate(251%) hue-rotate(271deg) brightness(115%) contrast(92%)'},
        water: {color: '#AADAFF', filter: 'invert(79%) sepia(23%) saturate(751%) hue-rotate(181deg) brightness(99%) contrast(107%)'}
    },{
        id   : 'charts', //Charts
        name : {da: 'Søkort', en:'Charts'},
        land : {color: '#FEF9D1', filter: 'invert(92%) sepia(4%) saturate(1495%) hue-rotate(9deg) brightness(106%) contrast(99%)'},
        water: {color: '#C9E9F7', filter: 'invert(85%) sepia(6%) saturate(1848%) hue-rotate(181deg) brightness(108%) contrast(94%)'}
    },{
        id   : 'gray', //Gray
        name : {da: 'Grå', en:'Gray'},
        land : {color: '#EFEFEF', filter: 'invert(99%) sepia(7%) saturate(143%) hue-rotate(213deg) brightness(115%) contrast(87%)'},
        water: {color: '#CBCBCB', filter: 'invert(100%) sepia(0%) saturate(1194%) hue-rotate(316deg) brightness(104%) contrast(59%)'}
    },{
        id   : 'retro', //Retro
        name : {da: 'Retro', en:'Retro'},
        land : {color: '#DFD2AE', filter: 'invert(91%) sepia(21%) saturate(351%) hue-rotate(356deg) brightness(90%) contrast(95%)'},
        water: {color: '#B9D3C2', filter: 'invert(90%) sepia(14%) saturate(281%) hue-rotate(88deg) brightness(91%) contrast(88%)'}
    }];

    L.Map.include({
        /***********************************************************
        L.Map.setBackground(landColor, waterColor)
        Add/alter land-mask-layer and sets background-color of the map
        ***********************************************************/
        setBackground: function(idOrIndex){
            if (typeof idOrIndex == 'string')
                $.each(backgroundColorList, function(index, options){
                    if (idOrIndex == options.id)
                        idOrIndex = index;
                });
            var oldBackgroundLayerIndex = this.backgroundLayerIndex;
            this.backgroundLayerIndex = idOrIndex;
            var backgroundColor = this.backgroundLayerColor = backgroundColorList[Math.min(idOrIndex, 3)];

            //Update or create land-layer
            var colorFilter = backgroundColor.land.filter;
            if (this.backgroundLandLayer){
                if (oldBackgroundLayerIndex != this.backgroundLayerIndex){
                    this.backgroundLandLayer.options.colorFilter = colorFilter;
                    this.backgroundLandLayer._container.style.filter = colorFilter;
                }
            }
            else {
                this.backgroundLandLayer = nsMap.layer_static({
                        id         : 'BACKGROUND_LAYER_LAND',
                        crossOrigin: 'anonymous',
                        layers     : 'land-mask_latest',
                        opacity    : 1,
                        colorFilter: colorFilter,
                        zIndex     : nsMap.zIndex.BACKGROUND_LAYER_LAND
                    },                  //options
                    undefined,          //map
                    undefined,          //defaultOptions
                    undefined,          //url
                    BackgroundLandLayer //LayerConstructor
                );

                this.backgroundLandLayer.on('color', this.backgroundLandLayer._onColor , this.backgroundLandLayer);

                this.backgroundLandLayer.$colorInfoBoxContent =
                    $()
                        .add(this.bsPositionControl.$cursorPosition)
                        .add(this.bsPositionControl.$centerPosition);

                this.backgroundLandLayer.addTo(this);
            }
            this.backgroundLandLayer.redraw();

            //Save backgroundColor in background-layer
            this.backgroundLandLayer.backgroundColor = backgroundColor;

            //Use Map.container as water-color
            this.getContainer().style.backgroundColor = backgroundColor.water.color;

            //Update bsPositionControl
            this.backgroundLandLayer._onColor(true);

            //Create coast-line-layer
            this.backgroundCoastlineLayer = this.backgroundCoastlineLayer ||
                nsMap.layer_static({
                    layers: 'top-dark_latest',
                    zIndex: nsMap.zIndex.BACKGROUND_LAYER_COASTLINE
                }).addTo(this);
        },


        /***********************************************************
        L.Map.isOverLand(latLng)
        Return true if lastLng is over land, false if over water and
        null if backgroundLayer not added
        ***********************************************************/
        isOverLand: function(latLng){
            var colorRGBA = this.backgroundLandLayer ? this.backgroundLandLayer.getColor(latLng) : null;
            return colorRGBA ? !!colorRGBA[3] : null;
        },

        getBackgroundLayerColor: function(latLng){
            var color;
            switch (this.isOverLand(latLng)){
                case true :  color = this.backgroundLayerColor.land.color; break;
                case false:  color = this.backgroundLayerColor.water.color; break;
                default   :  color = null;
            }
            return color;
        }
    });


    /****************************************************************************
    BackgroundLandLayer
    Overwrite L.TileLayer.WMS method _onColor to update bsPositionControl
    regarding the location (land/water/out) of the cursor or map-center
    ****************************************************************************/
    var BackgroundLandLayer = L.TileLayer.WMS.extend({

            positionState   : 'OUT', //= 'LAND', 'WATER' or 'OUT'

            _onColor: function(options){
                if (!this._map) return this;

                var newPositionState = '';
                if (options === true){
                    //Force using the last state
                    newPositionState = this.positionState;
                    this.positionState = '';
                }
                else
                    if (!options.colorRGBA)
                        newPositionState = 'OUT';
                    else
                        newPositionState = options.colorRGBA[3] ? 'LAND' : 'WATER';


                if (this.positionState != newPositionState){
                    this.positionState = newPositionState;

                    //Set background-color of the position containers
                    var showLandSeaColor = this._map.bsPositionControl && this._map.bsPositionControl.options.showLandSeaColor;
                    this.$colorInfoBoxContent.css(
                        'background-color',
                            !showLandSeaColor || (newPositionState == 'OUT') ?
                            'initial' :
                            newPositionState == 'LAND' ? this.backgroundColor.land.color : this.backgroundColor.water.color
                    );

                    //Update modernizr classes to show/hide info-boxes only visible over land or water
                    this._map.bsPositionControl.$container
                        .modernizrToggle( 'bsPosition-on-land',  newPositionState ==  'LAND' )
                        .modernizrToggle( 'bsPosition-on-water', newPositionState == 'WATER' );
                }
            }
        });
    /****************************************************************************
    L.Control.BackgroundLayer
    Hidden control that set the selected background colors
    ****************************************************************************/
    L.Control.BackgroundLayer = L.Control.extend({
        options: {
            position  : 'bottomright',
            background: 'standard', //'charts'
        },
        onAdd: function (map) {
            var container = L.DomUtil.create('div');
            L.DomEvent.disableClickPropagation(container);
            this._map = map;
            this.setState(this.options);

            return container;
        },

        getState: function(){
            return {background: this.options.background};
        },

        setState: function(options){
            this.options.background = options.background;
            this._map.setBackground(this.options.background);
        }
    });


    L.Map.mergeOptions({
        backgroundLayerControl: false
    });

    L.Map.addInitHook(function () {
        if (this.options.backgroundLayerControl) {
            this.backgroundLayerControl = new L.Control.BackgroundLayer();
            this.addControl(this.backgroundLayerControl);
        }
    });

}(jQuery, L, this, document));
