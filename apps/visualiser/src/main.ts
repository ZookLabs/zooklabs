import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import blobGeometry from "./blobGeometry";
import Decimal from "decimal.js";
import { createFloorTiles } from "./floorGrid";
import { nodeBoundingBox } from "./boundingBox";
import Stats from "stats.js";

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

//
// Recursively build a THREE.Group for each <bodysolid> node.
//
function buildBodySolid(
  node: Element,
  textureLoader: THREE.TextureLoader,
  isRoot: boolean = false
): THREE.Mesh {
  const attr = node.attributes;

  const scalex = new Decimal(attr.getNamedItem("scalex")?.value ?? "0")
    .toDP(2)
    .toNumber();
  const scaley = new Decimal(attr.getNamedItem("scaley")?.value ?? "0")
    .toDP(2)
    .toNumber();
  const scalez = new Decimal(attr.getNamedItem("scalez")?.value ?? "0")
    .toDP(2)
    .toNumber();

  const bias = new Decimal(attr.getNamedItem("bias")?.value ?? "0.5")
    .toDP(2)
    .toNumber();
  const cubosity = new Decimal(attr.getNamedItem("cubosity")?.value ?? "0")
    .toDP(2)
    .toNumber();
  const asymmetry = new Decimal(attr.getNamedItem("asymmetry")?.value ?? "0")
    .toDP(2)
    .toNumber();
  const flatness = new Decimal(attr.getNamedItem("flatness")?.value ?? "0")
    .toDP(2)
    .toNumber();

  const geometry = blobGeometry({
    scalex: scalex,
    scaley: scaley,
    scalez: scalez,
    bias: bias,
    flatness: flatness,
    asymmetry: asymmetry,
    cubosity: cubosity,
  });

  const r = new Decimal(attr.getNamedItem("colour_red")?.value ?? "0")
    .toDP(2)
    .toNumber();
  const g = new Decimal(attr.getNamedItem("colour_green")?.value ?? "0")
    .toDP(2)
    .toNumber();
  const b = new Decimal(attr.getNamedItem("colour_blue")?.value ?? "0")
    .toDP(2)
    .toNumber();
  const brightness = new Decimal(attr.getNamedItem("brightness")?.value ?? "0")
    .toDP(2)
    .toNumber();
  const textureFn = attr.getNamedItem("texture")?.value ?? null;
  const color = new THREE.Color(r * brightness, g * brightness, b * brightness);

  let material: THREE.MeshStandardMaterial;
  if (textureFn) {
    const texPath = `/assets/${textureFn}`; // served from public/assets/
    const tex = textureLoader.load(
      texPath,
      () => {
        // Once loaded, clamp UVs so the image isn’t repeated
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(1, 1);
        tex.flipY = false;
      },
      undefined,
      (err) => console.error(`Failed to load texture ${texPath}`, err)
    );

    material = new THREE.MeshStandardMaterial({
      map: tex,
      color: color,
      side: THREE.DoubleSide,
    });
  } else {
    material = new THREE.MeshStandardMaterial({
      color: color,
      side: THREE.DoubleSide,
    });
  }

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.isRoot = isRoot;

  const phi = new Decimal(attr.getNamedItem("phi")?.value ?? "0")
    .toDP(2)
    .toNumber();
  const theta = new Decimal(attr.getNamedItem("theta")?.value ?? "0")
    .toDP(2)
    .toNumber();

  const yaw = new Decimal(attr.getNamedItem("yaw")?.value ?? "0")
    .toDP(2)
    .toNumber();
  const pitch = new Decimal(attr.getNamedItem("pitch")?.value ?? "0")
    .toDP(2)
    .toNumber();
  const roll = new Decimal(attr.getNamedItem("roll")?.value ?? "0")
    .toDP(2)
    .toNumber();

  const posx = new Decimal(attr.getNamedItem("posx")?.value ?? "0")
    .toDP(2)
    .toNumber();
  const posy = new Decimal(attr.getNamedItem("posy")?.value ?? "0")
    .toDP(2)
    .toNumber();
  const posz = new Decimal(attr.getNamedItem("posz")?.value ?? "0")
    .toDP(2)
    .toNumber();

  mesh.userData.scalex = scalex;
  mesh.userData.scaley = scaley;
  mesh.userData.scalez = scalez;
  mesh.userData.bias = bias;
  mesh.userData.flatness = flatness;
  mesh.userData.asymmetry = asymmetry;

  mesh.userData.cubosity = cubosity;
  mesh.userData.phi = phi;
  mesh.userData.theta = theta;
  mesh.userData.yaw = yaw;
  mesh.userData.pitch = pitch;
  mesh.userData.roll = roll;

  //CORRECT ORDER
  mesh.rotateY(THREE.MathUtils.degToRad(phi));
  mesh.rotateX(THREE.MathUtils.degToRad(theta));
  mesh.rotateY(THREE.MathUtils.degToRad(yaw));
  mesh.rotateX(THREE.MathUtils.degToRad(pitch));
  mesh.rotateZ(THREE.MathUtils.degToRad(roll));
  mesh.position.set(posx, posy, posz);
  // ^^ CORRECT

  // --- IK1 POSITIONS VISUALISATION ---
  let ik1VizGroup: THREE.Group | null = null;
  const ik1 = node.querySelector(":scope > ik1_positions");
  if (ik1) {
    const pts: Array<{ x: number; y: number; z: number }> = [];
    ik1.querySelectorAll("point").forEach((pt) => {
      pts.push({
        x: parseFloat(pt.getAttribute("x") || "0"),
        y: parseFloat(pt.getAttribute("y") || "0"),
        z: parseFloat(pt.getAttribute("z") || "0"),
      });
    });
    if (pts.length > 0) {
      ik1VizGroup = buildIk1PositionsViz(pts, scalez);
    }
  }

  //
  // 7) Name the group for debugging
  //
  const nameAttr = attr.getNamedItem("name")?.value ?? "";
  const partIdAttr = attr.getNamedItem("partId")?.value ?? "";
  mesh.name = nameAttr || `part_${partIdAttr}`;

  // Add ik1VizGroup after all transforms so it is not affected by group rotation/scale
  if (ik1VizGroup) {
    mesh.add(ik1VizGroup);
    ik1VizGroup.visible = false; // Start hidden, toggled by 'k'
    //   // Attach for toggling later

    (mesh as any)._ik1VizGroup = ik1VizGroup;
  }

  //
  // Recurse into child <bodysolid>—positions remain relative to this group
  //
  const childNodes = Array.from(node.querySelectorAll(":scope > bodysolid"));
  childNodes.forEach((childElem) => {
    const childGroup = buildBodySolid(childElem, textureLoader);
    mesh.add(childGroup);
  });

  return mesh;
}

