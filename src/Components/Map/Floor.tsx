import { useBox } from "@react-three/cannon";
import React from "react";

export function Floor() {
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
        receiveShadow={true}
      >
        <boxGeometry name="floor-box" />
        <meshPhongMaterial opacity={0} transparent />
      </mesh>
      <gridHelper args={[25, 25]} />
    </group>
  );
}
