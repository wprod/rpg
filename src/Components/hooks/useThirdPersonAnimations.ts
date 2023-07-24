import { useEffect, useMemo, useRef, useState } from "react";
import { AnimationMixer, Object3D } from "three";
import { useFrame } from "@react-three/fiber";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { Group } from "three/src/Three";

export enum EAnimationNames {
  IDLE = "idle",
  WALK = "walk",
  RUN = "run",
  JUMP = "jump",
  LANDING = "landing",
  IN_AIR = "inAir",
  BACKPEDAL = "backpedal",
  TURN_LEFT = "turnLeft",
  TURN_RIGHT = "turnRight",
  STRAFE_RIGHT = "strafeRight",
  STRAFE_LEFT = "strafeLeft",
}
export type TAnimationPaths = Record<EAnimationNames, string>;

const FBX_LOADER = new FBXLoader();

async function asyncForEach(array: any[], callback: Function) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
    //play each animation
  }
}

function loadModelSync(url: string, loader: FBXLoader): Promise<Group> {
  return new Promise((resolve, reject) => {
    loader.load(url, (data: any) => resolve(data), console.info, reject);
  });
}

function useThirdPersonAnimations(
  characterObj: THREE.Object3D,
  animationPaths: TAnimationPaths,
  onLoad = () => {},
) {
  const ref = useRef<Object3D | null>(null);
  const [clips, setClips] = useState([]);
  const [actualRef, setRef] = useState(ref);
  const [mixer, setMixer] = useState<AnimationMixer>();
  const lazyActions = useRef({});
  const [animations, setAnimations] = useState({});

  // set character obj + mixer for character
  useEffect(() => {
    if (characterObj) {
      setRef({ current: characterObj });
      // @ts-ignore
      setMixer(new AnimationMixer(undefined));
    }
  }, [characterObj.name]);

  // load animations async initially
  useEffect(() => {
    const loadAnimations = async () => {
      const newAnimations: Record<string, GLTF> = {};

      await asyncForEach(
        Object.values(EAnimationNames),
        async (key: EAnimationNames) => {
          const loader = FBX_LOADER;
          const model = await loadModelSync(animationPaths[key], loader);

          newAnimations[key] = model;
        },
      );

      setAnimations(newAnimations);
      onLoad();
    };

    loadAnimations();
  }, []);

  // set clips once animations are loaded
  useEffect(() => {
    const clipsToSet: any[] = [];

    Object.keys(animations).forEach((name) => {
      // @ts-ignore
      if (animations[name]?.animations?.length) {
        // @ts-ignore
        animations[name].animations[0].name = name;
        // @ts-ignore
        clipsToSet.push(animations[name].animations[0]);
      }
    });

    if (clips.length < clipsToSet.length) {
      // @ts-ignore
      setClips(clipsToSet);
    }
  }, [animations]);

  const api = useMemo(() => {
    if (!mixer || !clips.length) {
      return {
        actions: {},
      };
    }

    const actions = {};

    clips.forEach((clip) =>
      // @ts-ignore
      Object.defineProperty(actions, clip.name, {
        enumerable: true,
        get() {
          if (actualRef.current) {
            // @ts-ignore
            lazyActions.current[clip.name] = mixer.clipAction(
              clip,
              actualRef.current,
            );

            // @ts-ignore
            return lazyActions.current[clip.name];
          }

          return null;
        },
      }),
    );

    return {
      ref: actualRef,
      clips,
      actions,
      // @ts-ignore
      names: clips.map((c) => c?.name),
      mixer,
    };
  }, [clips, characterObj.name, mixer]);

  useEffect(() => {
    const currentRoot = actualRef.current;
    return () => {
      // Clean up only when clips change, wipe out lazy actions and uncache clips
      lazyActions.current = {};
      Object.values(api.actions).forEach((action) => {
        if (currentRoot) {
          // @ts-ignore
          mixer.uncacheAction(action, currentRoot);
        }
      });
    };
  }, [clips]);

  useFrame((_, delta) => {
    mixer && mixer.update(delta);
  });

  return api;
}

export default useThirdPersonAnimations;
