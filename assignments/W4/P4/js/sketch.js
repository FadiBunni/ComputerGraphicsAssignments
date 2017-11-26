//The window.onload event is executed in misc.js file. no need to run it twice.
var canvas;
var gl;

var numTimesToSubdivide = 3;
var index = 0;
var pointsArray = [];
var normalsArray=[];
var rendered = false;

var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);

var ambS = 0.5;
var diffS = 0.5;
var specS = 0.5;
var lightS = 0.5;

var lightPosition = vec4(0.0,0.0,1.0, 0.0 );
var light;
var materialAmbient;
var materialDiffuse;
var materialSpecular;
var materialShininess = 40.0;


var modelViewMatrixLoc, projectionMatrixLoc;
var modelViewMatrix, projectionMatrix;
var normalMatrix, normalMatrixLoc;

var near = 3;
var far = 10;
var fov = 45;
var aspect;
var radius = 6.0;
var theta  = 0.0;
var phi    = 0.0;
var eye;
var at = vec3(0.0, 0.0, 0);
var up = vec3(0.0, 1.0, 0.0);

function triangle(a, b, c){
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);

    var t1 = subtract(b, a);
    var t2 = subtract(c, a);
    var normal = normalize(cross(t2, t1));
    normal = vec4(normal);
/*
    normalsArray.push(normal);
    normalsArray.push(normal);
    normalsArray.push(normal);
*/
    normalsArray.push(a[0], a[1], a[2], 0.0);
    normalsArray.push(b[0], b[1], b[2], 0.0);
    normalsArray.push(c[0], c[1], c[2], 0.0);
    index += 3;
}

function divideTriangle(a, b, c, count){
    if (count > 0) {
        var ab = normalize(mix(a, b, 0.5), true);
        var ac = normalize(mix(a, c, 0.5), true);
        var bc = normalize(mix(b, c, 0.5), true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    }
    else {
        triangle(a, b, c);
    }
}

function tetrahedron(a, b, c, d, n){
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

var init = function(){
    canvas = document.getElementById( "gl_canvas" );
        canvas.width = 512;
        canvas.height = 512;
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) alert( "WebGL isn't available" );

    pointsArray = [];
    normalsArray = [];

    gl.viewport( 0, 0, canvas.width, canvas.height );
    aspect = canvas.width/canvas.height;
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    light = vec4(lightS*1.0, lightS*1.0, lightS*1.0, lightS*0.0);
    materialAmbient = vec4(ambS*1.0, ambS*1.0, ambS*1.0, ambS*0.0 );
    materialDiffuse = vec4(diffS*1.0, diffS*1.0, diffS*1.0, diffS*0.0 );
    materialSpecular = vec4(specS*1.0, specS*1.0, specS*1.0, specS*0.0 );


    var ambientProduct = mult(light, materialAmbient);
    var diffuseProduct = mult(light, materialDiffuse);
    var specularProduct = mult(light, materialSpecular);

    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    document.getElementById("Button1").onclick = function(){
        numTimesToSubdivide++;
        index = 0;
        init();
    };
    document.getElementById("Button2").onclick = function(){
        if(numTimesToSubdivide) numTimesToSubdivide--;
        index = 0;
        init();
    };
    document.getElementById("ambSlide").oninput = function() {
        ambS = event.srcElement.value;
        init();
    };
    document.getElementById("diffSlide").oninput = function() {
        diffS = event.srcElement.value;
        init();
    };
    document.getElementById("specSlide").oninput = function() {
        specS = event.srcElement.value;
        init();
    };
    document.getElementById("lightSlide").oninput = function() {
        lightS = event.srcElement.value;
        init();
    };
    document.getElementById("shinSlide").oninput = function() {
        materialShininess = event.srcElement.value;
        init();
    };

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );

    gl.uniform4fv( gl.getUniformLocation(program,
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program,
       "shininess"),materialShininess );

    if(!rendered) render();
    rendered = true;
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    eye = vec3(radius*Math.sin(phi), radius*Math.sin(theta), radius*Math.cos(phi));
    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fov, aspect, near, far);

    phi += 0.005;

    var normalM = normalMatrix(modelViewMatrix, true);

    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalM));

    for( var i=0; i<index; i+=3) {
        gl.drawArrays( gl.TRIANGLES, i, 3 );
    }
    requestAnimFrame(render);
}

init();
