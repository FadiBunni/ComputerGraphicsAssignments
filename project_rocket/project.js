"use strict";

var canvas;
var gl;
var groundProgram, objProgram, shadowProgram;

var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLight, projectionMatrixLight;

var vertices = [
vec3(-10,0,10),
vec3(10,0,10),
vec3(-10,0,-10),
vec3(10,0,-10)
]
var texCoord = [
vec2(0, 0),
vec2(1, 0),
vec2(0, 1),
vec2(1, 1)
]
var keys = {
  W: false,
  A: false,
  S: false,
  D: false,
  Space: false
}
var near = 3;
var far = 200;
var fov = 45;
var aspect;
var eye;
var at;
var up;

var initialLightHeight = 20;
var lightRadius = 6;
var lightPosition = vec4(0, initialLightHeight, 0, 0);

var isLightRotating = true;
var isThrusting = false;

var objRotateX = 0.0;
var objRotateY = 0.0;
var objRotateZ = 0.0;

var lightRotate = 0.0;

var objTranslateX = 0.0;
var objTranslateY = 0.0;
var objTranslateZ = 0.0;

var g_objDocRocket;
var g_objDocFlame;

var light = vec4(1, 1, 1, 0);
var materialAmbient = vec4(0.5, 0.5, 0.5, 0);
var materialDiffuse = vec4(0.5, 0.5, 0.5, 0);
var materialSpecular = vec4(1, 1, 1, 0);
var shininess = 50.0;
var ambientProduct = mult(light, materialAmbient);
var diffuseProduct = mult(light, materialDiffuse);
var specularProduct = mult(light, materialSpecular);

var OFFSCREEN_WIDTH = 2048, OFFSCREEN_HEIGHT = 2048;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight*0.9;
    gl = WebGLUtils.setupWebGL( canvas );

    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect = canvas.width/canvas.height;
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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

    groundProgram.vertexBuffer =  initArrayBufferForLaterUse(vertices, 3, gl.FLOAT);
    groundProgram.textureBuffer =  initArrayBufferForLaterUse(texCoord, 2, gl.FLOAT);
    groundProgram.texture = initTextures(groundProgram, 'brick_floor.png');

    objProgram.a_Position = gl.getAttribLocation(objProgram, "a_Position");
    objProgram.a_Normal = gl.getAttribLocation(objProgram, "a_Normal");
    objProgram.a_Color = gl.getAttribLocation(objProgram, "a_Color");

    objProgram.modelViewMatrix = gl.getUniformLocation(objProgram, "modelViewMatrix");
    objProgram.projectionMatrix = gl.getUniformLocation(objProgram, "projectionMatrix");
    objProgram.normalMatrix = gl.getUniformLocation(objProgram, "normalMatrix");
    objProgram.rocketBuffers = null;
    objProgram.flameBuffers = null;

    objProgram.ambientProduct = gl.getUniformLocation(objProgram, "ambientProduct");
    objProgram.diffuseProduct = gl.getUniformLocation(objProgram, "diffuseProduct");
    objProgram.specularProduct = gl.getUniformLocation(objProgram, "specularProduct");
    objProgram.lightPosition = gl.getUniformLocation(objProgram, "lightPosition");
    objProgram.shininess = gl.getUniformLocation(objProgram, "shininess");


    shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, "a_Position");
    shadowProgram.modelViewMatrix = gl.getUniformLocation(shadowProgram, "modelViewMatrix");
    shadowProgram.projectionMatrix = gl.getUniformLocation(shadowProgram, "projectionMatrix");
    shadowProgram.fbo = initFramebufferObject();

    document.getElementById("lightRotation").onclick = function(){
        isLightRotating = (!isLightRotating) ? true : false;
    };
    // Keyboard strokes
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);

    readOBJFileRocket('retro_rocket.obj', 0.3, false); 
    readOBJFileFlame('flame.obj', 0.5, false);
    //readOBJFileThruster()
    // Set the object buffers
    waitToRender();
}
function waitToRender() {
    if (!objProgram.rocketBuffers && g_objDocRocket && g_objDocRocket.isMTLComplete()) {
        objProgram.rocketBuffers = onReadComplete(g_objDocRocket);
    }
    if (!objProgram.flameBuffers && g_objDocFlame && g_objDocFlame.isMTLComplete()) {
        objProgram.flameBuffers = onReadComplete(g_objDocFlame);
    }
    if(objProgram.rocketBuffers && objProgram.flameBuffers) {
        render();
    }
    else {
        window.requestAnimFrame(waitToRender, canvas);
    }
}
function keyDown(event) {
  switch(event.which){
    case 87:
      keys.W = true;
      break;
    case 65:
      keys.A = true;
      break;
    case 83:
      keys.S = true;
      break;
    case 68:
      keys.D = true;
      break;
    case 32:
      keys.Space = true;
      break;
  }
}
function keyUp(event) {
  switch(event.which){
    case 87:
      keys.W = false;
      break;
    case 65:
      keys.A = false;
      break;
    case 83:
      keys.S = false;
      break;
    case 68:
      keys.D = false;
      break;
    case 32:
      keys.Space = false;
      break;
  }
}

