export default /* glsl */`
#include "decode.glsl"

uniform float mipmap;
uniform float exposure;
uniform vec2 offset;
uniform float scale;
uniform vec2 viewportSize;
uniform vec2 texSize;

#if TEXTURE_CUBEMAP
    uniform samplerCube tex;
    uniform float face;
#else
    uniform sampler2D tex;
#endif

vec3 getCubemapUv(vec2 uv, float face) {
    vec2 st = uv * 2.0 - 1.0;
    if (face == 0.0) {
        return vec3(1, -st.y, -st.x);
    } else if (face == 1.0) {
        return vec3(-1, -st.y, st.x);
    } else if (face == 2.0) {
        return vec3(st.x, 1, st.y);
    } else if (face == 3.0) {
        return vec3(st.x, -1, -st.y);
    } else if (face == 4.0) {
        return vec3(st.x, -st.y, 1);
    } else {
        return vec3(-st.x, -st.y, -1);
    }
}

vec3 decodeAlpha(vec4 raw) {
    return vec3(raw.a);
}
vec3 encodeGamma(vec3 source) {
    return pow(source, vec3(1.0 / 2.2));
}

// calculate tiling
float tile(vec2 coord, float tileSize) {
    return mod(dot(floor(coord * 2.0 / tileSize), vec2(1.0)), 2.0);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - offset) / scale / texSize;

    // sample input texture
#if TEXTURE_CUBEMAP
    vec4 raw = textureCubeLodEXT(tex, getCubemapUv(vec2(uv.x, 1.0 - uv.y), face), mipmap);
#else
    vec4 raw = texture2DLodEXT(tex, vec2(uv.x, 1.0 - uv.y), mipmap);
#endif

    vec3 final = DECODE_FUNC(raw);
    float alpha = raw.a;

    // apply exposure
    final *= exposure;

    // blend with background
#if TEXTURE_ALPHA
    vec3 tileClr = mix(vec3(0.3), vec3(0.5), tile(gl_FragCoord.xy, 50.0));
    final = mix(tileClr, final, alpha);
#endif

    // remove oob pixels
    float oob = any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0))) ? 0.0 : 1.0;
    final = mix(vec3(0.15), final, oob);

    gl_FragColor = vec4(encodeGamma(final), 1.0);
}
`;
