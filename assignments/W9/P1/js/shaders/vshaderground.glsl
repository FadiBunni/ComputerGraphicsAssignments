attribute vec4 a_Position;
attribute vec2 a_TexCoord;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec2 fTexCoord;
uniform mat4 modelViewMatrixLight;
uniform mat4 projectionMatrixLight;
varying vec4 v_PositionFromLight;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * a_Position;
  fTexCoord = a_TexCoord;

  v_PositionFromLight = projectionMatrixLight * modelViewMatrixLight * a_Position;
}