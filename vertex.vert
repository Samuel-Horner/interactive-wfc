#version 300 es
precision mediump float;

in vec3 a_position;
in vec2 a_texture;

out vec2 tex_coord;

void main() {
    gl_Position = vec4(a_position.xyz, 1.);
    tex_coord = a_texture;
}