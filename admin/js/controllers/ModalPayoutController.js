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
