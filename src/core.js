/**
 * Scene graph: Object3D, Scene, Camera, Mesh, BufferGeometry, Material
 */

import { Vec3, Mat4, Quaternion, Euler } from './math.js';

const _m4 = new Mat4();
const _v3 = new Vec3();
const _q = new Quaternion();

export class Object3D {
  constructor() {
    this.position = new Vec3(0, 0, 0);
    this.quaternion = new Quaternion(0, 0, 0, 1);
    this.scale = new Vec3(1, 1, 1);
    this.children = [];
    this.parent = null;
    this.matrix = new Mat4();
    this.matrixWorld = new Mat4();
    this.visible = true;
  }
  updateMatrix() {
    this.matrix.compose(this.position, this.quaternion, this.scale);
    return this;
  }
  updateMatrixWorld() {
    this.updateMatrix();
    if (this.parent) {
      this.matrixWorld.copy(this.parent.matrixWorld).multiply(this.matrix);
    } else {
      this.matrixWorld.copy(this.matrix);
    }
    for (const child of this.children) {
      child.updateMatrixWorld();
    }
    return this;
  }
  add(object) {
    if (object.parent) object.parent.remove(object);
    object.parent = this;
    this.children.push(object);
    return this;
  }
  remove(object) {
    const i = this.children.indexOf(object);
    if (i >= 0) {
      object.parent = null;
      this.children.splice(i, 1);
    }
    return this;
  }
  traverse(cb) {
    cb(this);
    for (const child of this.children) child.traverse(cb);
  }
  setRotationFromEuler(euler) {
    this.quaternion.setFromEuler(euler);
    return this;
  }
}

export class Scene extends Object3D {
  constructor() {
    super();
  }
}

export class Camera extends Object3D {
  constructor(fov = 50, aspect = 1, near = 0.1, far = 2000) {
    super();
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.projectionMatrix = new Mat4();
    this.matrixWorldInverse = new Mat4();
    this.updateProjectionMatrix();
  }
  updateProjectionMatrix() {
    this.projectionMatrix.makePerspective(this.fov, this.aspect, this.near, this.far);
    return this;
  }
  lookAt(x, y, z) {
    _v3.set(x, y, z).sub(this.position);
    const len = Math.sqrt(_v3.x * _v3.x + _v3.z * _v3.z);
    const pitch = -Math.atan2(_v3.y, len);
    const yaw = Math.atan2(_v3.x, _v3.z);
    this.quaternion.setFromEuler(new Euler(pitch, yaw, 0));
    return this;
  }
}

export class BufferGeometry {
  constructor() {
    this.attributes = {};
    this.index = null;
    this.drawRange = { start: 0, count: -1 };
  }
  setAttribute(name, attribute) {
    this.attributes[name] = attribute;
    return this;
  }
  getAttribute(name) {
    return this.attributes[name];
  }
  setIndex(index) {
    this.index = index;
    return this;
  }
  get position() { return this.attributes.position; }
  get normal() { return this.attributes.normal; }
  get color() { return this.attributes.color; }
  get uv() { return this.attributes.uv; }
}

/** Attribute: { array: Float32Array, itemSize: 3 } */
export function createAttribute(array, itemSize) {
  return { array, itemSize };
}

export class Material {
  constructor(options = {}) {
    this.color = options.color ?? '#6699cc';
    this.wireframe = options.wireframe ?? false;
    this.side = options.side ?? 'front'; // 'front' | 'back' | 'both'
    /** Shader: (vertex) => color string. vertex = { position, normal, uv, color } */
    this.shader = options.shader ?? null;
  }
}

/** Built-in shaders (JS functions). Vertex has: position (Vec3), normal (Vec3), uv (x,y), color (r,g,b) */
export const Shaders = {
  /** Flat color */
  flat: (color = '#6699cc') => () => color,
  /** Lambert-like diffuse from normal (assume light at camera) */
  diffuse: (color = '#88aacc') => (v) => {
    const n = v.normal;
    const d = Math.max(0, n.z);
    const k = 0.3 + 0.7 * d;
    const c = hexToRgb(color);
    return `rgb(${Math.round(c.r*k)},${Math.round(c.g*k)},${Math.round(c.b*k)})`;
  },
  /** Vertex colors */
  vertexColor: () => (v) => {
    if (v.color) return `rgb(${v.color[0]*255|0},${v.color[1]*255|0},${v.color[2]*255|0})`;
    return '#888';
  },
  /** UV as color (debug) */
  uv: () => (v) => {
    const u = (v.uv && v.uv[0] != null) ? v.uv[0] : 0;
    const g = (v.uv && v.uv[1] != null) ? v.uv[1] : 0;
    return `rgb(${u*255|0},${g*255|0},128)`;
  },
};

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export class Mesh extends Object3D {
  constructor(geometry, material) {
    super();
    this.geometry = geometry;
    this.material = material;
    this.isMesh = true;
  }
}
