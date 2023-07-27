import { RigidBody } from "@react-three/rapier";
import { useLoader } from "@react-three/fiber";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

export default function Crash() {
  const ship = useLoader(FBXLoader, `/map/crash.fbx`);

  return (
    <RigidBody type="fixed" position={[-30, -0.78, 0]}>
      <group>
        <primitive object={ship} scale={0.001} />
      </group>
    </RigidBody>
  );
}
