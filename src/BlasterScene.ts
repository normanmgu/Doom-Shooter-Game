import * as THREE from "three";

import Bullet from "./Bullet";
import Target from "./Target";

import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import calcDistance from "./utils/calcDistance";

export default class BlasterScene extends THREE.Scene {
  private readonly mtlLoader = new MTLLoader();
  private readonly objLoader = new OBJLoader();

  private readonly camera: THREE.PerspectiveCamera;
  private readonly keyDown = new Set<string>();

  private blaster?: THREE.Group;
  private bulletMtl?: MTLLoader.MaterialCreator;
  private targetMtl?: MTLLoader.MaterialCreator;

  private directionVector = new THREE.Vector3();

  private bullets: Bullet[] = [];
  private targets: Target[] = [];

  constructor(camera: THREE.PerspectiveCamera) {
    super();

    this.camera = camera;
  }

  async init() {
    // const gridHelper = new THREE.GridHelper(200, 50);
    // this.add(gridHelper);
    // var axesHelper = new THREE.AxesHelper( 5 );
    // this.add( axesHelper );
    const groundTexture = new THREE.TextureLoader().load("assets/grass.jpg");
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    const textureRepeat = 70; // Adjust this value to control the repetition
    groundTexture.repeat.set(textureRepeat, textureRepeat);
    const groundMaterial = new THREE.MeshBasicMaterial({
      map: groundTexture
    });
    const groundGeometry = new THREE.PlaneGeometry(200,200);
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial)
    groundMesh.rotation.x = -Math.PI / 2;
    this.add(groundMesh);

    // load shared MTL (Material Template Library) for the targets
    this.targetMtl = await this.mtlLoader.loadAsync("assets/targetA.mtl");
    this.targetMtl.preload();
    this.bulletMtl = await this.mtlLoader.loadAsync("assets/foamBulletB.mtl");
    this.bulletMtl.preload();

    this.createTarget(-1, 0.3, -3);
    this.createTarget(1, 0.3, -3);
    this.createTarget(2, 0.3, -3);
    this.createTarget(3, 0.3, -4);

    this.blaster = await this.createBlaster();
    this.add(this.blaster);

    this.blaster.position.z = 0;
    this.blaster.add(this.camera);

