import { SpotLight, useFBX, useGLTF } from "@react-three/drei";
import React from "react";
import ThirdPersonCharacterControls from "./Components/ThirdPersonCharacterControls";
import { Canvas } from "@react-three/fiber";
import { Physics, useBox } from "@react-three/cannon";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";
import { AmbientLight } from "three";

const PATH = "/models";

const animationPaths = {
  idle: `${PATH}/idle.glb`,
  walk: `${PATH}/idle.glb`,
  run: `${PATH}/idle.glb`,
  jump: `${PATH}/idle.glb`,
  landing: `${PATH}/idle.glb`,
  inAir: `${PATH}/idle.glb`,
  backpedal: `${PATH}/idle.glb`,
  turnLeft: `${PATH}/idle.glb`,
  turnRight: `${PATH}/idle.glb`,
  strafeLeft: `${PATH}/idle.glb`,
  strafeRight: `${PATH}/idle.glb`,
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

export type GLTFResult = GLTF & {
  nodes: {
    SM_Chr_Attach_Helmet_Space_01: THREE.Mesh;
    SM_Chr_Attach_Helmet_Space_01_Glass: THREE.Mesh;
    SM_Chr_ScifiWorlds_SpaceSuit_Female_01: THREE.SkinnedMesh;
    Root: THREE.Bone;
  };
  materials: {
    ["SciFi_Planets_SHD.004"]: THREE.MeshStandardMaterial;
    ["SciFi_Planets_GLASS.004"]: THREE.MeshStandardMaterial;
    ["Scifi_1a9.005"]: THREE.MeshStandardMaterial;
  };
};

export function ThirdPersonCharacter() {
  const characterObj = useGLTF(`/models/model.glb`) as GLTFResult;

  const characterProps = {
    scale: 2,
    velocity: 8,
    radius: 1,
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
        <Physics gravity={[0, -5, 0]}>
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
          <ambientLight />
          <pointLight position={[10, 10, 10]} />

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
