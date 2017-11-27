precision mediump float;

uniform vec4 ambientProduct;
uniform vec4 diffuseProduct;
uniform vec4 lightPosition;
uniform mat4 modelViewMatrix;
uniform mat3 normalMatrix;
varying vec3 pos;
varying vec4 fNormal;
uniform sampler2D texture;


const float PI = 3.1415926535897932384626433832795;

void main()
{

    vec4 fColor;
    vec3 light = (modelViewMatrix *lightPosition).xyz;
    vec3 L = lightPosition.w == 0.0 ? normalize(light) : normalize(light - pos);
    vec3 normal = normalize(normalMatrix*fNormal.xyz);
    vec4 ambient = ambientProduct;

    float Kd = max( dot(L, normal), 0.0 );
    vec4  diffuse = Kd*diffuseProduct;

    fColor = ambient + diffuse;
    fColor.a = 1.0;


    vec2 texCoord;
    texCoord.x = 0.5 - atan(normal.z, normal.x) * (1.0/(2.0*PI));
    texCoord.y = 0.5 - asin(normal.y) * (1.0/PI);

    gl_FragColor = fColor * texture2D(texture, texCoord);

}