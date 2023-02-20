import { useState, useRef, Ref, RefObject } from "react";
import { Triplet, useRaycastClosest } from "@react-three/cannon";
import { Vector3 } from "three";

interface IuseRay {
  rayVector: RefObject<Vector3>;
  position: Triplet;
  collisionFilterMask?: any;
}
export default function useRay({
  rayVector,
  position,
  collisionFilterMask,
}: IuseRay) {
  const rayChecker = useRef(setTimeout);
  const from: [number, number, number] = [
    position[0],
    position[1],
    position[2],
  ];
  const to: [number, number, number] = [
    rayVector?.current?.x ?? 0,
    rayVector?.current?.y ?? 0,
    rayVector?.current?.z ?? 0,
  ];

  const [ray, setRay] = useState({});
  useRaycastClosest(
    {
      from,
      to,
      skipBackfaces: true,
      collisionFilterMask,
    },
    (e) => {
      // @ts-ignore
      clearTimeout(rayChecker.current);
      setRay({
        hasHit: e.hasHit,
        distance: e.distance,
      });
      // this callback only fires constantly on collision so this
      // timeout resets state once we've stopped colliding
      // @ts-ignore
      rayChecker.current = setTimeout(() => {
        setRay({});
      }, 100);
    },
    [from, to]
  );

  return ray;
}
