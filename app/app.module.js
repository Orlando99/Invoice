'use strict';

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

var IUKeys = {
	appID : "qYl5hDbdWGTNXvug7EcnF6S7DUaFc4dHKUb1dNq3",
	jsKey : "D7nGqgOC97j9ZM7p4rdurZ3P0pSaqTAmCN0xFK7T"
}

Parse.initialize(IUKeys.appID,IUKeys.jsKey);

var COMPONENTS = './app/components/';
var CSS_DIR = './assets/css/';
var IMG_DIR = './assets/images/';
var JS_DIR = './assets/js/';

var GetTemplate = function(name,file) {
  return COMPONENTS + name + '/views/' + file;
}

var invoicesUnlimited = angular.module('invoicesUnlimited', ['ui.router','oc.lazyLoad','ui.bootstrap'])
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
})
.directive('fileModel', ['$parse', function ($parse) {
  return {
    restrict: 'A',
      link: function(scope, element, attrs) {
        var model = $parse(attrs.fileModel);
        var modelSetter = model.assign;
            
        element.bind('change', function(){
           scope.$apply(function(){
              modelSetter(scope, element[0].files[0]);
           });
        });
      }
  };
}])
.directive('triFixInputName', function () {
  return {
      // just postLink
      link: function (scope, element, attrs, ngModelCtrl) {
          // do nothing in case of no 'name' attribiute
          if (!attrs.name) { 
              return;
          }
          // fix what should be fixed
          ngModelCtrl.$name = attrs.name;
      },
      // ngModel's priority is 0
      priority: '-100',
      // we need it to fix it's behavior
      require: 'ngModel'
   };
});

function ShowMessage(text,type) {
  $('.message-type,.close-btn').addClass(type);
  $('.message-text').text(text);
  $('.overlay.message').css({'display':'block'});
}

function showLoader(){
    $('.overlay.loader-screen').show();
}

function hideLoader(){
    setTimeout(function(){
        $('.overlay.loader-screen').fadeOut('slow');
    },500);
}

function alphabeticalSort(a,b){
  var dispA = a;
  var dispB = b;
  return (dispA < dispB) ? -1 : (dispA > dispB) ? 1 : 0;
}

var errorCallback = function(error){
  console.log(error.message);
  return error;
}

function loadColorTheme(user){
  if (!user) alert('User is empty! Unable to load color theme!');
  var color = user.get ? user.get('colorTheme') : user.entity[0].get('colorTheme');
  if (color) color = color.replace(/app|Color/g,"").toLowerCase();
  if (color && color != 'blue' && color != 'undefined') {
    $('#appStyle').attr('href',CSS_DIR + 'main.' + color + '.css');
  } else if (color == 'blue' || color == 'undefined') {
    $('#appStyle').attr('href',"");
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

  if (arguments.length == 1) {
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
      return parent.save();
    });
  };
}

Date.prototype.formatDate = function(format,fullday) {
  var hh = this.getHours();
  var mm = this.getMinutes();
  var YY = this.getUTCFullYear();
  var MM = this.getUTCMonth()+1;
  var DD = this.getUTCDate();
  var ampm = hh >= 12 ? 'PM' : 'AM';
  
  if (!fullday) {
    hh = hh % 12;
    hh = hh ? hh : 12;
  }

  function formatSingleNum(num){
    return num < 10 ? '0'+num : num;
  }

  mm = formatSingleNum(mm);
  MM = formatSingleNum(MM);
  DD = formatSingleNum(DD);

  var result = format
    .replace(/MM/g,MM)
    .replace(/YY/g,YY)
    .replace(/DD/g,DD)
    .replace(/mm/g,mm)
    .replace(/hh/g,hh);

  if (fullday) result += " " + ampm;
  return result;
}

//-------//
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

var mobileOptions = {
  onKeyPress : function(cep,e,field,options){
    var masks = ['0 (000) 000-0000','(000) 000-0000'];
    var cond = cep.replace("(","");
    var mask = (!cep.length||cep[0] == "1") ? masks[0] : masks[1];
    $('.mobilePhone').mask(mask,options);
  }
}

$(document).on('keypress','.sign-up input',function(e) {
  if (e.keyCode == 13) {
    $('.sign-up .button-next')[0].click();
  }
});

function formatDate(date, format) {
  if(date){
    var d = moment(date);
    return d.format(format);
  }
  return date;
}

function formatNumber(num) {
    if (num)
      return num.toFixed(2);
    return "0.00";
}

function formatInvoiceNumber(number, width) {
  return new Array(width + 1 - (number + '').length).join('0') + number;
}

function calculateTax(amount, tax) {
  if (! tax) return 0;

  var res = 0;
  if (tax.type == 1)
    res = amount * tax.rate * 0.01;
  else if (tax.type == 2) {
    res = amount * tax.rate * 0.01;
    if (tax.compound)
      res = res * tax.compound * 0.01;
  }

  return res;
}

function isEmpty(obj) {
  for(var key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

function scrollToOffset(offset) {
  var offset = typeof offset !== 'undefined' ? offset : 0;
  $("html, body").animate({
    scrollTop: offset
  }, 400);
}

function isNaturalNumber(x) {
  return Number.isInteger(x) && x > 0;
}

invoicesUnlimited.directive( 'elemReady', function( $parse ) {
   return {
       restrict: 'A',
       link: function( $scope, elem, attrs ) {    
          elem.ready(function(){
            $scope.$apply(function(){
                var func = $parse(attrs.elemReady);
                func($scope);
            })
          })
       }
    }
})
