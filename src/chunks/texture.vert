attribute vec3 vertex_position;

void main() {
    gl_Position = vec4(vertex_position * 2.0 - 1.0, 1.0);
}
