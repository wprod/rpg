import { shaderMaterial } from "@react-three/drei";
import { extend, ReactThreeFiber, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Color, Vector2 } from "three";
import { useControls } from "leva";

const CustomMaterial = shaderMaterial(
  {
    uTime: 0,
    uBigWavesElevation: 5.32,
    uBigWavesFrequency: new Vector2(10, 10),
    uBigWavesSpeed: 0.35,

    uSmallWavesElevation: 1,
    uSmallWavesFrequency: 0.51,
    uSmallWavesSpeed: 0.5,
    uSmallIterations: 2,

    uDepthColor: new Color("#503b85"),
    uSurfaceColor: new Color("#8a7fea"),
    uColorOffset: 1.08,
    uColorMultiplier: 7,
  },
  `
    uniform float uTime;
    uniform float uBigWavesElevation;
    uniform vec2 uBigWavesFrequency;
    uniform float uBigWavesSpeed;
    
    uniform float uSmallWavesElevation;
    uniform float uSmallWavesFrequency;
    uniform float uSmallWavesSpeed;
    uniform float uSmallIterations;
    
    varying float vElevation;
    
    // Classic Perlin 3D Noise 
    // by Stefan Gustavson
    //
    vec4 permute(vec4 x)
    {
        return mod(((x*34.0)+1.0)*x, 289.0);
    }
    vec4 taylorInvSqrt(vec4 r)
    {
        return 1.79284291400159 - 0.85373472095314 * r;
    }
    vec3 fade(vec3 t)
    {
        return t*t*t*(t*(t*6.0-15.0)+10.0);
    }

    float cnoise(vec3 P)
    {
        vec3 Pi0 = floor(P); // Integer part for indexing
        vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
        Pi0 = mod(Pi0, 289.0);
        Pi1 = mod(Pi1, 289.0);
        vec3 Pf0 = fract(P); // Fractional part for interpolation
        vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;
    
        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);
    
        vec4 gx0 = ixy0 / 7.0;
        vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    
        vec4 gx1 = ixy1 / 7.0;
        vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    
        vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
        vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
        vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
        vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
        vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
        vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
        vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
        vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
    
        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
        g000 *= norm0.x;
        g010 *= norm0.y;
        g100 *= norm0.z;
        g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
        g001 *= norm1.x;
        g011 *= norm1.y;
        g101 *= norm1.z;
        g111 *= norm1.w;
    
        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n111 = dot(g111, Pf1);
    
        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
        return 2.2 * n_xyz;
    }

    void main()
    {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    
        // Elevation
        float elevation = sin(modelPosition.x * uBigWavesFrequency.x + uTime * uBigWavesSpeed) *
                          sin(modelPosition.z * uBigWavesFrequency.y + uTime * uBigWavesSpeed) *
                          uBigWavesElevation;
    
        for(float i = 1.0; i <= uSmallIterations; i++)
        {
            elevation -= abs(cnoise(vec3(modelPosition.xz * uSmallWavesFrequency * i, uTime * uSmallWavesSpeed)) * uSmallWavesElevation / i);
        }
        
        modelPosition.y += elevation;
    
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;
        gl_Position = projectedPosition;
    
        vElevation = elevation;
    }
`,
  `
    uniform vec3 uDepthColor;
    uniform vec3 uSurfaceColor;
    uniform float uColorOffset;
    uniform float uColorMultiplier;
    
    varying float vElevation;
    
    void main()
    {
        float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
        vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
        
        gl_FragColor = vec4(color, 1.0);
    }
  `,
);

extend({ CustomMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      customMaterial: ReactThreeFiber.Object3DNode<any, any>;
    }
  }
}

// shaderMaterial creates a THREE.ShaderMaterial, and auto-creates uniform setter/getters
// extend makes it available in JSX, in this case <portalMaterial />

export default function RagingSea(props: any) {
  const material = useRef(null);

  useFrame((_state, delta) => {
    // @ts-ignore
    if (material?.current) {
      // @ts-ignore
      material.current.uTime += delta;
    }
  });

  const {
    uBigWavesElevation,
    uBigWavesSpeed,

    uSmallWavesElevation,
    uSmallWavesFrequency,
    uSmallWavesSpeed,
    uSmallIterations,

    uColorOffset,
    uColorMultiplier,
  } = useControls("Sea", {
    uBigWavesElevation: {
      value: 2.66,
      min: 0,
      max: 8,
      step: 0.01,
    },
    uBigWavesSpeed: {
      value: 0.18,
      min: 0,
      max: 3,
      step: 0.01,
    },

    uSmallWavesElevation: {
      value: 0.9,
      min: 0,
      max: 10,
      step: 0.01,
    },
    uSmallWavesFrequency: {
      value: 0.28,
      min: 0,
      max: 3,
      step: 0.01,
    },
    uSmallWavesSpeed: {
      value: 0.2,
      min: 0,
      max: 3,
      step: 0.01,
    },
    uSmallIterations: {
      value: 4.37,
      min: 0,
      max: 10,
      step: 0.01,
    },

    uColorOffset: {
      value: 1.9,
      min: 0,
      max: 3,
      step: 0.01,
    },
    uColorMultiplier: {
      value: 1.1,
      min: 0,
      max: 10,
      step: 0.01,
    },
  });

  return (
    <group {...props} dispose={null}>
      <mesh rotation-x={-Math.PI / 2}>
        <customMaterial
          ref={material}
          uBigWavesElevation={uBigWavesElevation}
          uBigWavesSpeed={uBigWavesSpeed}
          uSmallWavesElevation={uSmallWavesElevation}
          uSmallWavesFrequency={uSmallWavesFrequency}
          uSmallWavesSpeed={uSmallWavesSpeed}
          uSmallIterations={uSmallIterations}
          uColorOffset={uColorOffset}
          uColorMultiplier={uColorMultiplier}
          uBigWavesFrequency={new Vector2(0.125, 0.125)}
        />
        <planeGeometry args={[50, 50, 512, 512]} />
      </mesh>
    </group>
  );
}