    this.camera.position.z = 1;
    this.camera.position.y = 0.5;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 4, 2);

    this.add(light);

    this.generateRandomTargets(5)

    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    this.keyDown.add(event.key.toLowerCase());
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    this.keyDown.delete(event.key.toLowerCase());

    if (event.key == " ") {
      this.createBullet();
    }
  };

  private async createPoint(x: number, y: number, z: number, color: string) {
    const geometry = new THREE.SphereGeometry(0.025, 20, 20);
    const material = new THREE.MeshStandardMaterial({ color: color });
    const point = new THREE.Mesh(geometry, material);
    point.position.set(x, y, z);

    this.add(point);
  }

  private async createTarget(x: number, y: number, z: number) {
    console.log("ct callwed");
    if (this.targetMtl) {
      this.objLoader.setMaterials(this.targetMtl);
    }

    const targetModel = await this.objLoader.loadAsync("assets/targetA.obj");
    //targetModel.rotateY(Math.PI * 0.5)
    targetModel.position.x = x;
    targetModel.position.y = y;
    targetModel.position.z = z;

    targetModel.children.forEach((child) => child.rotateY(Math.PI * 0.5));
    this.add(targetModel);

    const target = new Target(targetModel);
    this.targets.push(target);
  }

  public generateRandomTargets(n: number) {
    const minX = -8;
    const maxX = 8;
    const minZ = -20;
    const maxZ = -10;
  
    for (let i = 0; i < n; i++) {
      const randomX = Math.random() * (maxX - minX) + minX;
      const randomZ = Math.random() * (maxZ - minZ) + minZ;
      const Y = 0.3; // You can set the desired Y position
  
      this.createTarget(randomX, Y, randomZ);
    }
  }

  private async createBlaster() {
    const mtl = await this.mtlLoader.loadAsync("assets/blasterG.mtl");
    mtl.preload();

    this.objLoader.setMaterials(mtl);
    const modelRoot = await this.objLoader.loadAsync("assets/blasterG.obj");

    return modelRoot;
  }

  private async createBullet() {
    if (!this.blaster) {
      return;
    }
    if (this.bulletMtl) {
      this.objLoader.setMaterials(this.bulletMtl);
    }

    const bulletModel = await this.objLoader.loadAsync(
      "assets/foamBulletB.obj"
    );

    this.camera.getWorldDirection(this.directionVector);

    // Get size of blaster using Axis Aligned Bounding Box
    const aabb = new THREE.Box3().setFromObject(this.blaster);
    const size = aabb.getSize(new THREE.Vector3()); // Gets width length and Height of blaster in size vector

    const vec = this.blaster.position.clone();
    vec.y += 0.3;

    bulletModel.position.add(
      vec.add(this.directionVector.clone().multiplyScalar(size.z * 0.0001))
    );

    // rotate children to match gun for simplicity
    bulletModel.children.forEach((child) => child.rotateX(Math.PI * -0.5));

    // use the same rotation as the gun
    bulletModel.rotation.copy(this.blaster.rotation);
    this.add(bulletModel);

    const b = new Bullet(bulletModel);
    b.setVelocity(
      this.directionVector.x * 0.1,
      this.directionVector.y * 0.1,
      this.directionVector.z * 0.1
    );

    this.bullets.push(b);
  }
  

  private updateBullets() {
    for (let i = 0; i < this.bullets.length; ++i) {
      const b = this.bullets[i];
      b.update();
      console.log(b.position);

      if (b.shouldGetRemoved) {
        this.remove(b.group);
        this.bullets.splice(i, 1);
        i--;
      }

      for (let target of this.targets) {

        const tolerance = 0.25
        if (calcDistance(target.position, b.position) < tolerance && target.visible) {
          target.visible = false;
          b.dead = true; // maks sure \bullet is destroyed after hitting target
        }

      }

    }
  }

  private updateInput() {
    if (!this.blaster) return;

    const shiftKey = this.keyDown.has("shift");

    if (!shiftKey) {
      if (this.keyDown.has("a") || this.keyDown.has("arrorleft")) {
        this.blaster.rotateY(0.02);
      } else if (this.keyDown.has("d") || this.keyDown.has("arrowright")) {
        this.blaster.rotateY(-0.02);
      }
    }

    const dir = this.directionVector;

    this.camera.getWorldDirection(dir);

    const speed = 0.1;

    if (this.keyDown.has("w") || this.keyDown.has("arrowup")) {
      this.blaster.position.add(dir.clone().multiplyScalar(speed));
    } else if (this.keyDown.has("s") || this.keyDown.has("arrowdown")) {
      this.blaster.position.add(dir.clone().multiplyScalar(-speed));
    }

    if (shiftKey) {
      const strafeDir = dir.clone();
      const upVector = new THREE.Vector3(0, 1, 0);

      if (this.keyDown.has("a") || this.keyDown.has("arrorleft")) {
        this.blaster.position.add(
          strafeDir
            .applyAxisAngle(upVector, Math.PI * 0.5)
            .multiplyScalar(speed)
        );
      } else if (this.keyDown.has("d") || this.keyDown.has("arrowRight")) {
        this.blaster.position.add(
          strafeDir
            .applyAxisAngle(upVector, Math.PI * -0.5)
            .multiplyScalar(speed)
        );
      }
    }
  }


  public restart() {
    this.camera.position.z = 1;
    this.camera.position.y = 0.5;
    if (this.blaster) {
      this.blaster.position.set(0, 0, 0);
      this.blaster.rotation.set(0, 0, 0);
    }
    this.generateRandomTargets(5)
  }

  public update() {
    this.updateInput();
    this.updateBullets();
  }
}