function initTextures(program, imagePath) {
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

    gl.bindTexture(gl.TEXTURE_2D, null);
  };
  image.src = imagePath;
  return texture;
}

function isPowerOf2(val) {return (val & (val - 1)) == 0;}

function onReadComplete(g_objDoc) {
  var drawingInfo = g_objDoc.getDrawingInfo();

  var buffers = new Object();
  buffers.vertexBuffer = initArrayBufferForLaterUse(drawingInfo.vertices, 3, gl.FLOAT);
  buffers.normalBuffer = initArrayBufferForLaterUse(drawingInfo.normals, 3, gl.FLOAT);
  buffers.colorBuffer = initArrayBufferForLaterUse(drawingInfo.colors, 4, gl.FLOAT);
  buffers.indexBuffer = initElementArrayBufferForLaterUse(drawingInfo.indices, gl.UNSIGNED_SHORT);
  buffers.numIndices = drawingInfo.indices.length;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return buffers;
}

function readOBJFileRocket(fileName, scale, reverse) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status !== 404) {
            g_objDocRocket = onReadOBJFile(request.responseText, fileName, scale, reverse);
        }
    }
    request.open('GET', fileName, true);
    request.send();
}
function readOBJFileFlame(fileName, scale, reverse) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status !== 404) {
            g_objDocFlame = onReadOBJFile(request.responseText, fileName, scale, reverse);
        }
    }
    request.open('GET', fileName, true);
    request.send();
}

