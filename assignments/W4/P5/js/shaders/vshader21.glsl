precision mediump float;

attribute vec4 vPosition;
attribute vec4 normal;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec3 pos;
varying vec4 vNormal;

void main()
{
    vNormal = normal;
    pos = (modelViewMatrix * vPosition).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vPosition;

}