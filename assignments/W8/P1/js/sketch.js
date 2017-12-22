//The window.onload event is executed in misc.js file. no need to run it twice.
var canvas;
var gl;
var groundProgram;
var objProgram;
var groundObject;
var teapotObject;
var texture;

var modelViewMatrix, projectionMatrix, normalMatrix;

var vertices = [
    vec3(-2,-1,-1),
    vec3(2,-1,-1),
    vec3(-2,-1,-5),
    vec3(2,-1,-5)
]
var texCoord = [
    vec2(0, 0),
    vec2(1, 0),
    vec2(0, 1),
    vec2(1, 1)
]

var near = 3;
var far = 11;
var fov = 45;
var aspect;
var radius = 3.0;
var theta  = 0.0;
var phi    = 0.0;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var lightPosition = vec4(0.0,7.0,-3.0, 0.0);
var thetaLight = 0.0;
var shadowPlane = -1;

var m = mat4(); // Shadow projection matrix initially an identity matrix
m[3][3] = 0.0;
m[3][1] = -1.0/(lightPosition[1]-(shadowPlane));

var rot = 0;
var objMotion = true;
var lightMotion = true;
var debugging = false;

var g_objDoc;
var g_drawingInfo;

var light = vec4(0.5,0.5, 0.5, 0);
var materialAmbient = vec4(0.5, 0.5, 0.5, 0);
var materialDiffuse = vec4(0.5, 0.5, 0.5, 0);
var materialSpecular = vec4(1,1,1,0);
var shininess = 40.0;
var ambientProduct = mult(light, materialAmbient);
var diffuseProduct = mult(light, materialDiffuse);
var specularProduct = mult(light, materialSpecular);

var phiIncr = 0;

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

    groundProgram = initShaders( gl, "vertex-shader-ground", "fragment-shader-ground");
    objProgram = initShaders( gl, "vertex-shader-obj", "fragment-shader-obj");
    if (!groundProgram || !objProgram) {
    console.log('Failed to intialize shaders.');
    return;
    }
    groundProgram.a_Position = gl.getAttribLocation(groundProgram, "a_Position");
    groundProgram.a_TexCoord = gl.getAttribLocation(groundProgram, "a_TexCoord");
    groundProgram.modelViewMatrix = gl.getUniformLocation(groundProgram, "modelViewMatrix");
    groundProgram.projectionMatrix = gl.getUniformLocation(groundProgram, "projectionMatrix");
    groundProgram.sampler = gl.getUniformLocation(groundProgram, "sampler");

    objProgram.a_Position = gl.getAttribLocation(objProgram, "a_Position");
    objProgram.a_Normal = gl.getAttribLocation(objProgram, "a_Normal");
    objProgram.modelViewMatrix = gl.getUniformLocation(objProgram, "modelViewMatrix");
    objProgram.projectionMatrix = gl.getUniformLocation(objProgram, "projectionMatrix");
    objProgram.normalMatrix = gl.getUniformLocation(objProgram, "normalMatrix");

    objProgram.ambientProduct = gl.getUniformLocation(objProgram, "ambientProduct");
    objProgram.diffuseProduct = gl.getUniformLocation(objProgram, "diffuseProduct");
    objProgram.specularProduct = gl.getUniformLocation(objProgram, "specularProduct");
    objProgram.lightPosition = gl.getUniformLocation(objProgram, "lightPosition");
    objProgram.shininess = gl.getUniformLocation(objProgram, "shininess");

    groundObject = new Object();
    groundObject.vertexBuffer =  initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    groundObject.texCoordBuffer =  initArrayBufferForLaterUse(gl, texCoord, 2, gl.FLOAT);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    texture = initTextures(gl, groundProgram)

    readOBJFile('assignments/W8/teapot.obj',gl, 1/4, true);

    document.getElementById("objMotion").onclick = function(){
        if(!objMotion) objMotion = true;
        else objMotion = false;
    };
    document.getElementById("lightMotion").onclick = function(){
        if(!lightMotion) lightMotion = true;
        else lightMotion = false;
    };

    waitToRender();
}

function waitToRender() {
    if (!teapotObject && g_objDoc && g_objDoc.isMTLComplete()) {
        teapotObject = onReadComplete(gl, teapotObject, g_objDoc);
    }
    if(teapotObject) {
        render();
    }
    else {
        window.requestAnimFrame(waitToRender, canvas);
    }
}

function initTextures(gl, program) {
  var texture = gl.createTexture();
  var image = new Image();
  image.crossorigin = 'anonymous';
  image.onload = function() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    } else {
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    // Pass the texure unit 0 to u_Sampler
    gl.useProgram(program);
    gl.uniform1i(program.sampler, 0);

    gl.bindTexture(gl.TEXTURE_2D, null);
  };
  image.src = "assignments/W8/xamp23.png";
  return texture;
}

function isPowerOf2(val) {return (val & (val - 1)) == 0;}

