'use strict';

angular.module('clientAdminPortalApp').config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/home');

  $stateProvider
    .state('login', {
      url: "/login",
      controller: "LoginController",
      templateUrl: "templates/login.html"
    })
    .state('home', {
      url: "/home",
      controller: "UserRecordController",
      templateUrl: "templates/home.html"
    });
});
