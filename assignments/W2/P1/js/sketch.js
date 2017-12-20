var program;
var gl;
var canvas;
var index = 0;
var maxVertices = 200;

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

        index++;
    });

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxVertices, gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    render();
}


function render(){
    gl.clear(gl.COLOR_BUFFER_BIT );
    gl.drawArrays(gl.POINTS, 0, index);
    window.requestAnimFrame(render);
}

init();
