/****************************************************************************
fcoo-maps-control-legend.js,
****************************************************************************/
(function ($, moment, L, window/*, document, undefined*/) {
    "use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {};

//HER ns.mapLegendIcon = 'fa-list';  //TODO fa-th-list when forecast@mouse-position is implemented
//HER    ns.mapLegendHeader = {



    /**
     * A Leaflet control for showing one or more legends. Each legend contains
     * a colorbar, parameter name and units, source/attribution, and optionally
     * information about when the data was last updated.
     */

    //Add phrases
    var i18nNamespace = 'flcl';
    window.i18next.addPhrases( i18nNamespace, {
        'legend'    : { da: 'Signaturforklaring', en: 'Legend' },
        'source'    : { da: 'Kilde',              en: 'Source' },
        'updated'   : { da: 'Opdateret',          en: 'Updated' },
        'analysis'  : { da: 'Analyse',            en: 'Analysis' },
        'exp-update': { da: 'Forventes opd.',     en: 'Expected update' },
        'remove'    : { da: 'Skjul laget',        en: 'Hide the layer' },
        'nolegend'  : { da: 'Ingen lag valgt',    en: 'No layer selected' },
        'delayed'   : { da: 'FORSINKET',          en: 'DELAYED' },
    });

//    L.Control.BsLegend = L.Control.BsButtonBox.extend({
    L.Control.BsLegend = L.Control.BsModal.extend({
        options: {
            position       : "topright",
            icon           : ns.mapLegendIcon + ' fa-lg',
            semiTransparent: true,
            content: {
                header             : ns.mapLegendHeader,
                clickable          : false,
                noVerticalPadding  : false,
                noHorizontalPadding: false,
                width              : 300,
                scroll             : true,
maxHeight: 300,

                content            : []
            }
        },

        initialize: function(options) {
            //Set default BsButtons-options
//HER            L.Control.BsButtonBox.prototype.initialize.call(this, options);
            L.Control.BsModal.prototype.initialize.call(this, options);
            this.legends = {};
            this._legendCounter = 0;
        },

        onAdd: function(map) {
//HER            var result = L.Control.BsButtonBox.prototype.onAdd.call(this, map);
            var result = L.Control.BsModal.prototype.onAdd.call(this, map);

console.log(this, result);
            this.$modalBody = this.bsModal.bsModal.$body;
            this.$modalBody.empty();

            //Add the 'No layer' text
            this.noLayer =
                $('<div/>')
                    .addClass('fcoo-no-legends-container')
                    .html('&nbsp; Skide godt')
                    .appendTo( this.$modalBody );


            return result;
        },

        /*******************************************
        addLegend
        *******************************************/
        addLegend: function(  options ) {
            var legendId = this._legendCounter++;
            this.legends[legendId] = new Legend( legendId, options, this.$modalBody );
            this.legends[legendId].update();
            this.noLayer.hide();
            return legendId;
        },

        /*******************************************
        removeLegend
        *******************************************/
        removeLegend: function(legendId) {
            if (this.legends[legendId]){
                this.legends[legendId].remove();
                delete this.legends[legendId];
            }
            if ( $.isEmptyObject( this.legends ) )
                this.noLayer.show();

        },

        /*******************************************
        updateLegend
        *******************************************/
        updateLegend: function( legendId, options ){
            if (this.legends[legendId])
                this.legends[legendId].update( options );
        }
    }); //end of L.Control.BsLegend = L.Control.BsButtonBox.extend({

    //Install L.Control.BsLegend
    L.Map.mergeOptions({
        bsLegendControl       : false,
        bsLegendControlOptions: {}
    });

    L.Map.addInitHook(function () {
        if (this.options.bsLegendControl){
            this.bsLegendControl = new L.Control.BsLegend( this.options.bsLegendControlOptions );
            this.addControl(this.bsLegendControl);

            //For backward compatibility: Also set as legendControl
            this.legendControl = this.bsLegendControl;
        }
    });


    /*****************************************************************
    Legend
    ******************************************************************/
    function createElement( tagName, htmlOrKeyOrPhrase ){
        return $('<'+tagName+'/>').i18n( htmlOrKeyOrPhrase, 'html' );
    }

    function removeLegend( e ){
        var legend = e.data.legend;
        e.stopPropagation();
        legend.legendControl.removeLegend( legend.legendId );
    }

    function Legend( legendId, options, $modalBody ){
        this.legendId = legendId;
        this.options = options;
        this.$modalBody = $modalBody;

    }

      //Extend the prototype
    Legend.prototype = {

        //update
        update: function( options ){
            if (options)
                $.extend( this.options , options );
            var opt = this.options;

            var isDelayed = false,
                nextM = null;
            if (opt.lastUpdated && opt.updatesPerDay){
                nextM = moment( opt.lastUpdated ).add( 24/opt.updatesPerDay, 'h').ceil(15, 'minutes');
                isDelayed = nextM.isBefore(moment());
            }





            //Create container first time
            this.$container = this.$container || $('<div/>').appendTo( this.$modalBody );

//HER                                $('<div/>')
//HER                                    .addClass('fcoo-legend-container')
//HER                                    .appendTo( this.$modalBody );
//HER                                    .insertBefore( $(this.legendControl.noLayer) );

            //Clear container
            this.$container.empty();
//HER            this.$container.html('');

            var modalOptions = {
                show: false,
                    header: {
                        text: 'Header'
                    },

                    closeButton: false,
                    /*fixedContent*/content: '<img style="width:250px; height:40px" src="https://wms03.fcoo.dk/webmap/v2/data/DMI/HARMONIE/DMI_NEA_MAPS_v005C.nc.wms?request=GetColorbar&amp;styles=horizontal%2Cnolabel&amp;cmap=Wind_ms_BGYRP_11colors">',
                    //content: ' ',

                    isExtended: true,//this.options.defaultOpen,
                    extended: {
                        fixedContent: true,
                        content     : [{text:'extended#1'}, {text:'extended#2'}]
                    }
                };



            this.$container._bsModalContent(modalOptions);

return;
            //Create the header
            this.$header = $('<h2/>').appendTo( this.$container );

            if (isDelayed)
                this.$header.addClass('delayed');

            if (opt.longName){
                this.$header.append( createElement( 'span', opt.longName ) );
                if (opt.units)
                    this.$header
                        .append('&nbsp;[')
                        .append( createElement( 'span', opt.units ) )
                        .append(']');
            }

            //Create the image
            $('<img>')
                .attr('src', opt.imageUrl)
                .appendTo(this.$container);

            //Create the extra information
            var addExtra = false,
                $extra = $('<div/>').addClass('extra');

            //Source
            if (opt.source){
                var $sourceSpan = $('<span/>');
                //If source is a array => create with ' / ' between
                if ($.isArray(opt.source)){
                    for (var i=0; i<opt.source.length; i++ ){
                        if (i)
                            $sourceSpan.append( '&nbsp;/&nbsp;' );
                        $sourceSpan.append( $.i18nLink( opt.source[i] ) );
                    }
                }
                else
                    $sourceSpan.append( $.i18nLink( opt.source ) );

                $('<div/>')
                    .append( createElement( 'span', i18nNamespace+':source' )  )
                    .append( $sourceSpan )
                    .appendTo( $extra );
                addExtra = true;
            }

            function addMoment( labelKey, m ){
                $('<div/>')
                    .append( createElement( 'span', i18nNamespace+':'+labelKey )  )
                    .append( $('<span/>').vfValueFormat( m, 'datetime'/*'datetime_short'*/ ) )
                    .appendTo( $extra );
                addExtra = true;
            }

            //Last updated
            if (opt.lastUpdated)
                addMoment('updated', opt.lastUpdated );

            //Analyse
            if (opt.epoch)
                addMoment('analysis', opt.epoch );

            //Expected update
//            if (opt.lastUpdated && opt.updatesPerDay){
            if (nextM){
//                var nextM = moment( opt.lastUpdated ).add( 24/opt.updatesPerDay, 'h').ceil(15, 'minutes');
//                if (nextM.isBefore(moment())){
                if (isDelayed){
                    $('<div/>')
                        .append( createElement( 'span', i18nNamespace+':exp-update' )  )
                        .append(
                            $('<span/>')
                                .i18n( i18nNamespace+':delayed' )
                                .addClass('text-danger font-weight-bold')
                        )
                        .appendTo( $extra );
                    addExtra = true;
                }
                else
                    addMoment('exp-update', nextM );
            }


            //Append $extra if it is not empty
            if (addExtra){
                this.$header
                    .addClass('clickable')
                    .on('click', $.proxy( this.toggleOpen, this ) );
                this.$chevron = $('<i/>')
                                    .addClass('far fa-chevron-right')
                                    .prependTo( this.$header );

                $extra.appendTo( this.$container );

//HER                if (this.options.defaultOpen)
//HER                    this.toggleOpen();

            }

//HER            //Add remove-layer-button
//HER            if (this.options.onRemove)
//HER                $('<i/>')
//HER                    .addClass('far fa-times')
//HER                    .on('click', { legend: this }, removeLegend )
//HER                    .i18n(i18nNamespace+':remove', 'title')
//HER                    .appendTo( this.$header );


        }, //end og Legend.update

        //toggleOpen
        toggleOpen: function(){
            this.$header.toggleClass('open');
            this.$chevron.toggleClass('fa-rotate-90');
        },

        //remove
        remove: function(){
            this.$container.remove();
//HER            if (this.options.onRemove)
//HER                this.options.onRemove( this.options );
        }


    }; //end of Legend.prototype = {


}(jQuery, window.moment, L, this, document));



