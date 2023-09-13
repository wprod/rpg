import { CuboidCollider } from "@react-three/rapier";
import { Suspense, useState } from "react";
import { Shadow, Sparkles } from "@react-three/drei";
import { useGameStore } from "../../store.ts";

const Sphere = ({ size = 0.5, amount = 50, color = "white", ...props }) => (
  <mesh {...props}>
    <sphereGeometry args={[size, 64, 64]} />
    <meshPhysicalMaterial
      roughness={0}
      color={color}
      emissive={color}
      envMapIntensity={0.2}
    />
    <Sparkles count={amount} scale={size * 2} size={6} speed={0.4} />
    <Shadow
      rotation={[-Math.PI / 2, 0, 0]}
      scale={size}
      position={[0, -size, 0]}
      opacity={0.5}
    />
  </mesh>
);

export const Collision = () => {
  const [intersecting, setIntersection] = useState(false);

  return (
    <Suspense fallback={null}>
      <CuboidCollider
        position={[0, 2, 7]}
        args={[1, 1, 0]}
        density={0}
        sensor
        onIntersectionEnter={(e) => {
          if (e?.rigidBodyObject?.name === "character") {
            useGameStore.setState(() => ({
              health: 100,
            }));

            console.log("healed");

            setIntersection(true);
          }
        }}
        onIntersectionExit={() => setIntersection(false)}
      >
        <Sphere color={intersecting ? "#bfffb2" : "white"} />
      </CuboidCollider>
    </Suspense>
  );
};
