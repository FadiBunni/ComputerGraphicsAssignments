//The window.onload event is executed in misc.js file. no need to run it twice.
var canvas;
var gl;
var program;

var modelViewMatrixLoc, projectionMatrixLoc;
var modelViewMatrix, projectionMatrix;
var texture1, texture2, texture3;

var vertices = [
    vec3(-2,-1,-1),
    vec3(2,-1,-1),
    vec3(-2,-1,-5),
    vec3(2,-1,-5),

    vec3(0.25, -0.5, -1.25),
    vec3(0.75,-0.5,-1.25),
    vec3(0.25,-0.5,-1.75),
    vec3(0.75,-0.5,-1.75),

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
var theta  = 0.25;
var phi    = 0.25;
var eye;
var at = vec3(0.0, 1.0, 0);
var up = vec3(0.0, 1, 0.0);

var light = vec3(0,2,-2);
var shadowPlane = -1;
var m = mat4(); // Shadow projection matrix initially an identity matrix
m[3][3] = 0.0;
m[3][1] = -1.0/(light[1]-(shadowPlane+0.01));

var thetaLight = 0.0;

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
    var red = new Uint8Array([255,0,0,255]);
    var black = new Uint8Array([0,0,0,255]);
    texture2 = loadTexture2(gl,black);
    texture3 = loadTexture2(gl,red);

    render();
}

function loadTexture1(gl) {
  var texture1 = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture1);

  // Preloads a blue color while image is downloading
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));

  var image = new Image();
  image.crossorigin = 'anonymous';
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        //gl.generateMipmap(gl.TEXTURE_2D);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_NEAREST);
    } else {
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = "assignments/W7/xamp23.png";
  return texture1;
}

function isPowerOf2(val) {return (val & (val - 1)) == 0;}

function loadTexture2(gl, color) {
    var texture2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, color);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    return texture2;
}

function render(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //eye = vec3(radius*Math.sin(phi), radius*Math.sin(theta), radius*Math.cos(phi));
    eye = vec3(0,2,2);
    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fov, aspect, near, far);

    // Light rotation
    thetaLight += 0.02;
    if(thetaLight > 2*Math.PI) {thetaLight -= 2*Math.PI;}
    light[0] = 2*Math.sin(thetaLight);
    light[2] = -2 + 2*Math.cos(thetaLight);

    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture3);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 2);
    gl.drawArrays(gl.TRIANGLE_STRIP,4,4);
    gl.drawArrays(gl.TRIANGLE_STRIP,8,4);

    // model-view matrix for shadow then render
    modelViewMatrix = mult(modelViewMatrix, translate(light[0], light[1], light[2]));
    modelViewMatrix = mult(modelViewMatrix, m);
    modelViewMatrix = mult(modelViewMatrix, translate(-light[0], -light[1], -light[2]));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 1);
    gl.drawArrays(gl.TRIANGLE_STRIP,4,4);
    gl.drawArrays(gl.TRIANGLE_STRIP,8,4);

    window.requestAnimFrame(render);
}

init();
