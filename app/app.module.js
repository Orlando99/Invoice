'use strict';

var IUKeys = {
	appID : "qYl5hDbdWGTNXvug7EcnF6S7DUaFc4dHKUb1dNq3",
	jsKey : "D7nGqgOC97j9ZM7p4rdurZ3P0pSaqTAmCN0xFK7T"
}

Parse.initialize(IUKeys.appID,IUKeys.jsKey);

var COMPONENTS = './app/components/';
var CSS_DIR = './assets/css/';
var IMG_DIR = './assets/images/';
var JS_DIR = './assets/js/';

var invoicesUnlimited = angular.module('invoicesUnlimited', ['ui.router', 'ui.bootstrap','oc.lazyLoad'])
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

function showLoader(){
    $('.overlay').show();
}

function hideLoader(){
    $('.overlay').hide();
}

function loadColorTheme(user){
  if (!user) alert('User is empty! Unable to load color theme!');
  var color = user.get('colorTheme');
  if (color) color = color.replace(/app|Color/g,"").toLowerCase();
  if (color && color != 'blue' && color != 'undefined') {
    $('#appStyle').attr('href',CSS_DIR + 'main.' + color + '.css');
  }
}

function resetColorTheme(){
  $('#appStyle').attr('href',"");
}

var defineProperties = function(object,fields){
  for(var i in fields){
    object.__defineGetter__(fields[i],(function(fieldName){
      return function(){
        return this.get(fieldName);
      }
    })(fields[i]));
    object.__defineSetter__(fields[i],(function(fieldName){
      return function(newValue){
        return this.set(fieldName, newValue);
      }
    })(fields[i]));
  }
}

function setObjectOperations(object,fieldName,parent,fields){

  if (!fieldName && !parent && !fields) {
    fields = object.fields;
    parent = object.parent;
    fieldName = object.fieldName;
    object = object.object;
  }

  if (fields) defineProperties(object,fields);
  object.destroyDeep = function(){
    return object.destory().then(function(obj){
      parent.unset(fieldName);
      return user.save();
    });
  };
}

/*invoicesUnlimited.run(['$rootScope', '$state', function($rootScope, $state) {

    $rootScope.$on('$stateChangeStart', function(evt, to, params) {
      if (to.redirectTo) {
        evt.preventDefault();
        $state.go(to.redirectTo, params)
      }
    });
}]);*/
