//-- supported codings

float saturate(float x) {
    return clamp(x, 0.0, 1.0);
}

//-- decode

vec3 decodeLinear(vec3 source) {
    return source.rgb;
}

vec3 decodeGamma(vec3 source) {
    return pow(source, vec3(2.2));
}

vec3 decodeRGBM(vec4 rgbm) {
    vec3 color = (8.0 * rgbm.a) * rgbm.rgb;
    return color * color;
}

vec3 decodeRGBE(vec4 source) {
    if (source.a == 0.0) {
        return vec3(0.0, 0.0, 0.0);
    } else {
        return source.xyz * pow(2.0, source.w * 255.0 - 128.0);
    }
}

//-- encode

vec3 encodeLinear(vec3 source) {
    return source;
}

vec3 encodeGamma(vec3 source) {
    return pow(source, vec3(1.0 / 2.2));
}

vec4 encodeRGBM(vec3 source) { // modified RGBM
    vec4 result;
    result.rgb = pow(source.rgb, vec3(0.5));
    result.rgb *= 1.0 / 8.0;

    result.a = saturate( max( max( result.r, result.g ), max( result.b, 1.0 / 255.0 ) ) );
    result.a = ceil(result.a * 255.0) / 255.0;

    result.rgb /= result.a;
    return result;
}

vec4 encodeRGBE(vec3 source) {
    float maxVal = max(source.x, max(source.y, source.z));
    if (maxVal < 1e-32) {
        return vec4(0, 0, 0, 0);
    } else {
        float e = ceil(log2(maxVal));
        return vec4(source / pow(2.0, e), (e + 128.0) / 255.0);
    }
}
