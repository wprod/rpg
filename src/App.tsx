import React from "react";
import ThirdPersonCharacterControls from "./Components/ThirdPersonCharacterControls";
import { Canvas, useLoader } from "@react-three/fiber";
import { Debug, Physics } from "@react-three/cannon";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { generateHeightmap, Heightfield } from "./Components/Map/Heightfield";

export const MODEL_PATH = "/models";

const animationPaths = {
  idle: `${MODEL_PATH}/idle.fbx`,
  walk: `${MODEL_PATH}/slowRun.fbx`,
  run: `${MODEL_PATH}/fastRun.fbx`,
  jump: `${MODEL_PATH}/jumpingUp.fbx`,
  landing: `${MODEL_PATH}/jumpingDown.fbx`,
  inAir: `${MODEL_PATH}/inAir.fbx`,
  backpedal: `${MODEL_PATH}/backpedal.fbx`,
  turnLeft: `${MODEL_PATH}/leftTurn.fbx`,
  turnRight: `${MODEL_PATH}/rightTurn.fbx`,
  strafeLeft: `${MODEL_PATH}/leftStrafe.fbx`,
  strafeRight: `${MODEL_PATH}/rightStrafe.fbx`,
};

export function App() {
    const fbx = useLoader(FBXLoader, `/models/model-2.fbx`);
    const scale = 128;

    const characterProps = {
      scale: 1,
      velocity: 8,
      radius: 0.33,
    };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <Canvas
        flat
        camera={{
          fov: 75,
          near: 0.1,
          far: 3800,
          position: [0, 11, 11],
        }}
      >
        <Physics gravity={[0, -35, 0]}>
          <Debug color="black" scale={1}>
            <Heightfield
              elementSize={scale / 128}
              heights={generateHeightmap({
                height: 128,
                number: 100,
                scale: 10,
                width: 128,
              })}
              position={[-scale / 2, -10, scale / 2]}
              rotation={[-Math.PI / 2, 0, 0]}
            />

            <ambientLight />
            <pointLight position={[10, 10, 10]} />

            <ThirdPersonCharacterControls
              cameraOptions={{
                yOffset: 1.6,
                minDistance: 0.6,
                maxDistance: 7,
                collisionFilterMask: 2,
              }}
              characterObj={fbx}
              characterProps={characterProps}
              animationPaths={animationPaths}
              onLoad={console.log}
            />
          </Debug>
        </Physics>
      </Canvas>
    </div>
  );
}
