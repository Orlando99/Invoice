$(function(){
	$("#sig").signature(),
	$("#clear").click(function(){$("#sig").signature("clear")}),
	$("#json").click(function(){alert($("#sig").signature("toJSON"))}),
	$("#svg").click(function(){alert($("#sig").signature("toSVG"))})
});
