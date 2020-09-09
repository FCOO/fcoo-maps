/****************************************************************************
    fcoo-maps.js,

    (c) 2020, FCOO

    https://github.com/FCOO/fcoo-maps
    https://github.com/FCOO



To create an application call window.fcoo.map.createApplication(options: OPTIONS)

createApplication will load e serie of mandatory and optional setup-json-files or setup-json-objects
each with a 'build'-function
After the build the settings in fcoo.appSetting and globalSetting are loaded

OPTIONS: {
    setup    : FILENAME or SETUP-OBJECT,
    leftMenu,
    rightMenu: {
        fileName: FILENAME, or
        data    : JSON-OBJECT,
        resolve : function( data, $leftMenuContainer ) - optional. default = fcoo.map.createLeftMenu (see fcoo-maps-create-menu.js)
    },
    metadata: {
        fileName: FILENAME,
        resolve : function( data ),
        reload  : BOOLEAN or NUMBER. If true the file will be reloaded every hour. If NUMBER the file will be reloaded every reload minutes
    },
    other: []{fileName, resolve, reload} Same as metadata

    finally: function() - optional. Function to be called when all is ready
}

FILENAME = Path to file. Two versions:
    1: Relative path locally e.q. "data/info.json"
    2: Using ns.dataFilePath (See fcoo-data-files): {subDir, fileName}.
    E.q. {subDir: "theSubDir", fileName:"theFileName.json"} => "https://app.fcoo.dk/static/theSubDir/theFileName.json"

SETUP-OBJECT: See fcoo-maps-setup-files.js for details

****************************************************************************/
(function ($, moment, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {},

    //nsMap.addFinallyEvent: Adds func (and context) to be fired when the application is created
    finallyGlobalEventName = 'CREATEAPPLICATIONFINALLY';

    nsMap.addFinallyEvent = function(callback, context, options){
        ns.events.on(finallyGlobalEventName, callback, context, options);
    };


    //Overwrite intervals.isFileName and window.intervals.getFileName to use FCOO filename conventions
    window.intervals.isFileName = function(fileNameOrData){
        return (($.type(fileNameOrData) == 'string') || (fileNameOrData.subDir && fileNameOrData.fileName));
    };

    window.intervals.getFileName = function(fileName){
        return ns.dataFilePath(fileName);
    };

    var resolveList = [],
        whenFinish = null;

    /*************************************************************************
    createApplication
    *************************************************************************/
    nsMap.createApplication = function(options){
        //Create and add a Promise for all files/data needed to load
        var promiseList = [];

        //******************************************************
        function addPromise(opt){
            if (!opt) return;

            var promise;

            if (opt.fileName)
                //File-name is given => load file
                promise = Promise.getJSON(ns.dataFilePath(opt.fileName));
            else
                if (opt.data)
                    //Data is given => resolve them
                    promise = new Promise(function(resolve/*, reject*/) {
                        resolve(opt.data);
                    });
                else
                    return;
            promiseList.push(promise);
            resolveList.push(opt);
        }
        //******************************************************

        //1. setup
        var opt = {resolve: nsMap.createFCOOMap};
        if (window.intervals.isFileName(options.setup))
            opt.fileName = options.setup;
        else
            opt.data = options.setup;
        addPromise(opt);

        //2. left-menu
        if (options.leftMenu){
            var resolveLeft = options.leftMenu.resolve || nsMap.createLeftMenu;
            options.leftMenu.resolve = function(data){ resolveLeft(data, nsMap.main.leftMenu.$menu); };
            addPromise(options.leftMenu);
        }

        //3. right-menu
        if (options.rightMenu){
            var resolveRight = options.rightMenu.resolve || nsMap.createRightMenu;
            options.rightMenu.resolve = function(data){ resolveRight(data, nsMap.main.rightMenu.$menu); };
            addPromise(options.rightMenu);
        }

        //4: Other
        $.each(options.other || [], function(index, opt){ addPromise(opt); });

        //4: Meta-data (allow both syntax)
        addPromise(opt.metadata || opt.metaData);

        //5: Finish
        whenFinish = options.finally;

        //Fetch all the promises
        Promise.defaultPrefetch();
        Promise.all( promiseList )
            .then   ( promise_all_then )
            .catch  ( nsMap.displayError )
            .finally( promise_all_finally );
    };

    function promise_all_then( dataList ){
        $.each(dataList, function(index, data){
            var opt = resolveList[index];

            //Call the resolve-function
            opt.resolve(data);

            //If the file/data needs to reload with some interval => adds the resolve to windows.intervals.addInterval after the first load
            if (opt.reload)
                window.intervals.addInterval({
                    duration: opt.reload === true ? 60 : opt.reload,
                    fileName: dataopt.fileName,
                    data    : opt.data,
                    resolve : opt.resolve,
                    reject  : null,
                    wait    : true
                );
        });
        return true;
    }

    function promise_all_finally(){
        //Call ns.globalSetting.load => ns.appSetting.load => whenFinish => Promise.defaultFinally
        ns.globalSetting.load(null, function(){
            ns.appSetting.load(null, function(){
                if (whenFinish)
                    whenFinish();
                ns.events.fire(finallyGlobalEventName);
                Promise.defaultFinally();
            });
        });
        return true;
    }

    /*************************************************************************
    **************************************************************************
    addInterval( duration, fileNameOrData, resolve, context, wait)
    Add a reload of fileNameOrData with resolve-function
    Will reload every rounded duration. Eq duration = "10 minutes" => called HH:00, HH:10, HH:20,...
    If wait == false => also call the resolve on creation
    **************************************************************************
    *************************************************************************/
    var intervalList = []; //[]{lastFloorMoment: MOMENT, list: []{fileNameOrData, resolve}

    nsMap.addInterval = function( durationMinutes, fileNameOrData, resolve, context, wait){
        var first    = !intervalList[durationMinutes],
            interval = intervalList[durationMinutes] = intervalList[durationMinutes] || {};

        interval.list = interval.list || [];
        resolve = context ? $.proxy(resolve, context) : resolve;
        var intervalRec = {
                fileNameOrData: fileNameOrData,
                resolve       : resolve
            };
        interval.list.push(intervalRec);

        if (!wait)
            execIntervalResolve(null, intervalRec);

        if (first)
            intervalTimeout(durationMinutes, true);
    };

    function intervalTimeout(durationMinutes, dontResolve){
        var interval        = intervalList[durationMinutes],
            nowFloorMoment  = moment().floor(durationMinutes, 'minutes'),
            nextFloorMoment = moment(nowFloorMoment).add(durationMinutes, 'minutes');

        window.setTimeout( function(){intervalTimeout(durationMinutes);}, nextFloorMoment.diff(moment()) );

        //Check if we need to call resolves
        if (!interval.lastFloorMoment || !nowFloorMoment.isSame(interval.lastFloorMoment)){
            interval.lastFloorMoment = nowFloorMoment;
            if (!dontResolve)
                $.each(interval.list, execIntervalResolve);
        }
    }

    function execIntervalResolve(dummy, intervalRec){
        if (isFileName(intervalRec.fileNameOrData))
            //File-name is given => load file
            Promise.getJSON(ns.dataFilePath(intervalRec.fileNameOrData), {
                noCache: true,
                resolve: intervalRec.resolve
            });
        else
            //Data is given => resolve them
            intervalRec.resolve(intervalRec.fileNameOrData);
    }


    /*************************************************************************
    **************************************************************************
    displayError
    **************************************************************************
    *************************************************************************/
    nsMap.displayError = function(){
        var appName = {da:'applikationen', en: 'the Application'};
        if (nsMap.setupData && nsMap.setupData.applicationName){
            appName.da = '<em>'+nsMap.setupData.applicationName.da + '</em>';
            appName.en = '<em>'+nsMap.setupData.applicationName.en + '</em>';
        }

        $.bsModal({
            header  : {icon: $.bsNotyIcon.error, text: $.bsNotyName.error},
            type    : 'error',
            content : $('<div/>')
                            .addClass('text-center')
                            ._bsAddHtml({
                                da: 'En af opsætningsfilerne kunne ikke læses<br>Det betyder, at ' + appName.da + ' ikke kan vises korrekt<br>Prøv evt. at <a ref="javascript:alert()">genindlæse siden</a>',
                                en: 'One of the settings files could not be read<br>Therefore ' + appName.da + ' will not be displayed correct<br>If possible, try to reload the page'
                            }),
            buttons : [{id:'fa-reload', text:{da:'Genindlæs', en:'Reload'}, onClick: function(){ window.location.reload(true); }}],
            show    : true
        });
        return false;
    };


}(jQuery, window.moment, L, this, document));



