precision mediump float;

attribute vec4 a_Position;
attribute vec4 a_Color;
attribute vec2 a_TexCoord;

varying vec4 fColor;
varying vec2 fTexCoord;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;


void main()
{

    gl_Position = projectionMatrix * modelViewMatrix * a_Position;
    fColor = a_Color;
    fTexCoord = a_TexCoord;

}