'use strict';

$(document).ready(function(){

	$.validator.addMethod(
		"NotFullName",
		function(value,element){
			var words = value.match(/[^ ]+/g);
			
			if (words.length == 1) return false;

			var fullname = words.reduce(function(res,current,index){
				return res + (index ? " ":"") + current.capitalize();
			},"");

			$(element).val(fullname);
			return true;
		},''
	);

    
    
	$.validator.addMethod(
		"CountryNotSelected",
		function(value,element){
			return (value != '' && value != 'Select Country');
		}
	);

	$.validator.addMethod(
		"ConfirmPassMatch",
		function(value,element){
			return value == $("input[name='password']").val();
		},''
	);

	$.validator.addMethod(
		"UserNameExists",
		function(value,element){
			return !parseInt($('#username-exists').val());
		},''
	);

	$.validator.addMethod(
		"EmailExists",
		function(value,element){
			return !parseInt($('#email-exists').val());
		},''
	);

});

invoicesUnlimited.controller('AvtivateAccountController',
	['$rootScope','$scope','$state','signUpFactory','userFactory',
	function($rootScope,$scope,$state,signUpFactory,userFactory){

	if (userFactory.entity.length &&
		!signUpFactory.getVerification.code()) {
		showLoader();
		userFactory.logout().then(function(){
			hideLoader();
		});
	}

        
    $("input").keyup(function(event){
            var id = event.target.id;
            $('#' + id + '-' + 'error').css('display', 'none');
       
            $('#' + id).removeClass('error');
    });
        
	signUpFactory.setDefaultValues();

	$('#phone').mask("(Z00) 000-0000",{
		translation : {
			'Z': {
				pattern : /[2-9]/g
			}
		}
	});

        
    
    
        
	var showIndexInfo = function(){
		if ($('.extended-signup').css({'display':'none'}))
			$('.extended-signup').show();
		if ($.inArray($scope.selectedCountry, $scope.usaAndCanada) != -1) {
			$('input#email').attr('placeholder',"Email (To Recover Forgotten Password)");
			$('input#phone').attr('placeholder',"Phone Number (Text Verification Required)");
			signUpFactory.setVerification.provider('text');
		} else {
			$('input#email').attr('placeholder',"Email");
			$('input#phone').attr('placeholder',"Phone Number");
			signUpFactory.setVerification.provider('email');
		}
	}

	var signUpCountry = signUpFactory.getField('User','country');
	if (signUpCountry) showIndexInfo();	
	
	$scope.selectedCountry = (signUpCountry == '' ? 'Select Country' : signUpCountry);
        
        var fields = ['email',
				      'username',
				      'password',
                      'company',
                      'country'];
	
	fields.forEach(function(field){
		$('input[name='+field+']').val(signUpFactory.getField('User',field));
	});

        $("#signUpForm").validate({
		onkeyup : false,
		onfocusout : false,
		rules: {
			username: {
				required : true,
				UserNameExists : true
			},
			email : {
				required : true,
				email : true,
				EmailExists : true
			},
			password: {
				required : true,
				minlength : 6
			}
		},
		messages: {
			username: {
				required : "Please specify your username !"
				//UserNameExists : "The username is already taken!"
			},
			email : {
				required : "Please specify your email !",
				email : "Please write valid email address"
				//EmailExists : "The email is already taken!"
			},
			password: {
				required : "Please specify your password !",
				minlength : "Password should contain atleast 6 characters"
			}
		}
	});
        
	$scope.ValidateForm = function(callback){
		var queryUsername = new Parse.Query(Parse.User);
        queryUsername.equalTo("username",$('input[name=username]').val());

   		var queryEmail = new Parse.Query(Parse.User);
        queryEmail.equalTo("email",$('input[name=email]').val());

        var objectExistCallback = function(object,name) {
        	if(object) $('#'+name+'-exists').val(1);
        	else $('#'+name+'-exists').val(0);
        }

        var usernameP = queryUsername.first().then(function(object){
        	objectExistCallback(object,'username');
        });

        var emailP = queryEmail.first().then(function(object){
        	objectExistCallback(object,'email');
        });

        Parse.Promise
        .when([usernameP, emailP]).then(function(){
        	var validated = $('#signUpForm').valid();
			callback(!parseInt($('#username-exists').val()) && 
					 !parseInt($('#email-exists').val()) && validated);
    	});
	};

	$scope.selectedCountryChanged = function(){
		var validCountry = $('#signUpForm')
							.validate()
							.element('[name=country]');
		
		if (!validCountry) return;
		showIndexInfo();
	};

	$scope.sendMessage = function(){
        
        if(!$("#signUpForm").valid())
            return;
        
        $scope.newWin = window.open('','_blank');
        debugger;
		showLoader();
		var result = $scope.ValidateForm(function(validated){
			if (!validated) {
                $scope.newWin.close();
                $("#username_error").show();
                $("#email_error").show();
				hideLoader();
				return;
			}
            $("#username_error").hide();
            $("#email_error").hide();
            $('#company').val($('#username').val());
            $('#country').val('United States of America');
            
			fields.forEach(function(field){
				signUpFactory
				.setField('User',field,$('input[name='+field+']').val());
			});

			var handleError = function() {
				var error = {};
                console.log('invalid email address');
				error.email = "email address does not exist";
                
				$("#signUpForm").validate().showErrors(error);
                if($scope.newWin)
                    $scope.newWin.close();
				hideLoader();
			}
            
            signUpFactory.setVerification.code('1234');

            var Template = Parse.Object.extend('InvoiceTemplate');
			var query = new Parse.Query(Template);
			query.equalTo ('name', 'Template 1');
			query.first()
			.then(function(t) {
				signUpFactory.setField('User', 'defaultTemplate', t);
                signUpFactory.signup()
                .then(function(){

                    var user = userFactory.entity[0];

                    ['BusinessInfo',
                     'AccountInfo',
                     'PrincipalInfo',
                     'Organization',
                     'Signature',
                     'Currency',
                     'Preferences',
                     'Role'].forEach(function(table){
                        signUpFactory.setField(table,'userID',user);
                     });

                    ['Organization',
                     'Role'].forEach(function(table){
                        signUpFactory.setField(table,'name',user.company);
                     });

                    signUpFactory.setField('Organization',"email",user.email);

                    return signUpFactory.create('Role');
                    //return;

                },function(error){
                    console.log(error.message);
                })
                .then(function(){
                    var org = signUpFactory.create('Organization');
                    return org;
                },function(err){
                    console.log(err.message);
                })
                .then(function(orgObj) {
                    return signUpFactory.copyDefaultCategories({
                        user : userFactory.entity[0],
                        organization : orgObj
                    })
                    .then(function() {
                        return orgObj;
                    });
                })
                .then(function(orgObj){
                    ['BusinessInfo',
                     'AccountInfo',
                     'PrincipalInfo',
                     'Signature',
                     'Preferences',
                     'Currency'].forEach(function(table){
                        signUpFactory.setField(table,'organization',orgObj);
                    });
                    var curr = signUpFactory.create('Currency');
                    var pref = signUpFactory.create('Preferences');
                    return Parse.Promise.when([curr,pref]);
                },function(err){
                    console.log(err.message);
                })
                .then(function(currObj,prefObj) {
                    hideLoader();
                    $rootScope.fromPaymentSettings = false;
                    //$state.go('signup.accountActivated');
                    //saveBusinessInfo();
                    
                    $('input[name=username]').val("");
                    $('input[name=email]').val("");
                    $('input[name=password]').val("");
                    
                    var url = $state.href('signup.accountActivated');
                    //window.open(url,'_blank');
                    $scope.newWin.location = url;
                },function(err){
                    if (!err.length) {
                        console.log(err.message);
                        return;
                    }
                    err.forEach(function(er){console.log(er.message);});
                });
			});
            
			var postParams = {};
            
            postParams.dest = 'email';
            postParams.email = $('input[name=email]').val();

		});
	};

	$scope.openPrivacyPolicy = function() {
		var elem = $("#theFrame");
		elem.attr('src', 'http://www.merchantaccountsolutions.com/Home/Privacy');
		elem.css("display", "block");
	}
    
    function saveBusinessInfo(){

		showLoader();
		for (var field in $scope.bsnsInfo){
			signUpFactory.setField('BusinessInfo',{
				field : field,
				value : $scope.bsnsInfo[field]
			});
		}
        
        signUpFactory.setField('BusinessInfo',{
				field : 'businessName',
				value : signUpFactory.getField('User','company')
			});
		
		var business = signUpFactory.create('BusinessInfo');

		business
		.then(function(busObj){
			return signUpFactory.save('User',{
				'businessInfo' : busObj,
			});
		},
		function(err){
			if (!err.length) console.log(err.message);
			err.forEach(function(er){
				console.log(er.message);
			});
		})
		.then(function(){
			hideLoader();
			//$state.go('signup.invoiceTemplateInfo');
            var url = $state.href('signup.invoiceTemplateInfo');
            window.open(url,'_blank');
            
		},errorCallback);
	}

	$scope.usaAndCanada = ["United States of America","Canada"];

	$scope.otherCountries = ["Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei Darussalam","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Cфte d'Ivoire","Croatia","Cuba","Cyprus","Czech Republic","Democratic People's Republic of Korea (North Korea)","Democratic Republic of the Cong","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Lao People's Democratic Republic (Laos)","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macedonia","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia (Federated States of)","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","Norway","Oman","Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Republic of Korea (South Korea)","Republic of Moldova","Romania","Russian Federation","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Swaziland","Sweden","Switzerland","Syrian Arab Republic","Tajikistan","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom of Great Britain and Northern Ireland","United Republic of Tanzania","Uruguay","Uzbekistan","Vanuatu","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"];
}]);
