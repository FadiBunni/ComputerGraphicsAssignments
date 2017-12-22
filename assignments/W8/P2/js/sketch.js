var canvas;
var gl;
var groundProgram, objProgram, shadowProgram;
var groundObject, teapotObject;
var texture;
var fbo;

var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLight, projectionMatrixLight;
var normalM;

var vertices = [
    vec3(-2,-1,2),
    vec3(2,-1,2),
    vec3(-2,-1,-2),
    vec3(2,-1,-2)
]
var texCoord = [
    vec2(0, 0),
    vec2(1, 0),
    vec2(0, 1),
    vec2(1, 1)
]

var near = 1;
var far = 10;
var fov = 45;
var aspect;

var lightPosition = vec4(0, 4, 0, 0);
var thetaLight = 0.0;

var objMotion = true;
var lightMotion = true;
var thetaTranslate = 0.0;

var g_objDoc;
var g_drawingInfo;

var light = vec4(0.5,0.5, 0.5, 0);
var materialAmbient = vec4(0.5, 0.5, 0.5, 0);
var materialDiffuse = vec4(0.5, 0.5, 0.5, 0);
var materialSpecular = vec4(1,1,1,0);
var shininess = 50.0;
var ambientProduct = mult(light, materialAmbient);
var diffuseProduct = mult(light, materialDiffuse);
var specularProduct = mult(light, materialSpecular);

var OFFSCREEN_WIDTH = 2048, OFFSCREEN_HEIGHT = 2048;

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
    shadowProgram = initShaders(gl, "vertex-shader-shadow", "fragment-shader-shadow");
    if (!groundProgram || !objProgram || !shadowProgram) {
      console.log('Failed to intialize shaders.');
      return;
    }
    groundProgram.a_Position = gl.getAttribLocation(groundProgram, "a_Position");
    groundProgram.a_TexCoord = gl.getAttribLocation(groundProgram, "a_TexCoord");
    groundProgram.modelViewMatrix = gl.getUniformLocation(groundProgram, "modelViewMatrix");
    groundProgram.projectionMatrix = gl.getUniformLocation(groundProgram, "projectionMatrix");
    groundProgram.textureMap = gl.getUniformLocation(groundProgram, "textureMap");
    groundProgram.modelViewMatrixLight = gl.getUniformLocation(groundProgram, "modelViewMatrixLight");
    groundProgram.projectionMatrixLight = gl.getUniformLocation(groundProgram, "projectionMatrixLight");
    groundProgram.shadowMap = gl.getUniformLocation(groundProgram, "shadowMap");

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

    shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, "a_Position");
    shadowProgram.modelViewMatrix = gl.getUniformLocation(shadowProgram, "modelViewMatrix");
    shadowProgram.projectionMatrix = gl.getUniformLocation(shadowProgram, "projectionMatrix");
    shadowProgram.fbo = initFramebufferObject();

    groundObject = new Object();
    groundObject.vertexBuffer =  initArrayBufferForLaterUse(vertices, 3, gl.FLOAT);
    groundObject.texCoordBuffer =  initArrayBufferForLaterUse(texCoord, 2, gl.FLOAT);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    texture = initTextures(groundProgram)

    readOBJFile('assignments/W8/teapot.obj', 1/4, true);

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
        teapotObject = onReadComplete(teapotObject, g_objDoc);
    }
    if(teapotObject) {
        render();
    }
    else {
        window.requestAnimFrame(waitToRender, canvas);
    }
}

function initTextures(program) {
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
    gl.useProgram(program);
    gl.uniform1i(program.textureMap, 0);
  };
  image.src = "assignments/W8/xamp23.png";
  return texture;
}

function isPowerOf2(val) {return (val & (val - 1)) == 0;}

function onReadComplete(teapotObject, objDoc) {
    var drawingInfo = g_objDoc.getDrawingInfo();

    teapotObject = new Object();
    teapotObject.vertexBuffer = initArrayBufferForLaterUse(drawingInfo.vertices, 3, gl.FLOAT)
    teapotObject.normalBuffer = initArrayBufferForLaterUse(drawingInfo.normals, 3, gl.FLOAT)
    teapotObject.indexBuffer = initElementArrayBufferForLaterUse(drawingInfo.indices, gl.UNSIGNED_SHORT);
    teapotObject.numIndices = drawingInfo.indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return teapotObject;
}

