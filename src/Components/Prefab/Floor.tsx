import { RigidBody } from "@react-three/rapier";
import { IInteractionGroups } from "../Character.types.ts";

export default function Floor({ interactionGroups }: IInteractionGroups) {
  return (
    <RigidBody type="fixed" collisionGroups={interactionGroups}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[300, 0.5, 300]} />
        <meshPhongMaterial color="#ff0000" opacity={0} transparent />
      </mesh>
    </RigidBody>
  );
}
