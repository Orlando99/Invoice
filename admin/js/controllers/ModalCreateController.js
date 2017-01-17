'use strict';

clientAdminPortalApp.controller('ModalCreateController',
    ['$scope', '$modalInstance', 'newUserRecord','accountInfoFactory','businessInfoFactory', 'gatewayTypeNames','account','business',
    function($scope, $modalInstance, newUserRecord,accountInfoFactory,businessInfoFactory, gatewayTypeNames,account,business, Validate, ValidateModal) {
  $scope.newUserRecord = newUserRecord;
  $scope.newUserRecord.password = '';
  $scope.gatewayTypeNames = gatewayTypeNames;
  
  $scope.account = new accountInfoFactory();
  $scope.business = new businessInfoFactory();
  $scope.newUserRecord.SetDummyInfo();
  $scope.account.SetDummyInfo();
  $scope.newUserRecord.set("accountInfo", $scope.account);
  $scope.newUserRecord.set("businessInfo", $scope.business);
  $scope.newUserRecord.accountAssigned = true;
  $scope.newUserRecord.businessAssigned = true;

  $scope.statesAbbr = {
    "AL":"AL",
    "AK":"AK",
    "AZ":"AZ",
    "AR":"AR",
    "CA":"CA",
    "CO":"CO",
    "CT":"CT",
    "DE":"DE",
    "DC":"DC",
    "FL":"FL",
    "GA":"GA",
    "HI":"HI",
    "ID":"ID",
    "IL":"IL",
    "IN":"IN",
    "IA":"IA",
    "KS":"KS",
    "KY":"KY",
    "LA":"LA",
    "ME":"ME",
    "MD":"MD",
    "MA":"MA",
    "MI":"MI",
    "MN":"MN",
    "MS":"MS",
    "MO":"MO",
    "MT":"MT",
    "NE":"NE",
    "NV":"NV",
    "NH":"NH",
    "NJ":"NJ",
    "NM":"NM",
    "NY":"NY",
    "NC":"NC",
    "ND":"ND",
    "OH":"OH",
    "OK":"OK",
    "OR":"OR",
    "PA":"PA",
    "RI":"RI",
    "SC":"SC",
    "SD":"SD",
    "TN":"TN",
    "TX":"TX",
    "UT":"UT",
    "VT":"VT",
    "VA":"VA",
    "WA":"WA",
    "WV":"WV",
    "WI":"WI",
    "WY":"WY"
  }

  String.prototype.capitilizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };

  $scope.ValidateModal = function(callback){

    var modalForm = {
        error : false,
        //FullName  : { id : ""},
        /*FirstName : { id : '#FirstName',
                      error : false,
                      errorMessage : "" },
        LastName  : { id : '#LastName',
                      error : false,
                      errorMessage : "" },*/
        Email     : { id : '#Email',
                      error : false,
                      errorMessage : "" },
        Username  : { id : '#Username',
                      error : false,
                      errorMessage : "" },
        Password  : { id : '#Password', 
                      error : false,
                      errorMessage: "" }
    };

    var alertMessage = [];

    function refreshErrorList(){
      alertMessage = [];

        for(var field in modalForm){
            if (field == 'error') continue;
            
            var currentField = modalForm[field];
            if (currentField['error']) {
                modalForm.error = true;
                $(currentField['id']).addClass('form-error');
                if (currentField.errorMessage != "") 
                    alertMessage.push(currentField.errorMessage);
            }
        }
    
        if (!modalForm.error) $('.error-message').hide('fast');
        $('.error-list').html('');
    
        if (alertMessage.length > 0){
            for(var i in alertMessage){
                $('.error-list').prepend('<li>' + alertMessage[i] + '</li>')
            }
            $('.error-message').show('fast');
        }
    }

    for(var field in modalForm){
        if (field == 'error') continue;
        var currentField = modalForm[field];
        if ($(currentField.id).hasClass('form-error'))
            $(currentField.id).removeClass('form-error');
        
        if($(currentField['id']).val() == "") {
            currentField['error'] = true;
            if (modalForm['error']) continue;
            else modalForm['error'] = true;
        }
    }

    var usernameP = $scope.Validate.Username(modalForm.Username, function(object){
      if(object){
        modalForm.Username.error = true;
        modalForm.Username.errorMessage = "The username is already taken!";
      }
    });

    var emailP = $scope.Validate.Email(modalForm.Email, function(object){
      if (object) {
        modalForm.Email.error = true;
        modalForm.Email.errorMessage = "The email is already taken!";
      }
    });

    var promises = [];

    if (usernameP) promises.push(usernameP);
    if (emailP) promises.push(emailP);

    Parse.Promise.when(promises).then(function(){

      //$scope.Validate.FirstName(modalForm.FirstName);
      //$scope.Validate.LastName(modalForm.LastName);
      $scope.Validate.Password(modalForm.Password);

      refreshErrorList();

      callback(!modalForm.error);
    })
};

$scope.Validate = {
    FirstName : function(nameObj) {
        var firstName = $(nameObj['id']).val().match(/[^ ]+/g);

        if (firstName == undefined) firstName = [];

        switch(firstName.length) {
            case 0:
                nameObj.error = true;
                nameObj.errorMessage = "FirstName cannot be blank!";
                break;
            case 1:
            default:
                nameObj.error = false;
                nameObj.errorMessage = "";
                var newFirstName = "";
                for(var word in firstName) 
                    newFirstName += firstName[word].capitilizeFirstLetter() + " ";
                $(nameObj['id']).val(newFirstName);

                break;
        }
    },

    LastName : function(nameObj) {
        var lastName = $(nameObj['id']).val().match(/[^ ]+/g);

        if (lastName == undefined) lastName = [];

        switch(lastName.length) {
            case 0:
                nameObj.error = true;
                nameObj.errorMessage = "FirstName cannot be blank!";
                break;
            case 1:
            default:
                nameObj.error = false;
                nameObj.errorMessage = "";
                var newLastName = "";
                for(var word in lastName) 
                    newLastName += lastName[word].capitilizeFirstLetter() + " ";
                $(nameObj['id']).val(newLastName);
                break;
        }
    },

    Password : function(passObj) {
        var pass = $(passObj['id']).val();
        
        if (!pass) {
          passObj.error = true;
          passObj.errorMessage = "Password cannot be blank!";
        } else if (!pass.match(/^[^ ]+$/)) {
          passObj.error = true;
          passObj.errorMessage = "Password cannot contain space sybmols!"
        } else {
          passObj.error = false;
          passObj.errorMessage = "";
        }
    },

    Email : function(emailObj, callback) {
        var email = $(emailObj['id']).val();  

        var emailregex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;

        if (!email) {
          emailObj.error = true;
          emailObj.errorMessage = "Email address cannot be blank!";
        } else if (!email.match(/^[^ ]+$/g)) {
          emailObj.error = true;
          emailObj.errorMessage = "Email should be only one!";
        } else if (!email.match(emailregex)) {
          emailObj.error = true;
          emailObj.errorMessage = "Email address is invalid!";
        } else {
          var query = new Parse.Query(Parse.User);
          query.equalTo("email",email);
          return query.first().then(function(object){
            callback(object);
          });
        }
    },

    Username : function(usernameObj,callback) {
        var username = $(usernameObj['id']).val();

        if (!username) {
          usernameObj.error = true;
          usernameObj.errorMessage = "Username cannot be blank!";
        } else if (!username.match(/^[^ ]+$/g)) {
          usernameObj.error = true;
          usernameObj.errorMessage = "Username should not contain space symbols!";
        } else {
          var query = new Parse.Query(Parse.User);
          query.equalTo("username",username);
          return query.first().then(function(object){
            callback(object);
          });
        }
    }

};

  /*$scope.$on('modal.closing', function(event, reason, closed) {
      var r = prompt("Are you sure you wanna close the modal? (Enter 'YES' to close)");
      if (r !== 'YES') {
        event.preventDefault();
      }
  });*/

  $scope.newUserForm = {fullName : true};

  $scope.ok = function(form) {

    $scope.newUserForm.fullName = true;

    debugger;
    if (!form.fullName.$valid) $scope.newUserForm.fullName = false;

    !$scope.ValidateModal(function(validated){
      if (validated && form.$valid)
        $modalInstance.close({
          newUser : $scope.newUserRecord,
          account : $scope.account,
          business : $scope.business
        });
    });
  }

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  }
}]);
