export const defaultCharacterSettings = {
  maxVelLimit: {
    value: 5,
    min: 0,
    max: 10,
    step: 0.01,
  },
  turnVelMultiplier: {
    value: 0.1,
    min: 0,
    max: 1,
    step: 0.01,
  },
  turnSpeed: {
    value: 10,
    min: 5,
    max: 30,
    step: 0.1,
  },
  sprintMult: {
    value: 1.5,
    min: 1,
    max: 3,
    step: 0.01,
  },
  jumpVel: {
    value: 4,
    min: 0,
    max: 10,
    step: 0.01,
  },
  sprintJumpMult: {
    value: 1.2,
    min: 1,
    max: 3,
    step: 0.01,
  },
  airDragMultiplier: {
    value: 0.01,
    min: 0,
    max: 1,
    step: 0.01,
  },
  dragDampingC: {
    value: 0.05,
    min: 0,
    max: 0.5,
    step: 0.01,
  },
  accDeltaTime: {
    value: 8,
    min: 0,
    max: 50,
    step: 1,
  },
};

export const defaultRaySettings = {
  rayLength: {
    value: 1.5,
    min: 0,
    max: 3,
    step: 0.01,
  },
  rayDir: { x: 0, y: -1, z: 0 },
  floatingDis: {
    value: 0.8,
    min: 0,
    max: 2,
    step: 0.01,
  },
  springK: {
    value: 3,
    min: 0,
    max: 5,
    step: 0.01,
  },
  dampingC: {
    value: 0.2,
    min: 0,
    max: 3,
    step: 0.01,
  },
};

export const defaultSlopeSettings = {
  slopeRayOriginOffest: {
    value: 0.28,
    min: 0,
    max: 3,
    step: 0.01,
  },
  slopeRayLength: {
    value: 1.5,
    min: 0,
    max: 3,
    step: 0.01,
  },
  slopeRayDir: { x: 0, y: -1, z: 0 },
  slopeUpExtraForce: {
    value: 1.5,
    min: 0,
    max: 5,
    step: 0.01,
  },
  slopeDownExtraForce: {
    value: 4,
    min: 0,
    max: 5,
    step: 0.01,
  },
};
