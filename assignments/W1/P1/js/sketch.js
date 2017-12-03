//The window.onload event is executed in misc.js file. no need to run it twice.
var gl;
var points;

var NumPoints = 5000;

var init = function() {
    var canvas = document.getElementById( "gl_canvas" );
        canvas.width = 512;
        canvas.height = 512;
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) alert( "WebGL isn't available" );

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.3921, 0.5843, 0.9294, 1.0 );

    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
}

init();