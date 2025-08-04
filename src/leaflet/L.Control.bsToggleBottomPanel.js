/****************************************************************************
L.Control.bsToggleBottomPanel.js
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

        L.Control.BsToggleBottomPanel = L.Control.BsButton.extend({
            options: {
                bigIcon     : true,
                icon        : ['far fa-circle-chevron-up hide-for-bottom-panel-open fa-no-margin', 'far fa-circle-chevron-down show-for-bottom-panel-open'],
                position    : 'bottomcenter',
                transparent : true,
                //semiTransparent : true,
                onClick     : function(){ nsMap.main.bottomPanel.toggle(); }
            }
        });

    //Install L.Control.BsCompass
    L.Map.mergeOptions({
        bsToggleBottomPanelControl: false,
        bsToggleBottomPanelOptions: {}
    });

    L.Map.addInitHook(function () {
        if (this.options.bsToggleBottomPanelControl){
            this.bsToggleBottomPanelControl = new L.Control.BsToggleBottomPanel( this.options.bsToggleBottomPanelOptions );
            this.addControl(this.bsToggleBottomPanelControl);
        }
    });

}(jQuery, L, this, document));



