'use strict';

clientAdminPortalApp.controller('UserRecordController',
    ['$scope', '$state', '$modal', 'userRecordFactory', 'accountInfoFactory', 'businessInfoFactory','signatureFactory','principalInfoFactory',
    function($scope, $state, $modal, userRecordFactory, accountInfoFactory, businessInfoFactory, signatureFactory,principalInfoFactory) {

  if (!(Parse.User.current() && Parse.User.current().authenticated())) {
    $state.go("login");
  }

  $('.phonenumber').mask("(Z00) 000-0000",{
    translation : {
      'Z': { pattern : /[2-9]/g }
    }
  });

  $scope.records = [];
  $scope.adminUsers = [];
  $scope.adminIds = [];

  $scope.query = "";
  $scope.lastUsedQuery = null;
  $scope.lastUsedQuerySkip = 0;
  $scope.paginating = false;
  $scope.queryChunkSize = 20;
  $scope.lastUsedQueryGotAll = false;

  $scope.gatewayTypeNames = {
    '': 'Select Gateway',
    'epn': 'Epn',
    'authNet': 'Auth. Net',
    'pivotal': 'Pivotal'
  };

  $scope.statesAbbr = [
    "AL", "AK", "AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID",
    "IL", "IN", "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO",
    "MT", "NE", "NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA",
    "RI", "SC", "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
  ];

  $scope.countryNames = {
    '': 'Select country',
    'usa': 'USA',
    'ukraine': 'Ukraine',
    'poland': 'Poland'
  };

  var loadQuery = function(){
      $scope.paginating = true;
      $scope.lastUsedQuery.skip($scope.lastUsedQuerySkip);
      $scope.lastUsedQuery.find({
        success: function(list) {
          console.log("successfull load of " + list.length + " elements with skip " + $scope.lastUsedQuerySkip);
          $scope.$apply(function() {
            for (var i = 0; i < list.length; i++) {
              if (list[i].accountInfo && list[i].accountInfo.id) {
                (function(record) {
                  var accountQuery = new Parse.Query("AccountInfo");
                  var busQuery = new Parse.Query('BusinessInfo');
                  accountQuery.equalTo('objectId',record.accountInfo ? record.accountInfo.id : null);
                  busQuery.equalTo('objectId', record.businessInfo ? record.businessInfo.id : null);
                  Parse.Promise.when([
                    accountQuery.first(),
                    busQuery.first()
                  ]).then(function(acc,bus){
                    $scope.$apply(function() {
                      record.accountInfo = acc;
                      record.businessInfo  = bus;
                      record.accountAssigned = true;
                      console.log("Fetched account for " + record.fullName);
                      if (record.state) {
                        console.log("STATE: " + record.state);
                      }
                      if (record.get('businessInfo') && 
                          record.get('principalInfo') && 
                          record.get('accountInfo') &&
                          record.get('signatureImage')) {
                        record.skipAppDisabled = true;
                      } 
                      else
                        record.skipAppDisabled = false;
                    });
                  },function(e){
                    console.log("Failed to fetch accout for " + record.fullName + ": " + 
                                e.map(function(el){return el.message}).join('\n\r'));
                  });
                })(list[i]);
              } else {
                (function(record) {
                  var account = new accountInfoFactory();
                  record.set("accountInfo", account);
                  record.accountAssigned = true;
                  console.log("Created account for " + record.username);
                })(list[i]);
              }
              list[i].paymentGateway = '';
              $scope.records.push(list[i]);
            }
            $scope.lastUsedQuerySkip += list.length;
            $scope.lastUsedQueryGotAll = (list.length < $scope.queryChunkSize);
            $scope.paginating = false;
          });
        }, error: function(error) {
          $scope.$apply(function() {
            $scope.paginating = false;
          });
          console.log(error.message);
        }
      });
    }

  $scope.loadMoreQueryResults = function() {

    if ($scope.paginating == true) return;
    if ($scope.lastUsedQueryGotAll) return;

    loadQuery();

  };

  $scope.updateQueryResults = function() {
    
    var query;

    userRecordFactory.searchedFields.forEach(function(elem){
      var subQuery = new Parse.Query(userRecordFactory);
      subQuery.contains(elem, $scope.query);
      query = query ? Parse.Query.or(query, subQuery) : subQuery;
    });

    $scope.lastUsedQueryGotAll = false;
    $scope.lastUsedQuerySkip = 0;
    query.limit($scope.queryChunkSize);
    $scope.records = [];
    query.descending("updatedAt");
    $scope.lastUsedQuery = query;
    $scope.loadMoreQueryResults();

  };

  $scope.updateQueryResults();

  $scope.newUserRecord = new userRecordFactory();
  $scope.newUserRecord.set("accountInfo", new accountInfoFactory);
  $scope.newUserRecord.accountAssigned = true;
  $scope.newUserRecord.paymentGateway = '';
  $scope.newUserRecord.skipApplication = true;

  $scope.userFormValidated = true;
  $scope.userForm = {
    fullName  : true
  }

  $scope.saveAndNotify = function(user,form) {

    $scope.userForm.fullName = true;

    if (!form.fullName.$valid) $scope.userForm.fullName = false;

    if (!form.$valid) return;

      if(user.paymentGateway.length < 1){
          user.EPNrestrictKey = "";
          user.EPNusername = "";
          user.AuthKey = "";
          user.AuthNet = "";
      }
      
    Parse.Cloud.run('UpdateUser',{
      user : {
        id     : user.id,
        params : {
          merchantID      : user.merchantID,
          company         : user.company,
          fullName        : user.fullName,
          email           : user.email,
          username        : user.username,
          EPNrestrictKey  : user.EPNrestrictKey,
          EPNusername     : user.EPNusername,
          AuthNet         : user.AuthNet,
          AuthKey         : user.AuthKey,
          paymentGateway  : user.paymentGateway.toString()
        }
      }
    }).then(function(res){
      alert("User was successfuly saved!");
      $scope.updateQueryResults();
    },function(err){
      console.log("User account update failed:" + err.message);
    });
  }

  $scope.deleteAndNotify = function(record) {
    if (!confirm("Are you sure want to remove?")) return;

    var deleting = {id: record.id};
    var beforeDelete = $scope.records.length;
    Parse.Cloud.run("deleteUser", {deleting: deleting}, {
      success: function() {
        console.log("Cloud delete successfull");
      },
      error: function(error) {
        console.log("Cloud delete failed: " + error.message);
      }
    }).then(function() {
      $scope.updateQueryResults();
      $scope.$apply(function() {
          $scope.updateQueryResults();
        });
    });
  }

  $scope.openModalCreate = function() {
    var modalInstance = $modal.open({
      animation: false,
      templateUrl: 'add-basic-info',
      controller: 'ModalCreateController',
      windowClass: 'window-shadow',
      backdrop: true,
      resolve: {
        newUserRecord: function() {
          console.log('resolve');
          return $scope.newUserRecord;
        },
        gatewayTypeNames: function() {
          return $scope.gatewayTypeNames;
        },
        account : function(){
          return new accountInfoFactory();
        }
      }
    });

    modalInstance.result.then(function(result) {

      console.log('modal create submitted');

      var skipApp = $scope.newUserRecord.skipApplication;
      var formInfo = {
        fullname      : $scope.newUserRecord.fullName,
        address       : $scope.newUserRecord.address,
        city          : $scope.newUserRecord.city,
        state         : $scope.newUserRecord.state,
        zipCode       : $scope.newUserRecord.zip,
        phone         : $scope.newUserRecord.phone,
        email         : $scope.newUserRecord.email,
        merchantId    : $scope.newUserRecord.merchantReferenceId,
        businessName  : $scope.newUserRecord.businessName,
        username      : $scope.newUserRecord.username,
        paymentGateway   : $scope.newUserRecord.paymentGateway,

      };

      $scope.newUserRecord.save(null, {
        success: function(record) {
          $scope.$apply(function() {
            $scope.records.push($scope.newUserRecord);
            $scope.newUserRecord = new userRecordFactory();
            $scope.newUserRecord.set("accountInfo", new accountInfoFactory);
            $scope.newUserRecord.accountAssigned = true;
            $scope.newUserRecord.paymentGateway = '';
          });
          console.log("successfully created:", record);
        },
        error: function(record, error) {
          alert("Failed to create object:" + error.message);
        }
      }).then(function(user){
        if (!skipApp) {
          result.account.save().then(function(account){
            var saving = {
              id        : user.id,
              accountId : account.id
            };
            Parse.Cloud.run("updateUser", {saving: saving})
            .then(function(){
              alert("User " + user.username + " was successfuly created!");
              $scope.updateQueryResults();
              window.location.reload();
            });
          });
          return;
        }

        var userTables = {
          business : new businessInfoFactory(),
          account : null,
          principal : new principalInfoFactory(),
          signatureImage : new signatureFactory()
        }
        
        for (var table in userTables){
          if (!userTables[table]) continue;
          userTables[table].SetDummyInfo();
          if (userTables[table].SetData)
            userTables[table].SetData(formInfo);
        }

        userTables.signatureImage.set("imageName","Signature_" + user.id);
        userTables.signatureImage.set("user",user);
        userTables.account = result.account;

        var promises = toArray(userTables).map(function(table){
          return table.save();
        });

        Parse.Promise.when(promises).then(function(busObj,accObj,prObj,signObj){

          if (busObj && accObj && prObj && signObj)

            var saving = {};
            saving.id = user.id;
            saving.busId = busObj.id;
            saving.accId = accObj.id;
            saving.prId = prObj.id;
            saving.signId = signObj.id;

            Parse.Cloud.run("updateUserTables", {saving: saving}, {
              success: function() {
                console.log("Cloud update successfull");
                $scope.updateQueryResults();
                window.location.reload();
              },
              error: function(error) {
                console.log("Cloud update failed:" + error.message);
              }
            });
        });

      });

    }, function() {
      console.log('modal create cancelled');
    });
  };
}]);
