import * as THREE from "three";
import { Group, MeshStandardMaterial, Object3D, Object3DEventMap } from "three";

import { LinearSpline } from "./Utils/Spline.ts";
import { TerrainChunk } from "./TerrainChunck.ts";
import { Noise } from "./Utils/Noise.ts";
import { CubeQuadTree } from "./QuadTree.ts";
import { DictDifference, DictIntersection } from "./Utils";

const _DEEP_OCEAN = new THREE.Color(0x20020ff);
const _SHALLOW_OCEAN = new THREE.Color(0x8080ff);
const _SNOW = new THREE.Color(0xffffff);
const _FOREST_BOREAL = new THREE.Color(0x29c100);

const _MIN_CELL_SIZE = 250;
const _MIN_CELL_RESOLUTION = 64;
const _PLANET_RADIUS = 4000;

class HeightGenerator {
  _position: any;
  _radius: any;
  _generator: any;

  constructor(generator: any, position: any, minRadius: any, maxRadius: any) {
    this._position = position.clone();
    this._radius = [minRadius, maxRadius];
    this._generator = generator;
  }

  Get(x: number, y: number, z: number) {
    return [this._generator.Get(x, y, z), 1];
  }
}

// Cross-blended Hypsometric Tints
// http://www.shadedrelief.com/hypso/hypso.html
class HyposemetricTints {
  private _colourSpline: LinearSpline[];
  private _oceanSpline: LinearSpline;
  private _params: any;

  constructor(params: any) {
    const _colourLerp = (t: any, p0: any, p1: any) => {
      const c = p0.clone();

      return c.lerp(p1, t);
    };

    this._colourSpline = [
      new LinearSpline(_colourLerp),
      new LinearSpline(_colourLerp),
    ];

    // Arid
    this._colourSpline[0].AddPoint(0.0, new THREE.Color(0xb7a67d));
    this._colourSpline[0].AddPoint(0.5, new THREE.Color(0xf1e1bc));
    this._colourSpline[0].AddPoint(1.0, _SNOW);

    // Humid
    this._colourSpline[1].AddPoint(0.0, _FOREST_BOREAL);
    this._colourSpline[1].AddPoint(0.5, new THREE.Color(0xcee59c));
    this._colourSpline[1].AddPoint(1.0, _SNOW);

    this._oceanSpline = new LinearSpline(_colourLerp);
    this._oceanSpline.AddPoint(0, _DEEP_OCEAN);
    this._oceanSpline.AddPoint(0.03, _SHALLOW_OCEAN);
    this._oceanSpline.AddPoint(0.05, _SHALLOW_OCEAN);

    this._params = params;
  }

  Get(x: number, y: number, z: number) {
    const m = this._params.biomeGenerator.Get(x, y, z);
    const h = z / 100.0;

    if (h < 0.05) {
      return this._oceanSpline.Get(h);
    }

    const c1 = this._colourSpline[0].Get(h);
    const c2 = this._colourSpline[1].Get(h);

    return c1.lerp(c2, m);
  }
}

class TerrainChunkRebuilder {
  _params: any;
  _active?: null;
  _old?: any[];
  _new?: any[];
  private _pool: {};
  private _queued: any;

  constructor(params?: any) {
    this._pool = {};
    this._params = params;
    this._Reset();
  }

  get Busy() {
    return this._active || this._queued.length > 0;
  }

  AllocateChunk(params: any) {
    const w = params.width;

    if (!(w in this._pool)) {
      // @ts-ignore
      this._pool[w] = [];
    }

    let c = null;

    // @ts-ignore
    if (this._pool[w].length > 0) {
      // @ts-ignore
      c = this._pool[w].pop();
      c._params = params;
    } else {
      c = new TerrainChunk(params);
    }

    c.Hide();

    this._queued.push(c);

    return c;
  }

  _RecycleChunks(chunks: any) {
    for (let c of chunks) {
      if (!(c.chunk._params.width in this._pool)) {
        // @ts-ignore
        this._pool[c.chunk._params.width] = [];
      }

      c.chunk.Destroy();
    }
  }

  _Reset() {
    this._active = null;
    this._queued = [];
    this._old = [];
    this._new = [];
  }

  Rebuild(chunks: any) {
    if (this.Busy) {
      return;
    }
    for (let k in chunks) {
      this._queued.push(chunks[k].chunk);
    }
  }

  Update() {
    if (this._active) {
      // @ts-ignore
      const r = this._active.next();
      if (r.done) {
        this._active = null;
      }
    } else {
      const b = this._queued.pop();

      if (b && this._new) {
        this._active = b._Rebuild();
        this._new.push(b);
      }
    }

    if (this._active) {
      return;
    }

    if (!this._queued.length && this._new) {
      this._RecycleChunks(this._old);
      for (let b of this._new) {
        b.Show();
      }
      this._Reset();
    }
  }
}

