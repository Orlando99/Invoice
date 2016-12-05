'use strict';

invoicesUnlimited.controller('ItemController',['$scope', '$state', '$controller', '$q',
	'userFactory', 'coreFactory', 'taxService', 'itemService',
function($scope,$state,$controller,$q,userFactory, coreFactory, taxService, itemService){

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];

$scope.currency = user.get('currency');
$scope.currencyFormat = $scope.currency.get('format');
    
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});
initalizeModalClasses();

loadItemsAndTaxes();

$.validator.addMethod(
		"CheckNumber",
		function(value,element){
            if(value.split('.').length > 2)
                return false;
            return true;
		}
	);
    
$('#addItemForm').validate({
	rules: {
		name : 'required',
		rate : {
			required : true,
			CheckNumber : true
		}
	},
	messages: {
		name : 'Please enter Item name',
		rate : {
			required : 'Item rate is required',
			CheckNumber : 'Please enter a valid price.'
		}
	}
});
    
$('#editItemForm').validate({
	rules: {
		name : 'required',
		rate : {
			required : true,
			CheckNumber : true
		}
	},
	messages: {
		name : 'Please enter Item name',
		rate : {
			required : 'Item rate is required',
			CheckNumber : 'Please enter a valid price.'
		}
	}
});

function commaSeparateNumber1(val){
  
  val = val.split(',').join('');
  if(val.indexOf('.') !== -1)
 {
   
   while (/(\d+)(\d{2})/.test(val.toString())){
      val = val.toString().replace(/(\d+)(\d{2})/, '$1'+','+'$2');
    }
   var temp = val.length - val.indexOf('.');
   //alert(temp);
   if(temp == 3)
     {
       $(".add_item_price").attr('maxlength',val.length);
     }
  }
  else
    {
      $(".add_item_price").attr('maxlength',50);
      while (/(\d+)(\d{2})/.test(val.toString())){
      val = val.toString().replace(/(\d+)(\d{2})/, '$1'+','+'$2');
    }
    }
     return val;
  }
   
function commaSeparateNumber2(val){
        
        if(val.indexOf('.') != -1){
            var temp = val.length - val.indexOf('.');
           
           if(temp == 3)
             {
               $(".add_item_price").attr('maxlength',val.length);
             }
            return val;
        }
            
        
        val = val.split(',').join('');
        if(val.length > 4)
        {
            $(".add_item_price").attr('maxlength',50);
            var right = val.substring(val.length - 4 , val.length);
            var left = val.substring(0, val.length - 4);
            return addthreecooma(left) + ',' + right;
        }
    
         return val;
  }
    
  function addthreecooma(value)
  {
      value = value.split(',').join('');
      while (/(\d+)(\d{3})/.test(value.toString())){
      value = value.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
      }
      return value;
    //alert(value);
  }
    
