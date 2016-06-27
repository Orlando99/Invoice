'use strict';

invoicesUnlimited.controller('EstimateController',['$q', '$scope', '$state', '$controller',
	'userFullFactory', 'estimateService', 'currencyFilter',

function($q,$scope,$state,$controller,userFullFactory,estimateService,currencyFilter) {

var user = userFullFactory.authorized();
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

var isGoTo = {
	details : function(to){
		return to.endsWith('estimates.details');	
	},
	estimates : function(to){ 
		return to.endsWith('estimates.all');
	},
	edit : function(to){
		return to.endsWith('estimates.edit');
	},
	newEstimate : function(to){
		return to.endsWith('estimates.new');	
	}
};

CheckUseCase();

function CheckUseCase(stateName) {
	if (! stateName)
		stateName = $state.current.name;

	if (isGoTo.estimates(stateName)) {
		console.log('its in list')
		listEstimates();

	} else if (isGoTo.newEstimate(stateName)) {
		console.log('its in new');

	} else if (isGoTo.edit(stateName)) {
		console.log('its in edit');

	}
}

function listEstimates() {
	showLoader();
	$q.when(estimateService.listEstimates(user))
	.then(function(res) {
		res.forEach(function(obj) {
			// Draft, Sent, Invoiced, Accepted, Declined
			switch (obj.entity.status) {
			case "Draft":
			case "Sent":
				obj.statusClass = "text-color-normalize";
				break;
			case "Invoiced":
			case "Accepted":
				obj.statusClass = "text-positive";
				break;
			case "Declined":
				obj.statusClass = "text-danger";
				break;
			default:
				obj.statusClass = "text-color-normalize";
			}

			obj.estimateDate = formatDate(
				obj.entity.estimateDate, "MM/DD/YYYY");
			obj.totalAmount = currencyFilter(obj.entity.totalAmount, '$', 2);
		});

	//	res = res.reverse();
		$scope.estimateList = res;
		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});	
}

}]);