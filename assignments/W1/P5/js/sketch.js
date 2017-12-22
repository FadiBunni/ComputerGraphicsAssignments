var program;
var gl;
var canvas;

var yLoc;
var dir = 1;
var yOffSet = 0;

var rendered = false;

var noOfPoints = 100;
var vertices = [];

var init = function(){
    canvas = document.getElementById("gl_canvas");
        canvas.width = 512;
        canvas.height = 512;

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn’t available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    drawCircle();

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    yLoc = gl.getUniformLocation(program, "yOffSet");

    render();
}


function drawCircle() {
    var pointAngle = Math.PI*2 / noOfPoints; //Angle between points
    vertices.push(vec2(0.0,0.0)); //Center
    for(var i = 0; i <= noOfPoints; i++) {
        var angle = pointAngle * i;
        var x = Math.cos(angle) * 0.5;
        var y = Math.sin(angle) * 0.5;
        var point = vec2(x,y); //Point on edge of circle
        vertices.push(point);
    }
}

function render() {

    if(yOffSet >= 0.5 || yOffSet <= -0.5) {
        dir *= -1;
    }
    yOffSet += 0.01 * dir;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(yLoc, yOffSet);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length);

    if(!interrupted) requestAnimFrame(render);
}

init();