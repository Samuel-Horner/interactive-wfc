#version 300 es
precision mediump float;

uniform float u_res;
uniform float u_time;
uniform sampler2D u_tex;

in vec2 tex_coord;

out vec4 outColor;

// This function takes a vec2 representing a complex number and
// returns its square
vec2 zSquared(vec2 z) {
	return vec2(z.x * z.x - z.y * z.y, z.x * z.y * 2.);
}

// The equation for the mandelbrot
vec3 mandelbrot(vec2 c, int df) {
	vec2 z = c;
  	int j = 0;

	while (j < df && z.x * z.x + z.y * z.y < 4.) {
		z = zSquared(z) + c;
		j += 1;
	}

  	return vec3(1. - float(j)/float(df));
}
void main() {
    vec2 uv = gl_FragCoord.xy / u_res;

    uv.x = uv.x * 2.5 - 1.75;
  	uv.y = uv.y * 2.5 - 1.25;
    // outColor = vec4(mandelbrot(uv, 50), 1.);
	outColor = vec4(texture(u_tex, tex_coord).xyz, 1.);
}