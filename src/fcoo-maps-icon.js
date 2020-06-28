/****************************************************************************
fcoo-maps-icon
Objects and methods to create icons for buttons etc.
Extending fcoo.iconSub from fcoo-application
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
	"use strict";

    var ns = window.fcoo = window.fcoo || {};

    ns.mapIcon = function(subIcon, subClassPostfix){
        return ns.iconSub('fa-map', subIcon, subClassPostfix);
    };


/*
$.bsButton({
    icon: fcoo.settingIcon('fa-map'),
    text:'Knap'
 }).appendTo(main.$mainContainer);
$.bsButton({
    icon: fcoo.iconSub('fa-map', 'fa-tally', null, true),
    text:'Knap'
 }).appendTo(main.$mainContainer);
*/


}(jQuery, L, this, document));



