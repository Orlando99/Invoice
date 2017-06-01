'use strict';

invoicesUnlimited.controller('ExpenseCategoryController',['$q', '$scope','$state', '$controller',
	'userFactory', 'expenseService', 'coreFactory', 'expenseCategoryFactory', 'expenseCategoryService',
function($q, $scope, $state, $controller, userFactory, expenseService, coreFactory, expenseCategoryFactory,
	expenseCategoryService) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

	if(userFactory.entity[0].get('role') == 'Sales'){
		$state.go('dashboard.sales.invoices.all');
		return;
	}
	
var user = userFactory.entity[0];
var organization = user.get('organizations')[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

loadCategories();
loadColors();
$scope.catColors = [];
function loadCategories () {
	showLoader();
	$q.when(coreFactory.getExpenseCategories({
		organization : organization
	}))
	.then(function(categories) {
		$scope.categories = categories.sort(function(a,b){
			return alphabeticalSort(a.entity.name,b.entity.name)
		});
        colorCodeToValue
        $scope
        
        $scope.shouldDelete = new Array($scope.categories.length);
        for(var i = 0; i < $scope.categories.length; ++i){
            $scope.shouldDelete[i] = false;
            $scope.catColors.push(colorCodeToValue($scope.categories[i].entity.get('color')));
        }
		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
}

function loadColors() {
	var colors = [];
	for(var i=0; i < colorCount; ++i) {
		colors.push(colorCodeToValue(i));
	}
	$scope.colors = colors;
}
    
$scope.deleteCategories = function(){
    var a = $scope.shouldDelete;
    var cat = [];
    
    for(var i = 0; i < $scope.categories.length; ++i){
        if($scope.shouldDelete[i])
            cat.push($scope.categories[i].entity);
    }
    
    if(cat.length > 0){
        showLoader();
        Parse.Object.destroyAll(cat)
        .then(function(){
            hideLoader();
            window.location.reload();
        });
    }
    else{
        ShowMessage("No category selected!","error");
        return;
    }
        
}

$scope.toggleCheck = function(){
    for(var i = 0; i < $scope.categories.length; ++i)
            $scope.shouldDelete[i] = $scope.selectAll;
}

// $scope.selectedColor is used in both add/edit
$scope.setColor = function(index) {
	$scope.selectedColor = colorCodeToValue(index);

	if($scope.newCategory)
		$scope.newCategory.colorCode = index;
	if($scope.editCategory)
		$scope.editCategory.colorCode = index;
}

$scope.prepareAddCategory = function() {
	$scope.selectedColor = colorCodeToValue(0);
	$scope.newCategory = {
		name : '',
		desc : '',
		colorCode : 0
	}

	$('#addCategoryForm').validate({
		rules: {
			name : 'required'
		}
	});
	$('#addCategoryForm').validate().resetForm();
}

$scope.showCategoryDetail = function(index) {
	var category = $scope.categories[index];
	$scope.editCategoryIndex = index;
	$scope.selectedColor = colorCodeToValue(category.entity.color);
	
	$scope.editCategory = {
		name : category.entity.name,
		desc : category.entity.notes,
		colorCode : category.entity.color
	}
	$('#editCategoryForm').validate({
		rules: {
			name : 'required'
		}
	});
	$('#editCategoryForm').validate().resetForm();
	$('.edit-category').addClass('show');
}

$scope.createNewCategory = function() {
	if (! $('#addCategoryForm').valid())
		return;

	showLoader();
	var category = {
		userID : user,
		organization : organization,
		name : $scope.newCategory.name,
		notes : $scope.newCategory.desc,
		color : $scope.newCategory.colorCode
	}

	$q.when(coreFactory.getUserRole(user))
	.then(function(role) {
		return expenseCategoryService.createNewCategory(category, role);
	})
	.then(function(obj) {
		$scope.categories.unshift(obj);
		$('.new-category').removeClass('show');
      
        window.location.reload();
		hideLoader();
	});
}

$scope.saveEditedCategory = function() {
	if (! $('#editCategoryForm').valid())
		return;

	showLoader();
	var category = $scope.categories[$scope.editCategoryIndex];
	category.entity.set('name', $scope.editCategory.name);
	category.entity.set('notes', $scope.editCategory.desc);
	category.entity.set('color', $scope.editCategory.colorCode);

	$q.when(expenseCategoryService.saveEditedCategory(category.entity))
	.then(function(obj) {
		$scope.categories[$scope.editCategoryIndex] = obj;
		$('.edit-category').removeClass('show');
        
        window.location.reload();
		hideLoader();
	});
}

}]);