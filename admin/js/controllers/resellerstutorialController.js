'use strict';

clientAdminPortalApp.controller('resellerstutorialController',
                                ['$q','$scope', '$state', '$modal', 'userRecordFactory', 'accountInfoFactory', 'businessInfoFactory','signatureFactory','principalInfoFactory','organizationFactory','currencyFactory','projectUserFactory','preferencesFactory',
                                 function($q,$scope, $state, $modal, userRecordFactory, accountInfoFactory, businessInfoFactory, signatureFactory,principalInfoFactory,organizationFactory,currencyFactory,projectUserFactory,preferencesFactory) {

                                     $scope.count = 0;

                                     $scope.changeImage = function(){

                                         if($scope.count == 0){
                                             $("#imgcont").attr('src', './images/t2.jpg');
                                             $scope.count++;
                                         }
                                         else if($scope.count == 1){
                                             $("#imgcont").attr('src', './images/t3.jpg');
                                             $scope.count++;
                                         }
                                         else if($scope.count == 2){
                                             $("#imgcont").attr('src', './images/t4.jpg');
                                             $scope.count++;
                                         }
                                         else if($scope.count == 3){
                                             $("#imgcont").attr('src', './images/t5.jpg');
                                             $scope.count++;
                                         }
                                         else if($scope.count == 4){
                                             $("#imgcont").attr('src', './images/t6.jpg');
                                             $scope.count++;
                                         }
                                         else if($scope.count == 5){
                                             $("#imgcont").attr('src', './images/t7.jpg');
                                             $scope.count++;
                                         }
                                         else if($scope.count == 6){
                                             $("#imgcont").attr('src', './images/t8.jpg');
                                             $scope.count++;
                                         }
                                         else if($scope.count == 7){
                                             $("#imgcont").attr('src', './images/t9.jpg');
                                             $scope.count++;
                                         }
                                         else if($scope.count == 8){
                                             $("#imgcont").attr('src', './images/t10.jpg');
                                             $scope.count++;
                                         }
                                         else if($scope.count == 9){
                                             $("#imgcont").attr('src', './images/t11.jpg');
                                             $scope.count++;
                                         }
                                         else if($scope.count == 10){
                                             $("#imgcont").attr('src', './images/t12.jpg');
                                             $scope.count++;
                                         }else{
                                             $state.go("resellers");
                                         }
                                     }
                                 }]);
