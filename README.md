# SVG3D

A **super light** 3D library for JavaScript, similar to three.js, that renders to **SVG** and supports **easy custom shaders** as plain JavaScript functions.

## Get it from GitHub

```bash
git clone https://github.com/YOUR_USERNAME/svg3d.git
cd svg3d
npm run demo
```

Then open **http://localhost:5555/demo/** in your browser. Works on Windows, Mac, and Linux.

- **No WebGL** — pure SVG output (scalable, styleable, small bundle)
- **Shaders in JS** — pass a function `(vertex) => color` instead of GLSL
- **Familiar API** — Scene, Camera, Mesh, BufferGeometry, Material
- **Tiny** — minimal math and renderer, no dependencies

## Install

Copy the `src/` folder into your project or use as ES module:

```html
<script type="module">
  import { Scene, Camera, Mesh, Material, Shaders, Geometries, SVGRenderer } from './src/index.js';
  // ...
</script>
```

## Quick start

```javascript
import { Scene, Camera, Mesh, Material, Shaders, Geometries, SVGRenderer } from './src/index.js';

const renderer = new SVGRenderer({ width: 640, height: 480 });
document.body.appendChild(renderer.domElement);

const scene = new Scene();
const camera = new Camera(50, 640/480, 0.1, 1000);
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0);

const geo = Geometries.box(1, 1, 1);
const mat = new Material({
  color: '#6699cc',
  shader: Shaders.diffuse('#6699cc')  // built-in diffuse
});
const mesh = new Mesh(geo, mat);
scene.add(mesh);

renderer.render(scene, camera);
```

## Shaders

Shaders are **JavaScript functions** that receive a **vertex** object and return a **CSS color string**.

Vertex shape:

- `position` — `Vec3` (world)
- `normal` — `Vec3` (world)
- `uv` — `[u, v]` or null
- `color` — `[r, g, b]` in 0–1 or null

### Built-in shaders

```javascript
Shaders.flat('#ff0000')           // () => '#ff0000'
Shaders.diffuse('#88aacc')        // Lambert-like from normal
Shaders.vertexColor()             // use geometry vertex colors
Shaders.uv()                     // debug: UV as RGB
```

### Custom shader

```javascript
const mat = new Material({
  shader: (vertex) => {
    const { position, normal } = vertex;
    const light = Math.max(0, normal.z);
    const r = (0.3 + 0.7 * light) * 255 | 0;
    return `rgb(${r}, 100, 200)`;
  }
});
```

## API (minimal)

- **Scene** — root container
- **Camera(fov, aspect, near, far)** — perspective, `.position`, `.lookAt(x,y,z)`
- **Mesh(geometry, material)** — drawable object
- **BufferGeometry** — `.setAttribute(name, { array, itemSize })`, `.setIndex({ array })`
- **Material({ color, wireframe, shader })** — `shader` is `(vertex) => color`
- **SVGRenderer({ width, height, clearColor })** — `.domElement` (SVG), `.render(scene, camera)`
- **Geometries** — `.box(w,h,d)`, `.plane(w,h)`, `.sphere(radius,wSeg,hSeg)`, `.tetrahedron(radius)`

## Demo

From the repo root:

```bash
npm run demo
```

Then open `http://localhost:5555/demo/`.

## Size

Roughly **~8KB** of source (unminified); no runtime dependencies. Suitable for small widgets, inline 3D diagrams, or environments where WebGL is unavailable.
