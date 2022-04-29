/****************************************************************************
latlng-modal.js
Methods to adjust and display latLng-values
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    //latLngAsModal(latLng) - Display a modal with latLng in different formats
    //Two different versions tryed: 1: With selectbox, 2: With selectlist
    var latLngModal,
        copyToClipboardFormat,
        latLngFormats,
        clipboard;

    nsMap.latLngAsModal = function(latLng, options){
        options = options || {};
        var modalOptions = {
                header: options.header || {
                    icon: ['fa-location-dot', 'fa-arrow-alt-right','fa-copy'],
                    text: {da:'Kopier position til udklipsholder', en:'Copy Position to Clipboard'}
                },
                content: [],
                //version 2:
                buttons: [{
                    id  : 'btn_copy_to_clipboard',
                    icon: 'fa-copy',
                    text: {da:'Kopier til udklipsholder', en:'Copy to Clipboard'},
                }],
                show: false
            };

        copyToClipboardFormat = copyToClipboardFormat || 'format' + ns.globalSetting.get('latlng') + '0';
        latLngFormats = {};

        if (clipboard)
            clipboard.destroy();

        //Box with position in current format
        modalOptions.fixedContent = {
            type     : 'textbox',
            label    : {icon:'fa-map-marker-alt', text: {da:'Position', en:'Position'}},
            text     : (options.text ? options.text+'<br>' : '') + '<b>'+latLng.format()+'</b>',
            textStyle:'center',
            center   : true
        };

        //select with different formats
        var saveCurrentFormatId = ns.globalSetting.get('latlng'),
            formatItems = [];

        for (var formatId = window.latLngFormat.LATLNGFORMAT_FIRST; formatId <= window.latLngFormat.LATLNGFORMAT_LAST; formatId++){

            window.latLngFormat.setTempFormat(formatId);
            formatItems.push({ text: window.latLngFormat.options.text[formatId] });


            var formatList = latLng.outputs();
            $.each(formatList, function(index, format){
                var id = 'format'+formatId+index;
                latLngFormats[id] = format;
                formatItems.push({id: id, text: format});
            });
        }

        window.latLngFormat.setTempFormat(saveCurrentFormatId);

        modalOptions.content.push({
            //type      : 'selectlist', //version 1
            type      : 'selectlist',   //version 2
            //label     : {icon: 'fa-copy', text: {da:'Kopier til udklipsholder', en:'Copy to Clipboard'}}, //version 1
            fullWidth : true,
            center    : true,
            //size      : 4,    //version 1
            items     : formatItems,
            selectedId: copyToClipboardFormat,
            onChange  : function(id){ copyToClipboardFormat = id; },
            //version 1
            //after: {
            //    id  : 'btn_copy_to_clipboard',
            //    type: 'button',
            //    icon: 'fa-copy',
            //}
        });

        if (latLngModal)
            latLngModal.update(modalOptions);
        else
            latLngModal = $.bsModal(modalOptions);

        latLngModal.show();
        clipboard = new window.ClipboardJS('#btn_copy_to_clipboard', {
            container: latLngModal.bsModal.$modalContent[0],
            text     : function(/*trigger*/) { return latLngFormats[copyToClipboardFormat]; }
        });
        clipboard.on('success', function(/*e*/){
             window.notySuccess({da:'Kopieret!', en:'Copied!'}, {timeout: 500} );
        });
        clipboard.on('error', function(e){
             window.notyError(
                 ['"'+e.text+'"<br>', {da:' blev <b>ikke</b> kopieret til udklipsholder', en:' was <b>not</b> copied to the Clipboard'}],
                 {layout: 'center', defaultHeader: false}
             );
        });


    };

    //Extend LatLng with asModal-method
    L.extend( L.LatLng.prototype, {
        asModal: function(options){ nsMap.latLngAsModal(this, options); },
    });

}(jQuery, L, this, document));



