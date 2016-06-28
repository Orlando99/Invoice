'use strict';

invoicesUnlimited.controller('SignatureController',['$scope','$state','userFullFactory','signUpFactory','$ocLazyLoad',
	function($scope,$state,userFullFactory,signUpFactory,$ocLazyLoad){

	if (userFullFactory.authorized()){
		var businessInfo = userFullFactory.getBusinessInfo();
		var principalInfo = userFullFactory.getPrincipalInfo();
		var accountInfo = userFullFactory.getAccountInfo();

		if (businessInfo) {
			if (principalInfo) {
				if (!accountInfo) $state.go('signup.account-info');
			} else $state.go('signup.principal-info');
		} else {
			userFullFactory.logout();
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
				if (!userFullFactory.authorized) return;
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
					"./assets/js/excanvas.js",
  					"./asstes/js/jquery.signature.min.js",
  					"./assets/js/jquery.ui.touch-punch.min.js",
  					"./assets/js/sig.js",
					]);
	});

}]);
