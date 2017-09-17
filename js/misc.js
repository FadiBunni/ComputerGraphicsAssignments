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


	jQuery.get('Assignments/W1/P1/index.html', function(data) {
	    $("#vertex_shader").text(data);
	    //process text file line by line
	    //$('#vertex_shader').text(data.value());
	    $('#vertex_shader').each(function(i, e) {
            hljs.highlightBlock(e)
        });
	});

	// jQuery.get('Assignments/W1/P1/index.html', function(data) {
	//     $("#vertex_shader").text(data);
	//     //process text file line by line
	//     //$('#vertex_shader').text(data.value());
	//     $('#vertex_shader').each(function(i, e) {
 //            hljs.highlightBlock(e)
 //        });
	// });

	// jQuery.get('Assignments/W1/P1/index.html', function(data) {
	//     $("#vertex_shader").text(data);
	//     //process text file line by line
	//     //$('#vertex_shader').text(data.value());
	//     $('#vertex_shader').each(function(i, e) {
 //            hljs.highlightBlock(e)
 //        });
	// });

	jQuery.get('Assignments/W1/P1/js/sketch.js', function(data) {

	    //process text file line by line
	    //$('#vertex_shader').text(data.value());
        $("#js_code").text(data);
        $('#js_code').each(function(i, e) {
            hljs.highlightBlock(e)
        });
	});
}