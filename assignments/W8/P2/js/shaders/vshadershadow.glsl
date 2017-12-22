//Vertex shader shadow
attribute vec4 a_Position;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * a_Position;
}