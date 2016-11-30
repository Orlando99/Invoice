'use strict';

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

Array.prototype.rotate = function( n ) {
  this.unshift.apply( this, this.splice( n, this.length ) )
  return this;
}
/*
var IUKeys = {
	appID : "qYl5hDbdWGTNXvug7EcnF6S7DUaFc4dHKUb1dNq3",
	jsKey : "D7nGqgOC97j9ZM7p4rdurZ3P0pSaqTAmCN0xFK7T"
}

Parse.initialize(IUKeys.appID,IUKeys.jsKey);
*/
/*
var OurParse = {
  appID : "qYl5hDbdWGTNXvug7EcnF6S7DUaFc4dHKUb1dNq3",
  serverURL : "https://invoiceunlimited.herokuapp.com/parse"
}
*/

var OurParse = {
  appID : "qYl5hDbdWGTNXvug7EcnF6S7DUaFc4dHKUb1dNq3",
  serverURL : "https://sslsecuredfiles.com/parse",
    jsKey: "Xjf3GvwUO0SNsz0nCeM0NjlvQlDlmxGHOi6PqfzI"
}

Parse.initialize(OurParse.appID,OurParse.jsKey);
Parse.serverURL = OurParse.serverURL;

var COMPONENTS = './app/components/';
var CSS_DIR = './assets/css/';
var IMG_DIR = './assets/images/';
var JS_DIR = './assets/js/';
var colorCount = 98;
var createItemOpener = {'entity':{'title':'+ Create new item'}, 'dummy':true};
var createTaxOpener = {'name':'+ Create new tax', 'dummy':true};
var createCustomerOpener = {'entity':{'displayName':'+ Create new Customer'}, 'dummy':true};
var createTaskOpener = {'attributes':{'taskName':'+ Create new task'}, 'taskName':'+ Create new task', 'dummy':true};
var createUserOpener = {'userName':'+ Create new User', 'dummy':true};
var fromTutorial = false;

var GetTemplate = function(name,file) {
  return COMPONENTS + name + '/views/' + file;
}

function numberValidation(textValue)
{
    var k = textValue.which;
    if(k == 101)
    {
      textValue.preventDefault();
    }   
}

function numberValidationOnText(textValue)
{
    var k = textValue.which;
    if((k < 48 || k > 57) && k != 46)
    {
      textValue.preventDefault();
    }   
}
 
var invoicesUnlimited = angular.module('invoicesUnlimited', ['ui.router','oc.lazyLoad','ui.bootstrap','ngSanitize'])
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
/*
var mobileOptions = {
  onKeyPress : function(cep,e,field,options){
    var masks = ['0 (000) 000-0000','(000) 000-0000','Z0 (000) 000-0000'];
    var cond = cep.replace("(","");
      
      if(!cep.length){
          $('.mobilePhone').mask(mask,options);
      }
      
    var mask = (!cep.length||cep[0] == "1") ? masks[0] : masks[1];
    $('.mobilePhone').mask(mask,options);
  }
}
*/

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

function getrotateCount(month) {
  var mnth = month.slice(0,3).toUpperCase();
  switch(mnth) {
  case 'JAN': return 0;
  case 'FEB': return 1;
  case 'MAR': return 2;
  case 'APR': return 3;
  case 'MAY': return 4;
  case 'JUN': return 5;
  case 'JUL': return 6;
  case 'AUG': return -5;
  case 'SEP': return -4;
  case 'OCT': return -3;
  case 'NOV': return -2;
  case 'DEC': return -1;
  default: return 0;
  }

}

