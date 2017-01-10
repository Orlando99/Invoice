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
        
    $('#editTaxGroupForm').validate({
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
            $scope.sortByTaxName();
		});
	}

   $scope.sortByTaxName= function(){
       
       if($("#name").css('display') === "none"){
            $scope.taxes.sort(function(a,b){
                return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
            });
            $('#name').css({
                'display': 'inline-table'
            });
            $('#nameUp').css({
                'display': 'none'
            });
        }
        else{
             $scope.taxes.sort(function(a,b){
                return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
             });
            $('#nameUp').css({
                'display': 'inline-table'
            });
            $('#name').css({
                'display': 'none'
            });
        }
       
            $('#percentage').css({
                'display': 'none'
            });
       
            $('#percentageUp').css({
                'display': 'none'
            });
    }
   
   $scope.sortByPercentage= function(){
       /*
        $scope.taxes.sort(function(a,b){
            return a.rate < (b.rate)
        });
       */
       if($("#percentage").css('display') === "none"){
           $scope.taxes.sort(function(a,b){
                return a.rate < (b.rate)
           });
            $('#percentage').css({
                'display': 'inline-table'
            });
            $('#percentageUp').css({
                'display': 'none'
            });
        }
        else{
            $scope.taxes.sort(function(a,b){
                return b.rate < (a.rate)
            });
            $('#percentageUp').css({
                'display': 'inline-table'
            });
            $('#percentage').css({
                'display': 'none'
            });
        }

        $('#name').css({
            'display': 'none'
        });
       
        $('#nameUp').css({
            'display': 'none'
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
        
    function initializeEditGroupTaxVariables(tax){
        $scope.taxGroupId = tax.id;
		$scope.taxGroupName = tax.entity.get('title');
        $scope.taxesForGroup = [];
        $scope.shouldAdd = [];
        
        $scope.taxes.forEach(function(obj){
            if(obj.type != 2){
                $scope.taxesForGroup.push(obj);
                $scope.shouldAdd.push(false);
            }
        });
        
        var assTaxes = tax.entity.get('associatedTaxes');
        
        for(var i = 0; i < assTaxes.length; ++i){
            for(var j = 0; j < $scope.taxesForGroup.length; ++j){
                if(assTaxes[i].id == $scope.taxesForGroup[j].id){
                    $scope.shouldAdd[j] = true;
                }
            }
        }
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
                    compundRate += $scope.taxesForGroup[i].rate;
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
        
		taxService.saveNewGroupTax(params, function(response){
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
    
    $scope.updateGroupTax = function() {
		if(! $('#editTaxGroupForm').valid()) return;
		
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
                    compundRate += $scope.taxesForGroup[i].rate;
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
        
        var taxToSave = $scope.selectedTax.entity;
        taxToSave.set('title', $scope.taxGroupName);
        taxToSave.set('value', total);
        taxToSave.set('compound', compundRate);
        taxToSave.set('associatedTaxes', associatedTaxes);
        
        taxToSave.save()
        .then(function(taxObj){
            $(".edit-tax-group").removeClass("show");
            getTaxes();
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
        if(tax.type == 1){
            $('#editTaxForm').validate().resetForm();
            $(".edit-tax").addClass("show");
            // record selected tax attributes
            $scope.taxId = tax.id;
            $scope.taxName = tax.name;
            $scope.taxRate = tax.rate;
            $scope.isCompound = tax.isCompound;
        }
        else{
            $scope.selectedTax = tax;
            $('#editTaxGroupForm').validate().resetForm();
            $(".edit-tax-group").addClass("show");
            initializeEditGroupTaxVariables(tax);
        }
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
              
            return obj.name.toLowerCase().includes($scope.searchText.toLowerCase()) ||
                obj.rate.toString().toLowerCase().includes($scope.searchText.toLowerCase());
          });
        }
        else
        {
            $scope.taxes = $scope.displayedTaxes;
        }
    }
}]);
