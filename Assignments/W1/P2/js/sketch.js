window.onload = function init(){
	var gl;
	var numPoints = 3;

	const canvas = document.getElementById("gl-canvas");
		canvas.width = 512;
		canvas.height = 512;

	gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { console.log( "WebGL isn't available" );}

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    render();
};

function render(){
	gl.clear(gl.COLOR_BUFFER_BIT);
};