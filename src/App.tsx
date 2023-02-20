import { useFBX, useGLTF } from "@react-three/drei";
import React from "react";
import ThirdPersonCharacterControls from "./Components/ThirdPersonCharacterControls";
import { Canvas } from "@react-three/fiber";
import { Physics, useBox } from "@react-three/cannon";

const PATH = "https://mannys-game.s3.amazonaws.com/third-person/animations";

const animationPaths = {
  idle: `${PATH}/idle.glb`,
  walk: `${PATH}/walk.glb`,
  run: `${PATH}/run.glb`,
  jump: `${PATH}/jump.glb`,
  landing: `${PATH}/landing.glb`,
  inAir: `${PATH}/falling_idle.glb`,
  backpedal: `${PATH}/backpedal.glb`,
  turnLeft: `${PATH}/turn_left.glb`,
  turnRight: `${PATH}/turn_right.glb`,
  strafeLeft: `${PATH}/strafe_left.glb`,
  strafeRight: `${PATH}/strafe_right.glb`,
};

function Floor() {
  const [ref] = useBox(() => ({
    type: "Static",
    args: [25, 0.2, 25],
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

export function ThirdPersonCharacter() {
  const characterObj = useFBX(`/models/Manny_3.0.0.fbx`);
  const characterProps = {
    scale: 1.75,
    velocity: 8,
    radius: 0.5,
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
          <Wall args={[25, 3, 0.2]} position={[0, 1.4, -12.6]} />
          <Wall args={[25, 3, 0.2]} position={[0, 1.4, 12.6]} />
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
          <ThirdPersonCharacterControls
            cameraOptions={{
              yOffset: 1.6,
              minDistance: 0.6,
              maxDistance: 7,
              collisionFilterMask: 2,
            }}
            characterObj={characterObj}
            characterProps={characterProps}
            animationPaths={animationPaths}
            onLoad={console.log}
          />
        </Physics>
      </Canvas>
    </div>
  );
}
