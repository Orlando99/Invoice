'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('SignUpController',['$scope','$state',function($scope,$state){

	$scope.selectedCountry = 'Select Country';

	$scope.ValidationFails = false;

	$scope.form = {
		error : 0,
		fields : {}
	};

	$scope.selectedCountryChanged = function(){
		if (!$scope.selectedCountry) return;
		if ($('.extended-signup').css({'display':'none'}))
			$('.extended-signup').show();
		if ($.inArray($scope.selectedCountry, $scope.usaAndCanada) != -1) {
			$('input#email').attr('placeholder',"Email (To Recover Forgotten Password)");
			$('input#phone').attr('placeholder',"Phone Number (Text Verification Required)");
		} else {
			$('input#email').attr('placeholder',"Email");
			$('input#phone').attr('placeholder',"Phone Number");
		}
	};

	$scope.Validation = {
		setErr : function(field,msg){
			$scope.form.error++;
			$scope.form.fields[field].
			message = msg;
		},
		NullOrEmpty : function(field){
			var value = $("input[name='"+ field +"']").val();
			if (!value || value == "") {
				$scope.Validation
				.setErr(field,field.capitilize() + " cannot be empty!");
				return true;
			}
			return false;
		},
		Setup : function() {

			var names = ["company","fullname","email","username","password","confirmpassword","phonenumber"];
				
			for (var i in names){
				if ($scope.form.fields[names[i]]) continue;
				$scope.form.fields[names[i]] = 
				{
					selector : "input[name='"+ names[i] +"']"
				};
			}

			$scope.form.error = 0;
			for (var field in $scope.form.fields)
				$scope.form.fields[field].message = "";
			
			$('#signUpForm input').removeClass('field-error');
			$('.inner-message').html('');
		},
		FullName : function() {
			if ($scope.Validation.NullOrEmpty('fullname')) return;
			var words = $("input[name='fullname']").val().match(/[^ ]+/g);
			if (words.length == 1){
				$scope.Validation
				.setErr('fullname',"Please Enter Full Name");
				return;
			}
			var fullname = "";

			for(var i=0;i<words.length;i++){
				words[i] = words[i].capitilize();
				fullname += words[i];
				fullname += (i == words.length-1) ?'':' ';
			}
			$($scope.form.fields.fullname.selector).val(fullname);
		},
		Company : function(){
			if ($scope.Validation.NullOrEmpty('company')) return;
		},
		Email : function(){
			if ($scope.Validation.NullOrEmpty('email')) return;
		},
		Username : function(){
			if ($scope.Validation.NullOrEmpty('username')) return;
		},
		Password : function(){
			if ($scope.Validation.NullOrEmpty('password')) return;
		},
		ConfirmPassword : function(){
			if ($scope.Validation.NullOrEmpty('confirmpassword')) return;
			if ($("input[name='confirmpassword']").val() == $("input[name='password']").val()) return;
			$scope.Validation.setErr('confirmpassword','Confirm Password not matches with Password');
		},
		Phone : function(){
			if ($scope.Validation.NullOrEmpty('phonenumber')) return;
		},
		Validate : function(){
			$scope.Validation.Company();
			$scope.Validation.FullName();
			$scope.Validation.Email();
			$scope.Validation.Username();
			$scope.Validation.Password();
			$scope.Validation.ConfirmPassword();
			$scope.Validation.Phone();
		},
		Finilize : function(){
			for (var field in $scope.form.fields) {
				var object = $scope.form.fields[field];
				
				if (object.message == '') continue;
				
				$('.validation-error .inner-message')
				.append("<li>"+ object.message +"</li>");
				$(object.selector).addClass('field-error');
			}
		}
	};

	$scope.sendMessage = function(){
		if (!$scope.selectedCountry ||
			$scope.selectedCountry == 'Select Country') return;

		if ($scope.selectedCountry == 'United States of America' ||
			$scope.selectedCountry == 'Canada')
			console.log('usa or canada');
		else 
			console.log('other Country');

		$scope.Validation.Setup();
		$scope.Validation.Validate()
		$scope.Validation.Finilize();
		

		//$state.go('signup-extended');
		
	};

	$scope.usaAndCanada = ["United States of America","Canada"];

	$scope.otherCountries = ["Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei Darussalam","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Cфte d'Ivoire","Croatia","Cuba","Cyprus","Czech Republic","Democratic People's Republic of Korea (North Korea)","Democratic Republic of the Cong","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Lao People's Democratic Republic (Laos)","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macedonia","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia (Federated States of)","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","Norway","Oman","Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Republic of Korea (South Korea)","Republic of Moldova","Romania","Russian Federation","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Swaziland","Sweden","Switzerland","Syrian Arab Republic","Tajikistan","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom of Great Britain and Northern Ireland","United Republic of Tanzania","Uruguay","Uzbekistan","Vanuatu","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"];
}]);
