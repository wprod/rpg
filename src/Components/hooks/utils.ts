export interface IMovementDirection {
  up?: boolean;
  down?: boolean;
  right?: boolean;
  left?: boolean;
  isMouseLooking?: boolean;
  run?: boolean;
  jump?: boolean;
  use?: boolean;
  die?: boolean;
}
export const getAnimationFromUserInputs = (
  inputs: IMovementDirection,
  floored?: boolean,
  injured?: boolean,
  pushing?: boolean,
) => {
  const { up, down, right, left, isMouseLooking, run } = inputs;
  const walk = injured ? "injuredWalk" : "walk";
  const idle = injured ? "injuredIdle" : "idle";

  if (!floored) {
    return "inAir";
  }

  if (up && !down) {
    if (run) {
      return "run";
    }

    if (pushing) {
      return "push";
    }

    return walk;
  }

  if (down && !up) {
    return walk;
  }

  if (!right && left) {
    return isMouseLooking ? "strafeLeft" : walk;
  }

  if (!left && right) {
    return isMouseLooking ? "strafeRight" : walk;
  }

  return idle;
};
