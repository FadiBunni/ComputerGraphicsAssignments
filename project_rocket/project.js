"use strict";

var canvas;
var gl;
var groundProgram, objProgram, shadowProgram, planeProgram;

var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLight, projectionMatrixLight;

var groundVertices = [
vec3(-10,0,10),
vec3(10,0,10),
vec3(-10,0,-10),
vec3(10,0,-10)
];
var mirrorPlane = [
  vec3(-2, 6, 0),
  vec3(2, 6, 0),
  vec3(-2, 0, 0),
  vec3(2, 0, 0)
];
var groundTexCoords = [
vec2(0, 0),
vec2(1, 0),
vec2(0, 1),
vec2(1, 1)
];
var mirrorColors = [
  vec3(0.5, 0, 0), // RED
  vec3(0, 0.5, 0), // GREEN
  vec3(0, 0, 0.5), // BLUE
  vec3(0.5, 0.5, 0), // YELLOW
  vec3(0.5, 0, 0.5), // PINK
  vec3(0.5, 0.5, 0.5)  // WHITE
]
var mirrorAlpha = 0.5; // Initial value
var mirrorColor = vec4(0.5, 0.5, 0.5, mirrorAlpha); // Initial value

var keys = {
  W: false,
  A: false,
  S: false,
  D: false,
  up: false,
  down: false,
  shift: false
};
// LIGHT GLOBALS
var initialLightHeight = 20;
var lightRadius = 6;
var lightPosition = vec4(0, initialLightHeight, 0, 0);
var isLightRotating = true;
var lightRotate = 0.0;

// ROCKET GLOBALS
var isThrusting = false;
var initialZoomValue = 5.0;
var initialZTranslate = -2.0;
var zoomFactor = initialZoomValue;

var objRotateX = 0.0, objRotateY = 0.0, objRotateZ = 0.0;
var objTranslateX = 0.0, objTranslateY = 0.0, objTranslateZ = initialZTranslate;

var rocketYOffSet = 0.85;
var flameYOffSet = -0.75;
var initialFlameScale = 0.5;
var flameScale = initialFlameScale;

// GLOBALS FOR READING OBJ FILES
var g_objDocRocket, g_objDocFlame, g_objDocMirrorFrame;

// GLOBALS FOR SHADING
var light = vec4(1, 1, 1, 0);
var frameAmbient = vec4(0.5, 0.5, 0.5, 0);
var frameDiffuse = vec4(0.5, 0.5, 0.5, 0);
var frameSpecular = vec4(1, 1, 1, 0);
var shininess = 50.0;
var ambientProduct = mult(light, frameAmbient);
var diffuseProduct = mult(light, frameDiffuse);
var specularProduct = mult(light, frameSpecular);

