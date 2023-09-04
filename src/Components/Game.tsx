import { Grid, KeyboardControls } from "@react-three/drei";
import { Perf } from "r3f-perf";
import { Physics } from "@react-three/rapier";
import Character from "./Character.jsx";
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
    physics: true,
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

      <Grid
        infiniteGrid
        followCamera
        sectionColor={"lightgray"}
        cellColor={"gray"}
        position={[0, 0, 0]}
      />

      <RagingSea position={[0, -5, 0]} />

      <Lights />

      <Physics debug={physics} paused={!loaded} timeStep="vary">
        {/* Character */}
        <KeyboardControls map={keyboardMap}>
          <Character />
        </KeyboardControls>

        {/* Portal */}
        <PortalIsland rotation-y={-Math.PI} position={[0, 0.75, 20]} />

        {/* Interaction */}
        <Collision />

        {/* Rigid body objects */}
        <RigidObjects />

        {/* Floating platform */}
        <FloatingPlatform />

        {/* Dynamic platforms */}
        <DynamicPlatforms />

        {/* Floor */}
        <Floor />
      </Physics>
    </>
  );
}
