import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Group } from "three";
import { useFrame, useThree } from "@react-three/fiber";
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
import { Triplet } from "@react-three/cannon";

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
  STRAFE_RIGHT = "strafeRight",
  STRAFE_LEFT = "strafeLeft",
}

export type TAnimationPaths = Record<EAnimationNames, string>;

interface IThirdPersonCharacterControls {
  cameraOptions: ICameraOptions;
  characterObj: Group;
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
    characterObj,
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
      newRotation = characterObj.rotation.clone();
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

      // rotate character model inside model group
      const newQuat = new THREE.Quaternion().setFromEuler(newRotation);
      characterObj.quaternion.slerp(newQuat, 0.1);
    }

    collider.velocity.set(xVelocity, velocity.current[1], zVelocity);

    // after applying x/z velocity, apply y velocity if user has jumped while grounded
    const isGrounded = Math.abs(Number(velocity.current[1].toFixed(2))) === 0;

    if (animation === "jump" && isGrounded) {
      collider.velocity.set(velocity.current[0], 8.5, velocity.current[2]);
    }

    // quaternion is set on model group so we copy it to collider
    collider.quaternion.copy(modelRef?.current?.quaternion!);
    // check camera raycast collision and pass that to controls to
    cameraContainer.current.getWorldPosition(rayVector.current);
    controls?.update(ray);
  });

  // Transition to new animation when loaded
  useEffect(() => {
    // @ts-ignore
    actions?.[animation]?.stop().fadeIn(0.5).play();

    return () => {
      // @ts-ignore
      actions?.[animation]?.fadeOut(0.5);
    };
  }, [animation, actions]);

  return (
    <Suspense>
      <group dispose={null} ref={modelRef}>
        <group
          name="Armature"
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={1}
        >
          <primitive object={characterObj} />
        </group>
      </group>
    </Suspense>
  );
};

export default ThirdPersonCharacterControls;