// GLOBALS FOR SHADOWING
var OFFSCREEN_WIDTH = 2048, OFFSCREEN_HEIGHT = 2048;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    canvas.width = window.innerWidth *0.7;
    canvas.height = window.innerHeight*0.8;
    gl = WebGLUtils.setupWebGL( canvas, { stencil: true } );

    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    groundProgram = initShaders( gl, "vertex-shader-ground", "fragment-shader-ground");
    objProgram = initShaders( gl, "vertex-shader-obj", "fragment-shader-obj");
    shadowProgram = initShaders(gl, "vertex-shader-shadow", "fragment-shader-shadow");
    planeProgram = initShaders(gl, "vertex-shader-plane", "fragment-shader-plane");
    if (!groundProgram || !objProgram || !shadowProgram) {
      console.log('Failed to intialize shaders.');
      return;
    }
    // VALUES FOR GROUND PROGRAM
    groundProgram.a_Position = gl.getAttribLocation(groundProgram, "a_Position");
    groundProgram.a_TexCoord = gl.getAttribLocation(groundProgram, "a_TexCoord");
    groundProgram.modelViewMatrix = gl.getUniformLocation(groundProgram, "modelViewMatrix");
    groundProgram.projectionMatrix = gl.getUniformLocation(groundProgram, "projectionMatrix");
    groundProgram.textureMap = gl.getUniformLocation(groundProgram, "textureMap");
    groundProgram.modelViewMatrixLight = gl.getUniformLocation(groundProgram, "modelViewMatrixLight");
    groundProgram.projectionMatrixLight = gl.getUniformLocation(groundProgram, "projectionMatrixLight");
    groundProgram.shadowMap = gl.getUniformLocation(groundProgram, "shadowMap");

    groundProgram.vertexBuffer =  initArrayBufferForLaterUse(groundVertices, 3, gl.FLOAT);
    groundProgram.textureBuffer =  initArrayBufferForLaterUse(groundTexCoords, 2, gl.FLOAT);
    groundProgram.texture = initTextures(groundProgram, 'brick_floor.png');

    // VALUES FOR OBJ PROGRAM
    objProgram.a_Position = gl.getAttribLocation(objProgram, "a_Position");
    objProgram.a_Normal = gl.getAttribLocation(objProgram, "a_Normal");
    objProgram.a_Color = gl.getAttribLocation(objProgram, "a_Color");
    objProgram.modelViewMatrix = gl.getUniformLocation(objProgram, "modelViewMatrix");
    objProgram.projectionMatrix = gl.getUniformLocation(objProgram, "projectionMatrix");
    objProgram.normalMatrix = gl.getUniformLocation(objProgram, "normalMatrix");
    objProgram.mirrorColor = gl.getUniformLocation(objProgram, "mirrorColor");
    objProgram.rocketBuffers = null;
    objProgram.flameBuffers = null;
    objProgram.mirrorFrameBuffers = null;

    objProgram.ambientProduct = gl.getUniformLocation(objProgram, "ambientProduct");
    objProgram.diffuseProduct = gl.getUniformLocation(objProgram, "diffuseProduct");
    objProgram.specularProduct = gl.getUniformLocation(objProgram, "specularProduct");
    objProgram.lightPosition = gl.getUniformLocation(objProgram, "lightPosition");
    objProgram.shininess = gl.getUniformLocation(objProgram, "shininess");

    // VALUES FOR SHADOW PROGRAM
    shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, "a_Position");
    shadowProgram.modelViewMatrix = gl.getUniformLocation(shadowProgram, "modelViewMatrix");
    shadowProgram.projectionMatrix = gl.getUniformLocation(shadowProgram, "projectionMatrix");
    shadowProgram.fbo = initFramebufferObject();

    // VALUES FOR PLANE PROGRAM
    planeProgram.a_Position = gl.getAttribLocation(planeProgram, "a_Position");
    planeProgram.color = gl.getUniformLocation(planeProgram, "color");
    planeProgram.modelViewMatrix = gl.getUniformLocation(planeProgram, "modelViewMatrix");
    planeProgram.projectionMatrix = gl.getUniformLocation(planeProgram, "projectionMatrix");
    planeProgram.vertexBuffer = initArrayBufferForLaterUse(mirrorPlane, 3, gl.FLOAT);

    document.getElementById("lightRotation").onclick = function(){
        isLightRotating = (!isLightRotating) ? true : false;
    };
    document.getElementById("resetRocket").onclick = function() {
      resetRocket();
    }
    var m = document.getElementById("selectMirrorColor");
    m.addEventListener("click", function() {
      mirrorColor = mirrorColors[m.selectedIndex];
      mirrorColor[3] = mirrorAlpha;
    });

    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);

    readOBJFileRocket('retro_rocket.obj', 0.3, false); 
    readOBJFileFlame('flame.obj', 0.5, false);
    readOBJFileMirrorFrame('mirrorFrame_detailed.obj', 3.5, true);

    waitToRender();
}
function waitToRender() {
    if (!objProgram.rocketBuffers && g_objDocRocket && g_objDocRocket.isMTLComplete()) {
        objProgram.rocketBuffers = onReadComplete(g_objDocRocket);
    }
    if (!objProgram.flameBuffers && g_objDocFlame && g_objDocFlame.isMTLComplete()) {
        objProgram.flameBuffers = onReadComplete(g_objDocFlame);
    }
    if (!objProgram.mirrorFrameBuffers && g_objDocMirrorFrame && g_objDocMirrorFrame.isMTLComplete()) {
        objProgram.mirrorFrameBuffers = onReadComplete(g_objDocMirrorFrame);
    }
    if(objProgram.rocketBuffers && objProgram.flameBuffers && objProgram.mirrorFrameBuffers) {
        render();
    }
    else {
        window.requestAnimFrame(waitToRender, canvas);
    }
}
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

    case 38:
      keys.up = true;
      break;
    case 40:
      keys.down = true;
      break;
    case 16:
      keys.shift = true;
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

    case 38:
      keys.up = false;
      break;
    case 40:
      keys.down = false;
      break;
    case 16:
      keys.shift = false;
      break;
  }
}

