"use strict";

var scope = new Scope();

//• watch – should get as input watchFn as mandatory parameter and listenerFn and valueEq as optional parameters
//  o registers a listener callback to be executed whenever the watchExpression changes
scope.$watch(
    function (scope) { return scope.prop1; },
    function () {
        throw 'Watch exception';
    }
);

var watcher = scope.$watch(
    function (scope) { return scope.prop1; },
    function (value, oldValue) {
        console.log('Watch executed: prop1 changed from "' + oldValue + '" to "' + value + '"');
    }
);

//• watchGroup - a variant of $watch() where it watches an array of watchExpressions. If anyone expression in the collection changes the listener is executed
scope.$watchGroup(
    [
        function (scope) { return scope.prop1; },
        function (scope) { return scope.prop2; }
    ],
    function (values, oldValues) {
        console.log('WatchGroup executed:  [' + oldValues + '] => [' + values + ']');
    }
);

watcher.disable();

//• apply – should get as input any expression for execute as optional parameter,
scope.$apply(function (scope) {
    scope.prop1 = '1';
    scope.prop2 = '2';


    //• async queue – actually should have set of expressions, that have to call during digest’s call; should be independent from digest’s calls from someone, or any changes, should call digest itself as soon as possible in the case of no functions (apply, digest) in progress
    scope.$evalAsync(function () {
        throw 'evalAsync exception';
    });

    scope.$evalAsync(function () {
        console.log('Async executed');
    });

    //• postDigest – set of functions, that should be processed after digest completed,
    scope.$postDigest(function () {
        throw 'postDigest exception';
    });

    scope.$postDigest(function () {
        console.log('PostDigest executed');
    });
});

watcher.enable();

scope.$apply(function (scope) {
    scope.prop1 = '2';
});



//• digest – processes all of the watchers of the current scope and also async queue and post digest functionality
//  o should support deep check (whatever object property we has changed or value of array)
//  o should support case if listenerFn has changed scope field
//• phases – should control functions apply and digest, and need to clear after functions completed
//• need to have exception catching
//• need to have infinity loop interrupt in the case of watchers look each other

//• need to have possibility to disable watching function

