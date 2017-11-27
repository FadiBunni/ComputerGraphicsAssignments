precision mediump float;
uniform sampler2D sampler;
varying vec2 fTexCoord;
void main() {
  gl_FragColor = texture2D(sampler, fTexCoord);
}