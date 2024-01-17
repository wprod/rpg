import { RigidBody } from "@react-three/rapier";
import { IInteractionGroups } from "../Character/Character.types.ts";

export default function Floor({ interactionGroups }: IInteractionGroups) {
  return (
    <RigidBody type="fixed" collisionGroups={interactionGroups}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1000, 0.5, 1000]} />
        <meshPhongMaterial color="#ff0000" opacity={0} transparent />
      </mesh>
    </RigidBody>
  );
}
