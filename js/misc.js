$(function () {
	var categoryText;
	var subCategoryText;

	$("#nav_wrapper nav ul li ul").hide();

	//slider nav
	$("#nav_wrapper > nav > ul > li").click(function(){
		if(!$(this).find('ul').is(":visible")) {
			$("#nav_wrapper ul ul").slideUp();
     		$(this).find('ul').slideDown();
  		}
	});

	$("#nav_wrapper > nav > ul > li > ul > li,#nav_wrapper > nav > ul > li > p").hover(function(){
     	$(this).css("cursor", "pointer");
	});

	//return text of Worksheet
	$("#nav_wrapper > nav > ul > li > p").on("click", function(){
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
	//console.log('assignments/' + categoryText + '/' + subCategoryText + '/js/shaders/vshader21.glsl');

	//Get vertex shader text
	$.ajax({
		type: 'GET',
		url: 'assignments/' + categoryText + '/' + subCategoryText + '/js/shaders/vshader21.glsl',
		error: function(xhr, statusText) {
		 	$("#vertex_shader").text("ERROR: NO CODE!");
		 },
		success: function(msg){
		 	$("#vertex_shader").text(msg);
		    $('#vertex_shader').each(function(i, e) {
	            hljs.highlightBlock(e);
	            hljs.lineNumbersBlock(e);
	        });

		    if($("#vertex-shader").length){
				//remove vertex-shader script
	        	$("#vertex-shader").remove(vertexScript);
	    	}

	        //create the vertex-shader script
	        var vertexScript  = document.createElement('script');
	        vertexScript.id   = 'vertex-shader';
	        vertexScript.type = 'x-shader/x-vertex';
	        vertexScript.innerHTML  = msg;
	        $("body").append(vertexScript);
		},
		complete: function(){
			//Get fragment shader text
			$.ajax({
				type: 'GET',
				url: 'assignments/' + categoryText + '/' + subCategoryText + '/js/shaders/fshader21.glsl',
				error: function(xhr, statusText) {
				 	$("#fragment_shader").text("ERROR: NO CODE!");
				 },
				success: function(msg){
				 	$("#fragment_shader").text(msg);
				    $('#fragment_shader').each(function(i, e) {
			            hljs.highlightBlock(e);
			            hljs.lineNumbersBlock(e);
			        });

				    if($("#fragment-shader").length){
				    	 //remove fragment-shader script
				    	$("#fragment-shader").remove(fragmentScript);
					}
		       		//create the vertex-shader script
			        var fragmentScript  = document.createElement('script');
			        fragmentScript.id   = 'fragment-shader';
			        fragmentScript.type = 'x-shader/x-fragment';
			        fragmentScript.innerHTML  = msg;
			        $("body").append(fragmentScript);
				},
				complete: function(){
					//Get index.html text
					$.ajax({
						type: 'GET',
						url: 'assignments/' + categoryText + '/' + subCategoryText + '/index.html',
						error: function(xhr, statusText) {
				 		 	$("#html_code").text("ERROR: NO CODE!");
						},
						success: function(msg){
						 	$("#html_code").text(msg);
						    $('#html_code').each(function(i, e) {
					            hljs.highlightBlock(e)
					            hljs.lineNumbersBlock(e);
					        });

					        $(".body").empty();

					        var body = msg.substring(msg.indexOf("<body>")+6,msg.indexOf("</body>"));
					        $(".body").append(body);
						},
						complete: function(){
							//Get sketch.js text
							$.ajax({
								type: 'GET',
								url: 'assignments/' + categoryText + '/' + subCategoryText + '/js/sketch.js',
								error: function(xhr, statusText) {
								 	$("#js_code").text("ERROR: NO CODE!");
								 	$("#js_canvas").remove("#js_canvas");
								},
								success: function(msg){
									//highlight the javascript code
								 	$("#js_code").text(msg);
								    $('#js_code').each(function(i, e) {
							            hljs.highlightBlock(e)
							            hljs.lineNumbersBlock(e);
							        });

								    //first remove the sketch.js script and canvas, if they exists
								    $("#js_canvas").remove(script);

								    //create the script that manipulates the canvas.
							        var script = document.createElement('script');
									script.type = 'text/javascript';
									script.innerHTML = msg;
									script.id = 'js_canvas'
									$("body").append(script);
								}
							});
						}
					});
				}
			});
		}
	});
}