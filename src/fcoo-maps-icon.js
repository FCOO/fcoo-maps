/****************************************************************************
fcoo-maps-icon
Objects and methods to create icons fro buttons etc.
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
	"use strict";

    window.fcoo = window.fcoo || {};
    var ns = window.fcoo.map = window.fcoo.map || {};


    ns.iconSub = function(mainIcon, subIcon, subClassPostfix){
        subClassPostfix = subClassPostfix || subIcon;
        return [[
            'fal '+mainIcon + ' fa-lg',
            'fas fa-circle fa-circle-small-right-bottom _fa-inverse',
            'far ' + subIcon + '  ' + subClassPostfix + '-small-right-bottom'
        ]];
    };

    ns.settingIcon = function(mainIcon){
        return ns.iconSub(mainIcon, 'fa-cog');
    };

    ns.mapIcon = function(subIcon, subClassPostfix){
        return ns.iconSub('fa-map', subIcon, subClassPostfix);
    };




}(jQuery, L, this, document));



