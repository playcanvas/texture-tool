
uniform mat4 matrix_viewProjection;

attribute vec3 vertex_position;
attribute vec3 vertex_normal;

varying vec3 frag_normal;

void main() {
    gl_Position = matrix_viewProjection * vec4(vertex_position, 1.0);
    frag_normal = vertex_normal;
}
