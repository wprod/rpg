import { createNoise3D, NoiseFunction3D } from "simplex-noise";

export class Noise {
  private _params: any;
  private _noise?: NoiseFunction3D;

  constructor(params: any) {
    this._params = params;
    this._Init();
  }

  _Init() {
    console.log(this._params.seed);
    this._noise = createNoise3D();
  }

  Get(x: number, y: number, z: number) {
    if (!this._noise) {
      console.error("Noise not initialized in Noise.ts");
      return 0;
    }

    const G = 2.0 ** -this._params.persistence;
    const xs = x / this._params.scale;
    const ys = y / this._params.scale;
    const zs = z / this._params.scale;
    const noiseFunc = this._noise;

    let amplitude = 1.0;
    let frequency = 1.0;
    let normalization = 0;
    let total = 0;
    for (let o = 0; o < this._params.octaves; o++) {
      const noiseValue =
        noiseFunc(xs * frequency, ys * frequency, zs * frequency) * 0.5 + 0.5;
      total += noiseValue * amplitude;
      normalization += amplitude;
      amplitude *= G;
      frequency *= this._params.lacunarity;
    }
    total /= normalization;
    return Math.pow(total, this._params.exponentiation) * this._params.height;
  }
}
