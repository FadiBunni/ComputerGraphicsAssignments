attribute vec4 vPosition;
attribute vec4 vNormal;

varying vec4 fColor;

uniform vec4 diffuseProduct;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec4 lightPosition;
uniform mat3 normalMatrix;


void
main()
{

    vec3 pos = (modelViewMatrix * vPosition).xyz;

    vec3 light = (modelViewMatrix * lightPosition).xyz;
    vec3 L = lightPosition.w == 0.0 ? normalize(light) : normalize(light - pos);

    if(lightPosition.w == 0.0) L = normalize(lightPosition.xyz);
    else L = normalize( lightPosition.xyz - pos);

    // Transform vertex normal into eye coordinates
    vec3 N = normalize(normalMatrix*vNormal.xyz);

    float Kd = max( dot(L, N), 0.0 );
    vec4  diffuse = Kd*diffuseProduct;

    gl_Position = projectionMatrix * modelViewMatrix * vPosition;

    fColor = diffuse;
    fColor.a = 1.0;

}