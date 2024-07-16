import { GLCanvas } from "./modules/engine.mjs";
import { Map, Tile } from "./modules/wfc.mjs";

class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}

const tile_size = 0.25;

const atlas_offset_lookup = [new Vec2(0, 0), new Vec2(tile_size, 0), new Vec2(tile_size * 2, 0), new Vec2(tile_size * 3, 0), new Vec2(0, tile_size)];

class Entity {
    constructor(verts, indices) {
        this.pos = new Vec2();
        this.verts = verts;
        this.vert_len = this.verts.length;
        this.indices = indices;
    }

    get_verts() {
        let output = [];
        this.verts.forEach(e => {
            output.push(...Entity.updateArray(e, this.pos.x, this.pos.y));
        })
        return output;
    }

    get_indices(total_buffer_length = 0) {
        return this.indices.map(x => x + total_buffer_length); // Transforms local indices to global indices
    }

    static updateArray(e, x, y) {
        return [e[0] + x, e[1] + y].concat(e.slice(2));
    }
}

class Quad extends Entity {
    constructor(size, tex_offset, pos = new Vec2()) {
        super(
            [[-size, size, 0, 0 + tex_offset.x, 0 + tex_offset.y], // Top Left
            [size, -size, 0, tile_size + tex_offset.x, tile_size + tex_offset.y], // Bottom Right
            [-size, -size, 0, 0 + tex_offset.x, tile_size + tex_offset.y], // Bottom Left
            [size, size, 0, tile_size + tex_offset.x, 0 + tex_offset.y]], // Top Right
            [0, 1, 2, 0, 1, 3]);
        this.size = size;
        this.pos = pos;
    }
}

function build_mesh(glCanvas, quads) { 
    let worldMesh = [];
    let worldIndex = [];

    quads.forEach(e => {
        worldIndex = worldIndex.concat(e.get_indices(worldMesh.length / 5));
        worldMesh = worldMesh.concat(e.get_verts());
    });

    glCanvas.updateBuffers(worldMesh, worldIndex);
}

function get_grid_pos(row, column, cell_size_normal) { // Maps row column to -1 -> 1 + quad offset
    // row, column are in the range 0 -> grid_size - 1
    return new Vec2(-1 + 2 * row * cell_size_normal + cell_size_normal, -1 + 2 * column * cell_size_normal + cell_size_normal);
}

async function generate(glCanvas, grid_size) {
    const tiles = [
        new Tile([true, true, true, false, false]),
        new Tile([false, false, true, false, false]),
        new Tile([false, true, true, true, true]),
        new Tile([false, false, true, true, true]),
        new Tile([false, false, false, true, false])
    ]
    const map = new Map(tiles, grid_size, grid_size);

    await map.generate()
    const cell_size_normal = 1 / grid_size;

    const quads = [];
    for (let y = 0; y < grid_size; y++) {
        for (let x = 0; x < grid_size; x++) {
            quads.push(new Quad(cell_size_normal, atlas_offset_lookup[map.get_tile(new Vec2(x, y)) - 1], get_grid_pos(x, y, cell_size_normal)));
        }
    }

    build_mesh(glCanvas, quads);
    glCanvas.render();
}

async function main() {
    const canvas = document.getElementById("gl-canvas");
    canvas.width = 640;
    canvas.height = 640;

    let grid_size = 40;
    
    let glCanvas = new GLCanvas(canvas, 1024 * 1024)
    await glCanvas.initProgram("fragment.frag", "vertex.vert");
    await glCanvas.loadTextureAtlas("textures/atlas.png");

    // Download button
    const download_button = document.getElementById("download");
    download_button.onclick = () => {
        glCanvas.render();
        let link = document.createElement('a');
        link.download = 'filename.png';
        link.href = document.getElementById('gl-canvas').toDataURL()
        link.click();
        link.remove();
    };

    const gen_button = document.getElementById("generate");
    gen_button.onclick = () => {
        generate(glCanvas, grid_size);
    };

    const size_slider = document.getElementById("size");
    const size_slider_label = document.getElementById("size-label");
    size_slider.oninput = function () {
        size_slider_label.innerText = "Size: " + this.value;
        grid_size = Number(this.value);
    }
}

main();
