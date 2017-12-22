//Vertex shader ground
attribute vec4 a_Position;
attribute vec2 a_TexCoord;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec2 fTexCoord;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * a_Position;
  fTexCoord = a_TexCoord;
}