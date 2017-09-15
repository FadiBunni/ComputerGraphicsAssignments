window.onload = function init(){
	var socket = io();
	var gl;
	var numPoints = 3;
	var colorsArray = [ ];

	const canvas = document.getElementById("canvas");
		canvas.width = 512;
		canvas.height = 512;

	gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
    	console.log( "WebGL isn't available" ); 
    }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    var program = initShaders( gl, "js/lib/shaders/vshader21.glsl", "js/lib/shaders/fshader21.glsl" );
    gl.useProgram(program);

	var vertices = [
		vec2(1.0,0.0),
		vec2(1.0,1.0),
		vec2(0.0,0.0)

	];

	// var colors = [
	// 	vec3(1.0, 0.0, 0.0),
	// 	vec3(0.0, 1.0, 0.0),
	// 	vec3(0.0, 0.0, 1.0)
	// ];
	
	// for (var index = 0; index < numPoints; ++index) {
	// 	//determine which color[i] to assign to pointsArray[index]
	// 	colorsArray.push(colors[i]);
	// }

    var vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

    render();

    function render(){
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, numPoints);
	};
};







