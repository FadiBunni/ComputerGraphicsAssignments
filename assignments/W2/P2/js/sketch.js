var program;
var gl;
var canvas;
var index = 0;
var maxVertices = 200;

var vBuffer;
var vPosition;
var cBuffer;
var vColor;

var cIndex = 0;
var colors = [
vec4(0.0, 0.0, 0.0, 1.0), // black
vec4(1.0, 0.0, 0.0, 1.0), // red
vec4(1.0, 1.0, 0.0, 1.0), // yellow
vec4(0.0, 1.0, 0.0, 1.0), // green
vec4(0.0, 0.0, 1.0, 1.0), // blue
vec4(1.0, 0.0, 1.0, 1.0), // magenta
vec4(0.0, 1.0, 1.0, 1.0) // cyan
];

var init = function(){

    canvas = document.getElementById("gl_canvas");
    canvas.width = 512;
    canvas.height = 512;

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn’t available");
    }

    canvas.addEventListener("mousedown", function(event){
        var rect = event.target.getBoundingClientRect();
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
        var t = vec2(2*(event.clientX-rect.left)/canvas.width-1,
           2*(canvas.height-event.clientY+rect.top)/canvas.height-1);
        gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(t));

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        t = vec4(colors[cIndex]);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(t));

        index++;
    } );

    document.getElementById("clearButton").onclick =
        function() {
            var t = vec4(colors[cIndex]);
            gl.clearColor(t[0], t[1], t[2], t[3]);
            makeBuffer();
        };

    var m = document.getElementById("select");
    m.addEventListener("click", function() { cIndex = m.selectedIndex; });

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

    index = 0;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT );
    gl.drawArrays(gl.POINTS, 0, index);
    window.requestAnimFrame(render,canvas);
}

init();
