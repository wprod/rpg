import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, useRapier } from "@react-three/rapier";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Group, MeshToonMaterial, Vector3 } from "three";
import { useControls } from "leva";
import useFollowCam from "../hooks/useFollowCam.ts";
import useThirdPersonAnimations, {
  EAnimationNames,
} from "../hooks/useThirdPersonAnimations.ts";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import useInputEventManager from "../hooks/useInputEventManager.ts";
import { useKeyboardInput } from "../hooks/useKeyboardMouseMovement.ts";
import { getAnimationFromUserInputs } from "../hooks/utils.ts";
import {
  defaultCharacterSettings,
  defaultRaySettings,
  defaultSlopeSettings,
  IInteractionGroups,
} from "./Character.types.ts";
import { useGameStore } from "../../store.ts";
import { Loader } from "../Loader.tsx";

export const MODEL_PATH: "meck" | "girl" = "girl";

const animationPaths: Record<EAnimationNames, string> = {
  idle: `/${MODEL_PATH}/idle.fbx`,
  injuredIdle: `/${MODEL_PATH}/injured-idle.fbx`,
  walk: `/${MODEL_PATH}/slow-run.fbx`,
  injuredWalk: `/${MODEL_PATH}/injured-walk.fbx`,
  run: `/${MODEL_PATH}/fast-run.fbx`,
  jump: `/${MODEL_PATH}/falling-idle.fbx`, // wip
  landing: `/${MODEL_PATH}/idle.fbx`, // wip
  inAir: `/${MODEL_PATH}/falling-idle.fbx`,
  backpedal: `/${MODEL_PATH}/idle.fbx`, // wip
  turnLeft: `/${MODEL_PATH}/idle.fbx`, // wip
  turnRight: `/${MODEL_PATH}/idle.fbx`, // wip
  strafeLeft: `/${MODEL_PATH}/slow-run.fbx`,
  strafeRight: `/${MODEL_PATH}/slow-run.fbx`,
};

