export interface IMovementDirection {
  up?: boolean;
  down?: boolean;
  right?: boolean;
  left?: boolean;
  isMouseLooking?: boolean;
  run?: boolean;
  jump?: boolean;
}
export const getAnimationFromUserInputs = (
  inputs: IMovementDirection,
  floored?: boolean,
) => {
  const { up, down, right, left, isMouseLooking, run } = inputs;

  if (!floored) {
    return "inAir";
  }

  if (up && !down) {
    if (run) {
      return "run";
    }
    return "walk";
  }

  if (down && !up) {
    return "walk";
  }

  if (!right && left) {
    return isMouseLooking ? "strafeLeft" : "walk";
  }

  if (!left && right) {
    return isMouseLooking ? "strafeRight" : "walk";
  }

  return "idle";
};
