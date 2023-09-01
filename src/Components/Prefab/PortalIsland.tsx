import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { Mesh, MeshBasicMaterial, TextureLoader } from "three";
import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { RigidBody } from "@react-three/rapier";

type GLTFResult = GLTF & {
  nodes: {
    colliders: THREE.Mesh;
    floating_1: THREE.Mesh;
    floating_2: THREE.Mesh;
    grass_1: THREE.Mesh;
    grass_123: THREE.Mesh;
    grass_458: THREE.Mesh;
    grass_459: THREE.Mesh;
    grass_65: THREE.Mesh;
    island: THREE.Mesh;
    stairs: THREE.Mesh;
    portal001: THREE.Mesh;
    stone_1: THREE.Mesh;
    stone_12: THREE.Mesh;
    stone_2: THREE.Mesh;
    stone_3: THREE.Mesh;
    stone_358: THREE.Mesh;
    stone_4: THREE.Mesh;
    stone_45: THREE.Mesh;
    stone_78: THREE.Mesh;
    stone_7896: THREE.Mesh;
    tree_1: THREE.Mesh;
    tree_125: THREE.Mesh;
    tree_3: THREE.Mesh;
    tree_5522: THREE.Mesh;
    tree_986: THREE.Mesh;
    tree_9865: THREE.Mesh;
  };
  materials: {};
};

export default function PortalIsland(props: JSX.IntrinsicElements["group"]) {
  const { nodes, scene } = useGLTF("/island/island.glb") as GLTFResult;
  const texture = useLoader(TextureLoader, `/island/backed-4k.jpg`);
  texture.flipY = false;

  const bakedMaterial = useMemo(() => {
    return new MeshBasicMaterial({ map: texture });
  }, [texture]);

  const colliderMaterial = useMemo(() => {
    return new MeshBasicMaterial({ transparent: true, opacity: 0 });
  }, [texture]);

  useEffect(() => {
    if (scene && bakedMaterial) {
      scene.traverse((child) => {
        (child as Mesh).material = bakedMaterial;
      });
    }
  }, [scene, bakedMaterial]);

  return (
    <group {...props} dispose={null} scale={0.9}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.floating_1.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.floating_2.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.grass_1.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.grass_123.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.grass_458.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.grass_459.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.grass_65.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.island.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.portal001.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stairs.geometry}
        material={bakedMaterial}
      />
      <RigidBody colliders={"trimesh"} type={"fixed"}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.colliders.geometry}
          material={colliderMaterial}
        />
      </RigidBody>

      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stone_1.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stone_12.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stone_2.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stone_3.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stone_358.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stone_4.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stone_45.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stone_78.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stone_7896.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.tree_1.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.tree_125.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.tree_3.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.tree_5522.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.tree_986.geometry}
        material={bakedMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.tree_9865.geometry}
        material={bakedMaterial}
      />
    </group>
  );
}

useGLTF.preload("/island.glb");
