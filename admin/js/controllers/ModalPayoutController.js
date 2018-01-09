'use strict';

clientAdminPortalApp.controller('ModalPayoutController',[
	'$scope', '$modalInstance', 'extrasObject', 'gatewayTypeNames',
	function($scope, $modalInstance, extrasObject, gatewayTypeNames, Validate, ValidateModal) {

		$scope.extrasObject = extrasObject;

		$scope.extrasObject.paymentGateway = $scope.extrasObject.get("paymentGateway");
		$scope.extrasObject.EPNusername = $scope.extrasObject.get("EPNusername");
		$scope.extrasObject.EPNrestrictKey = $scope.extrasObject.get("EPNrestrictKey");
		$scope.extrasObject.AuthNet = $scope.extrasObject.get("AuthNet");
		$scope.extrasObject.AuthKey = $scope.extrasObject.get("AuthKey");

		$scope.gatewayTypeNames = gatewayTypeNames;

		$scope.canChargeClient = true;

		var nextPayoutDate = new Date();
		nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
		//nextPayoutDate.setDate(nextPayoutDate.getDate() + 7);

		nextPayoutDate.setDate(1);

		nextPayoutDate.setHours(0);
		nextPayoutDate.setMinutes(0);
		nextPayoutDate.setSeconds(1);

		$scope.nextPayoutDate = moment(nextPayoutDate).format("dddd, MMMM Do YYYY");

		var now = new Date();

		if(now.getDate() == 1){
			$('#chargeResellerBtn').removeClass("disabled");
			$scope.canChargeClient = false;
		}

		var countDownDate = nextPayoutDate.getTime();

		// Update the count down every 1 second
		var x = setInterval(function() {

			// Get todays date and time
			var now = new Date().getTime();

			// Find the distance between now an the count down date
			var distance = countDownDate - now;

			// Time calculations for days, hours, minutes and seconds
			var days = Math.floor(distance / (1000 * 60 * 60 * 24));
			var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
			var seconds = Math.floor((distance % (1000 * 60)) / 1000);

			$scope.timer = days + "d " + hours + "h " + minutes + "m " + seconds + "s ";

			if(!$scope.$$phase)
				$scope.$apply();

			// If the count down is over, write some text 
			if (distance < 0) {
				clearInterval(x);
				$scope.timer = "EXPIRED";
			}
		}, 1000);

		$scope.chargeResellers = function(){
			if(!$scope.canChargeClient)
				return;
			
			Parse.Cloud.run('resellersPayoutFunction')
			.then(function(obj){
				$modalInstance.dismiss('cancel');
			}, function(error){
				$modalInstance.dismiss('cancel');
			});
		}

		$scope.ok = function(form) {

			$scope.extrasObject.set("paymentGateway", $scope.extrasObject.paymentGateway);
			$scope.extrasObject.set("EPNusername", $scope.extrasObject.EPNusername);
			$scope.extrasObject.set("EPNrestrictKey", $scope.extrasObject.EPNrestrictKey);
			$scope.extrasObject.set("AuthNet", $scope.extrasObject.AuthNet);
			$scope.extrasObject.set("AuthKey", $scope.extrasObject.AuthKey);

			$scope.extrasObject.save()
				.then(function(obj){
				$modalInstance.close({
					newExtras : $scope.extrasObject,
				});
			});
		}

		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		}
	}]);
