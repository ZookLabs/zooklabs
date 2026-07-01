import * as THREE from "three";

export function boxUnion(
  xMin1: number,
  yMin1: number,
  zMin1: number,
  xMax1: number,
  yMax1: number,
  zMax1: number,
  xMin2: number,
  yMin2: number,
  zMin2: number,
  xMax2: number,
  yMax2: number,
  zMax2: number
): [number, number, number, number, number, number] {
  return [
    Math.min(xMin1, xMin2),
    Math.min(yMin1, yMin2),
    Math.min(zMin1, zMin2),
    Math.max(xMax1, xMax2),
    Math.max(yMax1, yMax2),
    Math.max(zMax1, zMax2),
  ];
}

export function nodeBoundingBox(
  node: THREE.Object3D
): [number, number, number, number, number, number] {
  // Ensure world matrices are up to date
  // node.updateMatrixWorld(true);

  // Compute the local bounding box of this object (including geometry)
  const box = new THREE.Box3().setFromObject(node);

  // If the object has no geometry, fallback to a unit cube at the origin
  if (!box.isEmpty()) {
    // Get all 8 corners of the bounding box in local space
    const corners = [
      new THREE.Vector3(box.min.x, box.min.y, box.min.z),
      new THREE.Vector3(box.min.x, box.min.y, box.max.z),
      new THREE.Vector3(box.min.x, box.max.y, box.min.z),
      new THREE.Vector3(box.min.x, box.max.y, box.max.z),
      new THREE.Vector3(box.max.x, box.min.y, box.min.z),
      new THREE.Vector3(box.max.x, box.min.y, box.max.z),
      new THREE.Vector3(box.max.x, box.max.y, box.min.z),
      new THREE.Vector3(box.max.x, box.max.y, box.max.z),
    ];

    // Transform corners to world space
    for (const v of corners) {
      v.applyMatrix4(node.matrixWorld);
    }

    // Find min/max in world space
    let xMin = corners[0].x,
      yMin = corners[0].y,
      zMin = corners[0].z;
    let xMax = corners[0].x,
      yMax = corners[0].y,
      zMax = corners[0].z;
    for (const v of corners) {
      xMin = Math.min(xMin, v.x);
      yMin = Math.min(yMin, v.y);
      zMin = Math.min(zMin, v.z);
      xMax = Math.max(xMax, v.x);
      yMax = Math.max(yMax, v.y);
      zMax = Math.max(zMax, v.z);
    }

    // Recurse into children with element_type === "bodysolid"
    for (const child of node.children) {
      const [cxMin, cyMin, czMin, cxMax, cyMax, czMax] = nodeBoundingBox(child);
      [xMin, yMin, zMin, xMax, yMax, zMax] = boxUnion(
        xMin,
        yMin,
        zMin,
        xMax,
        yMax,
        zMax,
        cxMin,
        cyMin,
        czMin,
        cxMax,
        cyMax,
        czMax
      );
    }

    return [xMin, yMin, zMin, xMax, yMax, zMax];
  } else {
    // No geometry, just use the object's world position
    const pos = new THREE.Vector3();
    node.getWorldPosition(pos);
    return [pos.x, pos.y, pos.z, pos.x, pos.y, pos.z];
  }
}
