import { Group, Vector3 } from "three";

export default class Target {
  public readonly group: Group;

  constructor(group: Group) {
    this.group = group;
  }

  shouldGetRemoved(bulletPosition: Vector3) {

    if (bulletPosition == this.group.position) {
      return true;
    }
    else false;
  }

  get position(): Vector3 {
    return this.group.position;
  }

  get visible(): boolean {
    return this.group.visible;
  }

  set visible(value: boolean) {
    this.group.visible = value
  }
}