import { Vector3 } from "three";

/**
 * Scalar function. Calculates distance between two vectors
 */
const calcDistance = (a: Vector3, b: Vector3) => {
    const dx = Math.pow(a.x - b.x, 2);
    const dy = Math.pow(a.y - b.y, 2);
    const dz = Math.pow(a.z - b.z, 2);

    return Math.sqrt(dx + dy + dz);
}

export default calcDistance;