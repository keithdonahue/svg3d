/**
 * SVG3D - Lightweight 3D library with SVG rendering and easy JS shaders
 * @see https://github.com/your-repo/svg3d
 */

export { Vec3, Mat4, Quaternion, Euler } from './math.js';
export { Object3D, Scene, Camera, Mesh, BufferGeometry, createAttribute, Material, Shaders } from './core.js';
export { Geometries } from './geometries.js';
export { SVGRenderer } from './SVGRenderer.js';
export { grain, noise, stripes, checker, marble, compose } from './shaders/plugins.js';
export { noise2, noise3, snoise3 } from './shaders/noise.js';
export { calculateCameraDistance, getBoundingBox, frameObject } from './utils.js';
