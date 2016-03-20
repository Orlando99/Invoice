'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

$(document).ready(function(){

	var usernameExists = function(value,callback){
		var query = new Parse.Query(Parse.User);
        query.equalTo("username",email);
        return query.first().then(function(object){
        	callback(object);
        });
	}

	var emailExists = function(value,callback){
		var query = new Parse.Query(Parse.User);
        query.equalTo("email",email);
        return query.first().then(function(object){
        	callback(object);
        });
	}

	$.validator.addMethod(
		"NotFullName",
		function(value,element){
			var words = value.match(/[^ ]+/g);
			if (words.length == 1){
				$.validator.messages["NotFullName"] = "Please Enter Full Name";
				return false;
			}

			var fullname = "";

			for(var i=0;i<words.length;i++){
				words[i] = words[i].capitilize();
				fullname += words[i];
				fullname += (i == words.length-1) ?'':' ';
			}
			$(element).val(fullname);
			return true;
		},''
	);

	$.validator.addMethod(
		"ConfirmPassMatch",
		function(value,element){
			if (value == $("input[name='password']").val())
				return true;
			$.validator.messages["ConfirmPassMatch"] = "Passwords do not match!";
			return false;
		},''
	);

	$.validator.addMethod(
		"UserNameExists",
		function(value,element){
			if (!Boolean($('#username-exists').val())) return true;
			$.validator.messages["UserNameExists"] = "The username is already taken!";
			return false;
		},''
	);

	$.validator.addMethod(
		"EmailExists",
		function(value,element){
			if (!Boolean($('#email-exists').val())) return true;
			$.validator.messages["EmailExists"] = "The email is already taken!";
			return false;
		},''
	);
});

invoicesUnlimited.controller('SignUpController',['$scope','$state','signUpFactory',function($scope,$state,signUpFactory){

	$scope.selectedCountry = 'Select Country';
	$scope.verificationCodeProvider = signUpFactory.getVerification.provider();

	var getUserExists = function(){return $scope.exists.username;}

	$("#signUpForm").validate({
		onkeyup : false,
		onfocusout : false,
		rules: {
			fullname : {
				NotFullName : true,
				required : true
			},
			company : 'required',
			username: {
				required : true,
				UserNameExists : true
			},
			email : {
				required : true,
				EmailExists : true
			},
			password: 'required',
			confirmpassword: {
				required : true,
				ConfirmPassMatch : true
			},
			phonenumber : 'required'
		},
		messages: {
			fullname : "Please specify your Full Name !",
			username: {
				required : "Please specify your username !"
			},
			email : {
				required : "Please specify your email !"
			},
			company : "Please specify your company !",
			password: "Please specify your password !",
			confirmpassword: {
				required : "Please specify your confirm password !"
			},
			phonenumber : "Please specify your phone !"
		}
	});

	$scope.ValidateForm = function(callback){
		var queryUsername = new Parse.Query(Parse.User);
        queryUsername.equalTo("username",$('input[name=username]').val());

   		var queryEmail = new Parse.Query(Parse.User);
        queryEmail.equalTo("email",$('input[name=email]').val());

        var usernameCallback = function(object) {
        	if(object) $('#username-exists').val(true);
        	else $('#username-exists').val(false);
        }

        var emailCallback = function(object) {
        	if (object) $('#email-exists').val(true);
        	else $('#email-exists').val(false);
        }

        var usernameP = queryUsername.first().then(function(object){
        	usernameCallback(object);
        });

        var emailP = queryEmail.first().then(function(object){
        	emailCallback(object);
        })

        var promises = [usernameP, emailP];

        Parse.Promise.when(promises).then(function(){
        	$('#signUpForm').valid();
			callback(!Boolean($('#username-exists').val()) && 
					 !Boolean($('#email-exists')));
    	});
	};

	$scope.verifyCode = function(){
		var inputCode = $('#verificationCode').val();
		var inputHash = md5(inputCode);
		if (inputHash == signUpFactory.getVerification.code())
			alert('Verified');
	};

	$scope.selectedCountryChanged = function(){
		if (!$scope.selectedCountry) return;
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
	};

	$scope.sendMessage = function(){
		if (!$scope.selectedCountry ||
			$scope.selectedCountry == 'Select Country') return;

		var result = $scope.ValidateForm(function(validated){
			if (!validated) return;

			if ($scope.selectedCountry == 'United States of America' || $scope.selectedCountry == 'Canada') {
				debugger;
				$.post('./dist/php/sendVerificationCode.php',{
					dest:'phone',
					phonenumber : $('#phone').val()
				},function(res){
					console.log(res);
				});
			} else {
				$.post('./dist/php/sendVerificationCode.php', {
					dest  :'email',
					email : $('input[name=email]').val()
				},function(res){
					var codeString = res.match(/(Code:([0-9]|[a-f]){32}\;)/g);
					if (codeString != null) codeString = codeString[0];
					var code = codeString.match(/[^\;\:]+/g);
					if (code) code = code[1];
					debugger;
					signUpFactory.setVerification.code(code);
					signUpFactory.setProp('country',$scope.selectedCountry);
					$state.go('verification');
				});
			}
		});
	};

	$scope.usaAndCanada = ["United States of America","Canada"];

	$scope.otherCountries = ["Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei Darussalam","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Cфte d'Ivoire","Croatia","Cuba","Cyprus","Czech Republic","Democratic People's Republic of Korea (North Korea)","Democratic Republic of the Cong","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Lao People's Democratic Republic (Laos)","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macedonia","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia (Federated States of)","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","Norway","Oman","Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Republic of Korea (South Korea)","Republic of Moldova","Romania","Russian Federation","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Swaziland","Sweden","Switzerland","Syrian Arab Republic","Tajikistan","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom of Great Britain and Northern Ireland","United Republic of Tanzania","Uruguay","Uzbekistan","Vanuatu","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"];
}]);
