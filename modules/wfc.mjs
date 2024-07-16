function randInt(max) {
    return Math.floor(Math.random() * max);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

class Pos {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Pos(other.x + this.x, other.y + this.y);
    }
}

class Tile {
    constructor(rules) {
        this.rules = rules;
    }
}

class Cell {
    constructor(id = 0) {
        this.id = id;
        this.visited = false;
    }
}

class Map {
    offsets = [new Pos(0, -1), new Pos(1, 0), new Pos(0, 1), new Pos(-1, 0)];

    constructor(tiles, width, height) {
        this.tiles = tiles;
        this.num_tiles = tiles.length;
        this.map = Array(height).fill().map(() => Array(width).fill().map(() => new Cell())); // Initialises empty 2D array of unique cell objects
        this.width = width;
        this.height = height; 
    }

    async generate() {
        let min_poss_pos = new Pos(randInt(this.width), randInt(this.height));
        this.propagation_stack = [];
        this.map[min_poss_pos.y][min_poss_pos.x].id = 5;
        while (true) {
            this.propagate(min_poss_pos, true);

            while (this.propagation_stack.length > 0) {
                this.propagate(this.propagation_stack.pop(), false)
            }

            let min_poss = Infinity;
            min_poss_pos = new Pos(-1, -1);
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    let pos = new Pos(x, y);
                    this.map[y][x].visited = false;
                    if (this.get_tile(pos) != 0) { continue; }
                    let poss = this.get_poss(pos).length;
                    if (poss < min_poss) {
                        min_poss = poss;
                        min_poss_pos = pos;
                    }
                }
            }
            if (min_poss == 0) { alert("Broken rule set - 0 possibility tile reached."); }
            if (min_poss == Infinity) { break; }
        }
    }

    propagate(pos, hard) {
        if (!this.check_bounds(pos)) { return; }
        if (this.get_tile(pos) != 0) { return; }
        if (this.get_visited(pos)) { return; }
        this.map[pos.y][pos.x].visited = true;

        let poss = this.get_poss(pos);
        if (poss.length == 0) {
            alert("Broken rule set - 0 possibility tile reached.");
        } else if (poss.length == 1) {
            this.map[pos.y][pos.x].id = poss[0];
        } else if (hard) {
            this.map[pos.y][pos.x].id = poss[randInt(poss.length)];
        }

        shuffleArray(this.offsets);
        this.offsets.forEach(e => {
            this.propagation_stack.push(pos.add(e));
        });
    }

    get_poss(pos) {
        let poss = [];
        for (let tile = 0; tile < this.num_tiles; tile++) {
            let tile_poss = true;
            for (let offset = 0; offset < this.offsets.length; offset++) {
                let neighbour = this.get_tile(pos.add(this.offsets[offset]));
                if (neighbour == 0) { continue; }
                if (!this.tiles[tile].rules[neighbour - 1]) {
                    tile_poss = false;
                    break;
                }
            }
            if (tile_poss) { poss.push(tile  + 1); }
        }
        return poss;
    }

    get_tile(pos) {
        if (!this.check_bounds(pos)) { return 0; }
        return this.map[pos.y][pos.x].id;
    }

    get_visited (pos) {
        if (!this.check_bounds(pos)) { return true; }
        return this.map[pos.y][pos.x].visited;
    }

    check_bounds (pos) {
        return pos.x < this.width && pos.x >= 0 && pos.y < this.height && pos.y >= 0;
    }

    get_map() {
        return this.map.map(array => array.map(cell => cell.id)); // Returns 2D array of cell IDs
    }

    print_map() {
        let out = "";
        this.map.forEach(row => {
            row.forEach(e => {
                out += e.id + " ";
            })
            out += "\n"
        });
        console.log(out);
    }
}

export { Map, Tile };