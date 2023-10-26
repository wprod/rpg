import { Grid, KeyboardControls } from "@react-three/drei";
import { Perf } from "r3f-perf";
import { interactionGroups, Physics } from "@react-three/rapier";
import Character from "./Character/Character.tsx";
import Floor from "./Prefab/Floor.tsx";
import Lights from "./Lights.jsx";
import RigidObjects from "./Prefab/RigidObjects.tsx";
import FloatingPlatform from "./Prefab/FloatingPlatform.tsx";
import DynamicPlatforms from "./Prefab/DynamicPlatforms.tsx";
import { useControls } from "leva";
import { Collision } from "./Prefab/Collision.tsx";
import { DefaultLoadingManager } from "three";
import { useEffect, useState } from "react";
import PortalIsland from "./Prefab/PortalIsland.tsx";
import RagingSea from "./Prefab/RagingSea.tsx";

DefaultLoadingManager.onLoad = function () {
  console.log("Loading Complete!");
};

export default function Game() {
  const { physics } = useControls("World Settings", {
    physics: false,
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

  return (
    <>
      <Perf position="top-left" />

      <fog attach="fog" args={["#17171b", 30, 40]} />

      <color attach="background" args={["#17171b"]} />

      <Grid visible={false} infiniteGrid followCamera position={[0, 0, 0]} />

      <RagingSea position={[0, 0, 0]} />

      <Lights />

      <Physics debug={physics} paused={!loaded} timeStep="vary">
        <KeyboardControls map={keyboardMap}>
          <Character interactionGroups={interactionGroups(10, 1)} />
        </KeyboardControls>

        <PortalIsland
          rotation-y={-Math.PI}
          position={[0, 0.75, 20]}
          interactionGroups={interactionGroups(1, [0, 10])}
        />

        <Collision />

        <RigidObjects interactionGroups={interactionGroups(1, [0, 10])} />

        <FloatingPlatform interactionGroups={interactionGroups(1, [0, 10])} />

        <DynamicPlatforms interactionGroups={interactionGroups(1, [0, 10])} />

        <Floor interactionGroups={interactionGroups(0, 1)} />
      </Physics>
    </>
  );
}
