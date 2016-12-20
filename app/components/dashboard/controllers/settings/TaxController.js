'use strict';
  var digitsOnly = /[1234567890]/g;
    var integerOnly = /[0-9\.]/g;
    var alphaOnly = /[A-Za-z]/g;
    var usernameOnly = /[0-9A-Za-z\._-]/g;
invoicesUnlimited.controller('TaxController',['$scope', '$state', '$controller',
	'userFactory', 'taxService',
	function($scope,$state,$controller,userFactory,taxService){

	if(! userFactory.entity.length) {
		console.log('User not logged in');
		return undefined;
	}

        if(fromTutorial){
            $('.tutorial').show();
            initializeScopeVariables();
            $('#addTaxForm').validate().resetForm();
            $('.new-tax').addClass('show');
        }
        else{
            $('.tutorial').hide();
        }
        
	var user = userFactory.entity[0];
	$controller('DashboardController',{$scope:$scope,$state:$state});

	getTaxes();
	initalizeModalClasses();
	initializeScopeVariables();

	$('#addTaxForm').validate({
		rules: {
			name: 'required',
			rate : {
				required : true,
				number : true
			}
		},
		messages: {
			name : 'Please enter Tax name',
			rate : {
				required : 'Tax percentage is required.',
				number : 'Please enter a valid percentage.'
			}
		}
	});
          
 $('#addTaxGroupForm').validate({
		rules: {
			name: 'required'
		},
		messages: {
			name : 'Please enter Tax Group name'
		}
	});
        
	$('#editTaxForm').validate({
		rules: {
			name: 'required',
			rate : {
				required : true,
				number : true
			}
		},
		messages: {
			name : 'Please enter Tax name',
			rate : {
				required : 'Tax percentage is required.',
				number : 'Please enter a valid percentage.'
			}
		}
	});

	function initializeScopeVariables() {
		$scope.taxId = 0;
		$scope.taxName = '';
		$scope.taxRate = '';
		$scope.isCompound = false;
	}

	function getTaxes() {
		taxService.getTaxes(user,function(taxContent){
			$scope.taxes = taxContent;
            $scope.displayedTaxes = $scope.taxes;
		});
	}
 //
   $scope.sortByTaxName= function(){
    $scope.taxes.sort(function(a,b){
        return a.name.localeCompare(b.name)});
       $('#name').css({
            'display': 'inline-table'
        });
            $('#percentage').css({
            'display': 'none'
        });
    }
   
   $scope.sortByPercentage= function(){
    $scope.taxes.sort(function(a,b){
        return a.rate < (b.rate)});
       $('#name').css({
            'display': 'none'
        });
            $('#percentage').css({
            'display': 'inline-table'
        });
    }
        
//        
	$scope.print_values = function() {
		console.log("tax name: " + $scope.taxName);
		console.log("tax rate: " + $scope.taxRate);
		console.log("is compound: " + $scope.isCompound);
	}

	$scope.clearAddItemFields = function() {
		initializeScopeVariables();
		$('#addTaxForm').validate().resetForm();
	}
    
    $scope.clearAddTaxGroupFields = function() {
		initializeGroupTaxVariables();
		$('#addTaxGroupForm').validate().resetForm();
	}
    
    function initializeGroupTaxVariables(){
        $scope.taxGroupId = 0;
		$scope.taxGroupName = '';
        $scope.taxesForGroup = [];
        $scope.shouldAdd = [];
        
        $scope.taxes.forEach(function(obj){
            if(obj.type != 2){
                $scope.taxesForGroup.push(obj);
                $scope.shouldAdd.push(false);
            }
        });
    }
        
    $scope.saveNewGroupTax = function() {
		if(! $('#addTaxGroupForm').valid()) return;
		
        showLoader();
        
        var associatedTaxes = [];
        var compundCount = 0;
        var compundRate = 0;
        var total = 0;
        for(var i = 0; i < $scope.taxesForGroup.length; ++i){
            if($scope.shouldAdd[i]){
                associatedTaxes.push($scope.taxesForGroup[i].entity);
                total += $scope.taxesForGroup[i].rate;
                if($scope.taxesForGroup[i].isCompound){
                    compund += $scope.taxesForGroup[i].rate;
                    compundCount++;
                }
            }
        }
        
        if(compundCount > 1){
            ShowMessage('You can assign only one compund tax to a tax group.', 'error');
            hideLoader();
            return;
        }
        
        if(associatedTaxes.length < 1){
            ShowMessage('You must select at least 1 tax.', 'error');
            hideLoader();
            return;
        }
        
		var params = {
			title: $scope.taxGroupName,
			value: total,
			compound: compundRate,
			user: user,
            associatedTaxes: associatedTaxes
		};
        
		taxService.saveNewTax(params, function(response){
			console.log(response);
            hideLoader();
            if(fromTutorial){
                $state.go('dashboard.settings.items')
            }
            else{
                $(".new-tax-group").removeClass("show");
                getTaxes();
            }
		});
        
	}

	$scope.saveNewTax = function() {
		if(! $('#addTaxForm').valid()) return;
		
        showLoader();
        
		var params = {
			title: $scope.taxName,
			value: Number($scope.taxRate),
			compound: ($scope.isCompound ? 1 : 0),
			user: user
		};

		taxService.saveNewTax(params, function(response){
			console.log(response);
            hideLoader();
            if(fromTutorial){
                $state.go('dashboard.settings.items')
            }
            else{
                $(".new-tax").removeClass("show");
                getTaxes();
            }
		});
	}
    
    $scope.nextClicked = function(){
        $('.tutorial').hide();
    }
	
	$scope.editTax = function(tax) {
		$('#editTaxForm').validate().resetForm();
		$(".edit-tax").addClass("show");
		// record selected tax attributes
		$scope.taxId = tax.id;
		$scope.taxName = tax.name;
		$scope.taxRate = tax.rate;
		$scope.isCompound = tax.isCompound;
	}

	$scope.saveEditedTax = function() {
		if(! $('#editTaxForm').valid()) return;

		var params = {
			taxId: $scope.taxId,
			taxName: $scope.taxName,
			taxRate: $scope.taxRate,
			isCompound: $scope.isCompound
		};
		var promise = taxService.saveEditedTax(params);
		$(".edit-tax").removeClass("show");

		promise.then(function(res) {
			console.log("all done");
			getTaxes();
		}, function(error) {
			console.log("from controller: " + error.message);
		});

	}
	
	$scope.deleteTax = function(tax) {
		console.log("delete Click Now");
        $scope.taxToDelete = tax.id;
        $('.delete-tax').addClass('show');
	}
    
    $scope.confirmDelete = function(){
        showLoader();
        var tax = Parse.Object.extend("Tax");
        var query = new Parse.Query(tax);
        query.get($scope.taxToDelete, {
          success: function(taxObj) {
            // The object was retrieved successfully.
            taxObj.destroy()
            .then(function(){
                hideLoader();
                window.location.reload();
            });
          },
          error: function(object, error) {
            hideLoader();
              console.log(error);
          }
        });
    }
    
    $scope.deleteTaxWithotConfirm = function(){
        showLoader();
        var tax = Parse.Object.extend("Tax");
        var query = new Parse.Query(tax);
        query.get($scope.taxId, {
          success: function(taxObj) {
            // The object was retrieved successfully.
            taxObj.destroy()
            .then(function(){
                hideLoader();
                window.location.reload();
            });
          },
          error: function(object, error) {
            hideLoader();
              console.log(error);
          }
        });
    }
    $scope.search = function()
    {
        if($scope.searchText.length)
        {
          $scope.taxes = $scope.displayedTaxes.filter(function(obj)
          {
             if(!obj.name)
             {
               obj.name = "";  
             }
             if(!obj.rate)
             {
               obj.rate = "";  
             } 
              
            return obj.name.toLowerCase().includes($scope.searchText.toLowerCase())||
            obj.rate.toString().toLowerCase().includes($scope.searchText.toLowerCase());
               
          });
        }
        else
        {
            $scope.taxes = $scope.displayedTaxes;
        }
    }
}]);
