$(function () {
	var categoryText;
	var subCategoryText;
	interrupted = false;

	$("#nav_wrapper nav ul li ul").hide();

	//slider nav
	$("#nav_wrapper > nav > ul > li").click(function(){
		if(!$(this).find('ul').is(":visible")) {
			$("#nav_wrapper ul ul").slideUp("slow");
			$(this).find('ul').slideDown("slow");
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
			if(categoryAndSubcategoryText(categoryText,subCategoryText)[0] == 'W5' || categoryAndSubcategoryText(categoryText,subCategoryText)[0] == 'W8' || categoryAndSubcategoryText(categoryText,subCategoryText)[0] == 'W9'){
				setCookie('myCookie',JSON.stringify(categoryAndSubcategoryText(categoryText,subCategoryText)),1);
				location.reload();
			}
	});
	var myCookie = getCookie('myCookie');
		if(myCookie){
			readAndPrintFileContent(JSON.parse(myCookie));
			eraseCookie('myCookie');
			$("html, body").animate({ scrollTop: 450 }, 1500)
			//$("#nav_wrapper > nav > ul > li:nth-child("+(parseInt(JSON.parse(myCookie)[0].substring(1,2))+1)+")").find('ul').slideDown("slow");
	}
});

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function eraseCookie(name) {
    setCookie(name,"",-1);
}

function categoryAndSubcategoryText(categoryText, subCategoryText){
	interrupted = true;
	var splitCategoryText = categoryText.slice(0,1) + categoryText.slice(10,11);
	var splitSubCategoryText = subCategoryText.slice(0,1) + subCategoryText.slice(5,6);

	return [splitCategoryText, splitSubCategoryText];
};

function readAndPrintFileContent(categoryTexts){
	var categoryText = categoryTexts[0];
	var subCategoryText = categoryTexts[1];


	//Get vertex shader text for assignment 1 to 7
	if(categoryText != 'W8' && categoryText != 'W9'){
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

		        //tags
		        $("#vertex_shader_ground").empty().hide();
		        $("#vertex_shader_obj").empty().hide();
		        $("#vertex_shader_shadow").empty().hide();


		        //scripts
	        	$("#vertex-shader-obj").remove();
	        	$("#vertex-shader-ground").remove();
	        	$("#vertex-shader-shadow").remove();


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
				//Get fragment shader text for assignment 1 to 7
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

				        //tags
				        $("#fragment_shader_ground").empty().hide();
				        $("#fragment_shader_obj").empty().hide();
				        $("#fragment_shader_shadow").empty().hide();

				        $("#fragment-shader-obj").remove();
		        		$("#fragment-shader-ground").remove();
		        		$("#fragment-shader-shadow").remove();

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

							    //Emptying the body tag
						        $(".body").empty();

						        //Get the content inside the body tag from the assignments and append it to body tagin index.html
						        var body = msg.substring(msg.indexOf("<body>")+6,msg.indexOf("</body>"));
						        $(".body").append(body);
							},
							complete: function(){
								//Get comment.txt text
								$.ajax({
									type: 'GET',
									url: 'assignments/' + categoryText + '/' + subCategoryText + '/comment.txt',
									error: function(xhr, statusText) {
										$('#comments').each(function(i, e) {
								            hljs.highlightBlock(e)
								        });
									 	$("#comments").text("Couldn't find any comment for this assignment.");
									},
									success: function(msg){

										$("#comments").text(msg);
									    $('#comments').each(function(i, e) {
								            hljs.highlightBlock(e)
								        });
									    //first remove the content of the comment section
									    $("#comments").empty();
									    //add the content to the comment section
									    console.log(msg);
										$("#comments").html(msg);
									},
									complete: function(){
										//Get sketch.js text
										$.ajax({
											type: 'GET',
											url: 'assignments/' + categoryText + '/' + subCategoryText + '/js/sketch.js',
											error: function(xhr, statusText) {
											 	$("#js_code").text("ERROR: NO CODE!");
											 	$("#js_canvas").remove("#js_canvas");
											 	$(".body").empty();
											},
											success: function(msg){
												//highlight the javascript code
												interrupted = false;
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
												if((categoryText == "W2" || categoryText == "W3" ) && (subCategoryText == "P2" || subCategoryText == "P3" || subCategoryText == "P4")){
													$("body").eval(script);
												}else {
													$("body").append(script);
												}
											}
										});
									}
								});
							}
						});
					}
				});
			}
		});
	}else {

		/// TODO - add a script that makes "<pre><code id="vertex_shader" class="glsl"></code></pre>" for allfragment and vertex shaders.

		//Get vertex shader and fragment shader text for specifically assignment 8
		$.ajax({
			type: 'GET',
			url: 'assignments/' + categoryText + '/' + subCategoryText + '/js/shaders/vshaderground.glsl',
			error: function(xhr, statusText) {
			 	$("#vertex_shader_ground").text("ERROR: NO CODE!");
			 },
			success: function(msg){
			 	$("#vertex_shader_ground").text(msg);
			    $("#vertex_shader_ground").each(function(i, e) {
		            hljs.highlightBlock(e);
		            hljs.lineNumbersBlock(e);
		        });

		        $("#vertex-shader").remove();

			    if($("#vertex-shader-ground").length){
					//remove vertex-shader script
		        	$("#vertex-shader-ground").remove(vertexScript);
		    	}

		        //create the vertex-shader script
		        var vertexScript  = document.createElement('script');
		        vertexScript.id   = 'vertex-shader-ground';
		        vertexScript.type = 'x-shader/x-vertex';
		        vertexScript.innerHTML  = msg;
		        $("body").append(vertexScript);
			},
			complete: function(){
				$.ajax({
					type: 'GET',
					url: 'assignments/' + categoryText + '/' + subCategoryText + '/js/shaders/fshaderground.glsl',
					error: function(xhr, statusText) {
					 	$("#fragment_shader_ground").text("ERROR: NO CODE!");
					 },
					success: function(msg){
					 	$("#fragment_shader_ground").text(msg);
					    $("#fragment_shader_ground").each(function(i, e) {
				            hljs.highlightBlock(e);
				            hljs.lineNumbersBlock(e);
				        });

				        $("#fragment-shader").remove();

					    if($("#fragment-shader-ground").length){
					    	 //remove fragment-shader script
					    	$("#fragment-shader-ground").remove(fragmentScript);
						}
			       		//create the vertex-shader script
				        var fragmentScript  = document.createElement('script');
				        fragmentScript.id   = 'fragment-shader-ground';
				        fragmentScript.type = 'x-shader/x-fragment';
				        fragmentScript.innerHTML  = msg;
				        $("body").append(fragmentScript);
					},
					complete: function(){
						$.ajax({
							type: 'GET',
							url: 'assignments/' + categoryText + '/' + subCategoryText + '/js/shaders/vshaderobj.glsl',
							error: function(xhr, statusText) {
							 	$("#vertex_shader_obj").text("ERROR: NO CODE!");
							 },
							success: function(msg){
							 	$("#vertex_shader_obj").append(msg);
							    $("#vertex_shader_obj").each(function(i, e) {
						            hljs.highlightBlock(e);
						            hljs.lineNumbersBlock(e);
						        });

							    if($("#vertex-shader-obj").length){
									//remove vertex-shader script
						        	$("#vertex-shader-obj").remove(vertexScript);
						    	}

						        //create the vertex-shader script
						        var vertexScript  = document.createElement('script');
						        vertexScript.id   = 'vertex-shader-obj';
						        vertexScript.type = 'x-shader/x-vertex';
						        vertexScript.innerHTML  = msg;
						        $("body").append(vertexScript);
							},
							complete: function(){
								$.ajax({
									type: 'GET',
									url: 'assignments/' + categoryText + '/' + subCategoryText + '/js/shaders/fshaderobj.glsl',
									error: function(xhr, statusText) {
									 	$("#fragment_shader_obj").text("ERROR: NO CODE!");
									 },
									success: function(msg){
									 	$("#fragment_shader_obj").append(msg);
									    $("#fragment_shader_obj").each(function(i, e) {
								            hljs.highlightBlock(e);
								            hljs.lineNumbersBlock(e);
								        });

									    if($("#fragment-shader-obj").length){
									    	 //remove fragment-shader script
									    	$("#fragment-shader-obj").remove(fragmentScript);
										}
							       		//create the vertex-shader script
								        var fragmentScript  = document.createElement('script');
								        fragmentScript.id   = 'fragment-shader-obj';
								        fragmentScript.type = 'x-shader/x-fragment';
								        fragmentScript.innerHTML  = msg;
								        $("body").append(fragmentScript);
									},
									complete: function(){
										$.ajax({
											type: 'GET',
											url: 'assignments/' + categoryText + '/' + subCategoryText + '/js/shaders/vshadershadow.glsl',
											error: function(xhr, statusText) {
												if(categoryText == "W8" && subCategoryText == 'P2') $("#vertex_shader_shadow").text("ERROR: NO CODE!");
											 },
											success: function(msg){
											 	$("#vertex_shader_shadow").append(msg);
											    $("#vertex_shader_shadow").each(function(i, e) {
										            hljs.highlightBlock(e);
										            hljs.lineNumbersBlock(e);
										        });

											    if($("#vertex-shader-shadow").length){
											    	 //remove fragment-shader script
											    	$("#vertex-shader-shadow").remove(fragmentScript);
												}
									       		//create the vertex-shader script
										        var fragmentScript  = document.createElement('script');
										        fragmentScript.id   = 'vertex-shader-shadow';
										        fragmentScript.type = 'x-shader/x-vertex';
										        fragmentScript.innerHTML  = msg;
										        $("body").append(fragmentScript);
											},
											complete: function(){
												$.ajax({
													type: 'GET',
													url: 'assignments/' + categoryText + '/' + subCategoryText + '/js/shaders/fshadershadow.glsl',
													error: function(xhr, statusText) {
													 	if(categoryText == "W8" && subCategoryText == 'P2') $("#fragment_shader_shadow").text("ERROR: NO CODE!");
													 },
													success: function(msg){
													 	$("#fragment_shader_shadow").append(msg);
													    $('#fragment_shader_shadow').each(function(i, e) {
												            hljs.highlightBlock(e);
												            hljs.lineNumbersBlock(e);
												        });

													    if($("#fragment-shader-shadow").length){
													    	 //remove fragment-shader script
													    	$("#fragment-shader-shadow").remove(fragmentScript);
														}
											       		//create the vertex-shader script
												        var fragmentScript  = document.createElement('script');
												        fragmentScript.id   = 'fragment-shader-shadow';
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
																		interrupted = false;
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
								});
							}
						});
					}
				});
			}
		});
	}
}
