//The window.onload event is executed in misc.js file. no need to run it twice.
var canvas;
var gl;
var groundProgram, objProgram, shadowProgram;

var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLight, projectionMatrixLight;
var modelViewMatrix_obj, normalM;

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

var near = 1;
var far = 20;
var fov = 65;
var aspect;
var eye;

var lightPosition = vec4(0, 4, -3, 0);
var lightTranslate = 0.0;

var objMotion = true;
var lightMotion = true;
var objTranslate = 0.0;

var g_objDoc;

var light = vec4(0.5,0.5, 0.5, 0);
var materialAmbient = vec4(0.5, 0.5, 0.5, 0);
var materialDiffuse = vec4(0.5, 0.5, 0.5, 0);
var materialSpecular = vec4(1,1,1,0);
var shininess = 60.0;
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

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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
    groundProgram.vertexBuffer =  initArrayBufferForLaterUse(vertices, 3, gl.FLOAT);
    groundProgram.texCoordBuffer =  initArrayBufferForLaterUse(texCoord, 2, gl.FLOAT);
    groundProgram.texture = initTextures(groundProgram);

    objProgram.a_Position = gl.getAttribLocation(objProgram, "a_Position");
    objProgram.a_Normal = gl.getAttribLocation(objProgram, "a_Normal");
    objProgram.modelViewMatrix = gl.getUniformLocation(objProgram, "modelViewMatrix");
    objProgram.modelViewMatrixShading = gl.getUniformLocation(objProgram, "modelViewMatrixShading");
    objProgram.projectionMatrix = gl.getUniformLocation(objProgram, "projectionMatrix");
    objProgram.normalMatrix = gl.getUniformLocation(objProgram, "normalMatrix");
    objProgram.buffers = null;

    objProgram.ambientProduct = gl.getUniformLocation(objProgram, "ambientProduct");
    objProgram.diffuseProduct = gl.getUniformLocation(objProgram, "diffuseProduct");
    objProgram.specularProduct = gl.getUniformLocation(objProgram, "specularProduct");
    objProgram.lightPosition = gl.getUniformLocation(objProgram, "lightPosition");
    objProgram.shininess = gl.getUniformLocation(objProgram, "shininess");

    shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, "a_Position");
    shadowProgram.modelViewMatrix = gl.getUniformLocation(shadowProgram, "modelViewMatrix");
    shadowProgram.projectionMatrix = gl.getUniformLocation(shadowProgram, "projectionMatrix");
    shadowProgram.fbo = initFramebufferObject();

    document.getElementById("objMotion").onclick = function(){
      objMotion = (!objMotion) ? true : false;
    };
    document.getElementById("lightMotion").onclick = function(){
        lightMotion = (!lightMotion) ? true : false;
    };

    readOBJFile('assignments/W9/teapot.obj', 1/4, true);
    // Set the object buffers
    waitToRender();
}

function waitToRender() {
    if (!objProgram.buffers && g_objDoc && g_objDoc.isMTLComplete()) {
        objProgram.buffers = onReadComplete();
    }
    if(objProgram.buffers) {
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

    gl.bindTexture(gl.TEXTURE_2D, null);
  };
  image.src = "assignments/W9/xamp23.png";
  return texture;
}

function isPowerOf2(val) {return (val & (val - 1)) == 0;}

function onReadComplete() {
    var drawingInfo = g_objDoc.getDrawingInfo();

    var buffers = new Object();
    buffers.vertexBuffer = initArrayBufferForLaterUse(drawingInfo.vertices, 3, gl.FLOAT)
    buffers.normalBuffer = initArrayBufferForLaterUse(drawingInfo.normals, 3, gl.FLOAT)
    buffers.indexBuffer = initElementArrayBufferForLaterUse(drawingInfo.indices, gl.UNSIGNED_SHORT);
    buffers.numIndices = drawingInfo.indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return buffers;
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
        g_objDoc = null;
        console.log ("OBJ file parsing error.");
        return;
    }
    g_objDoc = objDoc;
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

