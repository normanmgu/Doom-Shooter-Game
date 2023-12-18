import * as THREE from "three";
import BlasterScene from "./BlasterScene";

const WIDTH = window.innerHeight;
const HEIGHT = window.innerHeight;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("app") as HTMLCanvasElement
});

// Configure renderer settings
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// params: FOV, aspect ratio, near plane, far plane
const mainCamera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 0.1, 100)

// const controls = new OrbitControls(mainCamera, renderer.domElement);

let scene = new BlasterScene(mainCamera);
scene.init()

document.getElementById("restartButton")
  ?.addEventListener("click", () =>{
    console.log("Should restart")
    scene.restart();
  })


function tick() {
  scene.update();
  // controls.update()
  renderer.render(scene, mainCamera);
  requestAnimationFrame(tick);
}

tick();