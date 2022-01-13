/****************************************************************************
control-legend.js,
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

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

    L.Control.Legend = L.Control.Box.extend({
        options: {
            VERSION      : "{VERSION}",
            position     : "topright",
            defaultIconClassName: 'far',
            iconClassName: 'fa-list',
            height       : 0.8,
        },

        initialize: function(options) {
            L.Util.setOptions(this, options);
            this.legends = {};
            this._legendCounter = 0;
        },

        onAdd: function(map) {
            var result = L.Control.Box.prototype.onAdd.call(this, map);
            if (this.$header)
                this.$header.i18n( i18nNamespace+':legend' );
            if (this.$openButton)
                this.$openButton.i18n( i18nNamespace+':legend', 'title' );

            //Add the 'No layer' text
            this.noLayer =
                $('<div/>')
                    .addClass('fcoo-no-legends-container')
                    .html('&nbsp;')
                    .appendTo( this.contentContainer );


            return result;
        },

        /*******************************************
        addLegend
        *******************************************/
        addLegend: function(  options ) {
            var legendId = this._legendCounter++;
            this.legends[legendId] = new Legend( legendId, options, this );
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

    }); //end of L.Control.Legend = L.Control.extend({


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

    function Legend( legendId, options, legendControl ){
        this.legendId = legendId;
        this.options = options;
        this.legendControl = legendControl;

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
            this.$container = this.$container ||
                                $('<div/>')
                                    .addClass('fcoo-legend-container')
                                    .insertBefore( $(this.legendControl.noLayer) );

            //Clear container
            this.$container.html('');

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

                if (this.options.defaultOpen)
                    this.toggleOpen();

            }

            //Add remove-layer-button
            if (this.options.onRemove)
                $('<i/>')
                    .addClass('far fa-times')
                    .on('click', { legend: this }, removeLegend )
                    .i18n(i18nNamespace+':remove', 'title')
                    .appendTo( this.$header );


        }, //end og Legend.update

        //toggleOpen
        toggleOpen: function(){
            this.$header.toggleClass('open');
            this.$chevron.toggleClass('fa-rotate-90');
        },

        //remove
        remove: function(){
            this.$container.remove();
            if (this.options.onRemove)
                this.options.onRemove( this.options );
        }


    }; //end of Legend.prototype = {


}(jQuery, L, this, document));



