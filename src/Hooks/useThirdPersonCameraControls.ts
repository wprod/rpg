import * as THREE from "three";
import { useState, useEffect, DOMElement } from "react";

export interface ICameraOptions {
  yOffset?: number;
  minDistance?: number;
  maxDistance?: number;
  collisionFilterMask?: number;
  cameraCollisionOn?: boolean;
}

/*
 * Based on code written by knav.eth for chainspace (https://somnet.chainrunners.xyz/chainspace)
 */
const CameraControlOperation = {
  NONE: -1,
  ROTATE: 0,
  TOUCH_ROTATE: 3,
  TOUCH_ZOOM_ROTATE: 6,
};

const ROTATION_ANGLE = new THREE.Vector3(0, 1, 0);

class CameraState {
  operation = CameraControlOperation.NONE;
  pointers: any[] = [];
  pointerPositions: any = {};

  reset() {
    this.operation = CameraControlOperation.NONE;
    this.pointers = [];
    this.pointerPositions = {};
  }
}

class ThirdPersonCameraControls {
  enabled = true;
  // How far you can zoom in and out ( PerspectiveCamera only )
  minDistance = 0;
  maxDistance = Infinity;

  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  minPolarAngle = 0;
  maxPolarAngle = 1.5;
  enableZoom = true;
  zoomSpeed = 1.75;
  enableRotate = true;
  rotateSpeed = 1.0;

  // "target" sets the location of focus, where the object orbits around
  targetOffset = new THREE.Vector3(0, 0, 0);

  spherical = new THREE.Spherical(3.5, Math.PI / 3, Math.PI);

  rotateStart = new THREE.Vector2();
  rotateEnd = new THREE.Vector2();
  rotateDelta = new THREE.Vector2();

  zoomStart = new THREE.Vector2();
  zoomEnd = new THREE.Vector2();
  zoomDelta = new THREE.Vector2();

  outerCameraContainer = new THREE.Object3D();
  camera: THREE.Camera;
  cameraState: CameraState;
  cameraContainer: any;
  domElement: HTMLElement;
  input: {
    [x: string]: any;
    isMouseLooking?: any;
  };
  cameraCollisionOn: any;
  target: any;
  lastCheck?: number;
  rightClickTime?: number;

  constructor({
    camera,
    domElement,
    target,
    inputManager,
    options = {
      cameraCollisionOn: undefined,
      yOffset: 0,
    },
    cameraContainer,
  }: {
    camera: THREE.Camera;
    domElement: HTMLElement;
    target: any;
    inputManager: any;
    options: {
      cameraCollisionOn: undefined;
      yOffset: number;
    };
    cameraContainer: any;
  }) {
    this.camera = camera;
    this.cameraState = new CameraState();
    this.cameraContainer = cameraContainer;
    this.domElement = domElement;

    this.input = {};
    const k = "camera";
    inputManager.subscribe("wheel", k, this.handleMouseWheel.bind(this));
    inputManager.subscribe(
      "pointerlockchange",
      k,
      this.onPointerLockChange.bind(this)
    );
    inputManager.subscribe("pointerdown", k, this.onPointerDown.bind(this));
    inputManager.subscribe("pointerup", k, this.onPointerUp.bind(this));
    inputManager.subscribe("pointermove", k, this.onPointerMove.bind(this));
    inputManager.subscribe("pointercancel", k, this.onPointerCancel.bind(this));
    inputManager.subscribe("pointerlockerror", k, (e: any) =>
      console.error("POINTERLOCK ERROR ", e)
    );
    inputManager.subscribe("contextmenu", k, this.onContextMenu.bind(this));
    this.cameraCollisionOn = options?.cameraCollisionOn;
    this.targetOffset.y = options?.yOffset ?? 1.6;
    this.outerCameraContainer.position.copy(this.targetOffset);
    this.outerCameraContainer.add(this.cameraContainer);

    this.target = target;
    this.target.add(this.outerCameraContainer);
  }

  _cameraPos = new THREE.Vector3();
  _raycastTargetVector = new THREE.Vector3();

