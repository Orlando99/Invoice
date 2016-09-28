'use strict';

clientAdminPortalApp.controller('LoginController', ['$scope', '$state', '$modal', function($scope, $state, $modal) {
  $scope.username = '';
  $scope.password = '';
  $scope.loginError = false;
  $scope.notAdminError = false;

  $scope.authenticated = Parse.User.current() && Parse.User.current().authenticated();
  if ($scope.authenticated) {
    $scope.sessionUsername = Parse.User.current().getUsername();
  }

  $scope.logIn = function() {
    $scope.loginError = false;
    $scope.notAdminError = false;
    debugger;
    var query = new Parse.Query(Parse.User);
    query.equalTo('username',$scope.username);
    query.first()
    .then(function(user){
      debugger;
      var hasAccess = user.get('adminPanelAccess');
      if (hasAccess) 
        return Parse.User.logIn($scope.username,$scope.password);
      else {
        $scope.$apply(function() {
          $scope.notAdminError = true;
          $scope.logOut();
        })
        console.log("Not Admin");
        return Parse.Promise.as(false);
      }
    },function(err){
      console.log(err.message);
    })
    .then(function(user){
      if (!user) return;
      console.log('Successfull admin login');
      $scope.$apply(function() {
        $scope.sessionUsername = Parse.User.current().getUsername();
        $scope.authenticated = true;
      });
      $state.go('home');

    });
  }

  $scope.logOut = function() {
    Parse.User.logOut();
    $scope.authenticated = false;
    $scope.sessionUsername = '';
    $state.go('login');
  };

  $scope.openUserOptions = false;
}]);
