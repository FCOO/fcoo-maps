/****************************************************************************
L.Control.bsToggleBottomMenu.js
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

        L.Control.BsToggleBottomMenu = L.Control.BsButton.extend({
            options: {
                bigIcon     : true,
                icon        : ['far fa-circle-chevron-up hide-for-bottom-menu-open fa-no-margin', 'far fa-circle-chevron-down show-for-bottom-menu-open'],
                position    : 'bottomcenter',
                transparent : true,
                //semiTransparent : true,
                onClick     : function(){ nsMap.main.bottomMenu.toggle(); }
            }
        });

    //Install L.Control.BsCompass
    L.Map.mergeOptions({
        bsToggleBottomMenuControl: false,
        bsToggleBottomMenuOptions: {}
    });

    L.Map.addInitHook(function () {
        if (this.options.bsToggleBottomMenuControl){
            this.bsToggleBottomMenuControl = new L.Control.BsToggleBottomMenu( this.options.bsToggleBottomMenuOptions );
            this.addControl(this.bsToggleBottomMenuControl);
        }
    });

}(jQuery, L, this, document));



