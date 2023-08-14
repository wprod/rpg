import { ConeCollider, RigidBody, useRapier } from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useLoader } from "@react-three/fiber";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

export default function FloatingIsland() {
  const island = useLoader(FBXLoader, `/map/land-26-1.fbx`);

  // Preset
  const floatingPlateRef = useRef<any>();
  const { rapier, world } = useRapier();

  /**
   * Ray setup
   */
  // Platform 1
  const rayLength = 0.8;
  const rayDir = { x: 0, y: -1, z: 0 };
  const springDirVec = useMemo(() => new THREE.Vector3(), []);
  const origin = useMemo(() => new THREE.Vector3(), []);
  const floatingDis = 0.8;
  const springK = 2.5;
  const dampingC = 0.15;

  useEffect(() => {
    // Loack platform 1 rotation
    floatingPlateRef.current.lockRotations(true);
  }, []);

  useFrame(() => {
    /**
     * Ray casting detect if on ground
     */
    // Ray cast for platform 1
    origin.set(
      floatingPlateRef.current.translation().x,
      floatingPlateRef.current.translation().y,
      floatingPlateRef.current.translation().z,
    );
    const rayCast = new rapier.Ray(origin, rayDir);
    const rayHit = world.castRay(
      rayCast,
      rayLength,
      true,
      undefined,
      undefined,
      floatingPlateRef.current,
      floatingPlateRef.current,
    );

    /**
     * Apply floating force
     */
    // Ray for platform 1
    if (rayHit) {
      if (rayHit != null) {
        const floatingForce =
          springK * (floatingDis - rayHit.toi) -
          floatingPlateRef.current.linvel().y * dampingC;
        floatingPlateRef.current.applyImpulse(
          springDirVec.set(0, floatingForce, 0),
          true,
        );
      }
    }
  });

  return (
    <>
      <RigidBody
        colliders={false}
        position={[-10, 1, 3]}
        mass={1}
        ref={floatingPlateRef}
      >
        <ConeCollider args={[0.5, 1.35]} rotation={[Math.PI, 0, 0]} />
        <primitive object={island} scale={0.005} position={[0, 0.4, 0]} />
      </RigidBody>
    </>
  );
}
