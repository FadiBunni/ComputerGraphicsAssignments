attribute vec4 vPosition;
attribute vec4 vColor;
varying vec4 fColor;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

void main()
{
    gl_Position = projectionMatrix * modelViewMatrix * vPosition;
    //fColor.a = 1.0;
    fColor = vec4((1.0+vPosition.xyz)/2.0, 1.0);
    //fColor.a = 1.0;
}