function initTextures(program, imagePath) {
  function isPowerOf2(val) {return (val & (val - 1)) == 0;}

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
function readOBJFileMirrorFrame(fileName, scale, reverse) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status !== 404) {
            g_objDocMirrorFrame = onReadOBJFile(request.responseText, fileName, scale, reverse);
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

function initAttributeVariable(a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}

function resetRocket() {
  objTranslateX = 0;
  objTranslateY = 0;
  objTranslateZ = initialZTranslate;
  objRotateX = 0;
  objRotateY = 0;
  objRotateZ = 0;
  zoomFactor = initialZoomValue;

  lightRotate = 0;
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
function mirrorMatrix(p, v) {
    var m = mat4();
    var dot = p[0]*v[0] + p[1]*v[1] + p[2]*v[2];

    m[0][0] = 1 - 2*v[0]*v[0];
    m[1][0] = - 2*v[0]*v[1];
    m[2][0] = - 2*v[0]*v[2];
    m[3][0] =  2*dot*v[0];
    m[0][1] = - 2*v[0]*v[1];
    m[1][1] = 1 - 2*v[1]*v[1];
    m[2][1] = - 2*v[1]*v[2];
    m[3][1] =  2*dot*v[1];
    m[0][2] = - 2*v[0]*v[2];
    m[1][2] = - 2*v[1]*v[2];
    m[2][2] = 1 - 2*v[2]*v[2];
    m[3][2] =  2*dot*v[2];
    m[0][3] = 0;
    m[1][3] = 0;
    m[2][3] = 0;
    m[3][3] = 1;

    return m;
}
function modifyProjectionMatrix(clipplane, projection) {

  var oblique = mult(mat4(), projection);
  var q = vec4((Math.sign(clipplane[0]) + projection[0][2])/projection[0][0],
  (Math.sign(clipplane[1]) + projection[1][2])/projection[1][1],-1.0,
  (1.0 + projection[2][2])/projection[2][3]);
  var s = 2.0/dot(clipplane, q);
  oblique[2] = vec4(clipplane[0]*s, clipplane[1]*s,
  clipplane[2]*s + 1.0, clipplane[3]*s);
  return oblique;
}
function moveObjects() {
  // HELPING FUNCTIONS
  function rocketOnGround() {return objTranslateY <= rocketYOffSet;}
  // KEY INPUT (ROCKET ROTATION)
  if(keys.W) objRotateX += 1.5;
  if(keys.S) objRotateX -= 1.5;
  if(keys.A) objRotateZ -= 1.5;
  if(keys.D) objRotateZ += 1.5;
  if(keys.up && zoomFactor > 0.3) zoomFactor -= 0.1;
  if(keys.down) zoomFactor += 0.1;

  if(keys.shift) isThrusting = true;
  else isThrusting = false

  if(isThrusting) {
    objRotateY += 1.5;
  } else if(!rocketOnGround()) {
    objRotateY -= 0.75;
  }

  if(Math.abs(objRotateX) > 360) objRotateX = 0;
  if(Math.abs(objRotateZ) > 360) objRotateZ = 0;
  if(Math.abs(objRotateY) > 360) objRotateY = 0;

  // ROCKET TRANSLATION
  objTranslateY -= 0.10; // TODO - Laws of gravity
  objTranslateY += isThrusting ? Math.cos(radians(objRotateZ)) * 
                                 Math.cos(radians(objRotateX)) * 0.20 : 0.0;

  objTranslateX -= isThrusting ? Math.sin(radians(objRotateZ)) *
                                 Math.cos(radians(objRotateX)) * 0.10 : 0.0;

  objTranslateZ += isThrusting ? Math.sin(radians(objRotateX)) * 0.10 : 0.0;

  if(rocketOnGround()) objTranslateY = rocketYOffSet;
  // Flame gets bigger the longer you hold the thruster
  if(isThrusting && flameScale < 2) flameScale += 0.01;
  else if(!isThrusting) flameScale = initialFlameScale;

  // LIGHT ROTATION AND TRANSLATION
  if(isLightRotating) lightRotate += 0.01;
  if(lightRotate > 2*Math.PI) {lightRotate -= 2*Math.PI;}

  lightPosition[0] = objTranslateX + lightRadius * Math.sin(lightRotate);
  lightPosition[2] = objTranslateZ + lightRadius * Math.cos(lightRotate);
  lightPosition[1] = objTranslateY + initialLightHeight;
}
function getRocketTransformationMatrix() {
    var obj_translate_X_mat = translate(objTranslateX, 0, 0);
    var obj_translate_Y_mat = translate(0, objTranslateY, 0);
    var obj_translate_Z_mat = translate(0, 0, objTranslateZ);

    var obj_rotate_Y_mat = rotateY(objRotateY);
    var obj_rotate_Z_mat = rotateZ(objRotateZ);  
    var obj_rotate_X_mat = rotateX(objRotateX);

    var obj_final_transform_mat = mult(obj_translate_X_mat, obj_translate_Y_mat);
    obj_final_transform_mat = mult(obj_final_transform_mat, obj_translate_Z_mat);

    obj_final_transform_mat = mult(obj_final_transform_mat, obj_rotate_Z_mat);
    obj_final_transform_mat = mult(obj_final_transform_mat, obj_rotate_X_mat);
    obj_final_transform_mat = mult(obj_final_transform_mat, obj_rotate_Y_mat);
    
    return obj_final_transform_mat;
}
function render()
{
	/* SET STANDARD MATRICES --------------------------------------------- */
    var eye = vec3(objTranslateX,
               (objTranslateY + zoomFactor),
               (objTranslateZ - zoomFactor));
    var at = vec3(objTranslateX, objTranslateY, objTranslateZ); // Always point at rocket
    var up = vec3(0, 1, 0);
    modelViewMatrix = lookAt(eye, at , up);

    projectionMatrix = perspective(45, canvas.width/canvas.height, 1, 200);
    /* SET LIGHT MATRICES ------------------------------------------- */
    projectionMatrixLight = perspective(70.0, canvas.width/canvas.height, 13, 100.0);
    var eye = vec3(lightPosition[0], lightPosition[1], lightPosition[2]);
    modelViewMatrixLight = lookAt(eye, at, up);
    /* SET ROCKET TRANSFORMATION MATRIX ---------------------------- */
    var obj_final_transform_mat = getRocketTransformationMatrix();
    var modelViewMatrix_obj = mult(modelViewMatrix, obj_final_transform_mat);
    var modelViewMatrixLight_obj = mult(modelViewMatrixLight, obj_final_transform_mat);
    /* SET REFLECTION MATRIX AND CORRESPONDING VIEW MATRICES ------------- */
    var p = vec3(0, 0, 0); // Values are hardcoded!
    var v = vec3(0,0,1); // Values are hardcoded!
    var reflectionMatrix = mirrorMatrix(p, v);

    var modelViewMatrixMirror = mult(modelViewMatrix, reflectionMatrix);
    var modelViewMatrixMirror_obj = mult(modelViewMatrixMirror, obj_final_transform_mat);

    var modelViewMatrixMirror_ground = modelViewMatrixMirror;

    /* Oblique near-clipping - not implemented since it works poorly with rotating polygonal objects

    var clipplane = vec4(0, 0, 1, -(objTranslateZ-0.85)); //translate - offset
    var projectionMatrixMirror = modifyProjectionMatrix(clipplane, projectionMatrix);
    projectionMatrixMirror = projectionMatrix;
    */
    /* ------------------------------------------------------------------ */
    // DRAW OBJECTS
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    
    // STENCIL TEST
    gl.enable(gl.STENCIL_TEST);
    gl.stencilFunc(gl.ALWAYS, 2, 0xFF);
    // Failed stencil test = 0. Passed stencil test but failed depth test = 1. Passed both = 2.
    gl.stencilOp(gl.KEEP, gl.INCR, gl.REPLACE);

    // DRAW ROCKET REFLECTION FOR USAGE OF DEPTH BUFFER IN STENCIL TEST
    gl.colorMask(false, false, false, false);
    drawRocket(objProgram, modelViewMatrixMirror_obj, projectionMatrix, false, true);
    gl.colorMask(true, true, true, true);

    // STENCIL TEST
    gl.stencilMask(0xFF);
    gl.depthMask(false);
    gl.colorMask(false, false, false, false);
    // DRAW MIRROR FOR STENCIL TEST
    drawMirrorFrame(objProgram, modelViewMatrix, projectionMatrix);
    gl.colorMask(true,true,true,true);
    gl.depthMask(true);
    gl.stencilMask(0x00);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    // DRAW GROUND REFLECTION ONLY IF STENCIL TEST PASSES
    gl.stencilFunc(gl.LEQUAL, 1, 0xFF);
    drawGround(groundProgram, modelViewMatrixMirror_ground, projectionMatrix,
               modelViewMatrixLight, projectionMatrixLight, false);

    // DRAW ROCKET REFLECTION ONLY WHEN BOTH DEPTH AND STENCIL TEST PASSES
    gl.stencilFunc(gl.EQUAL, 2, 0xFF);
    drawRocket(objProgram, modelViewMatrixMirror_obj, projectionMatrix, false, true);

    gl.disable(gl.STENCIL_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

    // DRAW MIRROR FRAME WITH MIRROR
    drawMirrorFrame(objProgram, modelViewMatrix, projectionMatrix);

    // DRAW GROUND
    drawGround(groundProgram, modelViewMatrix, projectionMatrix,
               modelViewMatrixLight, projectionMatrixLight, false);

    // DRAW ROCKET
    drawRocket(objProgram, modelViewMatrix_obj, projectionMatrix, false, false);

    // DRAW SHADOWS
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowProgram.fbo);
    gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    drawGround(shadowProgram, modelViewMatrixLight,
               projectionMatrixLight, null, null, true);
    
    drawRocket(shadowProgram, modelViewMatrixLight_obj, projectionMatrixLight, true, false);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    moveObjects(); // Movement logic
    window.requestAnimFrame(render);
}
/* DRAWING FUNCTIONS -------------------------- */
function drawFlame(program, mvm, pm, applyColor) {
  gl.useProgram(program);
  gl.uniform4fv(program.ambientProduct, flatten(ambientProduct));
  gl.uniform4fv(program.diffuseProduct, flatten(vec4(0,0,0,0)));
  gl.uniform4fv(program.specularProduct, flatten(vec4(0,0,0,0)));

  if(applyColor) gl.uniform4fv(program.mirrorColor, flatten(vec4(mirrorColor[0]/mirrorAlpha,
      						   mirrorColor[1]/mirrorAlpha, mirrorColor[2]/mirrorAlpha, 1)));

  else gl.uniform4fv(program.mirrorColor, flatten(vec4(1, 1, 1, 1)));
  initAttributeVariable(program.a_Color, program.flameBuffers.colorBuffer);

  var normalMat = normalMatrix(mvm, true);
  gl.uniformMatrix3fv(program.normalMatrix, false, flatten(normalMat));
  initAttributeVariable(program.a_Normal, program.flameBuffers.normalBuffer);

  initAttributeVariable(program.a_Position, program.flameBuffers.vertexBuffer);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, program.flameBuffers.indexBuffer);

  gl.uniformMatrix4fv(program.projectionMatrix, false, flatten(pm));

  mvm = mult(mvm, translate(0, flameYOffSet, 0));
  mvm = mult(mvm, rotateZ(180));
  mvm = mult(mvm, scalem(flameScale, flameScale, flameScale));
  gl.uniformMatrix4fv(program.modelViewMatrix, false, flatten(mvm));
  gl.drawElements(gl.TRIANGLES, program.flameBuffers.numIndices, gl.UNSIGNED_SHORT, 0);

}
function drawMirrorFrame(program, mvm, pm) {
  gl.useProgram(program);

  gl.uniform4fv(program.ambientProduct, flatten(ambientProduct));
  gl.uniform4fv(program.diffuseProduct, flatten(diffuseProduct));
  gl.uniform4fv(program.specularProduct, flatten(specularProduct));
  gl.uniform1f(program.shininess, shininess);
  gl.uniform4fv(program.lightPosition, flatten(lightPosition));

  initAttributeVariable(program.a_Color, program.mirrorFrameBuffers.colorBuffer);

  var normalMat = normalMatrix(mvm, true);
  gl.uniformMatrix3fv(program.normalMatrix, false, flatten(normalMat));
  initAttributeVariable(program.a_Normal, program.mirrorFrameBuffers.normalBuffer);

  initAttributeVariable(program.a_Position, program.mirrorFrameBuffers.vertexBuffer);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, program.mirrorFrameBuffers.indexBuffer);

  gl.uniformMatrix4fv(program.projectionMatrix, false, flatten(pm));
  mvm = mult(mvm, translate(0, 0, -0.25))
  gl.uniformMatrix4fv(program.modelViewMatrix, false, flatten(mvm));
  gl.drawElements(gl.TRIANGLES, program.mirrorFrameBuffers.numIndices, gl.UNSIGNED_SHORT, 0);

  // DRAW THE MIRROR ITSELF
  drawMirrorPlane(planeProgram, modelViewMatrix, projectionMatrix);

}
function drawRocket(program, mvm, pm, drawShadow, applyColor) {
    gl.useProgram(program);
    if(!drawShadow) {
      // DRAW FLAME
      if(isThrusting) drawFlame(program, mvm, pm, applyColor);

      gl.uniform4fv(program.ambientProduct, flatten(ambientProduct));
      gl.uniform4fv(program.diffuseProduct, flatten(diffuseProduct));
      gl.uniform4fv(program.specularProduct, flatten(specularProduct));
      gl.uniform1f(program.shininess, shininess);

      gl.uniform4fv(program.lightPosition, flatten(lightPosition));

      if(applyColor) gl.uniform4fv(program.mirrorColor, flatten(vec4(mirrorColor[0]/mirrorAlpha,
      							   mirrorColor[1]/mirrorAlpha, mirrorColor[2]/mirrorAlpha, 1)));

      else gl.uniform4fv(program.mirrorColor, flatten(vec4(1, 1, 1, 1)));

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
    gl.uniform4fv(program.mirrorColor, flatten(vec4(1, 1, 1, 1)));
}
function drawGround(program, mvm, pm, mvmL, pmL, drawShadow) {
    gl.useProgram(program);
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
function drawMirrorPlane(program, mvm, pm) {
    gl.useProgram(program);

    gl.uniformMatrix4fv(program.projectionMatrix, false, flatten(pm));
    gl.uniformMatrix4fv(program.modelViewMatrix, false, flatten(mvm));
    gl.uniform4fv(program.color, mirrorColor)

    initAttributeVariable(program.a_Position, program.vertexBuffer);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);  
}
