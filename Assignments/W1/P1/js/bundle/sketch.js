(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.onload = function init(){
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








},{}]},{},[1]);
