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
				required : 'tax rate is required',
				number : 'please enter a valid rate(number)'
			}
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
				required : 'tax rate is required',
				number : 'please enter a valid rate(number)'
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
		});
	}
	
	$scope.print_values = function() {
		console.log("tax name: " + $scope.taxName);
		console.log("tax rate: " + $scope.taxRate);
		console.log("is compound: " + $scope.isCompound);
	}

	$scope.clearAddItemFields = function() {
		initializeScopeVariables();
		$('#addTaxForm').validate().resetForm();
	}

	$scope.saveNewTax = function() {
		if(! $('#addTaxForm').valid()) return;
		
		var params = {
			title: $scope.taxName,
			value: Number($scope.taxRate),
			compound: ($scope.isCompound ? 1 : 0),
			user: user
		};

		taxService.saveNewTax(params, function(response){
			console.log(response);
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
	}

}]);
