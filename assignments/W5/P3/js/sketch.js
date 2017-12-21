var canvas;
var gl;

var modelViewMatrixLoc, projectionMatrixLoc;
var modelViewMatrix, projectionMatrix;

var near = 3;
var far = 10;
var fov = 45;
var aspect;
var radius = 5.0;
var theta  = 0.0;
var phi    = 0.0;
var eye;
var at = vec3(0.0, 0.0, 0);
var up = vec3(0.0, 1.0, 0.0);

var g_objDoc;
var g_drawinginfo;
var model;

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

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    model = initVertexBuffers(gl, program);
    readOBJFile('assignments/W5/suzanne.obj', 1, true);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    waitToRender();
}

function waitToRender() {
    if (!g_drawinginfo && g_objDoc && g_objDoc.isMTLComplete()) {
        g_drawinginfo = onReadComplete(gl, model, g_objDoc);
    }
    if(g_drawinginfo) {
        render();
    }
    else {
        window.requestAnimFrame(waitToRender, canvas);
    }
}

function onReadComplete(gl, model, objDoc) {
    var drawinginfo = objDoc.getDrawingInfo();

    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(drawinginfo.vertices),gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawinginfo.indices, gl.STATIC_DRAW);

    return drawinginfo;
}

function initVertexBuffers(gl, program) {
    var o = new Object();
    o.vertexBuffer = createEmptyArrayBuffer(gl, program, "a_Position", 3, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();
    return o;
}

function createEmptyArrayBuffer(gl, program, a_attribute, num, type) {
    var buffer = gl.createBuffer();
    var attributeLoc = gl.getAttribLocation(program, a_attribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attributeLoc, num, type, false, 0, 0);
    gl.enableVertexAttribArray(attributeLoc);

    return buffer;
}

function readOBJFile(fileName, scale, reverse) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status !== 404) {
            onReadOBJFile(request.responseText, fileName, scale, reverse);
        }
    }
    request.open('GET', fileName, true);
    request.send();
}

function onReadOBJFile(fileString, fileName, scale, reverse) {
    var objDoc = new OBJDoc(fileName);
    var result = objDoc.parse(fileString, scale, reverse);

    if (!result) {
        g_objDoc = null; g_drawinginfo = null;
        console.log ("OBJ file parsing error.");
        return;
    }
    g_objDoc = objDoc;
}

function render(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    eye = vec3(radius*Math.sin(phi), radius*Math.sin(theta), radius*Math.cos(phi));
    modelViewMatrix = lookAt(eye, at , up);
    phi+= 0.01;
    projectionMatrix = perspective(fov, aspect, near, far);

    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawElements(gl.TRIANGLES, g_drawinginfo.indices.length, gl.UNSIGNED_SHORT, 0);

    if(interrupted) return;
    window.requestAnimFrame(render);
}
init();
