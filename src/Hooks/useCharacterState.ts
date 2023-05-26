import { Triplet, useRaycastClosest } from "@react-three/cannon";
import { useEffect, useState } from "react";
import { ICharacterState, IMovementDirection } from "./hooks.types";
import { AnimationMixer } from "three";

const getAnimationFromUserInputs = (inputs: IMovementDirection) => {
  const { up, down, right, left, isMouseLooking, run } = inputs;

  if (up && !down) {
    if (run) {
      return "run";
    }
    return "walk";
  }

  if (down && !up) {
    return "backpedal";
  }

  if (!right && left) {
    return isMouseLooking ? "strafeLeft" : "turnLeft";
  }

  if (!left && right) {
    return isMouseLooking ? "strafeRight" : "turnRight";
  }

  return "idle";
};

export default function useCharacterState(
  inputs: IMovementDirection = {},
  position: Triplet,
  mixer?: AnimationMixer
) {
  const [characterState, setCharacterState] = useState<ICharacterState>({
    animation: "idle",
    isJumping: false,
    isLanding: false,
    inAir: false,
    isMoving: false,
  });

  const [jumpPressed, setJumpPressed] = useState<boolean | undefined>(false);
  const [landed, setLanded] = useState(false);

  const { up, down, right, left, jump, isMouseLooking, run } = inputs;
  const { isJumping, inAir, isLanding } = characterState;

  useEffect(() => {
    setJumpPressed(jump);
    setLanded(false);
  }, [jump]);

  const rayFrom: Triplet = [position[0], position[1], position[2]];
  const rayTo: Triplet = [position[0], position[1] - 0.25, position[2]]; // SHOULD BE RELATED TO CHARACTER SIZE

  useRaycastClosest(
    {
      from: rayFrom,
      to: rayTo,
      skipBackfaces: true,
    },
    (e) => {
      if (e.hasHit && !landed) {
        setLanded(true);
      }
    },
    [position]
  );

  useEffect(() => {
    if (inAir && landed) {
      setCharacterState((prevState) => ({
        ...prevState,
        inAir: false,
        animation: "landing",
        isLanding: true,
      }));
    }
  }, [landed, inAir]);

  useEffect(() => {
    setCharacterState((prevState) => ({
      ...prevState,
      isMoving: up || down || left || right,
    }));
  }, [up, down, left, right]);

  useEffect(() => {
    if (isJumping || inAir) {
      return;
    }

    const newState = {
      animation: getAnimationFromUserInputs(inputs),
      isJumping: false,
    };

    if (jump && !jumpPressed) {
      newState.animation = "jump";
      newState.isJumping = true;
    }

    if (jumpPressed || inAir) {
      newState.isJumping = false;
    }

    // let landing animation playout if we're still landing
    if (isLanding && newState.animation === "idle") {
      return;
    }

    setCharacterState((prevState) => ({
      ...prevState,
      isLanding: false,
      ...newState,
    }));
  }, [up, down, left, right, jump, isMouseLooking, isJumping, inAir]);

  useEffect(() => {
    const checker = () => {
      setCharacterState((prevState) => ({
        ...prevState,
        isJumping: false,
        inAir: true,
        animation: "inAir",
      }));
    };

    if (characterState.isJumping) {
      // play 200ms of jump animation then transition to inAir
      setTimeout(checker, 200);
    }

    return () => {
      // @ts-ignore
      clearTimeout(checker);
    };
  }, [characterState.isJumping]);

  useEffect(() => {
    if (!mixer) {
      return;
    }

    const onMixerFinish = () => {
      /*setCharacterState((prevState) => ({
        ...prevState,
        isJumping: false,
        inAir: false,
        isLanding: false,
        animation: "idle",
      }));*/
    };

    mixer.addEventListener("finished", onMixerFinish);

    return () => {
      mixer.removeEventListener("finished", onMixerFinish);
    };
  }, [mixer]);

  return characterState;
}
