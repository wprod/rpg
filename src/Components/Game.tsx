import { Grid, KeyboardControls } from "@react-three/drei";
import { Perf } from "r3f-perf";
import { interactionGroups, Physics, RigidBody } from "@react-three/rapier";
import Character from "./Character/Character.tsx";
import Floor from "./Prefab/Floor.tsx";
import Lights from "./Lights.jsx";
import RigidObjects from "./Prefab/RigidObjects.tsx";
import FloatingPlatform from "./Prefab/FloatingPlatform.tsx";
import DynamicPlatforms from "./Prefab/DynamicPlatforms.tsx";
import { useControls } from "leva";
import { DefaultLoadingManager, Vector3 } from "three";
import { useEffect, useRef, useState } from "react";
import { Vector3Tuple } from "@react-three/rapier/dist/declarations/src/types";
import { TerrainChunkManager } from "./Terrain/Terrain.ts";
import { useFrame, useThree } from "@react-three/fiber";

DefaultLoadingManager.onLoad = function () {
  console.log("Loading Complete!");
};

export default function Game() {
  const { physics } = useControls("World Settings", {
    physics: true,
  });

  const { coliders } = useControls(
    "World coliders (toggle on off after chunks genration)",
    {
      coliders: true,
    },
  );

  const { dir } = useControls("Gravity dir", {
    dir: false,
  });

  const keyboardMap = [
    { name: "forward", keys: ["ArrowUp", "KeyW"] },
    { name: "backward", keys: ["ArrowDown", "KeyS"] },
    { name: "leftward", keys: ["ArrowLeft", "KeyA"] },
    { name: "rightward", keys: ["ArrowRight", "KeyD"] },
    { name: "jump", keys: ["Space"] },
    { name: "run", keys: ["Shift"] },
  ];

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    DefaultLoadingManager.onLoad = function () {
      setLoaded(true);
    };
  }, []);

  const gravityUp: Vector3Tuple = [0, 10, 0];
  const gravityDown: Vector3Tuple = [0, -10, 0];

  const { camera, scene } = useThree();
  const earth = scene.getObjectByName("earth");
  const target = new Vector3();

  const terrainChunkManager = useRef<TerrainChunkManager | null>(null);

  useFrame(({ scene }) => {
    terrainChunkManager?.current?.Update(
      scene.getObjectByName("character")?.getWorldPosition(target),
    );
  });

  useEffect(() => {
    if (terrainChunkManager?.current !== null) return;

    terrainChunkManager.current = new TerrainChunkManager({
      camera: camera,
      earth: scene.getObjectByName("earth"),
    });
  }, [earth]);

  return (
    <>
      <Perf position="top-left" />

      {/*
        <fog attach="fog" args={["#17171b", 30, 40]} />
      */}

      <color attach="background" args={["#17171b"]} />

      <Grid visible={false} infiniteGrid followCamera position={[0, 0, 0]} />

      {/*
        <RagingSea position={[0, 0, 0]} />
      */}

      <Lights />

      <Physics
        debug={physics}
        paused={!loaded}
        timeStep="vary"
        gravity={dir ? gravityUp : gravityDown}
      >
        <RigidBody
          type="fixed"
          colliders={coliders ? "trimesh" : false}
          includeInvisible={true}
          collisionGroups={interactionGroups(0, [1, 10])}
        >
          <group name={"earth"}></group>
        </RigidBody>

        <group position={[0, 4020, 0]}>
          <KeyboardControls map={keyboardMap}>
            <Character interactionGroups={interactionGroups(10, [1, 0])} />
          </KeyboardControls>

          <RigidObjects interactionGroups={interactionGroups(1, [0, 10])} />

          <FloatingPlatform interactionGroups={interactionGroups(1, [0, 10])} />

          <DynamicPlatforms interactionGroups={interactionGroups(1, [0, 10])} />

          <Floor interactionGroups={interactionGroups(0, [1, 10])} />
        </group>
      </Physics>
    </>
  );
}
