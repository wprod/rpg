import { Grid, KeyboardControls } from "@react-three/drei";
import { Perf } from "r3f-perf";
import { Physics } from "@react-three/rapier";
import Character from "./Character.jsx";
import Floor from "./Prefab/Floor.tsx";
import Lights from "./Lights.jsx";
import Steps from "./Prefab/Steps.tsx";
import Slopes from "./Prefab/Slopes.tsx";
import RoughPlane from "./Prefab/RoughPlane.tsx";
import RigidObjects from "./Prefab/RigidObjects.tsx";
import FloatingPlatform from "./Prefab/FloatingPlatform.tsx";
import DynamicPlatforms from "./Prefab/DynamicPlatforms.tsx";
import { useControls } from "leva";
import Crash from "./Prefab/Crash.tsx";

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

  return (
    <>
      <Perf position="top-left" />

      <Grid
        infiniteGrid
        followCamera
        sectionColor={"lightgray"}
        cellColor={"gray"}
        position={[0, -0.99, 0]}
      />

      <Lights />

      <Physics debug={physics} timeStep="vary">
        {/* Character */}
        <KeyboardControls map={keyboardMap}>
          <Character />
        </KeyboardControls>

        {/* Rough plan */}
        <RoughPlane />

        {/* Slopes and stairs */}
        <Slopes />

        <Crash />

        {/* Small steps */}
        <Steps />

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
