import { useState, useEffect } from "react";

export interface IuseInputEventManager {
  subscribe: (eventName: string, key: string, subscribeFn: Function) => void;
  unsubscribe: (eventName: string, key: string) => void;
}
export default function useInputEventManager(
  container: HTMLCanvasElement
): IuseInputEventManager {
  const [subscriptions, setSubscriptions] = useState<Record<string, any>>({});

  const subscribe = (eventName: string, key: string, subscribeFn: Function) => {
    setSubscriptions((prevState) => ({
      ...prevState,
      [eventName]: {
        ...prevState[eventName],
        [key]: subscribeFn,
      },
    }));
  };

  const unsubscribe = (eventName: string, key: string) => {
    setSubscriptions((prevState) => {
      delete prevState?.[eventName]?.[key];
      return prevState;
    });
  };

  const makeEventHandler = (eventName: string) => (event: any) => {
    const handlers = subscriptions[eventName] ?? {};
    const subscribers = Object.values(handlers);
    subscribers.forEach((sub: any) => sub(event));
  };

  const keydownHandler = makeEventHandler("keydown");
  const keyupHandler = makeEventHandler("keyup");
  const wheelHandler = makeEventHandler("wheel");
  const pointerdownHandler = makeEventHandler("pointerdown");
  const pointerupHandler = makeEventHandler("pointerup");
  const pointermoveHandler = makeEventHandler("pointermove");
  const pointercancelHandler = makeEventHandler("pointercancel");
  const pointerlockchangeHandler = makeEventHandler("pointerlockchange");
  const pointerlockerrorHandler = makeEventHandler("pointerlockerror");
  const contextmenuHandler = makeEventHandler("contextmenu");

  const setupEventListeners = () => {
    window.addEventListener("keydown", keydownHandler);
    window.addEventListener("keyup", keyupHandler);

    container.addEventListener("wheel", wheelHandler);
    container.addEventListener("pointerdown", pointerdownHandler);
    container.addEventListener("pointerup", pointerupHandler);
    container.addEventListener("pointermove", pointermoveHandler);
    container.addEventListener("pointercancel", pointercancelHandler);
    container.addEventListener("contextmenu", contextmenuHandler);

    document.addEventListener("pointerlockchange", pointerlockchangeHandler);
    document.addEventListener("pointerlockerror", pointerlockerrorHandler);

    return () => {
      window.removeEventListener("keydown", keydownHandler);
      window.removeEventListener("keyup", keyupHandler);

      container.removeEventListener("wheel", wheelHandler);
      container.removeEventListener("pointerdown", pointerdownHandler);
      container.removeEventListener("pointerup", pointerupHandler);
      container.removeEventListener("pointermove", pointermoveHandler);
      container.removeEventListener("pointercancel", pointercancelHandler);
      container.removeEventListener("contextmenu", contextmenuHandler);

      document.removeEventListener(
        "pointerlockchange",
        pointerlockchangeHandler
      );
      document.removeEventListener("pointerlockerror", pointerlockerrorHandler);
    };
  };

  useEffect(setupEventListeners, [subscriptions, container]);

  return {
    subscribe,
    unsubscribe,
  };
}
