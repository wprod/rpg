import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ObjectMap, useFrame, useThree } from "@react-three/fiber";
import useCapsuleCollider from "../Hooks/useCapsuleCollider";
import useRay from "../Hooks/useRay";
import useInputEventManager from "../Hooks/useInputEventManager";
import { useKeyboardInput } from "../Hooks/useKeyboardMouseMovement";
import useThirdPersonCameraControls, {
  ICameraOptions,
} from "../Hooks/useThirdPersonCameraControls";
import useThirdPersonAnimations from "../Hooks/useThirdPersonAnimations";
import useCharacterState from "../Hooks/useCharacterState";
import { inputMovementRotation } from "../Hooks/useInputMovementRotation";
import { Group, Mesh, Object3D } from "three";
import { Triplet } from "@react-three/cannon";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { Geometry } from "three/examples/jsm/deprecated/Geometry";
import { GLTFResult } from "../App";

export interface ICharacterProps {
  scale?: number;
  velocity?: number;
  radius?: number;
}

export enum EAnimationNames {
  IDLE = "idle",
  WALK = "walk",
  RUN = "run",
  JUMP = "jump",
  LANDING = "landing",
  IN_AIR = "inAir",
  BACKPEDAL = "backpedal",
  TURN_LEFT = "turnLeft",
  TURN_RIGHT = "turnRight",
}

export type TAnimationPaths = Record<EAnimationNames, string>;

interface IThirdPersonCharacterControls {
  cameraOptions: ICameraOptions;
  characterObj: GLTFResult;
  characterProps: ICharacterProps;
  animationPaths: TAnimationPaths;
  onLoad: any;
}
const ThirdPersonCharacterControls = ({
  cameraOptions,
  characterObj,
  characterProps,
  animationPaths,
  onLoad = console.info,
}: IThirdPersonCharacterControls) => {
  const {
    camera,
    gl: { domElement },
  } = useThree();

  // set up refs that influence character and camera position
  const collider = useCapsuleCollider(characterProps.radius);
  const [position, setPosition] = useState<Triplet>([0, 0, 0]);
  const modelRef = useRef<Group | null>(null);
  const cameraContainer = useRef(new THREE.Object3D());
  const rayVector = useRef(new THREE.Vector3());
  const ray = useRay({ position, rayVector, ...cameraOptions });

  // get character state based on user inputs + collider position + animations
  const inputManager = useInputEventManager(domElement);
  const inputs = useKeyboardInput(inputManager);

  const controls = useThirdPersonCameraControls({
    camera,
    domElement,
    target: modelRef.current,
    inputManager,
    cameraOptions,
    cameraContainer,
  });

  const { actions, mixer } = useThirdPersonAnimations(
    characterObj.nodes.Root,
    animationPaths,
    onLoad
  );

  const { animation, isMoving } = useCharacterState(inputs, position, mixer);

  // subscribe to collider velocity/position changes
  const charVelocity = characterProps.velocity ?? 4;
  const velocity = useRef([0, 0, 0]);

  useEffect(() => {
    collider.velocity.subscribe((v) => {
      velocity.current = v;
    });

    collider.position.subscribe((p) => {
      // position is set on collider so we copy it to model
      modelRef.current?.position.set(...p);
      // setState with position to  useCharacterState
      setPosition(p);
    });
  }, []);

  useFrame(() => {
    let newRotation = new THREE.Euler();
    let xVelocity = 0;
    let zVelocity = 0;

    if (isMoving && modelRef?.current?.quaternion && modelRef?.current) {
      const { model, movement } = inputMovementRotation(inputs);

      // first rotate the model group
      modelRef.current.rotateY(model.direction * -0.05);
      newRotation = characterObj.scene.rotation.clone();
      newRotation.y = model.rotation;

      const mtx = new THREE.Matrix4().makeRotationFromQuaternion(
        modelRef?.current?.quaternion
      );
      movement.applyMatrix4(mtx);

      // then apply velocity to collider influenced by model groups rotation
      const baseVelocity = inputs.down ? charVelocity / 2 : charVelocity;
      if (inputs.run) {
        zVelocity = 2 * movement.z * baseVelocity;
        xVelocity = 2 * movement.x * baseVelocity;
      } else {
        xVelocity = movement.x * baseVelocity;
        zVelocity = movement.z * baseVelocity;
      }
    }

    collider.velocity.set(xVelocity, velocity.current[1], zVelocity);

    // after applying x/z velocity, apply y velocity if user has jumped while grounded
    const isGrounded = Math.abs(Number(velocity.current[1].toFixed(2))) === 0;

    if (animation === "jump" && isGrounded) {
      collider.velocity.set(velocity.current[0], 8.5, velocity.current[2]);
    }

    // rotate character model inside model group
    const newQuat = new THREE.Quaternion().setFromEuler(newRotation);
    characterObj.scene.quaternion.slerp(newQuat, 0.1);

    // quaternion is set on model group so we copy it to collider
    collider.quaternion.copy(modelRef?.current?.quaternion!);
    // check camera raycast collision and pass that to controls to
    cameraContainer.current.getWorldPosition(rayVector.current);
    controls?.update(ray);
  });

  // Transition to new animation when loaded
  useEffect(() => {
    // @ts-ignore
    actions?.[animation]?.reset().fadeIn(0.2).play();

    return () => {
      // @ts-ignore
      actions?.[animation]?.fadeOut(0.2);
    };
  }, [animation, actions]);

  return (
    <Suspense>
      <group dispose={null} ref={modelRef}>
        <group
          name="Armature"
          position={[0, 0, 0.02]}
          rotation={[0, 0, 0]}
          scale={0.01}
        >
          <primitive object={characterObj.nodes.Root} />
          <skinnedMesh
            name="SM_Chr_ScifiWorlds_SpaceSuit_Female_01"
            geometry={
              characterObj.nodes.SM_Chr_ScifiWorlds_SpaceSuit_Female_01.geometry
            }
            material={characterObj.materials["Scifi_1a9.006"]}
            skeleton={
              characterObj.nodes.SM_Chr_ScifiWorlds_SpaceSuit_Female_01.skeleton
            }
          />
        </group>
      </group>
    </Suspense>
  );
};

export default ThirdPersonCharacterControls;
