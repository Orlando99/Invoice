'use strict';

invoicesUnlimited.controller('SignatureController',['$scope','$state','userFactory','signUpFactory','$ocLazyLoad',
	function($scope,$state,userFactory,signUpFactory,$ocLazyLoad){

	if (userFactory.authorized()){
		var businessInfo = userFactory.getBusinessInfo();
		var principalInfo = userFactory.getPrincipalInfo();
		var accountInfo = userFactory.getAccountInfo();

		if (businessInfo) {
			if (principalInfo) {
				if (!accountInfo) $state.go('signup.account-info');
			} else $state.go('signup.principal-info');
		} else {
			userFactory.logout();
			$state.go('signup');
		}
	} else $state.go('signup');

	$('h2.text-uppercase').css({padding:'50px 0',margin:0});
	$('.signature').css({height:$(window).height()-$('.sticky-nav').height() - parseInt($('.sticky-nav').css('padding-top'))*2 - 1});

	$scope.submitSignature = function(){

		showLoader();

		var sigData = $('.kbw-signature canvas')[0].toDataURL().replace("data:image/png;base64,","");

		signUpFactory.set({
			table : 'Signature',
			expr  : "imageName:Signature_" + signUpFactory.getParse("_User").id
		})

		signUpFactory.setObject({
			table : 'Signature',
			params  : {
				field : "imageFile",
				value : new Parse.File("Signature.png", { base64 : sigData})
			}
		});

		signUpFactory.setObject({
			table : 'Signature',
			params  : {
				field : "userID",
				value : signUpFactory.getParse("_User")
			}
		});

		signUpFactory.Save({
			tableName :'Signature',
			callback  : function(){
				if (!userFactory.authorized) return;
				signUpFactory.Save('User',{
					signatureImage : signUpFactory.getParse("Signature")
				},function(){
					hideLoader();
					$state.go('signup.confirm');
				});

			}
		});
	}

	$scope.$on('$viewContentLoaded',function($scope,$timeout){
		$ocLazyLoad.load([
					"./dist/js/excanvas.js",
  					"./dist/js/jquery.signature.min.js",
  					"./dist/js/jquery.ui.touch-punch.min.js",
  					"./dist/js/sig.js",
					]);
	});

}]);
