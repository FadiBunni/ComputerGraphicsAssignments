//Vertex shader obj
precision mediump float;
attribute vec4 a_Position;
attribute vec4 a_Normal;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrixShading;

varying vec3 pos;
varying vec4 fNormal;
void main() {
  fNormal = a_Normal;
  pos = (modelViewMatrixShading * a_Position).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * a_Position;
}