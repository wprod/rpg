import React from "react";
import ThirdPersonCharacterControls from "./Components/ThirdPersonCharacterControls";
import { Canvas, useLoader } from "@react-three/fiber";
import { Debug, Physics, useBox } from "@react-three/cannon";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

const PATH = "/models";

const animationPaths = {
  idle: `${PATH}/idle.fbx`,
  walk: `${PATH}/slowRun.fbx`,
  run: `${PATH}/fastRun.fbx`,
  jump: `${PATH}/jumpingUp.fbx`,
  landing: `${PATH}/jumpingDown.fbx`,
  inAir: `${PATH}/inAir.fbx`,
  backpedal: `${PATH}/backpedal.fbx`,
  turnLeft: `${PATH}/leftTurn.fbx`,
  turnRight: `${PATH}/rightTurn.fbx`,
  strafeLeft: `${PATH}/leftStrafe.fbx`,
  strafeRight: `${PATH}/rightStrafe.fbx`,
};

function Floor() {
  const [ref] = useBox(() => ({
    type: "Static",
    args: [75, 0.2, 75],
    mass: 0,
    material: {
      friction: 0,
      name: "floor",
    },
    collisionFilterGroup: 2,
  }));

  return (
    <group>
      <mesh
        // @ts-ignore
        ref={ref}
      >
        <boxGeometry name="floor-box" />
        <meshPhongMaterial opacity={0} transparent />
      </mesh>
      <gridHelper args={[25, 25]} />
    </group>
  );
}

function Wall({ args, ...props }: any) {
  const [ref] = useBox(() => ({
    type: "Static",
    args,
    mass: 0,
    material: {
      friction: 0.3,
      name: "wall",
    },
    collisionFilterGroup: 2,
    ...props,
  }));

  return (
    <mesh receiveShadow ref={ref} {...props}>
      <boxGeometry args={args} />
      <meshPhongMaterial color="white" opacity={0.8} transparent />
    </mesh>
  );
}

export function App() {
  const fbx = useLoader(FBXLoader, `/models/model-2.fbx`);

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
          <Debug color="black" scale={1.1}>
            <Wall args={[50, 3, 0.2]} position={[0, 1.4, -25]} />
            <Wall args={[50, 3, 0.2]} position={[0, 1.4, 25]} />
            <Wall args={[2, 2, 2]} position={[0, 0, 0]} />
            <Wall
              args={[25, 3, 0.2]}
              rotation={[0, -Math.PI / 2, 0]}
              position={[12.6, 1.4, 0]}
            />
            <Wall
              args={[25, 3, 0.2]}
              rotation={[0, -Math.PI / 2, 0]}
              position={[-12.6, 1.4, 0]}
            />
            <Floor />
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
