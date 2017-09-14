$(function () {
	$("#slide_menu ul li ul").hide();

	$("#slide_menu > ul > li").click(function(){
		if(!$(this).find('ul').is(":visible")) {
			$("#slide_menu ul ul").slideUp();
     		$(this).find('ul').slideDown();
  		}
	});
});