import { Group, Vector3 } from "three";

export default class Bullet {
  public readonly group: Group;
  private readonly velocity = new Vector3();

  private isDead = false;

  constructor(group: Group) {
    this.group = group;

    setTimeout(() => {
      this.isDead = true;
    }, 1000)
  }

  get shouldGetRemoved(): Boolean {
    return this.isDead
  }

  get position(): Vector3 {
    return this.group.position;
  }

  set dead(value: boolean) {
    this.isDead = value;
  }

  setVelocity(x: number, y: number, z: number) {
    this.velocity.set(x, y, z);
  }

  update() {
    this.group.position.x += this.velocity.x;
    this.group.position.y += this.velocity.y;
    this.group.position.z += this.velocity.z;
  }

}