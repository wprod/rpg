import { useState, useEffect } from "react";
import { IuseInputEventManager } from "./useInputEventManager";

type IKeyMap = Record<string, string>;

interface IKey {
  key: string;
}
interface IButton {
  button: number;
}

const defaultMap: IKeyMap = {
  up: "z",
  down: "s",
  right: "d",
  left: "q",
  jump: " ",
  run: "e",
};

const getInputFromKeyboard = (keyMap: IKeyMap, keyPressed: string) => {
  let inputFound = "";
  Object.entries(keyMap).forEach(([k, v]) => {
    if (v === keyPressed) {
      inputFound = k;
    }
  });
  return inputFound;
};

export function useKeyboardInput(
  inputManager: IuseInputEventManager,
  userKeyMap = {},
): {
  up: boolean;
  down: boolean;
  right: boolean;
  left: boolean;
  jump: boolean;
  run: boolean;
  isMouseLooking: boolean;
} {
  const [isMouseLooking, setIsMouseLooking] = useState(false);
  const [inputsPressed, setInputsPressed] = useState<{
    up: boolean;
    down: boolean;
    right: boolean;
    left: boolean;
    jump: boolean;
    run: boolean;
  }>({
    up: false,
    down: false,
    right: false,
    left: false,
    jump: false,
    run: false,
  });
  const keyMap = {
    ...defaultMap,
    ...userKeyMap,
  };

  function downHandler({ key }: IKey) {
    const input = getInputFromKeyboard(keyMap, key);
    if (input) {
      setInputsPressed((prevState) => ({
        ...prevState,
        [input]: true,
      }));
    }
  }

  const upHandler = ({ key }: IKey) => {
    const input = getInputFromKeyboard(keyMap, key);
    if (input) {
      setInputsPressed((prevState) => ({
        ...prevState,
        [input]: false,
      }));
    }
  };

  function pointerdownHandler({ button }: IButton) {
    if (button === 2) {
      setIsMouseLooking(true);
    }
  }

  const pointerupHandler = ({ button }: IButton) => {
    if (button === 2) {
      setIsMouseLooking(false);
    }
  };

  useEffect(() => {
    inputManager.subscribe("keydown", "character-controls", downHandler);
    inputManager.subscribe("keyup", "character-controls", upHandler);
    inputManager.subscribe(
      "pointerdown",
      "character-controls",
      pointerdownHandler,
    );
    inputManager.subscribe("pointerup", "character-controls", pointerupHandler);

    return () => {
      inputManager.unsubscribe("keydown", "character-controls");
      inputManager.unsubscribe("keyup", "character-controls");
      inputManager.unsubscribe("pointerdown", "character-controls");
      inputManager.unsubscribe("pointerup", "character-controls");
    };
  }, []);

  return { ...inputsPressed, isMouseLooking };
}
