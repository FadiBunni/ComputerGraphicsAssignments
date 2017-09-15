attribute vec4 vPosition;
varying vec4 fColor;

void
main()
{
    gl_Position = vPosition;
    fColor = vColor;
    gl_PointSize = 20.0;
}
