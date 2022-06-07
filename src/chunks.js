import codings_glsl from './chunks/codings.glsl';
import cubemap_frag from './chunks/cubemap.frag';
import cubemap_vert from './chunks/cubemap.vert';
import texture_frag from './chunks/texture.frag';
import texture_vert from './chunks/texture.vert';

const Chunks = {
    'codings.glsl': codings_glsl,
    'cubemap.frag': cubemap_frag,
    'cubemap.vert': cubemap_vert,
    'texture.frag': texture_frag,
    'texture.vert': texture_vert
};

export { Chunks };
