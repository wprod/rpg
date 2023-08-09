import * as THREE from "three";
import { TubeGeometry, Vector3 } from "three";
import create from "zustand";
import * as audio from "./Audio";
import { GrannyKnot } from "three/examples/jsm/curves/CurveExtras.js";

let guid = 1;

export interface GameState {
  sound: boolean;
  camera?: THREE.Camera;
  points: number;
  health: number;
  lasers: number[];
  explosions: [];
  mutation: any;
  actions: any;
  rocks: RandomData[];
  enemies: RandomData[];
}

export interface RandomData {
  guid: number;
  scale: number;
  size: number;
  offset: Vector3;
  pos: Vector3;
  speed: number;
  radius: number;
  t: number;
  hit: Vector3;
  distance: 1000;
}

export const useGameStore = create<GameState>()((set, get) => {
  let spline = new GrannyKnot();
  let track = new TubeGeometry(spline, 250, 0.2, 10, true);

  let cancelLaserTO: number | undefined = undefined;
  const box = new THREE.Box3();

  return {
    sound: false,
    camera: undefined,
    points: 0,
    health: 33,
    lasers: [],
    explosions: [],
    rocks: randomData(100, track, 150, 8, 1),
    enemies: randomData(10, track, 20, 15, 1),

    mutation: {
      t: 0,
      position: new THREE.Vector3(),
      startTime: Date.now(),
      scale: 15,
      fov: 70,
      hits: false,
      looptime: 40 * 1000,
      binormal: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      clock: new THREE.Clock(false),
      mouse: new THREE.Vector2(-250, 50),

      // Re-usable objects
      dummy: new THREE.Object3D(),
      ray: new THREE.Ray(),
      box: new THREE.Box3(),
    },

    actions: {
      init(camera: THREE.Camera) {
        const { mutation, actions } = get();

        set({ camera });
        mutation.clock.start();
        actions.toggleSound(get().sound);
      },

      shoot() {
        set((state) => ({ lasers: [...state.lasers, Date.now()] }));
        clearTimeout(cancelLaserTO);
        cancelLaserTO = setTimeout(
          () =>
            set((state) => ({
              lasers: state.lasers.filter((t) => Date.now() - t <= 1000),
            })),
          1000,
        );
        playAudio(audio.zap, 0.5);
      },
      toggleSound(sound = !get().sound) {
        set({ sound });
        playAudio(audio.engine, 1, true);
        playAudio(audio.engine2, 0.3, true);
        playAudio(audio.bg, 1, true);
      },

      test(data: RandomData) {
        box.min.copy(data.offset);
        box.max.copy(data.offset);
        box.expandByScalar(data.size * data.scale);
        data.hit.set(10000, 10000, 10000);
        const result = get().mutation.ray.intersectBox(box, data.hit);
        data.distance = get().mutation.ray.origin.distanceTo(data.hit);
        return result;
      },
    },
  };
});

function randomData(
  count: number,
  track: TubeGeometry,
  radius: number,
  size: number,
  scale: number,
): RandomData[] {
  return new Array(count).map(() => {
    const t = Math.random();

    const pos = track.parameters.path.getPointAt(t);

    pos.multiplyScalar(15);

    const offset = pos
      .clone()
      .add(
        new THREE.Vector3(
          -radius + Math.random() * radius * 2,
          -radius + Math.random() * radius * 2,
          -radius + Math.random() * radius * 2,
        ),
      );

    const speed = 0.1 + Math.random();

    return {
      guid: guid++,
      scale: scale,
      size,
      offset,
      pos,
      speed,
      radius,
      t,
      hit: new THREE.Vector3(),
      distance: 1000,
    };
  });
}

function playAudio(audio: any, volume = 1, loop = false) {
  if (useGameStore.getState().sound) {
    audio.currentTime = 0;
    audio.volume = volume;
    audio.loop = loop;
    audio.play();
  } else audio.pause();
}
