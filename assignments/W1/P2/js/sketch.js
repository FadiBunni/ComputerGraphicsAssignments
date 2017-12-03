//The window.onload event is executed in misc.js file. no need to run it twice.
var program;
var gl;
var canvas;

var vertices = [
vec2(1.0, 0.0),
vec2(1.0, 1.0),
vec2(0.0, 0.0)
];

var init = function() {
    var canvas = document.getElementById( "gl_canvas" );
        canvas.width = 512;
        canvas.height = 512;
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) alert( "WebGL isn't available" );

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();
}


function render() {

    gl.clear(gl.COLOR_BUFFER_BIT );
    gl.drawArrays(gl.POINTS, 0, 3);
}

init();