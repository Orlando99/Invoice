'use strict';

//Parse.$ = jQuery;

// Initialize Parse with your Parse application javascript keys
// test app.
//Parse.initialize("R7ar2YrJEpUb7BbeZfVt9hMNrXWXTm5q4JGJgPkX",
                 //"XoVDCs3Zx0DUZAq1Pk2WGYOLgJfbzXp83g2QoZ10");

// actual app. Danger Zone!

var IUKeys = {
	appID : "qYl5hDbdWGTNXvug7EcnF6S7DUaFc4dHKUb1dNq3",
	jsKey : "D7nGqgOC97j9ZM7p4rdurZ3P0pSaqTAmCN0xFK7T"
}

Parse.initialize(IUKeys.appID,IUKeys.jsKey);

var invoicesUnlimited = angular.module('invoicesUnlimited', ['ui.router', 'ui.bootstrap'])
.config(function($locationProvider){
	//$locationProvider.html5Mode(true).hashPrefix('');
})

.directive('stringToNumber', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      ngModel.$parsers.push(function(value) {
        return '' + value;
      });
      ngModel.$formatters.push(function(value) {
        return parseInt(value, 10);
      });
    }
  };
});

/*invoicesUnlimited.run(['$rootScope', '$state', function($rootScope, $state) {

    $rootScope.$on('$stateChangeStart', function(evt, to, params) {
      if (to.redirectTo) {
        evt.preventDefault();
        $state.go(to.redirectTo, params)
      }
    });
}]);*/