export default function Character({ interactionGroups }: IInteractionGroups) {
  const characterRef = useRef<any>();
  const characterContainerRef = useRef<Group | null>(null);
  const characterObj = useLoader(FBXLoader, `/${MODEL_PATH}/t-pose.fbx`);

  useEffect(() => {
    if (characterObj?.children[1].material) {
      const map = characterObj.children[1].material.map;

      const material = new MeshToonMaterial();

      console.log(map);
      if (map) {
        material.map = map; // Set the texture as the map for the toon material
        material.needsUpdate = true; // Ensure the material is updated
      }

      characterObj.children[1].material = material;
    }
  }, [characterObj]);

  // Wip state
  const pv = useGameStore.getState().health;

  /**
   * Debug settings
   */
  const {
    maxVelLimit,
    turnVelMultiplier,
    turnSpeed,
    sprintMult,
    jumpVel,
    sprintJumpMult,
    airDragMultiplier,
    dragDampingC,
    accDeltaTime,
  } = useControls("Character controls", defaultCharacterSettings);

  const { rayLength, rayDir, floatingDis, springK, dampingC } = useControls(
    "Floating Ray",
    defaultRaySettings,
  );

  const {
    slopeRayOriginOffest,
    slopeRayLength,
    slopeRayDir,
    slopeUpExtraForce,
    slopeDownExtraForce,
  } = useControls("Slope Ray", defaultSlopeSettings);

  /**
   * keyboard controls setup
   */
  // @ts-ignore
  const { rapier, world } = useRapier();

  // can jump setup
  const [canJump, setCanJump] = useState(false);

  // on moving object state
  const [isOnMovingObject, setIsOnMovingObject] = useState(false);
  const movingObjectVelocity = useMemo(() => new THREE.Vector3(), []);
  const movingObjectVelocityInCharacterDir = useMemo(
    () => new THREE.Vector3(),
    [],
  );
  const distanceFromCharacterToObject = useMemo(() => new THREE.Vector3(), []);
  const objectAngvelToLinvel = useMemo(() => new THREE.Vector3(), []);

  /**
   * Load camera pivot and character move preset
   */
  const { pivot } = useFollowCam();
  const pivotPosition = useMemo(() => new THREE.Vector3(), []);
  const modelEuler = useMemo(() => new THREE.Euler(), []);
  const modelQuat = useMemo(() => new THREE.Quaternion(), []);
  const moveImpulse = useMemo(() => new THREE.Vector3(), []);
  const movingDirection = useMemo(() => new THREE.Vector3(), []);
  const moveAccNeeded = useMemo(() => new THREE.Vector3(), []);
  const currentVel = useMemo(() => new THREE.Vector3(), []);
  const dragForce = useMemo(() => new THREE.Vector3(), []);

  /**
   * Floating Ray setup
   */
  const springDirVec = useMemo(() => new THREE.Vector3(), []);
  const characterMassForce = useMemo(() => new THREE.Vector3(), []);

  /**
   * Slope detection ray setup
   */
  let slopeAngle: number = 0;
  const slopeRayOriginRef = useRef<any>();
  const slopeRayorigin = useMemo(() => new THREE.Vector3(), []);

  /**
   * Character moving function
   */
  const moveCharacter = (
    // @ts-ignore
    delta: number,
    run: boolean,
    slopeAngle: number,
    movingObjectVelocity: Vector3,
  ) => {
    if (!characterContainerRef?.current?.quaternion) return;

    // Only apply slope extra force when slope angle is between 0.2-1
    if (Math.abs(slopeAngle) > 0.2 && Math.abs(slopeAngle) < 1) {
      movingDirection.set(0, Math.sin(slopeAngle), Math.cos(slopeAngle));
    } else {
      movingDirection.set(0, 0, 1);
    }
    // Apply character quaternion to moving direction
    movingDirection.applyQuaternion(characterContainerRef.current.quaternion);
    // Calculate moving object velocity direction according to character moving direction
    movingObjectVelocityInCharacterDir
      .copy(movingObjectVelocity)
      .projectOnVector(movingDirection)
      .multiply(movingDirection);
    // Calculate angle between moving object velocity direction and character moving direction
    const angleBetweenCharacterDirAndObjectDir =
      movingObjectVelocity.angleTo(movingDirection);

    /**
     * Calculate required accelaration and force: a = Δv/Δt
     * If it's on a moving/rotating platform, apply platform velocity to Δv accordingly
     */
    moveAccNeeded.set(
      (movingDirection.x *
        (maxVelLimit + movingObjectVelocityInCharacterDir.x) *
        (run ? sprintMult : 1) -
        (currentVel.x -
          movingObjectVelocity.x *
            Math.sin(angleBetweenCharacterDirAndObjectDir))) /
        accDeltaTime,
      0,
      (movingDirection.z *
        (maxVelLimit + movingObjectVelocityInCharacterDir.z) *
        (run ? sprintMult : 1) -
        (currentVel.z -
          movingObjectVelocity.z *
            Math.sin(angleBetweenCharacterDirAndObjectDir))) /
        accDeltaTime,
    );

    // Wanted to move force function: F = ma
    const moveForceNeeded = moveAccNeeded.multiplyScalar(
      characterRef.current.mass(),
    );

    /**
     * Check if character complete turned to the wanted direction
     */
    const characterRotated =
      Math.sin(characterContainerRef?.current?.rotation.y ?? 0).toFixed(3) ==
      Math.sin(modelEuler.y).toFixed(3);

    // If character hasn't complete turning, change the impulse quaternion follow characterContainerRef quaternion
    if (!characterRotated) {
      moveImpulse.set(
        moveForceNeeded.x *
          turnVelMultiplier *
          (canJump ? 1 : airDragMultiplier), // if it's in the air, give it less control
        // -rejectVel.x * dragDampingC,
        slopeAngle === null || slopeAngle == 0 // if it's on a slope, apply extra up/down force to the body
          ? 0
          : movingDirection.y *
              turnVelMultiplier *
              (movingDirection.y > 0 // check it is on slope up or slope down
                ? slopeUpExtraForce
                : slopeDownExtraForce) *
              (run ? sprintMult : 1),
        moveForceNeeded.z *
          turnVelMultiplier *
          (canJump ? 1 : airDragMultiplier), // if it's in the air, give it less control
        // -rejectVel.z * dragDampingC
      );
    }
    // If character complete turning, change the impulse quaternion default
    else {
      moveImpulse.set(
        moveForceNeeded.x * (canJump ? 1 : airDragMultiplier),
        // -rejectVel.x * dragDampingC,
        slopeAngle === null || slopeAngle == 0 // if it's on a slope, apply extra up/down force to the body
          ? 0
          : movingDirection.y *
              (movingDirection.y > 0 // check it is on slope up or slope down
                ? slopeUpExtraForce
                : slopeDownExtraForce) *
              (run ? sprintMult : 1),
        moveForceNeeded.z * (canJump ? 1 : airDragMultiplier),
        // -rejectVel.z * dragDampingC
      );
    }

    // Move character at proper direction and impulse
    characterRef.current.applyImpulse(moveImpulse, true);
  };

  useEffect(() => {
    // Lock character rotations at any axis
    characterRef.current.lockRotations(true);
  }, []);

  const { actions } = useThirdPersonAnimations(
    characterObj,
    animationPaths,
    console.log,
  );

  const {
    gl: { domElement },
  } = useThree();

  const inputManager = useInputEventManager(domElement);
  const inputs = useKeyboardInput(inputManager);
  const animation = getAnimationFromUserInputs(inputs, canJump, pv < 50);

  useEffect(() => {
    // @ts-ignore
    actions?.[animation]?.stop().fadeIn(0.2).play();

    return () => {
      // @ts-ignore
      actions?.[animation]?.fadeOut(0.2);
    };
  }, [animation, actions]);

  useFrame((state, delta) => {
    /**
     * Getting all the useful keys from useKeyboardControls
     */
    const { up, down, right, left, run, jump } = inputs;

    // Getting moving directions
    if (up) {
      // Apply camera rotation to character model
      modelEuler.y = pivot.rotation.y;
    } else if (down) {
      // Apply camera rotation to character model
      modelEuler.y = pivot.rotation.y + Math.PI;
    } else if (left) {
      // Apply camera rotation to character model
      modelEuler.y = pivot.rotation.y + Math.PI / 2;
    } else if (right) {
      // Apply camera rotation to character model
      modelEuler.y = pivot.rotation.y - Math.PI / 2;
    }
    if (up && left) {
      // Apply camera rotation to character model
      modelEuler.y = pivot.rotation.y + Math.PI / 4;
    } else if (up && right) {
      // Apply camera rotation to character model
      modelEuler.y = pivot.rotation.y - Math.PI / 4;
    } else if (down && left) {
      // Apply camera rotation to character model
      modelEuler.y = pivot.rotation.y - Math.PI / 4 + Math.PI;
    } else if (down && right) {
      // Apply camera rotation to character model
      modelEuler.y = pivot.rotation.y + Math.PI / 4 + Math.PI;
    }

    // Move character to the moving direction
    if (up || down || left || right)
      moveCharacter(delta, run, slopeAngle, movingObjectVelocity);

    // Character current velocity
    currentVel.copy(characterRef.current.linvel());

    // Jump impulse
    if (jump && canJump) {
      // characterRef.current.applyImpulse(jumpDirection.set(0, 0.5, 0), true);
      characterRef.current.setLinvel(
        {
          x: currentVel.x,
          y: run ? sprintJumpMult * jumpVel : jumpVel,
          z: currentVel.z,
        },
        true,
      );
    }

    // Rotate character model
    modelQuat.setFromEuler(modelEuler);
    if (characterContainerRef.current) {
      characterContainerRef.current.quaternion.rotateTowards(
        modelQuat,
        delta * turnSpeed,
      );
    }

    /**
     *  Camera movement
     */
    pivotPosition.set(
      characterRef.current.translation().x,
      characterRef.current.translation().y + 0.5,
      characterRef.current.translation().z,
    );
    pivot.position.lerp(pivotPosition, 0.2);
    state.camera.lookAt(pivot.position);

    /**
     * Ray casting detect if on ground
     */
    const origin = characterRef.current.translation();
    const rayCast = new rapier.Ray(origin, rayDir);

    const rayHit = world.castRay(
      rayCast,
      rayLength,
      true,
      undefined,
      interactionGroups,
      characterRef.current,
    );

    if (rayHit && rayHit.toi < floatingDis + 0.1) {
      setCanJump(true);
    } else {
      setCanJump(false);
    }

    /**
     * Ray detect if on rigid body or dynamic platform, then apply the linear velocity and angular velocity to character
     */

    const collider = rayHit?.collider.parent();
    if (collider && canJump) {
      const rayHitObjectBodyType = collider.bodyType();
      // Body type 0 is rigid body, body type 1 is fixed body, body type 2 is kinematic body
      if (rayHitObjectBodyType === 0 || rayHitObjectBodyType === 2) {
        setIsOnMovingObject(true);
        // Calculate distance between character and moving object
        distanceFromCharacterToObject
          .copy(characterRef.current.translation())
          .sub(rayHit?.collider?.translation() as Vector3);
        // Moving object linear velocity
        const movingObjectLinvel = collider.linvel();
        // Moving object angular velocity
        const movingObjectAngvel = collider.angvel();
        // Combine object linear velocity and angular velocity to movingObjectVelocity
        movingObjectVelocity.set(
          movingObjectLinvel.x +
            objectAngvelToLinvel.crossVectors(
              movingObjectAngvel as Vector3,
              distanceFromCharacterToObject,
            ).x,
          movingObjectLinvel.y,
          movingObjectLinvel.z +
            objectAngvelToLinvel.crossVectors(
              movingObjectAngvel as Vector3,
              distanceFromCharacterToObject,
            ).z,
        );
      } else {
        setIsOnMovingObject(false);
        movingObjectVelocity.set(0, 0, 0);
      }
    }

    /**
     * Slope ray casting detect if on slope
     */

    slopeRayOriginRef?.current &&
      slopeRayOriginRef.current.getWorldPosition(slopeRayorigin);
    const slopeRayCast = new rapier.Ray(slopeRayorigin, slopeRayDir);
    const slopeRayHit = world.castRay(
      slopeRayCast,
      slopeRayLength,
      true,
      undefined,
      interactionGroups,
      characterRef.current,
    );

    // Calculate slope angle
    if (slopeRayHit && rayHit && slopeRayHit.toi < floatingDis + 0.5) {
      if (canJump) {
        slopeAngle = Math.atan(
          (rayHit.toi - slopeRayHit.toi) / slopeRayOriginOffest,
        );
      } else {
        slopeAngle = 0;
      }
    }

    /**
     * Apply floating force
     */
    const rayHitCollider = rayHit?.collider?.parent();

    if (rayHitCollider && !jump && canJump) {
      if (rayHit != null) {
        // console.log(rayHit.collider.castRayAndGetNormal(rayCast,rayLength,true).normal);
        const floatingForce =
          springK * (floatingDis - rayHit.toi) -
          characterRef.current.linvel().y * dampingC;
        characterRef.current.applyImpulse(
          springDirVec.set(0, floatingForce, 0),
        );

        // Apply opposite force to standing object
        characterMassForce.set(
          0,
          -characterRef.current.mass() * characterRef.current.gravityScale(),
          0,
        );

        rayHitCollider.applyImpulseAtPoint(
          characterMassForce,
          characterRef.current.translation(),
          true,
        );
      }
    }

    /**
     * Apply drag force if it's not moving
     */
    // not on a moving object
    if (!up && !down && !left && !right && canJump && !isOnMovingObject) {
      dragForce.set(
        -currentVel.x * dragDampingC,
        0,
        -currentVel.z * dragDampingC,
      );
      characterRef.current.applyImpulse(dragForce);
    }
    // on a moving object
    else if (!up && !down && !left && !right && canJump && isOnMovingObject) {
      dragForce.set(
        (movingObjectVelocity.x - currentVel.x) * dragDampingC * 2,
        0,
        (movingObjectVelocity.z - currentVel.z) * dragDampingC * 2,
      );
      characterRef.current.applyImpulse(dragForce, true);
    }
  });

  return (
    <Suspense fallback={<Loader />}>
      <RigidBody
        name="character"
        colliders={false}
        position={[0, 25, 0]}
        friction={-0.5}
        ref={characterRef}
        collisionGroups={interactionGroups}
      >
        <CapsuleCollider args={[0.35, 0.3]} />

        <group ref={characterContainerRef}>
          <mesh position={[0, 0, slopeRayOriginOffest]} ref={slopeRayOriginRef}>
            <boxGeometry args={[0.001, 0.001, 0.001]} />
          </mesh>
          <primitive
            object={characterObj}
            scale={0.01}
            position={[0, -0.78, 0]}
          ></primitive>
        </group>
      </RigidBody>
    </Suspense>
  );
}
