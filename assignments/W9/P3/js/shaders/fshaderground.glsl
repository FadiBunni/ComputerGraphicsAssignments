//Fragment shader ground
precision mediump float;

uniform sampler2D textureMap;
uniform sampler2D shadowMap;

varying vec2 fTexCoord;

varying vec4 v_PositionFromLight;

void main() {
  vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;
  vec4 rgbaDepth = texture2D(shadowMap, shadowCoord.xy);
  float depth = rgbaDepth.r;
  float visibility = (shadowCoord.z > depth + 0.01) ? 0.6 : 1.0;
  vec4 fColor = visibility * texture2D(textureMap, fTexCoord);
  fColor.a = 0.6;
  gl_FragColor = fColor;
}