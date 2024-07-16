class GLCanvas {
    constructor(canvas, max_buffer_size = 1024) {
        this.canvas = canvas;
        /* Init webgl */
        this.gl = canvas.getContext("webgl2");
        if (!this.gl) {
            alert("Failed to load webgl");
            return;
        }
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.gl.clearColor(0.0, 1.0, 1.0, 1.0);

        this.max_buffer = max_buffer_size;
    }

    async initProgram(fragment, vertex) {
        /* Load Shaders */
        /* This will also call initBuffers() once the program is initialised. */
        await this.loadShaders(fragment, vertex);
        this.initBuffers();
    }

    async loadShaders(fragment, vertex) {
        /* Get shader source */
        const fragment_source = await fetch(fragment).then(res => {
            return res.text();
        });
        const vertex_source = await fetch(vertex).then(res => {
            return res.text();
        });
        /* Create shaders */
        const vertex_shader = GLCanvas.#loadShader(this.gl, this.gl.VERTEX_SHADER, vertex_source);
        const fragment_shader = GLCanvas.#loadShader(this.gl, this.gl.FRAGMENT_SHADER, fragment_source);
        /* Create program */
        const shader_program = this.gl.createProgram();
        this.gl.attachShader(shader_program, vertex_shader);
        this.gl.attachShader(shader_program, fragment_shader);
        this.gl.linkProgram(shader_program);

        /* Check compilation */
        if (!this.gl.getProgramParameter(shader_program, this.gl.LINK_STATUS)) {
            alert(`Unable to link shader program:\n ${this.gl.getProgramInfoLog(shader_program)}`);
            return null;
        }

        /* Store attrib/uniform locations and program */
        this.program = {
            program: shader_program,
            attrib_loc: {
                vertex_loc: this.gl.getAttribLocation(shader_program, "a_position"),
                tex_loc: this.gl.getAttribLocation(shader_program, "a_texture")
            },
            uniform_loc: {
                res_loc: this.gl.getUniformLocation(shader_program, "u_res"),
                time_loc: this.gl.getUniformLocation(shader_program, "u_time")
            }
        };
        this.gl.useProgram(this.program.program);
    }

    async loadTextureAtlas(url) {
        const atlas = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, atlas);
        
        const img = new Image();
        img.src = url;
        await img.decode();

        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0, // Level
            this.gl.RGBA, // Internal Format
            this.gl.RGBA, // Source Format
            this.gl.UNSIGNED_BYTE, // Source Type
            img
        );

        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);
        // To not blur textures

        this.texture = {
            atlas: atlas
        };

        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
    }

    initBuffers() {
        /* Bind data buffers */
        this.vert_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vert_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.max_buffer, this.gl.DYNAMIC_DRAW);

        this.indices_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indices_buffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.max_buffer, this.gl.DYNAMIC_DRAW);

        this.gl.vertexAttribPointer(
            this.program.attrib_loc.vertex_loc, // Location
            3, // Size
            this.gl.FLOAT, // Type
            false, // Normalised
            5 * Float32Array.BYTES_PER_ELEMENT, // Stride
            0 // Offset
        );

        this.gl.vertexAttribPointer(
            this.program.attrib_loc.tex_loc,
            2,
            this.gl.FLOAT,
            true,
            5 * Float32Array.BYTES_PER_ELEMENT,
            3 * Float32Array.BYTES_PER_ELEMENT
        );

        this.gl.enableVertexAttribArray(this.program.attrib_loc.vertex_loc);
        this.gl.enableVertexAttribArray(this.program.attrib_loc.tex_loc);

        this.indices_length = 0;
    }

    updateBuffers(vertices_source, indices_source) {
        this.indices_length = indices_source.length;
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, new Float32Array(vertices_source));
        this.gl.bufferSubData(this.gl.ELEMENT_ARRAY_BUFFER, 0, new Uint16Array(indices_source));
    }

    render(time) {
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.uniform1f(this.program.uniform_loc.res_loc, this.canvas.width);
        this.gl.uniform1f(this.program.uniform_loc.time_loc, time);

        this.gl.drawElements(this.gl.TRIANGLES, this.indices_length, this.gl.UNSIGNED_SHORT, 0);
    }

    static #loadShader(gl, shader_type, shader_source) {
        const shader = gl.createShader(shader_type);
        gl.shaderSource(shader, shader_source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(`${shader_type == gl.VERTEX_SHADER ? "The vertex shader" : "The fragment shader"} 
                    could not be compiled:\n${gl.getShaderInfoLog(shader)}`);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
}

export { GLCanvas };