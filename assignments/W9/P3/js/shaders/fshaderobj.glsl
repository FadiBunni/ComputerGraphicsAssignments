precision mediump float;
uniform vec4 ambientProduct;
uniform vec4 diffuseProduct;
uniform vec4 specularProduct;
uniform vec4 lightPosition;
uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixShading;
uniform mat3 normalMatrix;
uniform float shininess;

varying vec3 pos;
varying vec4 fNormal;
void main() {
	vec4 fColor;
	vec3 light = (modelViewMatrixShading * lightPosition).xyz;
	vec3 L = lightPosition.w == 0.0 ? normalize(light) : normalize(light - pos);
	vec3 E =  -normalize(pos);
	vec3 N = normalize(normalMatrix*fNormal.xyz);
	vec3 H = normalize( L + E );
	vec4 ambient = ambientProduct;
	float Kd = max( dot(L, N), 0.0 );
	vec4  diffuse = Kd*diffuseProduct;
	float Ks = pow( max(dot(N, H), 0.0), shininess );
	vec4  specular = Ks * specularProduct;
	if( dot(L, N) < 0.0 ) {
	  specular = vec4(0.0, 0.0, 0.0, 1.0);
	}

	fColor = ambient + diffuse + specular;
	fColor.a = 1.0;
	gl_FragColor = fColor;
}