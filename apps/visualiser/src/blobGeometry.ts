import * as THREE from "three";

const heightSegments = 26;
const widthSegments = 16;

/**
 * Generate sphere-like base geometry via lathe
 */
function generateSphereGeometry(
  flatness: number,
  bias: number
): THREE.LatheGeometry {
  const k = 0.55228475;

  const pointPercentage = bias * 2 - 1;
  const biasTop = Math.max(pointPercentage, 0);
  const biasBottom = Math.abs(Math.min(pointPercentage, 0));

  const t1 = new THREE.Vector2(0, 1);
  const t2 = new THREE.Vector2(
    k * (1 - Math.max(flatness, biasTop)) + k * biasBottom,
    1
  );
  const t3 = new THREE.Vector2(
    0.5 * (1 - flatness) +
      0.5 * (1 - biasTop) +
      (k * 2 - 1) * biasBottom,
    (1 - k) * flatness + k
  );
  const t4 = new THREE.Vector2(
    0.83 * (1 - Math.min(flatness, biasTop)) + 0.17 * (1 - Math.min(Math.abs(pointPercentage), 1 - flatness)),
    flatness
  );

  const b1 = new THREE.Vector2( 
    0.83 * (1 - Math.min(flatness, biasBottom)) +
      0.17 * (1 - Math.min(Math.abs(pointPercentage), 1 - flatness)),
    -flatness
  );
  const b2 = new THREE.Vector2(
    0.5 * (1 - flatness) +
      0.5 * (1 - biasBottom) +
      (k * 2 - 1) * biasTop,
    (1 - k) * -flatness + -k
  );
  const b3 = new THREE.Vector2(
    k * (1 - Math.max(flatness, biasBottom)) + k * biasTop,
    -1
  );
  const b4 = new THREE.Vector2(0, -1);

  const curveTop = new THREE.CubicBezierCurve(t1, t2, t3, t4);
  const curveBottom = new THREE.CubicBezierCurve(b1, b2, b3, b4);

  const points = [
    ...curveTop.getPoints(heightSegments / 2),
    ...curveBottom.getPoints(heightSegments / 2),
  ];
  const lathePoints = points.map((p) => new THREE.Vector2(p.x, p.y));

  return new THREE.LatheGeometry(lathePoints, widthSegments);
}

/**
 * Calculate cube radius and vertical position at a ring
 */
function calculateCubeZ(
  ring: number,
  totalRings: number,
  bias: number
): { r: number; z: number } {
  const PStart = 1 - Math.max((bias - 0.5) / 0.5, 0);
  const PEnd = Math.min(bias / 0.5, 1);

  const firstQ = Math.floor(totalRings * 0.25);
  const lastQ = Math.ceil(totalRings * 0.75);

  if (ring <= firstQ) {
    return { r: (ring / firstQ) * PStart, z: 1 };
  }
  if (ring < lastQ) {
    const prog = (ring - firstQ) / (lastQ - firstQ);
    const r = PStart - prog * (PStart - PEnd);
    return { r, z: 1 - 2 * prog };
  }
  return { r: (1 - (ring - lastQ) / (totalRings - lastQ)) * PEnd, z: -1 };
}

/**
 * Map polar coords to square perimeter
 */
function toSquareRing(x: number, z: number, r: number): THREE.Vector2 {
  const a = Math.atan2(z, x);
  const ca = Math.cos(a),
    sa = Math.sin(a);
  const max = Math.max(Math.abs(ca), Math.abs(sa));
  return new THREE.Vector2((ca / max) * r, (sa / max) * r);
}

function calculateCubeCordinates(
  ring: number,
  totalRings: number,
  bias: number,
  sphereCordinates: THREE.Vector3
): THREE.Vector3 {
  const { r, z } = calculateCubeZ(ring, totalRings, bias);
  const cubeXY = toSquareRing(sphereCordinates.x, sphereCordinates.z, r);
  return new THREE.Vector3(cubeXY.x, z, cubeXY.y);
}

/**
 * Build the final morphed blob geometry
 */
export default function blobGeometry({
  scalex,
  scaley,
  scalez,
  bias,
  flatness,
  asymmetry,
  cubosity
}: {
  scalex: number;
  scaley: number;
  scalez: number;
  bias: number;
  flatness: number;
  asymmetry: number;
  cubosity: number;
}): THREE.LatheGeometry {
  const geometry = generateSphereGeometry(flatness, bias);
  const positions = geometry.attributes.position as THREE.BufferAttribute;
  const uv = geometry.attributes.uv as THREE.BufferAttribute;

  const sx = scalex / 2;
  const sy = scalez / 2;
  const sz = scaley / 2;

  const totalRings = heightSegments + 2;
  const totalSegments = widthSegments + 1;

  for (let ring = 1; ring <= totalRings; ring++) {
    for (let seg = 1; seg <= totalSegments; seg++) {
      const point = (seg - 1) * totalRings + (ring - 1);

      const sphereCoordinates = new THREE.Vector3(
        positions.getX(point),
        positions.getY(point),
        positions.getZ(point)
      );

      const cubeCordinates = calculateCubeCordinates(
        ring - 1,
        totalRings - 1,
        bias,
        sphereCoordinates
      );

      const morphed = sphereCoordinates.lerp(cubeCordinates, cubosity);

      if (morphed.z > 0) morphed.z *= 1 - asymmetry;

      const x = -morphed.x * sx;
      const y = -morphed.y * sy;
      const z = -morphed.z * sz;
      positions.setXYZ(point, x, y, z);

      // Cylindrical UV mapping
      const u = (seg - 1) / (totalSegments - 1);
      // Sphere UV mapping
      const v = 0.5 - Math.asin(y / Math.sqrt(x * x + y * y + z * z)) / Math.PI;
      uv.setXY(point, u, v);
    }
  }

  positions.needsUpdate = true;
  uv.needsUpdate = true;

  geometry.rotateX(THREE.MathUtils.degToRad(-90));


  return geometry;
}