function colorCodeToValue(number) {
  switch(number) {
  case 0:
    return 'rgba(47,112,225,1)';
  case 1:
    return 'rgba(83,215,106,1)';
  case 2:
    return 'rgba(221,170,59,1)';
  case 3:
    return 'rgba(229,0,15,1)';
  case 4:
    return 'rgba(250,235,215,1)';
  case 5:
    return 'rgba(253,245,230,1)';
  case 6:
    return 'rgba(255,255,240,1)';
  case 7:
    return 'rgba(255,245,238,1)';
  case 8:
    return 'rgba(248,248,255,1)';
  case 9:
    return 'rgba(255,250,250,1)';
  case 10:
    return 'rgba(250,240,230,1)';
  case 11:
    return 'rgba(64,64,64,1)';
  case 12:
    return 'rgba(128,128,128,1)';
  case 13:
    return 'rgba(191,191,191,1)';
  case 14:
    return 'rgba(133,117,112,1)';
  case 15:
    return 'rgba(118,122,133,1)';
  case 16:
    return 'rgba(34,34,34,1)';
  case 17:
    return 'rgba(28,160,170,1)';
  case 18:
    return 'rgba(103,153,170,1)';
  case 19:
    return 'rgba(141,218,247,1)';
  case 20:
    return 'rgba(99,161,247,1)';
  case 21:
    return 'rgba(112,219,219,1)';
  case 22:
    return 'rgba(0,178,238,1)';
  case 23:
    return 'rgba(13,79,139,1)';
  case 24:
    return 'rgba(67,114,170,1)';
  case 25:
    return 'rgba(89,113,173,1)';
  case 26:
    return 'rgba(100,149,237,1)';
  case 27:
    return 'rgba(190,220,230,1)';
  case 28:
    return 'rgba(13,26,35,1)';
  case 29:
    return 'rgba(23,137,155,1)';
  case 30:
    return 'rgba(200,213,219,1)';
  case 31:
    return 'rgba(102,169,251,1)';
  case 32:
    return 'rgba(1,152,117,1)';
  case 33:
    return 'rgba(99,214,74,1)';
  case 34:
    return 'rgba(126,242,124,1)';
  case 35:
    return 'rgba(77,226,140,1)';
  case 36:
    return 'rgba(176,226,172,1)';
  case 37:
    return 'rgba(99,111,87,1)';
  case 38:
    return 'rgba(69,139,0,1)';
  case 39:
    return 'rgba(32,87,14,1)';
  case 40:
    return 'rgba(91,114,34,1)';
  case 41:
    return 'rgba(107,142,35,1)';
  case 42:
    return 'rgba(134,198,124,1)';
  case 43:
    return 'rgba(216,255,231,1)';
  case 44:
    return 'rgba(56,237,56,1)';
  case 45:
    return 'rgba(87,121,107,1)';
  case 46:
    return 'rgba(233,87,95,1)';
  case 47:
    return 'rgba(151,27,16,1)';
  case 48:
    return 'rgba(241,167,162,1)';
  case 49:
    return 'rgba(228,31,54,1)';
  case 50:
    return 'rgba(255,95,154,1)';
  case 51:
    return 'rgba(205,92,92,1)';
  case 52:
    return 'rgba(190,38,37,1)';
  case 53:
    return 'rgba(240,128,128,1)';
  case 54:
    return 'rgba(80,4,28,1)';
  case 55:
    return 'rgba(242,71,63,1)';
  case 56:
    return 'rgba(255,99,71,1)';
  case 57:
    return 'rgba(255,105,180,1)';
  case 58:
    return 'rgba(255,228,225,1)';
  case 59:
    return 'rgba(187,18,36,1)';
  case 60:
    return 'rgba(105,5,98,1)';
  case 61:
    return 'rgba(207,100,235,1)';
  case 62:
    return 'rgba(229,180,235,1)';
  case 63:
    return 'rgba(140,93,228,1)';
  case 64:
    return 'rgba(191,95,255,1)';
  case 65:
    return 'rgba(139,102,139,1)';
  case 66:
    return 'rgba(204,153,204,1)';
  case 67:
    return 'rgba(135,38,87,1)';
  case 68:
    return 'rgba(255,20,147,1)';
  case 69:
    return 'rgba(54,11,88,1)';
  case 70:
    return 'rgba(135,159,237,1)';
  case 71:
    return 'rgba(218,112,214,1)';
  case 72:
    return 'rgba(215,170,51,1)';
  case 73:
    return 'rgba(192,242,39,1)';
  case 74:
    return 'rgba(229,227,58,1)';
  case 75:
    return 'rgba(205,171,45,1)';
  case 76:
    return 'rgba(254,241,181,1)';
  case 77:
    return 'rgba(139,117,18,1)';
  case 78:
    return 'rgba(240,226,187,1)';
  case 79:
    return 'rgba(240,238,215,1)';
  case 80:
    return 'rgba(240,238,215,1)';
  case 81:
    return 'rgba(245,245,220,1)';
  case 82:
    return 'rgba(242,187,97,1)';
  case 83:
    return 'rgba(184,102,37,1)';
  case 84:
    return 'rgba(248,197,143,1)';
  case 85:
    return 'rgba(250,154,79,1)';
  case 86:
    return 'rgba(237,145,33,1)';
  case 87:
    return 'rgba(247,145,55,1)';
  case 88:
    return 'rgba(199,63,23,1)';
  case 89:
    return 'rgba(138,54,15,1)';
  case 90:
    return 'rgba(94,38,5,1)';
  case 91:
    return 'rgba(141,60,15,1)';
  case 92:
    return 'rgba(123,63,9,1)';
  case 93:
    return 'rgba(196,142,72,1)';
  case 94:
    return 'rgba(252,230,201,1)';
  case 95:
    return 'rgba(222,182,151,1)';
  case 96:
    return 'rgba(70,45,29,1)';
  case 97:
    return 'rgba(160,82,45,1)';
  default:
    return 'rgba(236,214,197,1)';
  }
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
});

Chart.pluginService.register({
  beforeRender: function (chart) {
    if (chart.config.options.showAllTooltips) {
      // create an array of tooltips
      // we can't use the chart tooltip because there is only one tooltip per chart
      chart.pluginTooltips = [];
      chart.config.data.datasets.forEach(function (dataset, i) {
        chart.getDatasetMeta(i).data.forEach(function (sector, j) {
          chart.pluginTooltips.push(new Chart.Tooltip({
            _chart: chart.chart,
            _chartInstance: chart,
            _data: chart.data,
            _options: chart.options.tooltips,
            _active: [sector]
          }, chart));
        });
      });

      // turn off normal tooltips
      chart.options.tooltips.enabled = false;
    }
  },
  afterDraw: function (chart, easing) {
    if (chart.config.options.showAllTooltips) {
      // we don't want the permanent tooltips to animate, so don't do anything till the animation runs atleast once
      if (!chart.allTooltipsOnce) {
        if (easing !== 1)
          return;
        chart.allTooltipsOnce = true;
      }

      // turn on tooltips
      chart.options.tooltips.enabled = true;
      Chart.helpers.each(chart.pluginTooltips, function (tooltip) {
        tooltip.initialize();
        tooltip.update();
        // we don't actually need this since we are not animating tooltips
        tooltip.pivot();
        tooltip.transition(easing).draw();
      });
      chart.options.tooltips.enabled = false;
    }
  }
});
