/****************************************************************************
00_fcoo-maps_initialize.js

Create and set different global variables and methods

****************************************************************************/
(function ($, moment, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /***********************************************************
    ICONS
    ***********************************************************/
    //Icon and header for map-settings
    nsMap.mapSettingIcon = ns.settingIcon('fa-map');
    nsMap.mapSettingHeader = {
        icon: nsMap.mapSettingIcon,
        text: {da:'Kortindstillinger', en:'Map Settings'}
    };

    ns.mapIcon = function(subIcon, subClassPostfix){
        return ns.iconSub('fa-map', subIcon, subClassPostfix);
    };

    //Icon and header for legend
    nsMap.mapLegendIcon = 'fa-list';  //TODO fa-th-list when forecast@mouse-position is implemented
    nsMap.mapLegendHeader = {
        icon: nsMap.mapLegendIcon,
        text: {da:'Signaturforklaring', en:'Legend'}
    };



    /***********************************************************
    EVENTS
    ***********************************************************/
    //nsMap.addFinallyEvent: Adds func (and context) to be fired when the application is created
    var finallyGlobalEventName = 'CREATEAPPLICATIONFINALLY';
    ns.events[ finallyGlobalEventName ] = finallyGlobalEventName;
    nsMap.addFinallyEvent = function(callback, context, options){
        ns.events.on(finallyGlobalEventName, callback, context, options);
    };


    /***********************************************************
    LEAFLET
    ***********************************************************/

}(jQuery, window.moment, L, this, document));



