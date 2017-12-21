precision mediump float;

attribute vec4 a_Position;
attribute vec2 a_TexCoord;

varying vec2 fTexCoord;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;


void main()
{

    gl_Position = projectionMatrix * modelViewMatrix * a_Position;
    fTexCoord = a_TexCoord;

}