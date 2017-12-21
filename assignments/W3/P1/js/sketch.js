var canvas;
var gl;

var numVertices  = 24;

var points = [];

var vertices = [
vec4(0, 0, 1, 1.0),//0
vec4(0, 1, 1, 1.0),//1
vec4(1, 1, 1, 1.0),//2
vec4(1, 0, 1, 1.0),//3
vec4(0, 0, 0, 1.0),//4
vec4(0, 1, 0, 1.0),//5
vec4(1, 1, 0, 1.0),//6
vec4(1, 0, 0, 1.0) //7
];

var indices = [
    0, 1, 0,
    3, 0, 4,
    1, 2, 1,
    5, 2, 3,
    2, 6, 3,
    7, 4, 5,
    4, 7, 5,
    6, 6, 7
];
var modelViewMatrixLoc;
var modelViewMatrix;
var radius = 0.75;
var theta  = Math.PI/4;
var phi    = Math.PI/4;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var init = function(){
    canvas = document.getElementById( "gl_canvas" );
    canvas.width = 512;
    canvas.height = 512;

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) alert( "WebGL isn't available" );

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    render();
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius*Math.sin(phi), radius*Math.sin(theta), radius*Math.cos(phi));
    modelViewMatrix = lookAt(eye, at , up);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    gl.drawElements(gl.LINES, numVertices, gl.UNSIGNED_BYTE, 0);

    requestAnimFrame(render);
}

init();
