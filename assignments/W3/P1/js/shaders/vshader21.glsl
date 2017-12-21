attribute  vec4 vPosition;
uniform mat4 modelViewMatrix;

void main()
{
    gl_Position = modelViewMatrix * vPosition;
}