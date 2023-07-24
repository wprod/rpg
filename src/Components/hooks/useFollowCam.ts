import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

export default function useFollowCam() {
  const { camera } = useThree();

  const pivot = useMemo(() => new THREE.Object3D(), []);
  const followCam = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 1, -5);
    return o;
  }, []);

  const onDocumentMouseMove = (e: any) => {
    if (document.pointerLockElement) {
      pivot.rotation.y -= e.movementX * 0.002;
      const v = followCam.rotation.x + e.movementY * 0.002;

      if (v >= -0.35 && v <= 0.8) {
        followCam.rotation.x = v;
        followCam.position.y = -v * followCam.position.z + 1;
      }
    }
    return false;
  };

  useEffect(() => {
    followCam.add(camera);
    pivot.add(followCam);
    document.addEventListener("mousemove", onDocumentMouseMove);
    return () => {
      document.removeEventListener("mousemove", onDocumentMouseMove);
    };
  });

  return { pivot, followCam };
}