function onReadComplete(gl, teapotObject, objDoc) {
    var drawingInfo = g_objDoc.getDrawingInfo();

    teapotObject = new Object();
    teapotObject.vertexBuffer = initArrayBufferForLaterUse(gl, drawingInfo.vertices, 3, gl.FLOAT)
    teapotObject.normalBuffer = initArrayBufferForLaterUse(gl,drawingInfo.normals, 3, gl.FLOAT)
    teapotObject.indexBuffer = initElementArrayBufferForLaterUse(gl, drawingInfo.indices, gl.UNSIGNED_SHORT);
    teapotObject.numIndices = drawingInfo.indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return teapotObject;
}

function readOBJFile(fileName, gl, scale, reverse) {
    var request = new XMLHttpRequest();
    request.open('GET', fileName, true);
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status !== 404) {
            onReadOBJFile(request.responseText, fileName, gl, scale, reverse);
        }
    }
    request.send();
}

function onReadOBJFile(fileString, fileName, gl, scale, reverse) {
    var objDoc = new OBJDoc(fileName);
    var result = objDoc.parse(fileString, scale, reverse);

    if (!result) {
        g_objDoc = null; g_drawingInfo = null;
        console.log ("OBJ file parsing error.");
        return;
    }
    g_objDoc = objDoc;
}

function render(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    eye = vec3(radius*Math.sin(phi), radius*Math.sin(theta), radius*Math.cos(phi));
    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fov, aspect, near, far);

    if(debugging) {
      eye = vec3(0, 5, -3);
      modelViewMatrix = lookAt(eye, vec3(0.0, -1.0, -3.0) , vec3(0.0, 0.0, -1.0));
    }

    // DRAW GROUND
    drawGround(gl, groundProgram, groundObject, texture, modelViewMatrix);
    // DRAW TEAPOT
    drawObj(gl, objProgram, teapotObject, modelViewMatrix);
    
    if(!interrupted) requestAnimFrame(render);
}

function drawObj(gl, program, o, modelViewMatrix) {
    gl.useProgram(program);

    // ROTATE LIGHT SOURCE
    if(lightMotion) thetaLight += 0.01;
    if(thetaLight > 2*Math.PI) {thetaLight -= 2*Math.PI;}
    lightPosition[0] = 2*Math.sin(thetaLight);
    lightPosition[2] = -2 + 2*Math.cos(thetaLight);

    initAttributeVariable(gl, program.a_Position, o.vertexBuffer);
    initAttributeVariable(gl, program.a_Normal, o.normalBuffer);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);

    var t1 = translate(vec3(0, -1, -3), mat4());
    modelViewMatrix = mult(modelViewMatrix, t1);

    // Translation up and down
    if(objMotion) rot+=0.02;
    if(rot >= Math.PI) rot-=Math.PI
    var trans = Math.sin(rot);
    var t2 = translate(vec3(0,trans,0),mat4());
    modelViewMatrix = mult(modelViewMatrix, t2);

    gl.depthFunc(gl.LESS);

    gl.uniformMatrix4fv(program.projectionMatrix, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(program.modelViewMatrix, false, flatten(modelViewMatrix));
    var normalM = normalMatrix(modelViewMatrix, true)
    gl.uniformMatrix3fv(program.normalMatrix, false, flatten(normalM));

    gl.uniform4fv(program.ambientProduct, flatten(ambientProduct));
    gl.uniform4fv(program.diffuseProduct, flatten(diffuseProduct));
    gl.uniform4fv(program.specularProduct, flatten(specularProduct));
    gl.uniform4fv(program.lightPosition, flatten(lightPosition));
    gl.uniform1f(program.shininess, shininess);

    gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);

    // SHADOWS
    gl.depthFunc(gl.GEQUAL);
    var shadowMatrix = modelViewMatrix;
    shadowMatrix = mult(shadowMatrix, translate(lightPosition[0], lightPosition[1], lightPosition[2]));
    shadowMatrix = mult(shadowMatrix, m);
    shadowMatrix = mult(shadowMatrix, translate(-lightPosition[0], -lightPosition[1], -lightPosition[2]));

    gl.uniformMatrix4fv(program.modelViewMatrix, false, flatten(shadowMatrix));
    gl.uniform4fv(program.ambientProduct, flatten(vec4(0,0,0,0)));
    gl.uniform4fv(program.diffuseProduct, flatten(vec4(0,0,0,0)));
    gl.uniform4fv(program.specularProduct, flatten(vec4(0,0,0,0)));
    gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);

}

function drawGround(gl, program, o, texture, modelViewMatrix) {
    gl.useProgram(program);
    gl.depthFunc(gl.LESS);
    initAttributeVariable(gl, program.a_Position, o.vertexBuffer);
    initAttributeVariable(gl, program.a_TexCoord, o.texCoordBuffer);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.uniformMatrix4fv(program.projectionMatrix, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(program.modelViewMatrix, false, flatten(modelViewMatrix));

    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);

}

function initAttributeVariable(gl, a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}

function initArrayBufferForLaterUse(gl, data, num, type) {
  var buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

  buffer.num = num;
  buffer.type = type;

  return buffer;
}

function initElementArrayBufferForLaterUse(gl, data, type) {
  var buffer = gl.createBuffer();

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

  buffer.type = type;

  return buffer;
}

init();