function commaSeparateNumber(val){
  
  val = val.split(',').join('');
  if(val.indexOf('.') !== -1)
 {
   
   while (/(\d+)(\d{3})/.test(val.toString())){
      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
   var temp = val.length - val.indexOf('.');
   //alert(temp);
   if(temp == 3)
     {
       $(".add_item_price").attr('maxlength',val.length);
     }
  }
  else
    {
      $(".add_item_price").attr('maxlength',50);
      while (/(\d+)(\d{3})/.test(val.toString())){
      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    }
     return val;
  }
    
$('.add_item_price').keyup(function(){
    if($scope.currencyFormat == '#,###,####'){
        $(this).val(commaSeparateNumber2($(this).val()));
    }
    else if($scope.currencyFormat == '##,##,##,##'){
        $(this).val(commaSeparateNumber1($(this).val()));
    }
    else{
        $(this).val(commaSeparateNumber($(this).val()));
    }
  
});
    


function loadItemsAndTaxes() {
	showLoader();
	var p = undefined;
	var promises = [];

	p = $q.when(coreFactory.getAllItems({
		organization : organization
	}))
	.then(function(items) {
		$scope.items = items;
	});
	promises.push(p);

	p = taxService.getTaxes(user, function(taxes) {
		$scope.taxes = taxes;
	});
	promises.push(p);

	$q.all(promises).then(function() {
		hideLoader();

	}, function(error) {
		console.log(error.message);
		hideLoader();

	});

}

function initializeScopeVariables() {
	$scope.itemName = '';
	$scope.itemRate1 = '';
	$scope.itemDesc = '';
	$scope.itemTax = undefined;
}

$scope.clearAddItemFields = function() {
	initializeScopeVariables();
	$('#addItemForm').validate().resetForm();
    //$('.new-item').show();
}

$scope.showItemDetail = function(index) {
	$('#editItemForm').validate().resetForm();
	$(".edit-item").addClass("show");
	var item = $scope.items[index];

	$scope.itemIndex = index;
	$scope.itemName = item.entity.title;
	$scope.itemRate1 = item.entity.rate;
	$scope.itemDesc = item.entity.itemDescription;
	$scope.itemTax = undefined;

	if (item.tax) {
		var taxes = $scope.taxes;
		for (var i = 0; i < taxes.length; ++i) {
			if (item.tax.id == taxes[i].id) {
				$scope.itemTax = taxes[i];
				break;
			}
		}
	}
}

$scope.confirmDelete = function(index) {
	var item = $scope.items[index];
	if (! item) return;

	$scope.confirmItem = item;
	$(".confirm-delete").addClass("show");
}

$scope.deleteItem = function(confirmed, index) {
	if(confirmed) {
		showLoader();
		$scope.confirmItem.entity.set('isDeleted', 1);
		$scope.confirmItem.entity.save()
		.then(function() {
			$(".confirm-delete").removeClass("show");
			hideLoader();
			$state.reload();
		});

	} else {
		$(".confirm-delete").removeClass("show");
	}
}

$scope.saveNewItem = function() {
	if(! $('#addItemForm').valid()) return;

	showLoader();
	var params = {
		user : user,
		organization : organization,
		items : [{
			title : $scope.itemName,
			rate : $scope.itemRate1.split(',').join(""),
			tax : $scope.itemTax,
			desc : $scope.itemDesc
		}]
	};

	$q.when(coreFactory.getUserRole(user))
	.then(function(role) {
		var acl = new Parse.ACL();
		acl.setRoleWriteAccess(role.get("name"), true);
		acl.setRoleReadAccess(role.get("name"), true);

		params.acl = acl;

		return itemService.createItems(params);
	})
	.then(function(items) {
        hideLoader();
        if(fromTutorial){
            $state.go('dashboard.customers.new');
        }
        else{
            $scope.items.push(items[0]);
            $(".new-item").removeClass("show");
        }

	}, function(error) {
		$(".new-item").removeClass("show");
		hideLoader();
		console.log(error.message);
	});
}

$scope.saveEditedItem = function() {
	if(! $('#editItemForm').valid()) return;

	var item = $scope.items[$scope.itemIndex];
	if (! item) return;

	showLoader();
	item = item.entity;
	item.set('title', $scope.itemName);
	item.set('rate', $scope.itemRate1.split(',').join(""));
	item.set('itemDescription', $scope.itemDesc);

	if($scope.itemTax) {
		item.set('tax', Parse.Object.extend("Tax")
			.createWithoutData($scope.itemTax.id));
	} else {
		item.unset('tax');
	}

	item.save().then(function() {
		$state.reload();

	}, function(error) {
		$(".edit-item").removeClass("show");
		hideLoader();
		console.log(error.message);
	})

}

$scope.nextClicked = function(){
        $('.tutorial').hide();
    }

$scope.closeAddItem = function(){
    $('.new-item').removeClass('show');
}

if(fromTutorial){
        $('.tutorial').show();
        initializeScopeVariables();
	    $('#addItemForm').validate().resetForm();
        $('.new-item').addClass('show');
    }
    else{
        $('.tutorial').hide();
    }

//----
/*
	if (user.get('colorTheme')) {
		var color = user.get('colorTheme');
		if (color) color = color.replace(/app|Color/g,"").toLowerCase();
		if (color) $('.colors li a.'+color).parent().addClass("active");
	}

	$scope.saveAppPreferences = function(){
		var color = $(".colors li.active").find('a').attr('class');
		var colorToSave = "app" + color[0].toUpperCase() + color.slice(1) + "Color";
		userFullFactory.save({colorTheme:colorToSave}).then(function(){
			window.location.reload();
		});
	}
*/	
}]);