function readOBJFile(fileName, scale, reverse) {
    var request = new XMLHttpRequest();
    request.open('GET', fileName, true);
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status !== 404) {
            onReadOBJFile(request.responseText, fileName, scale, reverse);
        }
    }
    request.send();
}

function onReadOBJFile(fileString, fileName, scale, reverse) {
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
    // ROTATE LIGHT SOURCE
    if(lightMotion) thetaLight += 0.01;
    if(thetaLight > 2*Math.PI) {thetaLight -= 2*Math.PI;}
    lightPosition[0] = 4*Math.sin(thetaLight);
    lightPosition[2] = -2 + 4*Math.cos(thetaLight);

    // SET UP MATRICES
    var eye = vec3(0,2,-6);
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);

    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fov, aspect, near, far);
    projectionMatrixLight = perspective(75.0, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, 1, 100.0);
    eye = vec3(lightPosition[0], lightPosition[1], lightPosition[2]);
    modelViewMatrixLight = lookAt(eye, at, up);

    var obj_translate = translate(0, Math.sin(thetaTranslate) * 0.2 - 0.5, 0);
    var modelViewMatrix_obj = mult(modelViewMatrix, obj_translate);
    var modelViewMatrixLight_obj = mult(modelViewMatrixLight, obj_translate);
    normalM = normalMatrix(modelViewMatrix_obj, true);

    thetaTranslate += objMotion ? 0.05 : 0.0;

    // DRAW SHADOWS
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowProgram.fbo);
    gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shadowProgram);
    // DRAW GROUND FOR SHADOW
    drawGround(shadowProgram, groundObject, texture, modelViewMatrixLight,
               projectionMatrixLight, null, null, true);
    // DRAW TEAPOT SHADOW
    drawObj(shadowProgram, teapotObject, modelViewMatrixLight_obj, projectionMatrixLight, true);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // DRAW GROUND
    gl.useProgram(groundProgram);
    drawGround(groundProgram, groundObject, texture, modelViewMatrix, projectionMatrix,
               modelViewMatrixLight, projectionMatrixLight, false);
    // DRAW TEAPOT
    gl.useProgram(objProgram);
    drawObj(objProgram, teapotObject, modelViewMatrix_obj, projectionMatrix, false);
    
    if(!interrupted) requestAnimFrame(render);
}

function drawObj(program, o, mvm, pm, drawShadow) {
    if(!drawShadow) {
      gl.uniform4fv(program.ambientProduct, flatten(ambientProduct));
      gl.uniform4fv(program.diffuseProduct, flatten(diffuseProduct));
      gl.uniform4fv(program.specularProduct, flatten(specularProduct));
      gl.uniform1f(program.shininess, shininess);

      gl.uniform4fv(program.lightPosition, flatten(lightPosition));

      gl.uniformMatrix3fv(program.normalMatrix, false, flatten(normalM));
      initAttributeVariable(program.a_Normal, o.normalBuffer);
    }

    initAttributeVariable(program.a_Position, o.vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);

    gl.uniformMatrix4fv(program.projectionMatrix, false, flatten(pm));
    gl.uniformMatrix4fv(program.modelViewMatrix, false, flatten(mvm));
    gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);
}

function drawGround(program, o, texture, mvm, pm, mvmL, pmL, drawShadow) {
    if(!drawShadow) {
      gl.uniformMatrix4fv(program.modelViewMatrixLight, false, flatten(mvmL));
      gl.uniformMatrix4fv(program.projectionMatrixLight, false, flatten(pmL));

      initAttributeVariable(program.a_TexCoord, o.texCoordBuffer);
      gl.uniform1i(program.textureMap, 0);
      gl.uniform1i(program.shadowMap, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, shadowProgram.fbo.texture);
    }

    gl.uniformMatrix4fv(program.projectionMatrix, false, flatten(pm));
    gl.uniformMatrix4fv(program.modelViewMatrix, false, flatten(mvm));
    initAttributeVariable(program.a_Position, o.vertexBuffer);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
}

function initAttributeVariable(a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}

function initArrayBufferForLaterUse(data, num, type) {
  var buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

  buffer.num = num;
  buffer.type = type;

  return buffer;
}

function initElementArrayBufferForLaterUse(data, type) {
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

  buffer.type = type;

  return buffer;
}

function initFramebufferObject() {
  var framebuffer, texture, depthBuffer;

  framebuffer = gl.createFramebuffer();

  texture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  depthBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

  framebuffer.texture = texture;

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);

  return framebuffer;
}

init();
