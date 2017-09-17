$(function () {
	var categoryText;
	var subCategoryText;

	$("#slide_menu ul li ul").hide();

	//slider nav
	$("#slide_menu > ul > li").click(function(){
		if(!$(this).find('ul').is(":visible")) {
			$("#slide_menu ul ul").slideUp();
     		$(this).find('ul').slideDown();
  		}

	});

	//return text of Worksheet
	$("#slide_menu > ul > li > p").on("click", function(){
		categoryText = $(this).text();
	});

	//return text of parts
	$("#left_nav > li > p").on("click", function(){
		subCategoryText = $(this).text();
		readAndPrintFileContent(categoryAndSubcategoryText(categoryText,subCategoryText));
	});
});

function categoryAndSubcategoryText(categoryText, subCategoryText){
	var splitCategoryText = categoryText.slice(0,1) + categoryText.slice(10,11);
	var splitSubCategoryText = subCategoryText.slice(0,1) + subCategoryText.slice(5,6);
	return [splitCategoryText, splitSubCategoryText];
};

function readAndPrintFileContent(CategoryTexts){
	var categoryText = CategoryTexts[0];
	var subCategoryText = CategoryTexts[1];
	console.log('Assignments/' + categoryText + '/' + subCategoryText + '/js/shaders/vshader21.glsl');

	$.ajax({
		type: 'GET',
		url: 'Assignments/' + categoryText + '/' + subCategoryText + '/js/shaders/vshader21.glsl',
		error: function(xhr, statusText) {
		 	$("#vertex_shader").text("ERROR: NO CODE!");
		 },
		success: function(msg){
		 	$("#vertex_shader").text(msg);
		    $('#vertex_shader').each(function(i, e) {
	            hljs.highlightBlock(e)
	        });
		}
	});

	$.ajax({
		type: 'GET',
		url: 'Assignments/' + categoryText + '/' + subCategoryText + '/js/shaders/fshader21.glsl',
		error: function(xhr, statusText) {
		 	$("#fragment_shader").text("ERROR: NO CODE!");
		 },
		success: function(msg){
		 	$("#fragment_shader").text(msg);
		    $('#fragment_shader').each(function(i, e) {
	            hljs.highlightBlock(e)
	        });
		}
	});

	$.ajax({
		type: 'GET',
		url: 'Assignments/' + categoryText + '/' + subCategoryText + '/index.html',
		error: function(xhr, statusText) {
 		 	$("#html_code").text("ERROR: NO CODE!");
		},
		success: function(msg){
		 	$("#html_code").text(msg);
		    $('#html_code').each(function(i, e) {
	            hljs.highlightBlock(e)
	        });
		}
	});

	$.ajax({
		type: 'GET',
		url: 'Assignments/' + categoryText + '/' + subCategoryText + '/js/sketch.js',
		error: function(xhr, statusText) {
		 	$("#js_code").text("ERROR: NO CODE!");
		},
		success: function(msg){
			//highlightthe javascript code
		 	$("#js_code").text(msg);
		    $('#js_code').each(function(i, e) {
	            hljs.highlightBlock(e)
	        });
		    //create the script that manipulates the canvas.
	        var script = document.createElement('script');
			script.type = 'text/javascript';
			script.innerHTML = msg;
			$("body").append(script);
		}
	});
}