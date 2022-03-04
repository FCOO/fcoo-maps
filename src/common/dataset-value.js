/****************************************************************************
dataset-values.js,

define default DatasetValue used by fcoo-maps

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    //fcoo.map.datasetValues = options for default DatasetValue
    nsMap.datasetValues = nsMap.datasetValues || {};

    //Create standard/default DatasetValues
    function addDatasetValue(options){
        nsMap.datasetValues[options.id] = options;
    }

    /*************************************
    Position and position accuracy
    *************************************/
    //latLng
    addDatasetValue({
        id  : 'latLng',
        icon: 'fa-location-pin',
        text: {da:'Position', en:'Position'},

        vfFormat : 'latlng',
        vfOptions: function(createOptions){return createOptions.compact ? {separator: '<br>'} : {}; },
        saveValue: true,
        onClick  : function(){ $(this).data('dataSetValue').asModal(); }
    });

    //accuracy (position)
    addDatasetValue({
        id      : 'accuracy',
        icon    : 'fa-plus-minus',
        text    : {da: 'Nøjagtighed', en:'Accuracy'},
        vfFormat: 'number',
        vfOptions: {
            decimals: 0,
            prefix  : '~',
            postfix : ' m'
        },
    });


    /*************************************
    Altitude
    *************************************/
    var altitudeIcon = 'fa-arrow-to-top',
        altitudeText = {da:'Højde', en:'Altitude'};
    //altitude
    addDatasetValue({
        id      : 'altitude',
        icon    : altitudeIcon,
        text    : altitudeText,
        vfFormat: 'height',
        vfOptions: {
            withUnitLink: true
        }
    });

    //altitude accuracy (internally)
    addDatasetValue({
        id      : 'altitudeAccuracy',
        icon    : altitudeIcon,
        text    : altitudeText,
        vfFormat: 'height',
        vfOptions: {
            prefix : '(&plusmn; ',
            postfix: ')',
        }
    });


    //altitude and accuracy
    addDatasetValue({
        id    : 'altitude_accuracy',
        icon  : altitudeIcon,
        text  : altitudeText,
        center: true,
        datasetValueIdList: ['altitude', 'altitudeAccuracy']
    });

    /*************************************
    Direction
    *************************************/
    var directionIcon = 'fa-circle-location-arrow',
        directionText = {da:'Retning', en: 'Direction'};

    //direction (number)
    addDatasetValue({
        id      : 'direction',
        icon    : directionIcon,
        text    : directionText,
        vfFormat: 'direction',
        vfOptions: {
            withUnitLink: true
        }
    });

    //direction_text
    addDatasetValue({
        id      : 'direction_text',
        dataId  : 'direction',
        icon    : directionIcon,
        text    : directionText,
        vfFormat: 'direction_text'
    });

    //direction_vector
    addDatasetValue({
        id      : 'direction_vector',
        dataId  : 'direction',
        icon    : directionIcon,
        text    : directionText,
        isVector: true
    });


    /*************************************
    Speed
    *************************************/
    var speedIcon = 'fa-tachometer';

    addDatasetValue({
        id      : 'speed',
        icon    : speedIcon,
        text    : {da:'Fart', en:'Speed'},
        vfFormat: 'speed',
        vfOptions: {
            withUnitLink: true
        }
    });


    /*************************************
    Velocity (speed and direction)
    *************************************/
    var velocityIcon =  speedIcon,
        velocityText =  {da:'Hastighed', en:'Velocity'};

    addDatasetValue({
        id           : 'velocity',
        icon         : velocityIcon,
        text         : velocityText,
        showPartially: true,

        datasetValueIdList:['speed', 'direction_vector']
    });

    addDatasetValue({
        id           : 'velocity_extended',
        icon         : velocityIcon,
        text         : velocityText,
        showPartially: true,

        datasetValueIdList:['speed', 'direction_vector', 'direction_text', 'direction' ]
    });

/*
        vfFormat: 'number',
        vfOptions: {
            decimals: 0,
            prefix  : '~',
            postfix : ' m'
        },


                case 'velocity':
                    if (markerOptions.speed === null)
                        return null;

                    //If no direction is present => return info on speed
                    if (markerOptions.direction === null)
                        return this.getStandardPopupContent('speed', markerOptions.speed, extended);

                    content = {
                        label  : {icon: 'fa-tachometer', text: {da:'Hastighed', en:'Velocity'} },
                        type   : 'text',
                        text   : (extended ? this._createVelocityExtendedContent : this._createVelocityContent).bind(this),
                        vfValue: '',
                    };


                    break;

                case 'orientation':
                    content = {
                        label   : {icon: 'fa-mobile-android', text: {da:'Orientering', en:'Orientation'}},
                        vfFormat: 'direction'
                    };

*/



}(jQuery, L, this, document));



