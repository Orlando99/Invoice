'use strict';

invoicesUnlimited.controller('SignatureController',
	['$rootScope','$scope','$state','signUpFactory','$ocLazyLoad',
	function($rootScope,$scope,$state,signUpFactory,$ocLazyLoad){

	var user = signUpFactory.getFactory('User');

	if (!user.entity.length) {
		$state.go('signup');
		return;
	}

	if($rootScope.fromPaymentSettings) {
		var userObj = user.entity[0];
		signUpFactory.setField('User', 'fullName', userObj.get('fullName'));
		signUpFactory.setField('Signature', 'userID', userObj);
		signUpFactory.setField('Signature', 'organization',
			userObj.get('selectedOrganization'));

		showLoader();
		signUpFactory.getFactory('Role').load()
		.then(function() {
			hideLoader();

		}, function(error) {
			hideLoader();
			console.log(error.message);
		});
	}

	$('#sig').signature();
	$("#clear").click(function(){$("#sig").signature("clear")});
	$scope.fullName = signUpFactory.getField('User', 'fullName');
	$('h2.text-uppercase').css({padding:'50px 0',margin:0});
	$('.signature').css({height:$(window).height()-$('.sticky-nav').height() - parseInt($('.sticky-nav').css('padding-top'))*2 - 1});

	$scope.submitSignature = function(){
		var a = false, b = false;
		$('#sigForm').validate().resetForm();
		if ($('#sig').signature("isEmpty")) {
			$('#sigForm').validate().showErrors({
				'sigError' : 'Please provide signature'
			});
		} else a = true;

		if(! $('input[name="agree-box"]:checked').length) {
			$('#sigForm').validate().showErrors({
				'agree-box' : 'Please agree to the Terms'
			});
		} else b = true;

		if(! (a && b)) return;

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
/*
	$scope.$on('$viewContentLoaded',function($scope){
		// "./assets/js/sig.js"
		// "./assets/js/jquery.ui.touch-punch.min.js"
		$ocLazyLoad.load([
					"./assets/js/excanvas.js",
  					"./assets/js/jquery.signature.js"
					]).then(function() {
						$("#sig").signature(),
						$("#clear").click(function(){$("#sig").signature("clear")}),
						$("#json").click(function(){alert($("#sig").signature("toJSON"))}),
						$("#svg").click(function(){alert($("#sig").signature("toSVG"))})
					});
	});
*/
}]);