  getCameraPosition(rayResult: any) {
    this.cameraContainer.position.setFromSphericalCoords(
      this.spherical.radius,
      this.spherical.phi,
      this.spherical.theta
    );

    if (rayResult.hasHit && this.cameraCollisionOn) {
      this.cameraContainer.position.setFromSphericalCoords(
        rayResult.distance - 0.1,
        this.spherical.phi,
        this.spherical.theta
      );
    }

    this.cameraContainer.getWorldPosition(this._cameraPos);
    return this._cameraPos;
  }

  _workingVec = new THREE.Vector3();

  getCameraLookVec() {
    this.target.getWorldPosition(this._workingVec).add(this.targetOffset);
    return this._workingVec;
  }

  _workingQuat = new THREE.Quaternion();

  update(rayResult: any) {
    if (this.input.isMouseLooking) {
      this._workingQuat.setFromAxisAngle(
        ROTATION_ANGLE,
        this.spherical.theta - Math.PI
      );

      this.target.quaternion.multiply(this._workingQuat);
      this.spherical.theta = Math.PI;
    }

    // restrict phi to be between desired limits
    this.spherical.phi = Math.max(
      this.minPolarAngle,
      Math.min(this.maxPolarAngle, this.spherical.phi)
    );
    this.spherical.makeSafe();

    // restrict radius to be between desired limits
    this.spherical.radius = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.spherical.radius)
    );

    // copy maths to actual three.js camera
    this.camera.position.copy(this.getCameraPosition(rayResult));
    this.camera.lookAt(this.getCameraLookVec());
  }

  getZoomScale() {
    return 0.95 ** this.zoomSpeed;
  }

  rotateLeft(angle: number) {
    this.spherical.theta -= angle;
  }

  rotateUp(angle: number) {
    this.spherical.phi -= angle;
  }

  handleApplyRotate(speedMultiplier = 1) {
    this.rotateDelta
      .subVectors(this.rotateEnd, this.rotateStart)
      .multiplyScalar(this.rotateSpeed * speedMultiplier);

    const element = this.domElement;

    this.rotateLeft((2 * Math.PI * this.rotateDelta.x) / element.clientHeight); // yes, height

    this.rotateUp((2 * Math.PI * this.rotateDelta.y) / element.clientHeight);

    this.rotateStart.copy(this.rotateEnd);
  }

  zoomOut(zoomScale: number) {
    this.spherical.radius /= zoomScale;
  }

  zoomIn(zoomScale: number) {
    this.spherical.radius *= zoomScale;
  }

  // Event Handlers
  handleMouseDownRotate(event: any) {
    this.rotateEnd.set(event.clientX, event.clientY);
    this.rotateStart.set(event.clientX, event.clientY);
  }

  handleMouseMoveRotate(event: PointerEvent) {
    if (document.pointerLockElement === this.domElement) {
      this.rotateEnd.x += event.movementX * 0.25;
      if (this.camera.position.y > 1.5 || event.movementY > 0)
        // able to rotate
        this.rotateEnd.y += event.movementY * 0.25 * 0.8;
    } else {
      this.domElement.requestPointerLock();
      this.domElement.style.cursor = "none";
      this.rotateEnd.set(event.clientX, event.clientY);
    }
    this.handleApplyRotate();
  }
  handleMouseWheel(event: WheelEvent) {
    if (event.deltaY < 0) {
      this.zoomIn(this.getZoomScale());
    } else if (event.deltaY > 0) {
      this.zoomOut(this.getZoomScale());
    }
  }
  handleTouchStartRotate() {
    if (this.cameraState.pointers.length === 1) {
      this.rotateStart.set(
        this.cameraState.pointers[0].pageX,
        this.cameraState.pointers[0].pageY
      );
    } else {
      const x =
        0.5 *
        (this.cameraState.pointers[0].pageX +
          this.cameraState.pointers[1].pageX);
      const y =
        0.5 *
        (this.cameraState.pointers[0].pageY +
          this.cameraState.pointers[1].pageY);
      this.rotateStart.set(x, y);
    }
  }
  handleTouchStartZoom() {
    const dx =
      this.cameraState.pointers[0].pageX - this.cameraState.pointers[1].pageX;
    const dy =
      this.cameraState.pointers[0].pageY - this.cameraState.pointers[1].pageY;

    const distance = Math.sqrt(dx * dx + dy * dy);

    this.zoomStart.set(0, distance);
  }

  handleTouchStartZoomRotate() {
    if (this.enableZoom) this.handleTouchStartZoom();

    if (this.enableRotate) this.handleTouchStartRotate();
  }

  handleTouchMoveRotate(event: PointerEvent) {
    if (this.cameraState.pointers.length === 1) {
      this.rotateEnd.set(event.pageX, event.pageY);
    } else {
      const position = this.getSecondPointerPosition(event);

      const x = 0.5 * (event.pageX + position.x);
      const y = 0.5 * (event.pageY + position.y);

      this.rotateEnd.set(x, y);
    }

    this.handleApplyRotate(1.3);
  }

  handleTouchMoveZoom(event: PointerEvent) {
    const position = this.getSecondPointerPosition(event);

    const dx = event.pageX - position.x;
    const dy = event.pageY - position.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    this.zoomEnd.set(0, distance);

    this.zoomDelta.set(
      0,
      (this.zoomEnd.y / this.zoomStart.y) ** this.zoomSpeed
    );

    this.zoomOut(this.zoomDelta.y);

    this.zoomStart.copy(this.zoomEnd);
  }

  handleTouchMoveZoomRotate(event: PointerEvent) {
    if (this.enableZoom) this.handleTouchMoveZoom(event);
    if (this.enableRotate) this.handleTouchMoveRotate(event);
  }

  // Event Controllers
  onPointerDown(event: PointerEvent) {
    if (!this.enabled) return;

    if (this.cameraState.pointers.length === 0) {
      this.domElement.setPointerCapture(event.pointerId);
    }

    this.addPointer(event);
    if (event.pointerType === "touch") {
      this.onTouchStart(event);
    } else {
      this.onMouseDown(event);
    }
  }

  onPointerMove(event: PointerEvent) {
    this.lastCheck = Date.now();
    if (!this.enabled) return;
    if (!this.input.isMouseLocked && !this.cameraState.pointers.length) return;
    if (
      !this.cameraState.pointers.find((e) => e.pointerId === event.pointerId)
    ) {
      return;
    }

    if (event.pointerType === "touch") {
      this.onTouchMove(event);
    } else {
      this.onMouseMove(event);
    }
  }

  onPointerUp(event: PointerEvent) {
    if (event.pointerType === "touch") {
      this.onTouchEnd();
    } else {
      this.onMouseUp();
    }

    this.removePointer(event);

    if (
      this.cameraState.pointers.length === 0 &&
      event.pointerType === "touch"
    ) {
      this.domElement.releasePointerCapture(event.pointerId);
    }
  }

  // Touch
  onTouchStart(event: PointerEvent) {
    this.trackPointer(event);

    switch (this.cameraState.pointers.length) {
      case 1:
        if (!this.enableRotate) return;

        this.handleTouchStartRotate();
        this.input.isMouseLooking = true;
        this.cameraState.operation = CameraControlOperation.TOUCH_ROTATE;
        break;

      case 2:
        if (!this.enableZoom && !this.enableRotate) return;

        this.handleTouchStartZoomRotate();
        this.input.isMouseLooking = true;
        this.cameraState.operation = CameraControlOperation.TOUCH_ZOOM_ROTATE;
        break;

      default:
        this.cameraState.operation = CameraControlOperation.NONE;
    }
  }

  onTouchMove(event: PointerEvent) {
    this.trackPointer(event);

    switch (this.cameraState.operation) {
      case CameraControlOperation.TOUCH_ROTATE:
        if (!this.enableRotate) return;

        this.handleTouchMoveRotate(event);
        break;

      case CameraControlOperation.TOUCH_ZOOM_ROTATE:
        if (!this.enableZoom && !this.enableRotate) return;

        this.handleTouchMoveZoomRotate(event);
        break;

      default:
        this.cameraState.operation = CameraControlOperation.NONE;
    }
  }

  onTouchEnd() {
    this.cameraState.operation = CameraControlOperation.NONE;
  }

  // Mouse
  onPointerLockChange() {
    // do initial check to see if mouse is locked
    this.input.isMouseLocked = document.pointerLockElement === this.domElement;
    if (!this.input.isMouseLocked) {
      // wait 100ms and then check again as sometimes document.pointerLockElement
      // is null after doing a document.requestPointerLock()
      setTimeout(() => {
        this.input.isMouseLocked =
          document.pointerLockElement === this.domElement;
        if (!this.input.isMouseLocked) {
          this.input.isMouseLooking = false;
          this.cameraState.operation = CameraControlOperation.NONE;
        }
      }, 100);
    }
  }

  onMouseDown(event: PointerEvent) {
    switch (event.button) {
      case 0:
        if (!this.enableRotate) return;

        this.handleMouseDownRotate(event);
        this.cameraState.operation = CameraControlOperation.ROTATE;
        break;
      case 1:
        this.cameraState.operation = CameraControlOperation.NONE;
        break;
      case 2:
        if (!this.enableRotate) return;
        this.input.isMouseLooking = true;
        this.rightClickTime = Date.now();
        this.handleMouseDownRotate(event);
        this.cameraState.operation = CameraControlOperation.ROTATE;
        break;
      default:
        this.cameraState.operation = CameraControlOperation.NONE;
    }
  }

  onMouseMove(event: PointerEvent) {
    if (!this.enabled) return;

    if (this.cameraState.operation === CameraControlOperation.ROTATE) {
      if (!this.enableRotate) return;
      this.handleMouseMoveRotate(event);
    }
  }

  onMouseUp() {
    this.domElement.style.cursor = "initial";
    document.exitPointerLock();
    this.input.isMouseLooking = false;
  }

  onMouseWheel(event: WheelEvent) {
    if (
      !this.enabled ||
      !this.enableZoom ||
      (this.cameraState.operation !== CameraControlOperation.NONE &&
        this.cameraState.operation !== CameraControlOperation.ROTATE)
    ) {
      return;
    }
    this.handleMouseWheel(event);
  }

  // Pointer Utils
  getSecondPointerPosition(event: PointerEvent) {
    const pointer =
      event.pointerId === this.cameraState.pointers[0].pointerId
        ? this.cameraState.pointers[1]
        : this.cameraState.pointers[0];

    return this.cameraState.pointerPositions[pointer.pointerId];
  }

  addPointer(event: PointerEvent) {
    this.cameraState.pointers.push(event);
  }

  removePointer(event: PointerEvent) {
    delete this.cameraState.pointerPositions[event.pointerId];

    for (let i = 0; i < this.cameraState.pointers.length; i++) {
      if (this.cameraState.pointers[i].pointerId === event.pointerId) {
        this.cameraState.pointers.splice(i, 1);
        return;
      }
    }
  }

  trackPointer(event: PointerEvent) {
    let position = this.cameraState.pointerPositions[event.pointerId];

    if (position === undefined) {
      position = new THREE.Vector2();
      this.cameraState.pointerPositions[event.pointerId] = position;
    }

    position.set(event.pageX, event.pageY);
  }

  onPointerCancel(event: PointerEvent) {
    this.removePointer(event);
  }

  onContextMenu(event: PointerEvent) {
    if (!this.enabled) return;
    event.preventDefault();
  }

  reset() {
    this.cameraState.reset();
    this.domElement.style.cursor = "initial";
    try {
      document.exitPointerLock();
    } catch (e) {
      // lol
    }
  }

  dispose() {
    // remove event listeners here
  }
}

export interface IuseThirdPersonCameraControls {
  camera: THREE.Camera;
  domElement: HTMLElement;
  target: any;
  inputManager: any;
  cameraOptions: ICameraOptions;
  cameraContainer: any;
}

export default function useThirdPersonCameraControls({
  camera,
  domElement,
  target,
  inputManager,
  cameraOptions,
  cameraContainer,
}: IuseThirdPersonCameraControls) {
  const [controls, setControls] = useState<ThirdPersonCameraControls | null>(
    null
  );

  useEffect(() => {
    if (!target) {
      return;
    }
    const newControls = new ThirdPersonCameraControls({
      camera: camera,
      domElement: domElement,
      target: target,
      inputManager: inputManager,
      options: {
        yOffset: cameraOptions.yOffset || 0,
        cameraCollisionOn: undefined,
      },
      cameraContainer: cameraContainer.current,
    });

    newControls.minDistance = cameraOptions?.minDistance || 404;
    newControls.maxDistance = cameraOptions?.maxDistance || 808;
    setControls(newControls);
    return () => {
      newControls.dispose();
    };
  }, [camera, domElement, target]);

  return controls;
}
