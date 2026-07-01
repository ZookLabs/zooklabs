# Zook Visualiser

A 3D genome viewer built with Three.js and Vite. Loads BAMZOOKi genome XML files and renders the creature body in an interactive 3D scene.

## Setup

```bash
yarn install
yarn dev     # → http://localhost:5173
yarn build   # output to dist/
```

## Controls

| Input | Action |
| --- | --- |
| Right-click + drag | Rotate |
| Middle scroll | Zoom |
| Left-click mesh | Select part |
| `W` | Toggle wireframe |
| `K` | Toggle IK1 visualisation |

Selecting a part opens a slider panel to inspect and adjust its shape and rotation parameters.

## Structure

```
apps/visualiser/
├── public/
│   └── assets/          # BMP textures + sample XML files
├── src/
│   ├── main.ts          # Scene setup, controls, interaction
│   ├── blobGeometry.ts  # Parametric blob mesh generation
│   ├── boundingBox.ts   # World-space bounding box helpers
│   └── floorGrid.ts     # Checkerboard floor tile geometry
├── vite.config.ts
└── tsconfig.json
```