function onReadOBJFile(fileString, fileName, scale, reverse) {
    var objDoc = new OBJDoc(fileName);
    var result = objDoc.parse(fileString, scale, reverse);
    
    if (!result) {
        objDoc = null;
        console.log ("OBJ file parsing error.");
        return objDoc;
    }
    return objDoc;
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
function render()
{
    /* ROTATE VALUES ACCORDING TO KEY INPUT ------------------------- */
    if(keys.W) objRotateX += 1.5;
    if(keys.S) objRotateX -= 1.5;
    if(keys.A) objRotateZ -= 1.5;
    if(keys.D) objRotateZ += 1.5;

    if(keys.Space) isThrusting = true;
    else isThrusting =false
    /* ROTATE LIGHT SOURCE ------------------------------------------ */
    if(isLightRotating) lightRotate += 0.01;
    if(lightRotate > 2*Math.PI) {lightRotate -= 2*Math.PI;}
    lightPosition[0] = lightRadius * Math.sin(lightRotate);
    lightPosition[2] = lightRadius * Math.cos(lightRotate);
    lightPosition[1] = objTranslateY + initialLightHeight;
	/* SET VIEWMATRICES --------------------------------------------- */
    eye = vec3(0, objTranslateY + 5, -5);
    at = vec3(objTranslateX, objTranslateY, objTranslateZ);
    up = vec3(0, 1, 0);
    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fov, aspect, near, far);
    projectionMatrixLight = perspective(70.0, 1, 13, 100.0);
    var eye = vec3(lightPosition[0], lightPosition[1], lightPosition[2]);
    modelViewMatrixLight = lookAt(eye, at, up);

    var obj_translate_X_mat = translate(objTranslateX, 0, 0);
    var obj_translate_Y_mat = translate(0, objTranslateY, 0);
    //var obj_translate_Z_mat = translate(0, 0, objTranslateZ);

     
    var obj_rotate_Y_mat = rotateY(objRotateY);
    //var obj_rotate_X_mat = mult(rotateX(objRotateX), obj_rotate_Y_mat);
    var obj_rotate_Z_mat = mult(rotateZ(objRotateZ), obj_rotate_Y_mat);   

    var obj_final_transform_mat = mult(obj_translate_X_mat, obj_translate_Y_mat);

    //obj_final_transform_mat = mult(obj_final_transform_mat, obj_translate_Z_mat);
    //obj_final_transform_mat = mult(obj_final_transform_mat, obj_rotate_X_mat);
    obj_final_transform_mat = mult(obj_final_transform_mat, obj_rotate_Z_mat);
    obj_final_transform_mat = mult(obj_final_transform_mat, obj_rotate_Y_mat);
    											 
    
    var modelViewMatrix_obj = mult(modelViewMatrix, obj_final_transform_mat);
    var modelViewMatrixLight_obj = mult(modelViewMatrixLight, obj_final_transform_mat);

    /* MOVEMENT LOGIC --------------------------------------------------- */
    var rocketOffSet = 0.85;
    function rocketOnGround() {
    	return objTranslateY <= rocketOffSet;
    }

    if(isThrusting) {
    	objRotateY += 1.5;
    } else if(!rocketOnGround()) {
    	objRotateY -= 0.75;
    }
    objTranslateY -= 0.1; // TODO - Laws of gravity
    objTranslateY += isThrusting ? Math.cos(radians(objRotateZ)) * 0.20 : 0.0;
    objTranslateX -= isThrusting ? Math.sin(radians(objRotateZ)) * 0.10 : 0.0;
    //objTranslateZ += isThrusting ? Math.sin(objRotateX * Math.PI / 180) * 0.10 : 0.0;

    if(rocketOnGround()) objTranslateY = rocketOffSet;
    /* ------------------------------------------------------------------ */
    // DRAW OBJECTS
    gl.useProgram(groundProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // DRAW GROUND
    drawGround(groundProgram, modelViewMatrix, projectionMatrix,
               modelViewMatrixLight, projectionMatrixLight, false);
    // DRAW ROCKET
    gl.useProgram(objProgram);
    drawRocket(objProgram, modelViewMatrix_obj, projectionMatrix, false);
    // DRAW FLAME
    if(isThrusting) drawFlame(objProgram, modelViewMatrix_obj, projectionMatrix);

    // DRAW SHADOWS
    gl.useProgram(shadowProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowProgram.fbo);
    gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // DRAW GROUND SHADOW
    drawGround(shadowProgram, modelViewMatrixLight,
               projectionMatrixLight, null, null, true);
    
    // DRAW ROCKET SHADOW
    drawRocket(shadowProgram, modelViewMatrixLight_obj, projectionMatrixLight, true);

    window.requestAnimFrame(render);
}
function drawFlame(program, mvm, pm) {
  gl.uniform4fv(program.ambientProduct, flatten(ambientProduct));
  gl.uniform4fv(program.diffuseProduct, flatten(vec4(0,0,0,0)));
  gl.uniform4fv(program.specularProduct, flatten(vec4(0,0,0,0)));


  initAttributeVariable(program.a_Color, program.flameBuffers.colorBuffer);

  var normalMat = normalMatrix(mvm, true);
  gl.uniformMatrix3fv(program.normalMatrix, false, flatten(normalMat));
  initAttributeVariable(program.a_Normal, program.flameBuffers.normalBuffer);

  initAttributeVariable(program.a_Position, program.flameBuffers.vertexBuffer);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, program.flameBuffers.indexBuffer);

  gl.uniformMatrix4fv(program.projectionMatrix, false, flatten(pm));

  var flameOffSet = -0.75
  mvm = mult(mvm, translate(0, flameOffSet, 0));
  mvm = mult(mvm, rotateZ(180));
  gl.uniformMatrix4fv(program.modelViewMatrix, false, flatten(mvm));
  gl.drawElements(gl.TRIANGLES, program.flameBuffers.numIndices, gl.UNSIGNED_SHORT, 0);

}
function drawRocket(program, mvm, pm, drawShadow) {
    if(!drawShadow) {
      gl.uniform4fv(program.ambientProduct, flatten(ambientProduct));
      gl.uniform4fv(program.diffuseProduct, flatten(diffuseProduct));
      gl.uniform4fv(program.specularProduct, flatten(specularProduct));
      gl.uniform1f(program.shininess, shininess);

      gl.uniform4fv(program.lightPosition, flatten(lightPosition));

      initAttributeVariable(program.a_Color, program.rocketBuffers.colorBuffer);

      var normalMat = normalMatrix(mvm, true);
      gl.uniformMatrix3fv(program.normalMatrix, false, flatten(normalMat));
      initAttributeVariable(program.a_Normal, program.rocketBuffers.normalBuffer);
    }

    initAttributeVariable(program.a_Position, objProgram.rocketBuffers.vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objProgram.rocketBuffers.indexBuffer);

    gl.uniformMatrix4fv(program.projectionMatrix, false, flatten(pm));
    gl.uniformMatrix4fv(program.modelViewMatrix, false, flatten(mvm));
    gl.drawElements(gl.TRIANGLES, objProgram.rocketBuffers.numIndices, gl.UNSIGNED_SHORT, 0);
}
function drawGround(program, mvm, pm, mvmL, pmL, drawShadow) {
    if(!drawShadow) {
      gl.uniformMatrix4fv(program.modelViewMatrixLight, false, flatten(mvmL));
      gl.uniformMatrix4fv(program.projectionMatrixLight, false, flatten(pmL));

      initAttributeVariable(program.a_TexCoord, program.textureBuffer);
      gl.uniform1i(program.textureMap, 0);
      gl.uniform1i(program.shadowMap, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, program.texture);
    }
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shadowProgram.fbo.texture);

    gl.uniformMatrix4fv(program.projectionMatrix, false, flatten(pm));
    gl.uniformMatrix4fv(program.modelViewMatrix, false, flatten(mvm));
    initAttributeVariable(program.a_Position, groundProgram.vertexBuffer);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);    
}