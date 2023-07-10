import { useEffect, useRef } from "react";
import { BufferGeometry, Float32BufferAttribute, Mesh } from "three";
import { Triplet, useHeightfield } from "@react-three/cannon";

type GenerateHeightmapArgs = {
  height: number;
  number: number;
  scale: number;
  width: number;
};

/* Generates a 2D array using Worley noise. */
export function generateHeightmap({
  width,
  height,
  number,
  scale,
}: GenerateHeightmapArgs) {
  const data = [];

  const seedPoints = [];
  for (let i = 0; i < number; i++) {
    seedPoints.push([Math.random(), Math.random()]);
  }

  let max = 0;
  for (let i = 0; i < width; i++) {
    const row = [];
    for (let j = 0; j < height; j++) {
      let min = Infinity;
      seedPoints.forEach((p) => {
        const distance2 = (p[0] - i / width) ** 2 + (p[1] - j / height) ** 2;
        if (distance2 < min) {
          min = distance2;
        }
      });
      const d = Math.sqrt(min);
      if (d > max) {
        max = d;
      }
      row.push(d);
    }
    data.push(row);
  }

  /* Normalize and scale. */
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      data[i][j] *= scale / max;
    }
  }
  return data;
}

export function HeightmapGeometry({
  elementSize,
  heights,
}: {
  elementSize: number;
  heights: number[][];
}): JSX.Element {
  const ref = useRef<BufferGeometry>(null);

  useEffect(() => {
    if (!ref.current) return;
    const dx = elementSize;
    const dy = elementSize;

    /* Create the vertex data from the heights. */
    const vertices = heights.flatMap((row, i) =>
      row.flatMap((z, j) => [i * dx, j * dy, z])
    );

    /* Create the faces. */
    const indices = [];
    for (let i = 0; i < heights.length - 1; i++) {
      for (let j = 0; j < heights[i].length - 1; j++) {
        const stride = heights[i].length;
        const index = i * stride + j;
        indices.push(index + 1, index + stride, index + stride + 1);
        indices.push(index + stride, index + 1, index);
      }
    }

    ref.current.setIndex(indices);
    ref.current.setAttribute(
      "position",
      new Float32BufferAttribute(vertices, 3)
    );
    ref.current.computeVertexNormals();
    ref.current.computeBoundingBox();
    ref.current.computeBoundingSphere();
  }, [heights]);

  return <bufferGeometry ref={ref} />;
}

export function Heightfield({
  elementSize,
  heights,
  position,
  rotation,
}: {
  elementSize: number;
  heights: number[][];
  position: Triplet;
  rotation: Triplet;
}): JSX.Element {
  const [ref] = useHeightfield(
    () => ({
      args: [
        heights,
        {
          elementSize,
        },
      ],
      mass: 0,
      material: {
        friction: 0,
        name: "wall",
      },
      collisionFilterGroup: 2,
      position,
      rotation,
    }),
    useRef<Mesh>(null)
  );

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <meshPhongMaterial color={"#ffb500"} />
      <HeightmapGeometry heights={heights} elementSize={elementSize} />
    </mesh>
  );
}
