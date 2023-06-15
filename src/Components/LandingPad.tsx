import { useGLTF } from "@react-three/drei";
import React from "react";
import { useBox } from "@react-three/cannon";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

type GLTFResult = GLTF & {
  nodes: {
    SM_Bld_Corp_LandingPad_03: THREE.Mesh;
    SM_Bld_Corp_LandingPad_03_Glass_01: THREE.Mesh;
    SM_Bld_Corp_LandingPad_03_Ramp_01: THREE.Mesh;
    SM_Bld_Corp_LandingPad_03_Ramp_02: THREE.Mesh;
  };
  materials: {
    lambert10: THREE.MeshStandardMaterial;
  };
};

export function LandingPad(props: JSX.IntrinsicElements["group"]) {
  const { nodes, materials } = useGLTF(`/models/landingPad.glb`) as GLTFResult;

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
    // @ts-ignore
    <group {...props} ref={ref} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SM_Bld_Corp_LandingPad_03.geometry}
        material={materials.lambert10}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.SM_Bld_Corp_LandingPad_03_Glass_01.geometry}
          material={materials.lambert10}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.SM_Bld_Corp_LandingPad_03_Ramp_01.geometry}
          material={materials.lambert10}
          rotation={[0.32, -0.3, -0.74]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.SM_Bld_Corp_LandingPad_03_Ramp_02.geometry}
          material={materials.lambert10}
          rotation={[0.32, 0.3, -2.41]}
        />
      </mesh>
    </group>
  );
}
