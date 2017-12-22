'use strict';

clientAdminPortalApp.controller('resellerProfileController',[
	'$q', '$scope', '$state', '$modal', 'userRecordFactory', 'accountInfoFactory', 'businessInfoFactory', 'signatureFactory', 'principalInfoFactory', 'organizationFactory', 'currencyFactory', 'projectUserFactory', 'preferencesFactory',
	function($q,$scope, $state, $modal, userRecordFactory, accountInfoFactory, businessInfoFactory, signatureFactory,principalInfoFactory,organizationFactory,currencyFactory,projectUserFactory,preferencesFactory) {

		if (Parse.User.current()) {
			if(!(Parse.User.current().get("isReseller") || Parse.User.current().authenticated()))
				$state.go("home");
		} else {
			$state.go("login");
		}

		$("#signUpForm").validate({
			onkeyup : function(element) {$(element).valid()},
			onfocusout : false,
			rules: {
				businessName	: 'required',
				businessAddress	: 'required',
				city			: 'required',
				state 			: 'required',
				zipCode 		: 'required',
				email 			: {
					email 		: true,
					required 	: true
				},
				username 		: 'required',
				fullName 		: 'required',
				expDate			: 'required',
				cvv				: 'required',
				zipCodeAccount	: 'required',
				password : {
					minlength : 6,
					required: false
				},
				phoneNumber : {
					minlength : 10,
					required: true
				}
			},
			messages: {
				businessName	: 'Please enter business name',
				businessAddress	: 'Please enter business address',
				city			: 'Please enter business city',
				state 			: 'Please enter business state',
				zipCode 		: 'Please enter business zipcode',
				email 			: {
					email : 'Please enter valid email',
					required : 'Please enter email'
				},
				username 		: 'Please enter username',
				fullName 		: 'Please enter account holder name',
				expDate			: 'Please enter expiry date',
				cvv				: 'Please enter cvv',
				zipCodeAccount	: 'Please enter zip code',
				password : {
					minlength : "Password length must be atleast 6 characters",
				},
				phoneNumber : {
					minlength : "Please enter valid phone number",
					required: "Please enter phone number"
				}
			}
		});

		$('.phonenumber').mask("(Z00) 000-0000",{
			translation : {
				'Z': { pattern : /[2-9]/g }
			}
		});
		
		/********************************************************************************************/

		var Validate = {
			CardName : '',
			ExpDateMask : function(e) {
				var numberToAdd = e.which - 48;
				if (numberToAdd < 0 || numberToAdd > 9) return false;

				var expDate = $('#ExpirationDate');

				var potentialResult = expDate.val();

				potentialResult += /\d\d$/.test(expDate.val()) ? "/"+numberToAdd:numberToAdd;

				var year = (new Date()).getFullYear().toString().slice(2);

				var lengthChecks = {
					l1 : /[01]/,
					l2 : /(0(?=[1-9])\d)|(1(?=[0-2]))/,
					l4 : new RegExp('[0-9]{2}/[' + year[0] + '-9]'),
					l5 : new RegExp('[0-9]{2}/((' + year[0] + '(?=[' + year[1] + '-9]))|[' + (parseInt(year[0])+1) +'-9])[0-9]')
				}

				if (lengthChecks['l'+potentialResult.length] == undefined) return false;
				if (lengthChecks['l'+potentialResult.length].test(potentialResult)) return true;
				else return false;
			},
			CardNoMask : function(e){
				var cardInput = $('#CardNo');
				var cvv2Input = $('#CVV2');

				var currentCard = {card:'',cvv2:''};

				var regexCards = {
					visa : /^4/,
					mastercard : /^5/,
					amex : /^3[467]/,
					jcb : /^35/,
					discover : /^6(?:011|5)/
					//discover : /^65/
				}

				for(var cardCheck in regexCards) {
					if (regexCards[cardCheck].test(cardInput.val())) {
						currentCard.card = cardCheck;
						currentCard.cvv2 = cardCheck == 'amex'?'cvv-amex':'cvv-card';
						break;
					}
				}

				if (!cardInput.hasClass(currentCard.card))
					cardInput.attr('class',currentCard.card);
				if (!cvv2Input.hasClass(currentCard.cvv2)) 
					cvv2Input.attr('class',currentCard.cvv2);

				Validate.CardName = currentCard.card;

				return true;
			}
		};

		$('#CardNo').on('change keyup', function(ev) {
			Validate.CardNoMask(ev);
		});

		var cardMaskOptions =  {onKeyPress: function(cep, e, field, options){
			var masks = ['0000 0000 0000 0000', '0000 000000 00000'];
			var mask = (Validate.CardName == 'amex') ? masks[1] : masks[0];
			$('#CardNo').mask(mask, options);
		}, placeholder : ''};   

		var cvvMaskOptions =  {onKeyPress: function(cep, e, field, options){
			var masks = ['000', '0000'];

			var mask = Validate.CardName == 'amex' ? masks[1] : masks[0];

			$('#CVV2').mask(mask, options);
		}, placeholder : ''};       

		$('#CVV2').mask('000', cvvMaskOptions);
		$('#CardNo').mask('0000 0000 0000 0000', cardMaskOptions);
		$('#ExpirationDate').mask('00/00',{placeholder: 'MM/YY'});

		/********************************************************************************************/

		getUserData();

		function getUserData(){
			var query = new Parse.Query(userRecordFactory);

			query.include("businessInfo");
			query.include("resellerInfo");

			query.get(Parse.User.current().id, {
				success: function(user) {
					$scope.record = user;
					if(!$scope.$$phase)
						$scope.$apply();
				},
				error: function(object, error) {
					// The object was not retrieved successfully.
					// error is a Parse.Error with an error code and message.
				}
			});
		}

		$scope.updateInfo = function(){
			if(!$("#signUpForm").valid())
				return;

			$('.loader-screen').show();
			
			if($scope.record.ccNumber && $scope.record.ccNumber.length){
				$scope.record.resellerInfo.set('ccNumber', $scope.record.ccNumber);
			}

			$scope.record.resellerInfo.save();
			$scope.record.businessInfo.save();

			$scope.record.save()
				.then(function(){
				$('.loader-screen').hide();
				$state.go("resellers");
			}, function(error){
				$('.loader-screen').hide();
				console.error(error.message());
			});
		}
	}]);
