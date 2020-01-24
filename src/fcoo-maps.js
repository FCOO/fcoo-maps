/****************************************************************************
	fcoo-maps.js,

	(c) 2020, FCOO

	https://github.com/FCOO/fcoo-maps
	https://github.com/FCOO

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
	"use strict";

    window.fcoo = window.fcoo || {};
    var ns = window.fcoo.map = window.fcoo.map || {};


    ns.createFCOOMap = function( data ){
        //Create main structure
        ns.main = window.fcoo.createMain({
                mainContainerAsHandleContainer: true,
                topMenu             : data.topMenu,
                leftMenu            : data.leftMenu,
                keepLeftMenuButton  : data.keepLeftMenuButton,
                rightMenu           : data.rightMenu,
                keepRightMenuButton : data.keepRightMenuButton,

                _bottomMenu: {  //Just DEMO
                    height : 120,
                    handleWidth: 200,
                    handleHeight: 26,
                    //handleClassName: 'testHandle',
                    toggleOnHandleClick: true,
                    hideHandleWhenOpen: true
                },

                //Update all maps when main-container is resized
                onResizeDelay: 0,
                onResize: function(){
                   window.fcoo.callAllMaps('invalidateSize', [{pan:false, debounceMoveend:true}]);
                }
            });

        //Update search-button
        if (data.topMenu.search){
            var searchFunc = function(){

ns.selectMultiMaps();

                    ns.search( ns.main.topMenuObject.searchInput.val() );
                    ns.main.topMenuObject.searchInput.select().focus();
                };
            ns.main.topMenuObject.search.on('submit', searchFunc );
            ns.main.topMenuObject.searchButton.on('click', searchFunc );
        }

//HER        console.log(ns.main);

        //Create multi-maps
        ns.multiMaps = L.multiMaps( $('<div/>').appendTo(ns.main.$mainContainer) /*, options */ );

        ns.multiMaps.set('1');




    };


}(jQuery, L, this, document));