function mirrorMatrix(p, v) {
    var m = mat4();
    var dot = p[0]*v[0] + p[1]*v[1] + p[2]*v[2];

    m[0][0] = 1 - 2*v[0]*v[0];
    m[1][0] = - 2*v[0]*v[1];
    m[2][0] = - 2*v[0]*v[2];
    m[3][0] = 2*dot*v[0];
    m[0][1] = - 2*v[1]*v[0];
    m[1][1] = 1 - 2*v[1]*v[1];
    m[2][1] = - 2*v[1]*v[2];
    m[3][1] = 2*dot*v[1];
    m[0][2] = - 2*v[2]*v[0];
    m[1][2] = - 2*v[2]*v[1];
    m[2][2] = 1 - 2*v[2]*v[2];
    m[3][2] = 2*dot*v[2];
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

function render(){
    /* ROTATE LIGHT SOURCE AND OBJECT ----------------------------- */
    if(lightMotion) lightTranslate += 0.01;
    if(lightTranslate > 2*Math.PI) {lightTranslate -= 2*Math.PI;}
    lightPosition[0] = 4*Math.sin(lightTranslate);
    lightPosition[2] = -2 + 4*Math.cos(lightTranslate);

    objTranslate += objMotion ? 0.05 : 0.0;
  /* SET VIEWMATRICES --------------------------------------------- */

    eye = vec3(0,0,1);
    var at = vec3(0.0, 0.0, -3.0);
    var up = vec3(0.0, 1.0, 0.0);

    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fov, aspect, near, far);
    projectionMatrixLight = perspective(70.0, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, 1.0, 100.0);
    var eye = vec3(lightPosition[0], lightPosition[1], lightPosition[2]);
    modelViewMatrixLight = lookAt(eye, at, up);

    var obj_translate = translate(0, Math.sin(objTranslate) * 0.5 - 0.5, -3);
    modelViewMatrix_obj = mult(modelViewMatrix, obj_translate);
    var modelViewMatrixLight_obj = mult(modelViewMatrixLight, obj_translate);

    normalM = normalMatrix(modelViewMatrix_obj, true);

    /* CREATE THE REFLECTION MATRIX --------------------------------------*/
    var p = vec3(0, -1, -3.5); // Values are hardcoded!
    var v = normalize(vec3(0,-1,0.35)); // Values are hardcoded!

    var reflectionMatrix = mirrorMatrix(p, v);
    var modelViewMatrixMirror = mult(modelViewMatrix, reflectionMatrix);
    modelViewMatrixMirror = mult(modelViewMatrixMirror, obj_translate);
    /* ------------------------------------------------------------------ */

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // DRAW TEAPOT
    gl.useProgram(objProgram);
    drawObj(objProgram, modelViewMatrix_obj, projectionMatrix, false);

    // DRAW REFLECTION
    gl.useProgram(objProgram);
    drawObj(objProgram, modelViewMatrixMirror, projectionMatrix, false);

    // DRAW GROUND
    gl.useProgram(groundProgram);
    drawGround(groundProgram, modelViewMatrix, projectionMatrix,
               modelViewMatrixLight, projectionMatrixLight, false);

    // DRAW SHADOWS HERE
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowProgram.fbo);
    gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shadowProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, shadowProgram.fbo.texture);

    // DRAW GROUND SHADOW
    drawGround(shadowProgram, modelViewMatrixLight,
               projectionMatrixLight, null, null, true);
    // DRAW TEAPOT SHADOW
    drawObj(shadowProgram, modelViewMatrixLight_obj, projectionMatrixLight, true);
    if(!interrupted) requestAnimFrame(render);
}

function drawObj(program, mvm, pm, drawShadow) {
    if(!drawShadow) {
      gl.uniform4fv(program.ambientProduct, flatten(ambientProduct));
      gl.uniform4fv(program.diffuseProduct, flatten(diffuseProduct));
      gl.uniform4fv(program.specularProduct, flatten(specularProduct));
      gl.uniform1f(program.shininess, shininess);

      gl.uniform4fv(program.lightPosition, flatten(lightPosition));

      gl.uniformMatrix4fv(program.modelViewMatrixShading, false, flatten(modelViewMatrix_obj));
      gl.uniformMatrix3fv(program.normalMatrix, false, flatten(normalM));

      initAttributeVariable(program.a_Normal, program.buffers.normalBuffer);
    }

    initAttributeVariable(program.a_Position, objProgram.buffers.vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objProgram.buffers.indexBuffer);

    gl.uniformMatrix4fv(program.projectionMatrix, false, flatten(pm));
    gl.uniformMatrix4fv(program.modelViewMatrix, false, flatten(mvm));
    gl.drawElements(gl.TRIANGLES, objProgram.buffers.numIndices,
              gl.UNSIGNED_SHORT, 0);
}

function drawGround(program, mvm, pm, mvmL, pmL, drawShadow) {
    if(!drawShadow) {
      gl.uniformMatrix4fv(program.modelViewMatrixLight, false, flatten(mvmL));
      gl.uniformMatrix4fv(program.projectionMatrixLight, false, flatten(pmL));

      initAttributeVariable(program.a_TexCoord, program.texCoordBuffer);
      gl.uniform1i(program.textureMap, 0);
      gl.uniform1i(program.shadowMap, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, program.texture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, shadowProgram.fbo.texture);
    }

    gl.uniformMatrix4fv(program.projectionMatrix, false, flatten(pm));
    gl.uniformMatrix4fv(program.modelViewMatrix, false, flatten(mvm));
    initAttributeVariable(program.a_Position, groundProgram.vertexBuffer);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
}

init();