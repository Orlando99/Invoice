'use strict';

invoicesUnlimited.controller('SignatureController',
	['$scope','$state','signUpFactory','$ocLazyLoad',
	function($scope,$state,signUpFactory,$ocLazyLoad){

	var user = signUpFactory.getFactory('User');

	if (!user.entity.length) {
		$state.go('signup');
		return;
	}

	$scope.fullName = signUpFactory.getField('User', 'fullName');
	$('h2.text-uppercase').css({padding:'50px 0',margin:0});
	$('.signature').css({height:$(window).height()-$('.sticky-nav').height() - parseInt($('.sticky-nav').css('padding-top'))*2 - 1});

	$scope.submitSignature = function(){

		showLoader();

		var sigData = $('.kbw-signature canvas')[0].toDataURL().replace("data:image/png;base64,","");

		signUpFactory.setField('Signature',{
			field : "imageName",
			value : "Signature_" + user.entity[0].id
		});

		signUpFactory.setField('Signature',{
			field : "imageFile",
			value : new Parse.File("Signature.png", { base64 : sigData})
		});

		signUpFactory.setField('Signature',{
			field : 'userID',
			value : user.entity[0]
		});

		var signature = signUpFactory.create('Signature');

		if (!signature) {
			$state.go('signup');
			return;
		}

		signature.then(function(obj){
			var save = signUpFactory.save('User',{
				'signatureImage' : signUpFactory.getFactory('Signature').entity[0]
			});
			if (save) return save;
			window.reload();
		},function(error){
			console.log(error.messge);
		}).then(function(){
			hideLoader();
			$state.go('signup.confirm');
		},function(error){
			console.log(error.messge);
		});
	}

	$scope.$on('$viewContentLoaded',function($scope,$timeout){
		$ocLazyLoad.load([
					"./assets/js/excanvas.js",
  					"./assets/js/jquery.signature.min.js",
  					"./assets/js/jquery.ui.touch-punch.min.js",
  					"./assets/js/sig.js"
					]);
	});

}]);
