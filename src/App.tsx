import "./App.css";
import { Leva } from "leva";
import { Canvas } from "@react-three/fiber";
import Game from "./Components/Game.tsx";

function App() {
  return (
    <>
      <Leva collapsed />
      <Canvas
        shadows
        camera={{
          fov: 65,
          near: 0.1,
          far: 100,
          position: [0, 0, -1],
        }}
        onPointerDown={(e) => {
          // @ts-ignore
          e?.target?.requestPointerLock();
        }}
      >
        <Game />
      </Canvas>
    </>
  );
}

export default App;
