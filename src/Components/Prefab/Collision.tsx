import { CuboidCollider } from "@react-three/rapier";
import { Suspense, useState } from "react";
import { Text } from "@react-three/drei";
import { useGameStore } from "../../store.ts";

export const Collision = () => {
  const [intersecting, setIntersection] = useState(false);

  return (
    <Suspense fallback={null}>
      <Text color="black" position={[0, 2, 3]} fontSize={0.5}>
        Heal
      </Text>
      {intersecting && (
        <Text color="red" position={[0, 1, 3]} fontSize={0.5}>
          Healed
        </Text>
      )}

      <CuboidCollider
        position={[0, 0, 3]}
        args={[1, 1, 0]}
        density={0}
        sensor
        onIntersectionEnter={() => {
          useGameStore.setState(() => ({
            health: 100,
          }));

          setIntersection(true);
        }}
        onIntersectionExit={() => setIntersection(false)}
      ></CuboidCollider>
    </Suspense>
  );
};
