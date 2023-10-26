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
    //Icon and header for map-settings (global)
    ns.icons.mapSettingGlobal = ns.iconSub('fa-map width-1-2em', 'fa-cog');
    ns.texts.mapSettingGlobal = {da:'Kortindstillinger', en:'Maps Settings'};

    //Icon and header for single map-settings
    ns.icons.mapSettingSingle = ns.iconSub('fa-map width-1-1em', 'fa-square-check'); //Alternative = fa-cog fa-sliders fa-ballot-check
    ns.texts.mapSettingSingle = {da:'Kortindstillinger', en: 'Map Settings'};


    //Icon for Number of Maps
    ns.icons.numberOfMaps = ns.iconSub('fa-map width-1-5em', 'fa-tally', true);
    ns.texts.numberOfMaps = {da:'Antal kort', en:'Number of Maps'},

    //Icon and header for legend
    ns.icons.mapLegend = 'fa-list';     //TODO fa-th-list when forecast@mouse-position is implemented <-- ??????? (remove line?)
    ns.texts.mapLegend = {da:'Signaturforklaring', en:'Legend'};

    ns.mapIcon = function(subIcon, subClassPostfix){
        return ns.iconSub('fa-map', subIcon, subClassPostfix);
    };

    nsMap.mapSettingIconWithStatus = function(fontSizeClass){
        //Return a icon with
        return [ns.icons.mapSettingSingle, ns.iconSub('fa-map', 'fa-sync icon-active fw-bold ' + fontSizeClass)];
    };

    nsMap.updateMapSettingIconWithStatus = function($parent, inSync){
        var icons = $parent.children('.container-stacked-icons').addClass('fa-no-margin');
        $(icons[0]).toggle( !inSync);
        $(icons[1]).toggle(!!inSync);
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
    STANDARD OPTIONS
    nsMap.standard = {ID: function(options)}
    Is a set of response-methods for standard-options
    The methods are added in the src-files for the different type
    of settings (eq. src/layers/layer_wms.js)
    The ID must correspond with the IDs in default_setup in src/fcoo-maps.js
    ***********************************************************/
    nsMap.standard = {};


    /***********************************************************
    GLOBAL SETTINGS
    Globale variables used to add/remove some parts of the application
    ***********************************************************/
    nsMap.BOTTOM_MENU = null;   //Options for the buttom-menu. Used to set content from other packages not using a setup-file

}(jQuery, window.moment, L, this, document));



