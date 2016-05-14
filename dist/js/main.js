function Refresh(){
	window.location.reload(true);
}

$(document).ready(function(){
	function t(t){
		$(t).css("width",100/(t.length-.44)+"%"),
		$(t[t.length-1]).addClass("text-right")
	}

	$(".organization").on("click",function(){
		$(".organization .submenu").toggleClass("show"),
		$(".organization").toggleClass("showing-menu")
	}),
	t($(".equal-cells .tcell-aw"));
	$(".se-filter").on("click",function(){
		$(this).toggleClass("expand-h")
	});

	for (var e = ".sales-list li", a = 0; a < $(e).length; a++) {
        var s = $(e + ":nth-child(" + (a + 1) + ") > h4").width()
          , l = $(e + ":nth-child(" + (a + 1) + ") > h3").width()
          , i = $(e + ":nth-child(" + (a + 1) + ")").width()
          , n = $(e + ":nth-child(" + (a + 1) + ") > .dotted-separator");
        n.css("width", i - (s + l + 5) + "px")
    }
    $(".tabs li").on("click", function() {
        var t = $(this);
        $(".tabs li").removeClass("active"),
        t.addClass("active"),
        $(".tab").each(function() {
            $(this).attr("data-name") == t.attr("data-toggle") && ($(".tab").removeClass("active").hide(),
            $(this).addClass("active").show())
        })
    });
    $(".button").on("click", function() {
        $(this).find(".submenu").toggleClass("showsub")
    });
    $(".modal-opener").on("click", function() {
        var t = $(this)
          , e = t.attr("data-toggle");
        $("." + e).addClass("show")
    });
    $(".modal-close").on("click", function() {
        $(this).closest(".popup-modal").removeClass("show")
    });
    $(".popup-modal").on("click", function(t) {
        t.target == this && $(".popup-modal").removeClass("show")
    });
    var o = new Date
      , c = (o.getDate(), o.getMonth())
      , h = o.getFullYear();
    $(".weekcalendar").fullCalendar({
        weekMode: "liquid",
        events: [{
            title: "Praent vestibulum",
            start: new Date(h,c,1,9,0),
            end: new Date(h,c,1,10,0),
            allDay: !1
        }, {
            title: "Vestibulum iaculis lacinia",
            start: new Date(h,c,2,16,0),
            allDay: !1
        }, {
            title: "Integer rutrum ante eu lacus",
            start: new Date(h,c,4,16,0),
            allDay: !1
        }, {
            title: "Aliquam erat volpat. Duis ac turpis",
            start: new Date(h,c,9,16,0),
            allDay: !1
        }, {
            title: "Donec in velit vel ipsum",
            start: new Date(h,c,10,16,0),
            allDay: !1
        }]
    });
    $(".timesheet-more .table-row").on("click", function() {
        $(this).children(".timesheet-more-form").toggleClass("form-show")
    });
    $('a[href=""]').on("click", function(t) {
        t.preventDefault()
    });
    $("body").on("click", function(t) {
        t.target == this && $(".submenu").removeClass("showsub")
    });
    $(".button-next").on("click", function() {
        $(".input-container .messages").addClass("showmsg"),
        $(".input-container .messages .message").addClass("show")
    });
    $('input[name="budget"]').change(function() {
        console.log($(this)),
        "yes" == $(this).attr("value") ? $(".when-budget").removeClass("hide") : $(".when-budget").addClass("hide")
    });
    
    $(".colors li").bind("click", function() {
        $(".colors li").removeClass("active"),
        $(this).addClass("active")
    });
	
	/*$('body').on("click",'#saveAppPref',function(){
		localStorage.setItem('applicationColor',localStorage.selectedAppColor);
		localStorage.removeItem('selectedAppColor');
		Refresh();
	});*/

});
$(document).on("click",".organization",function(){
    $(".organization .submenu").toggleClass("show");
    $(".organization").toggleClass("showing-menu");
});

$(document).on("click",".colors li",
	function(elem){
		// .blue,.cyan,.green,.yellow,.orange,.red,.pink,.purple
		$(".colors li").removeClass("active"),
        $(this).addClass("active");
		var colorElem = $(elem.target);
		if (typeof(Storage) !== "undefined") {
			localStorage.setItem('selectedAppColor',colorElem.attr('class'));
			color = localStorage.selectedAppColor;
			if (color && color != 'undefined') {
				$('#appStyle').attr('href','./dist/css/main.' + color + '.css')
			}
		} else {
			alert("No local storage");
		}
	});