export class TerrainChunkManager {
  _material?: MeshStandardMaterial;
  _builder?: TerrainChunkRebuilder;
  _noise?: Noise;
  _biomes?: Noise;
  _groups?: Group<Object3DEventMap>[];
  _chunks: any;
  private _params: any;

  constructor(params: any) {
    this._Init(params);
  }

  _Init(params: any) {
    this._params = params;

    this._material = new THREE.MeshStandardMaterial({
      wireframe: true,
      wireframeLinewidth: 1,
      color: 0xffffff,
      side: THREE.FrontSide,
      vertexColors: true,
    });

    this._builder = new TerrainChunkRebuilder(params);

    this._InitNoise();
    this._InitBiomes();
    this._InitTerrain(params.earth);
  }

  _InitNoise() {
    const params = {
      octaves: 13,
      persistence: 0.707,
      lacunarity: 1.8,
      exponentiation: 4.5,
      height: 300.0,
      scale: 1100.0,
      seed: 1,
    };

    this._noise = new Noise(params);
  }

  _InitBiomes() {
    const params = {
      octaves: 2,
      persistence: 0.5,
      lacunarity: 2.0,
      scale: 2048.0,
      noiseType: "simplex",
      seed: 2,
      exponentiation: 1,
      height: 1,
    };

    this._biomes = new Noise(params);
  }

  _InitTerrain(earth: Object3D) {
    this._groups = [...new Array(6)].map((_) => new THREE.Group());
    earth.add(...this._groups);

    for (let k in this._chunks) {
      this._chunks[k].chunk._plane.material.wireframe =
        this._params.wireframe ?? true;
    }

    this._chunks = {};
  }

  _CellIndex(p: any) {
    const xp = p.x + _MIN_CELL_SIZE * 0.5;
    const yp = p.z + _MIN_CELL_SIZE * 0.5;
    const x = Math.floor(xp / _MIN_CELL_SIZE);
    const z = Math.floor(yp / _MIN_CELL_SIZE);
    return [x, z];
  }

  _CreateTerrainChunk(
    group: any,
    offset: THREE.Vector3,
    width: any,
    resolution: number,
  ) {
    if (!this._builder) return;

    const params = {
      group: group,
      material: this._material,
      width: width,
      offset: offset,
      radius: _PLANET_RADIUS,
      resolution: resolution,
      biomeGenerator: this._biomes,
      colourGenerator: new HyposemetricTints({
        biomeGenerator: this._biomes,
      }),
      heightGenerators: [
        new HeightGenerator(this._noise, offset, 100000, 100000 + 1),
      ],
    };

    return this._builder.AllocateChunk(params);
  }

  Update(pos: any) {
    if (!this._builder) return;

    this._builder.Update();

    if (!this._builder.Busy) {
      this._UpdateVisibleChunks_Quadtree(pos);
    }
  }

  _UpdateVisibleChunks_Quadtree(pos: any) {
    if (!this._builder) return;

    function _Key(c: any) {
      return (
        c.position[0] +
        "/" +
        c.position[1] +
        " [" +
        c.size +
        "]" +
        " [" +
        c.index +
        "]"
      );
    }

    const q = new CubeQuadTree({
      radius: _PLANET_RADIUS,
      min_node_size: _MIN_CELL_SIZE,
    });

    q.Insert(pos);

    const sides = q.GetChildren();

    let newTerrainChunks = {};
    const center = new THREE.Vector3();
    const dimensions = new THREE.Vector3();

    for (let i = 0; i < sides.length; i++) {
      if (!this._groups?.[i]) return;

      this._groups[i].matrix = sides[i].transform;
      this._groups[i].matrixAutoUpdate = false;
      for (let c of sides[i].children) {
        c.bounds.getCenter(center);
        c.bounds.getSize(dimensions);

        const child = {
          index: i,
          group: this._groups[i],
          position: [center.x, center.y, center.z],
          bounds: c.bounds,
          size: dimensions.x,
        };

        const k = _Key(child);
        // @ts-ignore
        newTerrainChunks[k] = child;
      }
    }

    const intersection = DictIntersection(this._chunks, newTerrainChunks);
    const difference = DictDifference(newTerrainChunks, this._chunks);
    const recycle = Object.values(
      DictDifference(this._chunks, newTerrainChunks),
    );

    // @ts-ignore
    this._builder._old.push(...recycle);

    newTerrainChunks = intersection;

    for (let k in difference) {
      const [xp, yp, zp] = difference[k].position;

      const offset = new THREE.Vector3(xp, yp, zp);
      // @ts-ignore
      newTerrainChunks[k] = {
        position: [xp, zp],
        chunk: this._CreateTerrainChunk(
          difference[k].group,
          offset,
          difference[k].size,
          _MIN_CELL_RESOLUTION,
        ),
      };
    }

    this._chunks = newTerrainChunks;
  }
}
