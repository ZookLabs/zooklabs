import * as THREE from "three";

// Helper to get config values (replace with your actual config getter)
function getConfig(_key: string, fallback: number): number {
  return fallback;
}

export function createFloorTiles(
  floorSizeX = 130,
  floorSizeZ = 130,
  position = new THREE.Vector3(0, 0, 0),
  rotation = new THREE.Euler(0, 0, 0)
): THREE.Mesh[] {
  const sizeX = floorSizeX;
  const sizeZ = floorSizeZ;

  const vertices: number[] = [];
  const normals: number[] = [];
  const tangents: number[] = [];
  const uvs: number[] = [];
  const indices1: number[] = [];
  const indices2: number[] = [];

  // let gindex = 0;
  // let gindex1 = 0;
  // let gindex2 = 0;

  // Build grid vertices
  for (let i = -sizeX / 2; i <= sizeX / 2; i++) {
    for (let j = -sizeZ / 2; j <= sizeZ / 2; j++) {
      vertices.push(i, 0, j);
      normals.push(0, 1, 0);
      tangents.push(1, 0, 0);
      uvs.push(i / 32, j / 32);
      // gindex++;
    }
  }

  // Helper to convert (i, j) to vertex index
  function vertexIndex(i: number, j: number): number {
    return (i + sizeX / 2) * (sizeZ + 1) + (j + sizeZ / 2);
  }

  // Build indices for checkerboard pattern
  for (let i = -sizeX / 2; i < sizeX / 2; i++) {
    for (let j = -sizeZ / 2; j < sizeZ / 2; j++) {
      const v0 = vertexIndex(i, j);
      const v1 = vertexIndex(i + 1, j);
      const v2 = vertexIndex(i, j + 1);
      const v3 = vertexIndex(i + 1, j + 1);

      if (((i + j + sizeX + sizeZ) % 2) > 0.5) {
        // indices1
        indices1.push(v0, v1, v2, v2, v1, v3);
        // gindex1 += 6;
      } else {
        // indices2
        indices2.push(v0, v1, v2, v2, v1, v3);
        // gindex2 += 6;
      }
    }
  }

  // Create BufferGeometries for each tile set
  function makeGeometry(indices: number[]): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute("tangent", new THREE.Float32BufferAttribute(tangents, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();
    return geometry;
  }

  // Materials (replace with your texture if needed)
  const material1 = new THREE.MeshStandardMaterial({
    color: new THREE.Color(
      getConfig("floortile1_r", 0.9),
      getConfig("floortile1_g", 0.9),
      getConfig("floortile1_b", 0.9)
    ),
    side: THREE.DoubleSide,
  });

  const material2 = new THREE.MeshStandardMaterial({
    color: new THREE.Color(
      getConfig("floortile2_r", 0.99),
      getConfig("floortile2_g", 0.99),
      getConfig("floortile2_b", 0.99)
    ),
    side: THREE.DoubleSide,
  });

  // Create meshes
  const mesh1 = new THREE.Mesh(makeGeometry(indices1), material1);
  mesh1.position.copy(position);
  mesh1.rotation.copy(rotation);
  mesh1.userData.isSelectable = false;
  mesh1.receiveShadow = true;

  const mesh2 = new THREE.Mesh(makeGeometry(indices2), material2);
  mesh2.position.copy(position);
  mesh2.rotation.copy(rotation);
  mesh2.userData.isSelectable = false;
  mesh2.receiveShadow = false;
  return [mesh1, mesh2];
}