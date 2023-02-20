import * as THREE from "three";
import { Vector3 } from "three";
import { IMovementDirection, IRotationDirection } from "./hooks.types";

function getAngleBetweenVectors(
  v1: Vector3,
  v2: Vector3,
  dotThreshold = 0.0005
) {
  let angle;
  const dot = v1.dot(v2);

  // If dot is close to 1, we'll round angle to zero
  if (dot > 1 - dotThreshold) {
    angle = 0;
  } else if (dot < -1 + dotThreshold) {
    // Dot too close to -1
    angle = Math.PI;
  } else {
    // Get angle difference in radians
    angle = Math.acos(dot);
  }

  return angle;
}

/**
 * Finds an angle between two vectors with a sign relative to normal vector
 */
function getSignedAngleBetweenVectors(
  v1: Vector3,
  v2: Vector3,
  normal = new THREE.Vector3(0, 1, 0),
  dotThreshold = 0.0005
) {
  let angle = getAngleBetweenVectors(v1, v2, dotThreshold);

  // Get vector pointing up or down
  const cross = new THREE.Vector3().crossVectors(v1, v2);
  // Compare cross with normal to find out direction
  if (normal.dot(cross) < 0) {
    angle = -angle;
  }

  return angle;
}

function getRotationDirection({
  left,
  right,
  isMouseLooking,
}: IRotationDirection) {
  let direction = 0;

  if (!isMouseLooking) {
    if (left) {
      direction = -1;
    }
    if (right) {
      direction = 1;
    }
  }
  return direction;
}

function getMovementDirection({
  up,
  down,
  right,
  left,
  isMouseLooking,
}: IMovementDirection) {
  const positiveX = isMouseLooking && right ? -1 : 0;
  const negativeX = isMouseLooking && left ? 1 : 0;
  const positiveZ = up ? 1 : 0;
  const negativeZ = down ? -1 : 0;

  return new THREE.Vector3(
    positiveX + negativeX,
    0,
    positiveZ + negativeZ
  ).normalize();
}

const FORWARD = new THREE.Vector3(0, 0, 1);

function getModelRotation(inputs: IMovementDirection) {
  const { up, down, right, left, isMouseLooking } = inputs;
  const movementDirection = getMovementDirection(inputs);
  let modelRotation = 0;

  if ((up || down) && !(down && up) && (left || right) && isMouseLooking) {
    const rotationDirection = getRotationDirection(inputs);
    const movementAngle = getSignedAngleBetweenVectors(
      movementDirection,
      FORWARD
    );

    if (up) {
      modelRotation =
        rotationDirection === 0
          ? -movementAngle
          : (Math.PI / 8) * rotationDirection * -1;
    } else if (down) {
      if (rotationDirection === 0) {
        if (movementDirection.x > 0) {
          modelRotation = Math.PI - movementAngle;
        } else if (movementDirection.x < 0) {
          modelRotation = Math.PI - movementAngle;
        }
      } else {
        modelRotation = (Math.PI / 8) * rotationDirection * -1;
      }
    }
  }

  return modelRotation;
}

export function inputMovementRotation(
  inputs: IRotationDirection & IMovementDirection
) {
  const direction = getRotationDirection(inputs);
  const rotation = getModelRotation(inputs);
  const movement = getMovementDirection(inputs);
  return { model: { direction, rotation }, movement };
}
