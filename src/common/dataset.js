/****************************************************************************
dataset.js

****************************************************************************/

(function ($, L, window, document, undefined) {
	"use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /**********************************************************
    Dataset
    Represent at set of data given as a simple record {ID: VALUE}

    The Dataset has a list of DataSetValue (see below) that represent one or more of the {ID:VALUE}s
    When the data in the Dataset are changed, all the elements displaying the changed value(s) are updated

    Method:
    createContent: function( $container, createOptions = {})
        Create all elements of all DatasetValue inside $container
        createOptions = {small: BOOLEAN, compact: BOOLEAN, noLinks: BOOLEAN} = Options for jquery-methods

    setData      : function( data, $container )
        Update all datasetValues with data={ID:VALUE}.
        $container (optional): Only update elements under $container

    options:
        showWhenNull: function(datasetValue, createOptions) (optional) Return true/false for given datasetValue, createOptions. Overwrite datasetValue.options.showWhenNull



    Each Dataset can create DOM-element(s) displaying the value and creates one input in eq. a popup-container or a modal-window


    There are tree ways to link a DatasetValue to a value in the ID of data={ID:VALUE} in its Dataset:
    Simple  :
        id = ID in {ID:DATA}. Eq id="direction" will get {direction: 123}
    Indirect:
        id = NAME, dataId=ID in {ID:DATA}. Eq id="direction_as_text" dataId="direction"  will get {direction: 123}
    Multi:
        id = NAME, datasetValueIdList=[]ID/NAME Eq. id="all_direction" datasertIdList=["direction", "direction_as_text", ..] will get the two versions of {direction: 123} defined above

    DatasetValue
    options:
        column        : BOOLEAN - Only apply if the datasetValue has multi sub-values (datasetValueIdList). When true the sub-elemens are displayed in a column. If false (dafault) the elements are placed horizontal

        showForCompact: BOOLEAN - When true the DatasetValue are only shown when the createOptions.compact == true
        hideForCompact: BOOLEAN - When true the DatasetValue is hidden when the createOptions.compact == true
        showForSmall  : BOOLEAN - When true the DatasetValue are only shown when the createOptions.small == true
        hideForSmall  : BOOLEAN - When true the DatasetValue is hidden when the createOptions.small == true

        showPartially: BOOLEAN - If true the element is visible if one or more values are <> null. If false the elemnt is hidden if one value == null
        showWhenNull : BOOLEAN - If true and the element is 'hidden' due to values = null => the content of the element is replaced with a "Unknown"-textmore values == null))

    **********************************************************/

    //fcoo.map.datasetValues = options for default DatasetValue
    nsMap.datasetValues = nsMap.datasetValues || {};

    /**********************************************************
    ***********************************************************
    Dataset
    ***********************************************************
    **********************************************************/
    var defaultDatasetOptions = {
            showWhenNull : function(datasetValue/*, createOptions*/){
                return datasetValue.options.showWhenNull;
            }
        };

    nsMap.Dataset = function(datasetValueList, options, data = {}){
        var _this = this;

        this.options = $.extend(true, defaultDatasetOptions, options);
        this.datasetValueList = [];
        this.datasetValues    = {};

        function addDatasetValue( datasetValue_or_Options ){
            //If datasetValue_or_Options is id in nsMap.datasetValues
            if (typeof datasetValue_or_Options == 'string')
                datasetValue_or_Options = $.extend(true, {}, nsMap.datasetValues[datasetValue_or_Options]);

            var datasetValue = datasetValue_or_Options instanceof nsMap.DatasetValue ?
                                datasetValue_or_Options :
                                new nsMap.DatasetValue( datasetValue_or_Options );
            datasetValue.parent = _this;

            if (!_this.datasetValues[datasetValue.id]){
                _this.datasetValueList.push(datasetValue);
                _this.datasetValues[datasetValue.id] = datasetValue;
            }
            return datasetValue;
        }

        $.each(datasetValueList, function(index, datasetValue_or_Options){

            var datasetValue = addDatasetValue( datasetValue_or_Options );

            //Add sub-datasetValues other that self (if any)
            if (datasetValue.options.datasetValueIdList)
                $.each(datasetValue.datasetValueIdList || [], function(index, datasetValue_or_Options2){
                    addDatasetValue( datasetValue_or_Options2 );
                });
        });

        this.data = data;
    };

    nsMap.dataSet = nsMap.dataset = function(list, options, data){
        return new nsMap.Dataset(list, options, data);
    };

    nsMap.Dataset.prototype = {

        /*********************************************
        createContent
        Create all elements of all DatasetValue inside $container
        createOptions = {small: BOOLEAN, compact: BOOLEAN} = Options for jquery-methods
        *********************************************/
        createContent: function( $container, createOptions = {}){
            var _this = this,
                contentList = [];

            //Sort the list of DatasetValues (optional)
            if (this.options.sort)
                this.datasetValueList = this.options.sort(this.datasetValueList, createOptions, this) || this.datasetValueList;

            //Craete the content from each datasetValues
            $.each(this.datasetValueList, function(index, datasetValue){
                var defaultShow = _this.options.show ? _this.options.show(datasetValue.id, createOptions) : true,
                    elemOrOptions = datasetValue.create(createOptions, defaultShow, _this.options.showWhenNull(datasetValue, createOptions));

                if (elemOrOptions)
                    contentList.push(elemOrOptions);
            });

            $container
                .empty()
                ._bsAppendContent( contentList );

            //Add container-class to the outer elements of each dataset-value
            //and set class to hide outer-element if all value(s9 are null
            $container.children().each( function(index){
                $(this)
                    .addClass( _this.datasetValueList[index].outerContainerClassName )
                    .toggleClass( 'hide-for-dataset-value-is-null', !_this.options.showWhenNull( _this.datasetValueList[index], createOptions ) );
            });

            this.setData( this.data, $container );

        },

        /*********************************************
        setData
        Update all datasetValues with data={ID:VALUE}
        $container (optional): Only update elements under $container
        *********************************************/
        setData: function( data, $container ){
            data = this.data = $.extend(true, {}, this.data, data);

            $.each(this.datasetValueList, function(index, datasetValue){
                datasetValue.setData( data, $container );
            });
        }
    };



    /**********************************************************
    ***********************************************************
    DatasetValue - represent one value in a Dataset
    ***********************************************************
    **********************************************************/
    var datasetValueId = 0;
    nsMap.DatasetValue = function(options){
        this.id = options.id;
        this.dataId = options.dataId || this.id;
        this.datasetValueIdList = options.datasetValueIdList || [this.id];

        this.value = null;

        this.options = $.extend(true, {
            showPartially: false,
            showWhenNull : false,
            vectorIcon   : 'far fa-up'
        }, options);

        datasetValueId++;
        this.className               = 'DSV_' + datasetValueId;     //Class-name for the element containing the value
        this.containerClassName      = 'DSV_C_' + datasetValueId;   //Class-name for the inner container of the element containing the value
        this.outerContainerClassName = 'DSV_OC_' + datasetValueId;  //Class-name for the outer container of the inner container element
    };

    nsMap.datasSetValue = nsMap.datasetValue = function(options){
        return new nsMap.DatasetValue(options);
    };


    function getElementsByClassName( $parentElement, className){
        return $parentElement ? $parentElement.find('.'+className) : $('.'+className);
    }

    nsMap.DatasetValue.prototype = {
        /*********************************************
        _getOptionsValue
        Gets this.options.ID
        Check for options.ID == value, function, or undefined
        *********************************************/
        _getOptionsValue: function(id, defaultValue = null, createOptions = {}){
            var value = this.options[id];
            if (value == undefined)
                return defaultValue;
            else
                return $.isFunction(value) ? value(createOptions) : value;
        },


        /*********************************************
        There are two main operations:
        1: Creating the elements
        2: Updating the elements with new values
        *********************************************/
        /*********************************************
        create
        Return options for one input with label, icons, text etc
        *********************************************/
        create: function(createOptions = {}, defaultShow, showWhenNull){
            if (this.options.create)
                return this.options.create.apply(this, arguments);

            var show      = null, //=unknown
                o         = this.options,
                isCompact = !!createOptions.compact,
                isSmall   = !!createOptions.small;

            //1. Check for own options
            if (o.showForCompact)
                show = isCompact;
            else
                if (o.hideForCompact)
                    show = !isCompact;
                else
                    if (o.showForSmall)
                        show = isSmall;
                    else
                        if (o.hideForSmall)
                            show = !isSmall;

            //2. Own show-function
            if ((show === null) && o.show)
                show = o.show(createOptions);

            //3. Default from Dataset
            if (show === null)
                show = defaultShow;

            return show ? {
                    label    : {icon: this.options.icon, text: this.options.text },
                    small    : !!createOptions.small,
                    fullWidth: true,
                    center   : true,

                    type     : createOptions.compact ? 'compact' : 'text',
                    text     : this.createContent.bind(this, createOptions, showWhenNull)
                }
                : null;
        },

        /*********************************************
        createContent
        *********************************************/
        createContent: function( createOptions, showWhenNull, $container ){
            //To prevent <span> inside <span> the <span> (= $container) is deleted and the content is created direct

            $container = $container.parent().empty();

            if (this.options.column)
                $container
                    .addClass('d-flex flex-column');
            else {
                $container
                    .addClass('w-100 d-flex flex-row')
                    .toggleClass('justify-content-evenly',  !this.options.center)
                    .toggleClass('justify-content-center', !!this.options.center);

                if (!this.options.center)
                    $container.css('justify-content', 'space-evenly');    //Bootstrap 4 do not support class justify-content-evenly

            }

            //Create this.datasetValueList = list of the datasetValue included in this.
            if (!this.datasetValueList){
                var datasetValues = this.parent.datasetValues,
                    list = this.datasetValueList = [];
                $.each(this.datasetValueIdList, function(index, datasetValue_or_id){
                    list.push(
                        datasetValue_or_id instanceof nsMap.DatasetValue ?
                            datasetValue_or_id :
                            datasetValues[datasetValue_or_id]
                    );
                });
            }


            $.each(this.datasetValueList, function(index, datasetValue){

                //Create and append the elements
                $container.append( datasetValue.createElement(createOptions) );

                //Set value for the new element
                datasetValue.setValue(datasetValue.parent.data[datasetValue.dataId], $container, true );

            });

            if (showWhenNull)
                $('<span/>')
                    .addClass("show-for-dataset-value-is-null")
                    ._bsAddHtml({ text: createOptions.compact ? '?' : {da:'* Ukendt *', en:'* Unknown *'} })
                    .appendTo($container);

        },

        /*********************************************
        createElement
        Create DOM-element(s) to display the value of this
        Return a element to be used to display the value
        *********************************************/
        createElement: function(createOptions){
            if (this.options.createElement)
                return this.options.createElement(createOptions, this);

            if (this.options.isVector)
                //Create a icon-element
                return $._bsCreateIcon( {icon: this.options.vectorIcon}, null, 'title', this.className + ' '+ this.containerClassName + ' hide-for-dataset-value-is-null');
            else
                return $('<span/>')
                            .addClass('hide-for-dataset-value-is-null ' + this.containerClassName)
                            ._bsAddHtml({
                                textClass: this.className,

                                vfFormat : this._getOptionsValue('vfFormat',  null, createOptions ),
                                vfOptions: this._getOptionsValue('vfOptions', null, createOptions),
                                onClick  : this.options.getOnClick ? this.options.getOnClick( createOptions ) : this.options.onClick,
                            });
        },


        /*********************************************
        setData
        Update all datasetValue in datasetValueList
        *********************************************/
        setData: function( data, $parentElement ){

            //If this hasn't be created => do not update
            if (!this.datasetValueList) return;

            var nullCount = 0;
            $.each(this.datasetValueList, function(index, datasetValue){
                var value = data[datasetValue.dataId];
                if (value === null)
                    nullCount++;
                datasetValue.setValue( value, $parentElement );
            });

            /*
            Hide/show/update the outer container regarding if the elements.value are not/some/all null
            options.showPartially: BOOLEAN - If true the element is visible if one or more values are <> null. If false the elemnt is hidden if one value == null
            options.showWhenNull : BOOLEAN - If true and the element is 'hidden' due to values = null => the content of the element is replaced with a "Unknown"-textmore values == null))
            */
            var showValue = (nullCount == 0) || (this.options.showPartially && (nullCount < this.datasetValueList.length));

            if ((showValue === this.showValue)  && !$parentElement)
                return;

            this.showValue = showValue;

            //Find all outer elements
            getElementsByClassName($parentElement, this.outerContainerClassName).toggleClass('dataset-value-is-null', !showValue);
        },

        /*********************************************
        setValue
        Update all elements displaying the value
        *********************************************/
        setValue: function (value, $parentElement, force ){
            var _this  = this;

            //Only update elements if it is a new value or a new instance (created inside $parentElement)
            if ((this.value == value) && !$parentElement)
                return;

            var isNull = (value == null),
                needToToggle = force || (this.isNull != isNull),
                adjustedValue = isNull ? null : this.options.adjustValue ? _this.options.adjustValue( value ) : value;

            this.value = value;
            this.isNull = isNull;

            if (isNull && !needToToggle)
                return;

            //Hide/show outer elements
            if (needToToggle)
                getElementsByClassName($parentElement, this.containerClassName).toggle(!isNull);

            //Update value
            if (!isNull)
                getElementsByClassName($parentElement, this.className).each(function(){
                    _this.updateElement( $(this), adjustedValue );
                });

        },

        /*********************************************
        updateElement
        *********************************************/
        updateElement: function( $element, displayValue ){
            if (this.options.updateElement)
                this.options.updateElement( $element, displayValue );
            else
                if (this.options.vfFormat)
                    $element.vfValue( displayValue );
                else
                    if (this.options.isVector)
                        $element.css('transform', 'rotate('+displayValue+'deg)');
                    else
                        $element.html(displayValue);

            if (this.options.saveValue)
                $element.data('dataSetValue', displayValue);
        }
    };

}(jQuery, L, this, document));
