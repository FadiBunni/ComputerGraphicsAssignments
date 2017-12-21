var canvas;
var gl;

var texWrapIndex = 0;
var texFilterIndex = 0;

var modelViewMatrixLoc, projectionMatrixLoc;
var modelViewMatrix, projectionMatrix;

var vertices = [
    vec3(-4,-1,-1),
    vec3(4,-1,-1),
    vec3(-4,-1,-21),
    vec3(4,-1,-21)
];

var texCoord = [
vec2(-1.5, 0.0),
vec2(2.5, 0.0),
vec2(-1.5, 10.0),
vec2(2.5, 10.0)

];
var texSize = 64;
var numRows = 8;
var numCols = 8;
var myTexels = new Uint8Array(4*texSize*texSize);
for (var i = 0; i < texSize; ++i) {
    for (var j = 0; j < texSize; ++j) {
        var patchx = Math.floor(i/(texSize/numRows));
        var patchy = Math.floor(j/(texSize/numCols));
        var c = (patchx%2 !== patchy%2 ? 255 : 0);
        myTexels[4*i*texSize+4*j] = c;
        myTexels[4*i*texSize+4*j+1] = c;
        myTexels[4*i*texSize+4*j+2] = c;
        myTexels[4*i*texSize+4*j+3] = 255;
    }
}

var near = 3.5;
var far = 20;
var fov = 90;
var aspect;
var radius = 0.0;
var theta  = 0.0;
var phi    = 0.0;
var eye;
var at = vec3(0.0, 0.0, 0);
var up = vec3(0.0, 1.0, 0.0);


var init = function(){
    canvas = document.getElementById("gl_canvas");
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

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
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
    configureTexture();

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

    var m = document.getElementById("selectTexWrap");
    m.addEventListener("click", function() {
        texWrapIndex = m.selectedIndex;
        configureTexture();
    });

    var n = document.getElementById("selectTexFilter");
    n.addEventListener("click", function() {
        texFilterIndex = n.selectedIndex;
        configureTexture();
    });

    render();
}

function configureTexture() {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);
    if(texWrapIndex == 0) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }
    else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    }
    
    if(texFilterIndex == 0) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }
    else if(texFilterIndex == 1) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    else {
        gl.generateMipmap(gl.TEXTURE_2D);
    }
}

function render(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    eye = vec3(radius*Math.sin(phi), radius*Math.sin(theta), radius*Math.cos(phi));
    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fov, aspect, near, far);

    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4)
    window.requestAnimFrame(render);
}

init();
