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

var defineXProperties = function(object,fields){
  for (var name in fields) {
    var obj = fields[name];
    if (obj == "File") {
      object.__defineGetter__(name,(function(fieldName){
        return function(){
          return this.get(fieldName);
        }
      })(name));
      object.__defineSetter__(name,(function(fieldName){
        return function(newValue){
          var data;
          if (newValue.base64) data = {base64:newValue.base64};
          else if (newValue.file) data = file;
          else if (newValue.bytes) data = bytes;
          var file = new Parse.File(fieldName + newValue.ext,data);
          return this.set(fieldName, file);
        }
      })(name));
    }
  }
}

function setObjectOperations(object,fieldName,parent,fields,xFields){

  if (!fieldName && !parent && !fields && !xFields) {
    fields = object.fields;
    parent = object.parent;
    fieldName = object.fieldName;
    xFields = object.xFields;
    object = object.object;
  }

  if (fields) defineProperties(object,fields);
  if (xFields) defineXProperties(object,xFields);

  if (!parent) return;
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

function initalizeModalClasses()
{
  $(".modal-opener").off("click");
  $(".modal-close").off("click");
  $(".popup-modal").off("click");
  $(".modal-opener").on("click", function() {
    console.log(".modal-opener clicked");
        var t = $(this)
          , e = t.attr("data-toggle");
        $("." + e).addClass("show")
    });
    $(".modal-close").on("click", function() {
        $(this).closest(".popup-modal").removeClass("show")
    });
    $(".popup-modal").on("click", function(t) {
        t.target == this && $(".popup-modal").removeClass("show")
    });
}