function buildIk1PositionsViz(
  points: Array<{ x: number; y: number; z: number }>,
  scalez: number
): THREE.Group {
  const vizGroup = new THREE.Group();
  vizGroup.position.set(0, 0, -scalez / 2);

  // 1. Draw a wireframe half-sphere
  const sphereGeom = new THREE.SphereGeometry(
    scalez,
    16,
    32,
    0,
    Math.PI,
    0,
    Math.PI
  );

  const wireframeMaterial = new THREE.MeshStandardMaterial({
    color: 0x999999,
    wireframe: true,
  });
  const line = new THREE.Mesh(sphereGeom, wireframeMaterial);
  line.userData.noMesh = true;
  vizGroup.add(line);

  // 2. Draw points
  points.forEach((pt, i) => {
    let mesh: THREE.Mesh;
    if (i === 0) {
      // First point as a small cube
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xddddff, depthTest: false })
      );
    } else {
      // Others as small spheres
      mesh = new THREE.Mesh(
        new THREE.CircleGeometry(0.07, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xffdddd, depthTest: false })
      );
    }
    mesh.position.set(
      pt.x * (scalez / 3),
      pt.y * (scalez / 3),
      pt.z * (scalez / 3)
    );
    mesh.renderOrder = 999;
    vizGroup.add(mesh);
  });

  // 3. Draw arrows between points
  for (let i = 0; i < points.length; i++) {
    const from = new THREE.Vector3(
      points[i].x * (scalez / 3),
      points[i].y * (scalez / 3),
      points[i].z * (scalez / 3)
    );
    const to = new THREE.Vector3(
      points[(i + 1) % points.length].x * (scalez / 3),
      points[(i + 1) % points.length].y * (scalez / 3),
      points[(i + 1) % points.length].z * (scalez / 3)
    );
    const dir = new THREE.Vector3().subVectors(to, from).normalize();
    const len = from.distanceTo(to);
    const arrow = new THREE.ArrowHelper(dir, from, len, 0xffffff, 0.12, 0.07);
    arrow.renderOrder = 999;
    if (arrow.line.material instanceof THREE.Material) {
      arrow.line.material.depthTest = false;
    } else {
      arrow.line.material.forEach((m) => {
        m.depthTest = false;
      });
    }
    if (arrow.cone.material instanceof THREE.Material) {
      arrow.cone.material.depthTest = false;
    } else {
      arrow.cone.material.forEach((m) => {
        m.depthTest = false;
      });
    }
    vizGroup.add(arrow);
  }
  return vizGroup;
}

