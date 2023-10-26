import { shaderMaterial } from "@react-three/drei";
import { extend, ReactThreeFiber } from "@react-three/fiber";
import { vertex } from "./vertex.ts";
import { fragment } from "./fragment.ts";
import * as THREE from "three";

export const customToonUniforms = {
  ...THREE.UniformsUtils.merge([THREE.UniformsLib["lights"]]),
  uGlossiness: 20,
  uColor: new THREE.Color("#fff"),
};

export const ToonMaterial = shaderMaterial(
  customToonUniforms,
  vertex,
  fragment,
);

extend({ ToonMaterial: ToonMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      toonMaterial: ReactThreeFiber.Object3DNode<any, any>;
    }
  }
}
