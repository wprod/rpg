export interface IMovementDirection {
  up?: boolean;
  down?: boolean;
  right?: boolean;
  left?: boolean;
  isMouseLooking?: boolean;
  run?: boolean;
  jump?: boolean;
}

export interface IRotationDirection {
  left?: boolean;
  right?: boolean;
  isMouseLooking?: boolean;
}

export interface ICharacterState {
  animation?: string;
  isJumping?: boolean;
  isLanding?: boolean;
  inAir?: boolean;
  isMoving?: boolean;
}
