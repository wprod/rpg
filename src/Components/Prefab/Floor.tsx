import { RigidBody } from "@react-three/rapier";

export default function Floor() {
  return (
    <RigidBody type="fixed">
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[300, 0.5, 300]} />
        <meshPhongMaterial color="#ff0000" opacity={0.1} transparent />
      </mesh>
    </RigidBody>
  );
}
