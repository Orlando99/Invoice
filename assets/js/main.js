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
    $(document).on("click",".tabs li", function() {
        var t = $(this);
        $(".tabs li").removeClass("active"),
        t.addClass("active"),
        $(".tab").each(function() {
            $(this).attr("data-name") == t.attr("data-toggle") && ($(".tab").removeClass("active").hide(),
            $(this).addClass("active").show())
        })
    });
    $(document).on("click",".button", function() {
        $(this).find(".submenu").toggleClass("showsub")
    });
    $(document).on("click",".modal-opener", function() {
        var t = $(this)
          , e = t.attr("data-toggle");
        $("." + e).addClass("show")
    });
    $(document).on("click",".modal-close", function() {
        $(this).closest(".popup-modal").removeClass("show")
    });
    $(document).on("click",".popup-modal", function(t) {
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
    $(document).on("click",".button-next", function() {
        $(".input-container .messages").addClass("showmsg"),
        $(".input-container .messages .message").addClass("show")
    });
    $('input[name="budget"]').change(function() {
        console.log($(this)),
        "yes" == $(this).attr("value") ? $(".when-budget").removeClass("hide") : $(".when-budget").addClass("hide")
    });
    
    $(".colors li").on("click", function() {
        $(".colors li").removeClass("active"),
        $(this).addClass("active");
        var color = this.attr('class');
        if (color && color != 'undefined') {
            $('#appStyle').attr('href',CSS_DIR + 'main.' + color + '.css')
        }
    });
});
$(document).on("click",".organization",function(){
    $(".organization .submenu").toggleClass("show");
    $(".organization").toggleClass("showing-menu");
});

$(document).on("click",".colors li",
	function(elem){
        $(".colors li").removeClass("active"),
        $(elem.target).parent().addClass("active");
        var color = $(elem.target).attr('class').replace(" active","");
        if (color && color != 'undefined') {
            $('#appStyle').attr('href',CSS_DIR + 'main.' + color + '.css')
        }
	});