//
// Fetch sample.xml, parse it, and build the scene hierarchy.
//
async function loadAndBuildScene(scene: THREE.Scene, xmlPath: string = "/evo-sample.xml"): Promise<void> {
  let xmlText: string;
  try {
    const response = await fetch(xmlPath);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    xmlText = await response.text();
  } catch (fetchErr) {
    console.error(`Failed to fetch ${xmlPath}:`, fetchErr);
    displayError(`Failed to fetch ${xmlPath}: ${fetchErr}`);
    return;
  }

  let xmlDoc: Document;
  try {
    xmlDoc = new DOMParser().parseFromString(xmlText, "application/xml");
  } catch (parseErr) {
    console.error("XML parse error:", parseErr);
    displayError(`XML parse error: ${parseErr}`);
    return;
  }

  const genome = xmlDoc.querySelector("genome");
  if (!genome) {
    console.error("<genome> not found in XML.");
    displayError(`<genome> not found in ${xmlPath}.`);
    return;
  }

  const textureLoader = new THREE.TextureLoader();
  const topBodies = Array.from(genome.querySelectorAll(":scope > bodysolid"));
  if (topBodies.length > 1) {
    // should not be more than one root
    throw new Error("more than one root component");
  }

  const bodyMesh = buildBodySolid(topBodies[0], textureLoader, true);
  scene.add(bodyMesh);
}

//
// Show an error banner in the DOM
//
function displayError(message: string): void {
  const errorDiv = document.getElementById("error-message") as HTMLDivElement;
  errorDiv.style.display = "block";
  errorDiv.textContent = message;
}

