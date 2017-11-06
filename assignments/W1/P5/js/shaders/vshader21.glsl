attribute vec4 vPosition;
uniform float ySpeed;

void main()
{
	gl_Position.x = vPosition.x;
	gl_Position.y = ySpeed + vPosition.y ;
	gl_Position.z = 0.0;
	gl_Position.w = 1.0;
}