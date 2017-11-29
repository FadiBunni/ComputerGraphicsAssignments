//The window.onload event is executed in misc.js file. no need to run it twice.
var program;
var gl;
var canvas;

var cIndex = 0;
var vIndex = 0;
var maxVertices = 2000;
var pointsInCircle = 50;
var triangleMode = false;
var circleMode = false;
var circleVNo = 0;
var triangleVNo = 0;

var vBuffer;
var vPosition;
var cBuffer;
var vColor;
var t;

var colors = [
vec4(0.0, 0.0, 0.0, 1.0), // black
vec4(1.0, 0.0, 0.0, 1.0), // red
vec4(1.0, 1.0, 0.0, 1.0), // yellow
vec4(0.0, 1.0, 0.0, 1.0), // green
vec4(0.0, 0.0, 1.0, 1.0), // blue
vec4(1.0, 0.0, 1.0, 1.0), // magenta
vec4(0.0, 1.0, 1.0, 1.0) // cyan
];

var points = [0];
var triangles = [0];
var circles = [0];

var init = function(){

    canvas = document.getElementById("gl_canvas");
        canvas.width = 512;
        canvas.height = 512;
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) alert("WebGL isn’t available");

    canvas.addEventListener("mousedown", function(event){
        var rect = event.target.getBoundingClientRect();
        var prevMousePoint = t;
        t = vec2(2*(event.clientX-rect.left)/canvas.width-1,
                   2*(canvas.height-event.clientY+rect.top)/canvas.height-1);
        if(circleMode && circleVNo == 1) {
            var pointAngle = Math.PI*2 / pointsInCircle;
            points.pop();
            circles.push(vIndex-1);
            circleVNo = 0;

            for(var i = 0; i <= pointsInCircle; i++) {
                var angle = pointAngle * i;

                var radius = Math.sqrt( Math.pow(prevMousePoint[0]-t[0],2) +
                                        Math.pow(prevMousePoint[1]-t[1],2));

                var x = Math.cos(angle) * radius + prevMousePoint[0];
                var y = Math.sin(angle) * radius + prevMousePoint[1];
                var point = vec2(x,y);
                gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
                gl.bufferSubData(gl.ARRAY_BUFFER, 8*vIndex, flatten(point));

                gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
                var tColor = vec4(colors[cIndex]);
                gl.bufferSubData(gl.ARRAY_BUFFER, 16*vIndex, flatten(tColor));

                vIndex++;
            }
        } else {
            if(triangleMode && triangleVNo == 2) {
                triangleVNo = 0;
                points.pop();
                points.pop();
                triangles.push(vIndex-2);
            } else {
                points.push(vIndex);
                if(triangleMode) triangleVNo++;
                if(circleMode) circleVNo++;
            }
            gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
            gl.bufferSubData(gl.ARRAY_BUFFER, 8*vIndex, flatten(t));

            gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
            var tColor = vec4(colors[cIndex]);
            gl.bufferSubData(gl.ARRAY_BUFFER, 16*vIndex, flatten(tColor));
            vIndex++;
        }
    });

    document.getElementById("clearButton").onclick =
        function() {
            var t = vec4(colors[cIndex]);
            gl.clearColor(t[0], t[1], t[2], t[3]);
            makeBuffer();
        };

    var m = document.getElementById("select");
    m.addEventListener("click", function() { cIndex = m.selectedIndex; });

    document.getElementById("triangleButton").onclick =
        function() {
            triangleMode = true;
            circleMode = false;
            circleVNo = 0;
        };
    document.getElementById("pointButton").onclick =
        function() {
            triangleMode = false;
            circleMode = false;
            triangleVNo = 0;
            circleVNo = 0;
        };

    document.getElementById("circleButton").onclick =
        function() {
            triangleMode = false;
            circleMode = true;
            triangleVNo = 0;
        };

    gl.viewport(0, 0, canvas.width, canvas.height);

    var t = vec4(colors[cIndex]);
    gl.clearColor(t[0], t[1], t[2], t[3]);
    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    makeBuffer();

    render();
}

function makeBuffer() {
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxVertices, gl.STATIC_DRAW );

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 16*maxVertices, gl.STATIC_DRAW );

    vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    vIndex = 0;
    triangles=[];
    points=[];
    circles = [];

}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT );
    for(var i = 0; i < points.length; i++) {
        gl.drawArrays(gl.POINTS, points[i], 1);
    }
    for(var i=0; i < triangles.length; i++) {
        gl.drawArrays(gl.TRIANGLES, triangles[i],3)
    }
    for(var i = 0; i < circles.length; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, circles[i],pointsInCircle+2)
    }
    window.requestAnimFrame(render,canvas);

    //TODO - The last drawm OBJ should be on top of everything else
}

init();
