import codings_glsl from './chunks/codings.glsl.js';
import cubemap_frag from './chunks/cubemap.frag.js';
import cubemap_vert from './chunks/cubemap.vert.js';
import texture_frag from './chunks/texture.frag.js';
import texture_vert from './chunks/texture.vert.js';

const Chunks = {
    'codings.glsl': codings_glsl,
    'cubemap.frag': cubemap_frag,
    'cubemap.vert': cubemap_vert,
    'texture.frag': texture_frag,
    'texture.vert': texture_vert
};

export { Chunks };
