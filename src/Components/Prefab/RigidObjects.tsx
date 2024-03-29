import { Text } from "@react-three/drei";
import { BallCollider, CylinderCollider, RigidBody } from "@react-three/rapier";
import { Suspense } from "react";
import { IInteractionGroups } from "../Character/Character.types.ts";

export default function RigidObjects({
  interactionGroups,
}: IInteractionGroups) {
  return (
    <Suspense fallback={<></>}>
      {/* Rigid body boxes */}
      <RigidBody position={[15, 10, 0]} collisionGroups={interactionGroups}>
        <Text
          scale={0.5}
          color="black"
          maxWidth={10}
          textAlign="center"
          position={[0, 1, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          mass: 1
        </Text>
        <mesh receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={"lightsteelblue"} />
        </mesh>
      </RigidBody>

      <RigidBody position={[15, 10, -2]} collisionGroups={interactionGroups}>
        <Text
          scale={0.5}
          color="black"
          maxWidth={10}
          textAlign="center"
          position={[0, 1.5, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          mass: 3.375
        </Text>
        <mesh receiveShadow>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color={"lightsteelblue"} />
        </mesh>
      </RigidBody>

      <RigidBody position={[15, 10, -5]} collisionGroups={interactionGroups}>
        <Text
          scale={0.5}
          color="black"
          maxWidth={10}
          textAlign="center"
          position={[0, 2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          mass: 8
        </Text>
        <mesh receiveShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color={"lightsteelblue"} />
        </mesh>
      </RigidBody>

      {/* Fun toy */}
      <RigidBody
        colliders={false}
        position={[15, 5, -10]}
        collisionGroups={interactionGroups}
      >
        <Text
          scale={0.5}
          color="black"
          maxWidth={10}
          textAlign="center"
          position={[0, 1.5, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          mass: 1.24
        </Text>
        <CylinderCollider args={[0.03, 2.5]} position={[0, 0.25, 0]} />
        <BallCollider args={[0.25]} />
        <mesh receiveShadow>
          <cylinderGeometry args={[2.5, 0.2, 0.5]} />
          <meshStandardMaterial color={"lightsteelblue"} />
        </mesh>
      </RigidBody>
    </Suspense>
  );
}
