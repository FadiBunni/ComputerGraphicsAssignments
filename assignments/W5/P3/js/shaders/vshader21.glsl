attribute vec4 a_Position;
attribute vec4 a_Normal;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

void main()
{
    gl_Position = projectionMatrix * modelViewMatrix * a_Position;

}