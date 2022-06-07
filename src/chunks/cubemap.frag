
#include "codings.glsl"

varying highp vec3 frag_normal;

uniform samplerCube tex;
uniform float mipmap;
uniform float exposure;
uniform float texSize;

vec3 fixCubemapSeams(vec3 dir) {
    float scale = 1.0 - exp2(mipmap) / texSize;
    vec3 adir = abs(dir);
    float M = max(max(adir.x, adir.y), adir.z);
    return dir / M * vec3(
        adir.x == M ? 1.0 : scale,
        adir.y == M ? 1.0 : scale,
        adir.z == M ? 1.0 : scale
    );
}

void main() {
    vec3 dir = frag_normal;
#if FIX_SEAMS == 1
    dir = fixCubemapSeams(dir);
#endif

    vec4 raw = textureCubeLodEXT(tex, dir, mipmap);

    // interpret texture based on type
#if TEXTURE_TYPE == 0
    vec3 clr = decodeGamma(raw.xyz);            // gamma
#elif TEXTURE_TYPE == 1
    vec3 clr = decodeLinear(raw.xyz);           // linear
#elif TEXTURE_TYPE == 2
    vec3 clr = decodeRGBM(raw);                 // rgbm
#elif TEXTURE_TYPE == 3
    vec3 clr = decodeRGBE(raw);                 // rgbe
#elif TEXTURE_TYPE == 4
    vec3 clr = decodeGamma(raw.xyz).xxx;        // a
#else
    vec3 clr = vec4(1.0, 1.0, 0.0);
#endif

    // apply exposure
    clr *= exposure;

    gl_FragColor = vec4(encodeGamma(clr), 1.0);
}
