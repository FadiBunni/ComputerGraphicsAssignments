var canvas;
var gl;
var program;

var modelViewMatrixLoc, projectionMatrixLoc;
var modelViewMatrix, projectionMatrix;
var texture1, texture2;

var vertices = [
    // Main quad
    vec3(-2,-1,-1),
    vec3(2,-1,-1),
    vec3(-2,-1,-5),
    vec3(2,-1,-5),

    // Left, red quad
    vec3(0.25, -0.5, -1.25),
    vec3(0.75,-0.5,-1.25),
    vec3(0.25,-0.5,-1.75),
    vec3(0.75,-0.5,-1.75),

    // Right, red quad
    vec3(-1,-1,-3),
    vec3(-1,0,-3),
    vec3(-1,-1,-2.5),
    vec3(-1,0,-2.5)
];

var texCoord = [
    vec2(0, 0),
    vec2(1, 0),
    vec2(0, 1),
    vec2(1, 1),

    vec2(0, 0),
    vec2(1, 0),
    vec2(0, 1),
    vec2(1, 1),

    vec2(0, 0),
    vec2(1, 0),
    vec2(0, 1),
    vec2(1, 1)
];

var near = 2;
var far = 10;
var fov = 45;
var aspect;
var radius = 3.0;
var theta  = 0.0;
var phi    = 0.0;
var eye;
var at = vec3(0.0, 0.0, 0);
var up = vec3(0.0, 1, 0.0);

var init = function(){
    canvas = document.getElementById( "gl_canvas" );
    canvas.width = 512;
    canvas.height = 512;
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) alert( "WebGL isn't available" );

    gl.viewport( 0, 0, canvas.width, canvas.height );
    aspect = canvas.width/canvas.height;
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var a_Position = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW);

    var a_TexCoord = gl.getAttribLocation(program, "a_TexCoord");
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_TexCoord);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    texture1 = loadTexture1(gl);
    texture2 = loadTexture2(gl);

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

    render();
}

function loadTexture1(gl) {
  gl.activeTexture(gl.TEXTURE0);
  var texture1 = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture1);

  // Preloads a blue color while image is downloading
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));
  var image = new Image();
  image.crossorigin = 'anonymous';

  image.onload = function() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    } else {
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = "assignments/W7/xamp23.png";
  return texture1;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

function loadTexture2(gl) {
    gl.activeTexture(gl.TEXTURE1);
    var texture2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([255, 0, 0, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    return texture2;
}

function render(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    eye = vec3(radius*Math.sin(phi), radius*Math.sin(theta), radius*Math.cos(phi));
    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fov, aspect, near, far);

    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // MAIN IMAGE QUAD
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);

    // RED QUADS
    gl.activeTexture(gl.TEXTURE1);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 1);
    gl.drawArrays(gl.TRIANGLE_STRIP,4,4);
    gl.drawArrays(gl.TRIANGLE_STRIP,8,4);

    window.requestAnimFrame(render);
}

init();
