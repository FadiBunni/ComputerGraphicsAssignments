precision mediump float;
varying vec2 fTexCoord;
uniform sampler2D texture;
uniform vec4 fColor;

void main()
{
    gl_FragColor = fColor * texture2D(texture, fTexCoord);
}