//
// Initialize three.js: scene, camera, lights, renderer, controls, animation loop.
//
async function init(): Promise<void> {
  const container = document.getElementById(
    "canvas-container"
  ) as HTMLDivElement;
  if (!container) {
    console.error("No #canvas-container element found.");
    return;
  }

  // 1) Scene
  const scene = new THREE.Scene();
  // scene.background = new THREE.Color( 0x2596be );
  scene.background = new THREE.Color(0xffffff);

  const [floor1, floor2] = createFloorTiles();
  scene.add(floor1);
  scene.add(floor2);

  // Raycaster and mouse for picking
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let highlightBox: THREE.Mesh | null = null;
  let highlightedObject: THREE.Mesh | null = null;

  // 2) Camera
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 10);

  // 3) Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // 4) Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  // controls.enableDamping = true;
  controls.mouseButtons = {
    // LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  };

  /////////////////////////////////
  // The following is an AI rewrite of the MessageStandardLights function

  // Assume position is a THREE.Vector3
  const position = new THREE.Vector3(0, 0, 0); // Define as needed

  // Config.get replacement
  const getConfig = (_key: string, fallback: number) => {
    // Replace this with your actual config getter
    return fallback + 0.2; // Fallback for example
  };

  // === Light 1: Soft Spotlight ===
  const light1 = new THREE.SpotLight(
    new THREE.Color(
      getConfig("light_spt1", 0.4),
      getConfig("light_spt1", 0.4),
      getConfig("light_spt1", 0.4)
    )
  );
  light1.position.copy(position.clone().add(new THREE.Vector3(0, 200, 0)));
  light1.distance = 1000;
  light1.castShadow = true;
  light1.angle = THREE.MathUtils.degToRad(35);

  // Spotlight target
  const target1 = new THREE.Object3D();
  target1.position.copy(position.clone().add(new THREE.Vector3(0, 0, 0)));
  light1.target = target1;

  // === Light 2: Ambient Light ===
  const light2 = new THREE.AmbientLight(
    new THREE.Color(
      getConfig("light_amb1", 0.4),
      getConfig("light_amb1", 0.4),
      getConfig("light_amb1", 0.4)
    )
  );

  // === Light 3: Directional Light 1 ===
  const light3 = new THREE.DirectionalLight(
    new THREE.Color(
      getConfig("light_dir1", 0.3),
      getConfig("light_dir1", 0.3),
      getConfig("light_dir1", 0.3)
    )
  );
  light3.position.copy(position.clone().add(new THREE.Vector3(100, 0, 200)));
  light3.target.position.copy(
    position.clone().add(new THREE.Vector3(10, 0, 0))
  );

  // === Light 4: Directional Light 2 ===
  const light4 = new THREE.DirectionalLight(
    new THREE.Color(
      getConfig("light_dir2", 0.3),
      getConfig("light_dir2", 0.3),
      getConfig("light_dir2", 0.3)
    )
  );
  light4.position.copy(position.clone().add(new THREE.Vector3(-200, 0, -150)));
  light4.target.position.copy(
    position.clone().add(new THREE.Vector3(10, 0, 0))
  );

  // === Add to scene ===
  scene.add(light1);
  scene.add(target1); // Important: spotLight.target must be added to scene
  scene.add(light2);
  scene.add(light3);
  scene.add(light3.target);
  scene.add(light4);
  scene.add(light4.target);

  ////////////////////////////////////

  // 6) Load XML & build hierarchy
  const xmlSelect = document.getElementById("xml-file-select") as HTMLSelectElement;

  async function reloadScene(xmlPath: string) {
    // Remove existing root meshes
    const toRemove = scene.children.filter((c) => c.userData.isRoot);
    toRemove.forEach((c) => scene.remove(c));

    // Clear any selection state
    if (highlightBox && highlightBox.parent) {
      highlightBox.parent.remove(highlightBox);
    }
    highlightBox = null;
    highlightedObject = null;
    (document.getElementById("transform-controls") as HTMLDivElement).style.display = "none";

    const errorDiv = document.getElementById("error-message") as HTMLDivElement;
    errorDiv.style.display = "none";

    await loadAndBuildScene(scene, xmlPath).catch((err) => {
      console.error("Error building scene:", err);
      displayError(`Error: ${err}`);
    });

    const newRoot = scene.children.find((c) => c.userData.isRoot);
    if (newRoot) {
      const [, yMin] = nodeBoundingBox(newRoot);
      newRoot.position.set(0, -yMin - 0.3, 0);
      smoothCameraFocus(newRoot.position);
    }
  }

  await reloadScene(xmlSelect?.value ?? "/sample.xml");

  xmlSelect?.addEventListener("change", () => {
    reloadScene(xmlSelect.value);
  });

  // 7) Handle window resize
  window.addEventListener("resize", () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // 8) Animate
  function animate(): void {
    stats.begin();
    requestAnimationFrame(animate);

    const showFloor = camera.position.y >= 0;
    floor1.visible = showFloor;
    floor2.visible = showFloor;

    controls.update();
    renderer.render(scene, camera);
    stats.end(); // <-- End measuring
  }
  animate();

  // Add a flag to track wireframe mode
  let isWireframe = false;
  // Add a flag to track ik1 viz mode
  let showIk1Viz = false;
  // Add event listener for toggling wireframe mode
  window.addEventListener("keydown", (event) => {
    if (event.key === "w" || event.key === "W") {
      isWireframe = !isWireframe;
      scene.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh && !object.userData.noMesh) {
          const material = object.material;
          if (Array.isArray(material)) {
            material.forEach((mat) => (mat.wireframe = isWireframe));
          } else {
            material.wireframe = isWireframe;
          }
        }
      });
    }
    if (event.key === "k" || event.key === "K") {
      showIk1Viz = !showIk1Viz;
      scene.traverse((object: THREE.Object3D) => {
        if ((object as any)._ik1VizGroup) {
          (object as any)._ik1VizGroup.visible = showIk1Viz;
        }
      });
    }
  });

  function updateHighlightBox() {
    if (highlightedObject && highlightBox) {
      highlightedObject.geometry.computeBoundingBox();
      const geometryBox = highlightedObject.geometry.boundingBox!;
      const size = geometryBox.getSize(new THREE.Vector3());
      highlightBox.scale.copy(size);
    }
  }

  // --- Highlight on click logic ---
  renderer.domElement.addEventListener("pointerdown", (event: PointerEvent) => {
    if (event.button === 0) {
      // Calculate mouse position in normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      // Only intersect meshes
      const intersects = raycaster
        .intersectObjects(scene.children, true)
        .filter(
          (i: THREE.Intersection) =>
            i.object instanceof THREE.Mesh &&
            (i.object.userData.isSelectable ?? true)
        );

      if (intersects.length > 0) {
        const picked = intersects[0].object as THREE.Mesh;
        if (highlightedObject !== picked) {
          // Remove previous highlight
          if (highlightBox && highlightBox.parent) {
            highlightBox.parent.remove(highlightBox);
          }

          if (!highlightBox) {
            const geometry = new THREE.BoxGeometry(1.05, 1.05, 1.05);
            const material = new THREE.MeshBasicMaterial({
              color: 0xff0000,
              transparent: true,
              opacity: 0.2,
            });
            highlightBox = new THREE.Mesh(geometry, material);
            highlightBox.userData.isSelectable = false;
          }

          highlightBox.visible = true;
          picked.add(highlightBox);
          highlightedObject = picked;

          updateHighlightBox();

          if (picked) {
            showTransformControls(picked);
          } else {
            hideTransformControls();
          }

          // Set OrbitControls target to the center of the picked mesh, smoothly
          smoothCameraFocus(picked.getWorldPosition(new THREE.Vector3()));
        }
      } else {
        // Clicked background, remove highlight
        if (highlightBox && highlightBox.parent) {
          highlightBox.parent.remove(highlightBox);
        }
        highlightedObject = null;
        // rotatableGroup = null;
        hideTransformControls(); // Hide controls
      }
    }
  });

  // Helper for smooth camera/target transition
  function smoothCameraFocus(newTarget: THREE.Vector3, duration = 165) {
    const startTarget = controls.target.clone();
    const startPos = camera.position.clone();
    // Keep the same offset from camera to target
    const offset = camera.position.clone().sub(controls.target);
    const endTarget = newTarget.clone();
    const endPos = newTarget.clone().add(offset);
    const startTime = performance.now();

    function animateFocus(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease in-out
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      camera.position.lerpVectors(startPos, endPos, ease);
      controls.target.lerpVectors(startTarget, endTarget, ease);
      controls.update();
      if (t < 1) {
        requestAnimationFrame(animateFocus);
      } else {
        camera.position.copy(endPos);
        controls.target.copy(endTarget);
        controls.update();
      }
    }
    requestAnimationFrame(animateFocus);
  }

  // --- Transform controls UI ---
  const transformControls = document.getElementById(
    "transform-controls"
  ) as HTMLDivElement;
  const pitchSlider = document.getElementById(
    "pitch-slider"
  ) as HTMLInputElement;
  const yawSlider = document.getElementById("yaw-slider") as HTMLInputElement;
  const rollSlider = document.getElementById("roll-slider") as HTMLInputElement;
  const cubositySlider = document.getElementById(
    "cubosity-slider"
  ) as HTMLInputElement;
  const phiSlider = document.getElementById("phi-slider") as HTMLInputElement;
  const thetaSlider = document.getElementById(
    "theta-slider"
  ) as HTMLInputElement;
  const biasSlider = document.getElementById("bias-slider") as HTMLInputElement;
  const scalexSlider = document.getElementById(
    "scalex-slider"
  ) as HTMLInputElement;
  const scaleySlider = document.getElementById(
    "scaley-slider"
  ) as HTMLInputElement;
  const scalezSlider = document.getElementById(
    "scalez-slider"
  ) as HTMLInputElement;
  const flatnessSlider = document.getElementById(
    "flatness-slider"
  ) as HTMLInputElement;
  const asymmetrySlider = document.getElementById(
    "asymmetry-slider"
  ) as HTMLInputElement;

  const pitchValue = document.getElementById("pitch-value") as HTMLSpanElement;
  const yawValue = document.getElementById("yaw-value") as HTMLSpanElement;
  const rollValue = document.getElementById("roll-value") as HTMLSpanElement;
  const cubosityValue = document.getElementById(
    "cubosity-value"
  ) as HTMLSpanElement;
  const phiValue = document.getElementById("phi-value") as HTMLSpanElement;
  const thetaValue = document.getElementById("theta-value") as HTMLSpanElement;
  const biasValue = document.getElementById("bias-value") as HTMLSpanElement;
  const scalexValue = document.getElementById(
    "scalex-value"
  ) as HTMLSpanElement;
  const scaleyValue = document.getElementById(
    "scaley-value"
  ) as HTMLSpanElement;
  const scalezValue = document.getElementById(
    "scalez-value"
  ) as HTMLSpanElement;
  const flatnessValue = document.getElementById(
    "flatness-value"
  ) as HTMLSpanElement;
  const asymmetryValue = document.getElementById(
    "asymmetry-value"
  ) as HTMLSpanElement;

  function updateUIValues() {
    scalexValue.textContent = scalexSlider.value;
    scaleyValue.textContent = scaleySlider.value;
    scalezValue.textContent = scalezSlider.value;
    biasValue.textContent = biasSlider.value;
    flatnessValue.textContent = flatnessSlider.value;
    asymmetryValue.textContent = asymmetrySlider.value;
    cubosityValue.textContent = cubositySlider.value;

    phiValue.textContent = phiSlider.value;
    thetaValue.textContent = thetaSlider.value;
    yawValue.textContent = yawSlider.value;
    pitchValue.textContent = pitchSlider.value;
    rollValue.textContent = rollSlider.value;
  }

  function updateMetadata(mesh: THREE.Mesh) {
    mesh.userData.scalex = Number(scalexSlider.value) / 4;
    mesh.userData.scaley = Number(scaleySlider.value) / 4;
    mesh.userData.scalez = Number(scalezSlider.value) / 4;
    mesh.userData.bias = Number(biasSlider.value);
    mesh.userData.flatness = Number(flatnessSlider.value);
    mesh.userData.asymmetry = Number(asymmetrySlider.value);
    mesh.userData.cubosity = Number(cubositySlider.value);

    mesh.userData.phi = Number(phiSlider.value);
    mesh.userData.theta = Number(thetaSlider.value);
    mesh.userData.yaw = Number(yawSlider.value);
    mesh.userData.pitch = Number(pitchSlider.value);
    mesh.userData.roll = Number(rollSlider.value);
  }

  function showTransformControls(mesh: THREE.Mesh) {
    if (!transformControls) return;
    transformControls.style.display = "block";
    // Read current rotation in degrees

    scalexSlider.value = (mesh.userData.scalex * 4).toString();
    scaleySlider.value = (mesh.userData.scaley * 4).toString();
    scalezSlider.value = (mesh.userData.scalez * 4).toString();
    biasSlider.value = mesh.userData.bias;
    flatnessSlider.value = mesh.userData.flatness;
    asymmetrySlider.value = mesh.userData.asymmetry;
    cubositySlider.value = mesh.userData.cubosity;

    phiSlider.value = mesh.userData.phi;
    thetaSlider.value = mesh.userData.theta;
    yawSlider.value = mesh.userData.yaw;
    pitchSlider.value = mesh.userData.pitch;
    rollSlider.value = mesh.userData.roll;

    scalexValue.textContent = scalexSlider.value;
    scaleyValue.textContent = scaleySlider.value;
    scalezValue.textContent = scalezSlider.value;
    biasValue.textContent = biasSlider.value;
    flatnessValue.textContent = flatnessSlider.value;
    asymmetryValue.textContent = asymmetrySlider.value;
    cubosityValue.textContent = cubositySlider.value;

    phiValue.textContent = phiSlider.value;
    thetaValue.textContent = thetaSlider.value;
    yawValue.textContent = yawSlider.value;
    pitchValue.textContent = pitchSlider.value;
    rollValue.textContent = rollSlider.value;
  }

  function hideTransformControls() {
    if (!transformControls) return;
    transformControls.style.display = "none";
  }

  if (
    pitchSlider &&
    yawSlider &&
    rollSlider &&
    cubositySlider &&
    phiSlider &&
    thetaSlider
  ) {
    function updateChildren(parent: THREE.Mesh) {
      parent.children
        .filter((i) => i instanceof THREE.Mesh)
        .forEach((childObject) => {
          const childMesh = childObject as THREE.Mesh;
          updateRotation(
            childMesh,
            childMesh.userData.phi,
            childMesh.userData.theta,
            childMesh.userData.yaw,
            childMesh.userData.pitch,
            childMesh.userData.roll
          );
        });
    }

    // Ray line
    const rayLineMat = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 3,
    });
    const rayLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]);
    const rayLine = new THREE.Line(rayLineGeo, rayLineMat);
    scene.add(rayLine);

    function updateRotation(
      child: THREE.Mesh,
      unsafePhi: number,
      theta: number,
      yaw: number,
      pitch: number,
      roll: number
    ) {
      const phi = Math.abs(unsafePhi) < 0.001 ? 0.001 : unsafePhi;

      const parent = child.parent! as THREE.Mesh;

      const baseQuat = parent.getWorldQuaternion(new THREE.Quaternion());

      // Step 2: Build offset quaternion from phi and theta
      const offsetEuler = new THREE.Euler(
        THREE.MathUtils.degToRad(theta),
        THREE.MathUtils.degToRad(phi),
        0,
        "YXZ"
      ); // order matters
      const offsetQuat = new THREE.Quaternion().setFromEuler(offsetEuler);

      const finalQuat = baseQuat.clone().multiply(offsetQuat); // base * offset

      const direction = new THREE.Vector3(0, 0, 1)
        .applyQuaternion(finalQuat)
        .normalize();

      const origin = parent.getWorldPosition(new THREE.Vector3());

      const raycaster = new THREE.Raycaster(origin, direction, undefined, 100);
      const intersects = raycaster.intersectObject(parent, false);

      if (intersects.length > 0) {
        const worldPoint = intersects[0].point.clone();
        const localPoint = parent.worldToLocal(worldPoint.clone());

        child.translateZ(-child.userData.scalez / 2);
        child.position.copy(localPoint);

        child.setRotationFromEuler(offsetEuler);

        child.rotateY(THREE.MathUtils.degToRad(yaw));
        child.rotateX(THREE.MathUtils.degToRad(pitch));
        child.rotateZ(THREE.MathUtils.degToRad(roll));

        child.translateZ(child.userData.scalez / 2);

        rayLine.geometry.setFromPoints([
          origin,
          origin.clone().add(direction.clone().multiplyScalar(2)),
        ]);

        return { worldPoint, localPoint };
      }
      return null;
    }

    [
      scalexSlider,
      scaleySlider,
      scalezSlider,
      biasSlider,
      flatnessSlider,
      asymmetrySlider,
      cubositySlider,
    ].forEach((slider) => {
      slider.addEventListener("input", () => {
        if (highlightedObject && highlightedObject.geometry) {
          updateUIValues();
          updateMetadata(highlightedObject);

          const updatedGeometry = blobGeometry({
            scalex: Number(scalexSlider.value) / 4,
            scaley: Number(scaleySlider.value) / 4,
            scalez: Number(scalezSlider.value) / 4,
            bias: Number(biasSlider.value),
            flatness: Number(flatnessSlider.value),
            asymmetry: Number(asymmetrySlider.value),
            cubosity: Number(cubositySlider.value),
          });

          highlightedObject.geometry.dispose();
          highlightedObject.geometry = updatedGeometry;

          updateHighlightBox();

          updateRotation(
            highlightedObject,
            Number(phiSlider.value),
            Number(thetaSlider.value),
            Number(yawSlider.value),
            Number(pitchSlider.value),
            Number(rollSlider.value)
          );

          updateChildren(highlightedObject);
        }
      });
    });

    [phiSlider, thetaSlider, pitchSlider, yawSlider, rollSlider].forEach(
      (slider) =>
        slider.addEventListener("input", () => {
          if (highlightedObject) {
            updateUIValues();
            updateMetadata(highlightedObject);

            updateRotation(
              highlightedObject,
              Number(phiSlider.value),
              Number(thetaSlider.value),
              Number(yawSlider.value),
              Number(pitchSlider.value),
              Number(rollSlider.value)
            );
          }
        })
    );

    document.getElementById("recalc")?.addEventListener("click", () => {
      if (highlightedObject) {
        updateUIValues();
        updateMetadata(highlightedObject);

        highlightedObject!.geometry = blobGeometry({
          scalex: Number(scalexSlider.value) / 4,
          scaley: Number(scaleySlider.value) / 4,
          scalez: Number(scalezSlider.value) / 4,
          bias: Number(biasSlider.value),
          flatness: Number(flatnessSlider.value),
          asymmetry: Number(asymmetrySlider.value),
          cubosity: Number(cubositySlider.value),
        });

        updateRotation(
          highlightedObject,
          Number(phiSlider.value),
          Number(thetaSlider.value),
          Number(yawSlider.value),
          Number(pitchSlider.value),
          Number(rollSlider.value)
        );

        updateChildren(highlightedObject);
      }
    });
  }
}

// Kick everything off
init().catch((err) => console.error("Fatal init error:", err));
