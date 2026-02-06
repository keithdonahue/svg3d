/**
 * SVG Renderer - projects 3D geometry to 2D and draws as SVG
 */

import { Vec3, Mat4 } from './math.js';

const _v = new Vec3();
const _v2 = new Vec3();
const _v3 = new Vec3();
const _proj = new Mat4();
const _viewProj = new Mat4();
const _modelViewProj = new Mat4();

function invertMatrix4(m) {
  const e = m.elements;
  const out = new Float32Array(16);
  const n11 = e[0], n21 = e[1], n31 = e[2], n41 = e[3];
  const n12 = e[4], n22 = e[5], n32 = e[6], n42 = e[7];
  const n13 = e[8], n23 = e[9], n33 = e[10], n43 = e[11];
  const n14 = e[12], n24 = e[13], n34 = e[14], n44 = e[15];
  const t11 = n23*n34*n42 - n24*n33*n42 + n24*n32*n43 - n22*n34*n43 - n23*n32*n44 + n22*n33*n44;
  const t12 = n14*n33*n42 - n13*n34*n42 - n14*n32*n43 + n12*n34*n43 + n13*n32*n44 - n12*n33*n44;
  const t13 = n13*n24*n42 - n14*n23*n42 + n14*n22*n43 - n12*n24*n43 - n13*n22*n44 + n12*n23*n44;
  const t14 = n14*n23*n32 - n13*n24*n32 - n14*n22*n33 + n12*n24*n33 + n13*n22*n34 - n12*n23*n34;
  const det = n11*t11 + n21*t12 + n31*t13 + n41*t14;
  if (det === 0) return m;
  const idet = 1 / det;
  out[0]=t11*idet; out[1]=(n24*n33*n41 - n23*n34*n41 - n24*n31*n43 + n21*n34*n43 + n23*n31*n44 - n21*n33*n44)*idet;
  out[2]=(n22*n34*n41 - n24*n32*n41 + n24*n31*n42 - n21*n34*n42 - n22*n31*n44 + n21*n32*n44)*idet;
  out[3]=(n23*n32*n41 - n22*n33*n41 - n23*n31*n42 + n21*n33*n42 + n22*n31*n43 - n21*n32*n43)*idet;
  out[4]=t12*idet; out[5]=(n13*n34*n41 - n14*n33*n41 + n14*n31*n43 - n11*n34*n43 - n13*n31*n44 + n11*n33*n44)*idet;
  out[6]=(n14*n32*n41 - n12*n34*n41 - n14*n31*n42 + n11*n34*n42 + n12*n31*n44 - n11*n32*n44)*idet;
  out[7]=(n12*n33*n41 - n13*n32*n41 + n13*n31*n42 - n11*n33*n42 - n12*n31*n43 + n11*n32*n43)*idet;
  out[8]=t13*idet; out[9]=(n14*n23*n41 - n13*n24*n41 - n14*n21*n43 + n11*n24*n43 + n13*n21*n44 - n11*n23*n44)*idet;
  out[10]=(n12*n24*n41 - n14*n22*n41 + n14*n21*n42 - n11*n24*n42 - n12*n21*n44 + n11*n22*n44)*idet;
  out[11]=(n13*n22*n41 - n12*n23*n41 - n13*n21*n42 + n11*n23*n42 + n12*n21*n43 - n11*n22*n43)*idet;
  out[12]=t14*idet; out[13]=(n13*n24*n31 - n14*n23*n31 + n14*n21*n33 - n11*n24*n33 - n13*n21*n34 + n11*n23*n34)*idet;
  out[14]=(n14*n22*n31 - n12*n24*n31 - n14*n21*n32 + n11*n24*n32 + n12*n21*n34 - n11*n22*n34)*idet;
  out[15]=(n12*n23*n31 - n13*n22*n31 + n13*n21*n32 - n11*n23*n32 - n12*n21*n33 + n11*n22*n33)*idet;
  m.elements.set(out);
  return m;
}

export class SVGRenderer {
  constructor(options = {}) {
    this.domElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.domElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    this.width = options.width ?? 640;
    this.height = options.height ?? 480;
    this.clearColor = options.clearColor ?? '#1a1a2e';
    this.setSize(this.width, this.height);
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.domElement.setAttribute('width', width);
    this.domElement.setAttribute('height', height);
    this.domElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.halfWidth = width / 2;
    this.halfHeight = height / 2;
  }

  clear() {
    while (this.domElement.firstChild) this.domElement.removeChild(this.domElement.firstChild);
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', this.clearColor);
    this.domElement.appendChild(rect);
  }

  render(scene, camera) {
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    _viewProj.copy(camera.projectionMatrix);
    const camInv = camera.matrixWorld.clone();
    invertMatrix4(camInv);
    _viewProj.multiply(camInv);

    this.clear();
    const triangles = [];
    this.projectScene(scene, _viewProj, camera.matrixWorld, triangles);
    triangles.sort((a, b) => b.depth - a.depth);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    for (const tri of triangles) {
      const el = tri.wireframe
        ? this.makeLineElement(tri)
        : this.makePolygonElement(tri);
      g.appendChild(el);
    }
    this.domElement.appendChild(g);
  }

  projectScene(object, viewProj, cameraWorld, triangles) {
    if (!object.visible) return;
    if (object.isMesh) {
      this.projectMesh(object, viewProj, cameraWorld, triangles);
      return;
    }
    for (const child of object.children) {
      this.projectScene(child, viewProj, cameraWorld, triangles);
    }
  }

  projectMesh(mesh, viewProj, cameraWorld, triangles) {
    _modelViewProj.copy(viewProj).multiply(mesh.matrixWorld);
    const geo = mesh.geometry;
    const mat = mesh.material;
    const posAttr = geo.getAttribute('position');
    const normAttr = geo.getAttribute('normal');
    const uvAttr = geo.getAttribute('uv');
    const colorAttr = geo.getAttribute('color');
    if (!posAttr) return;

    const index = geo.index;
    const pos = posAttr.array;
    const itemSize = posAttr.itemSize;
    const norm = normAttr ? normAttr.array : null;
    const normSize = normAttr ? normAttr.itemSize : 0;
    const uv = uvAttr ? uvAttr.array : null;
    const uvSize = uvAttr ? uvAttr.itemSize : 0;
    const col = colorAttr ? colorAttr.array : null;
    const colSize = colorAttr ? colorAttr.itemSize : 0;

    const shaderFn = mat.shader ? (typeof mat.shader === 'function' ? mat.shader : mat.shader(mesh.material.color)) : null;
    const flatColor = mat.color || '#6699cc';

    const drawStart = geo.drawRange.start;
    const drawCount = geo.drawRange.count < 0
      ? (index ? index.array.length : pos.length / itemSize)
      : geo.drawRange.count;

    const pushTriangle = (i0, i1, i2) => {
      const p0 = this.projectVertex(pos, norm, uv, col, itemSize, normSize, uvSize, colSize, i0, mesh.matrixWorld, _modelViewProj, _v);
      const p1 = this.projectVertex(pos, norm, uv, col, itemSize, normSize, uvSize, colSize, i1, mesh.matrixWorld, _modelViewProj, _v2);
      const p2 = this.projectVertex(pos, norm, uv, col, itemSize, normSize, uvSize, colSize, i2, mesh.matrixWorld, _modelViewProj, _v3);
      if (p0.behind && p1.behind && p2.behind) return;
      const depth = (p0.z + p1.z + p2.z) / 3;
      let fill = flatColor;
      if (shaderFn) {
        const c0 = shaderFn(p0.vertex);
        const c1 = shaderFn(p1.vertex);
        const c2 = shaderFn(p2.vertex);
        fill = this.interpolateColor(c0, c1, c2);
      }
      triangles.push({
        x1: p0.x, y1: p0.y,
        x2: p1.x, y2: p1.y,
        x3: p2.x, y3: p2.y,
        depth,
        fill,
        wireframe: mat.wireframe,
        stroke: mat.wireframe ? (mat.color || '#fff') : undefined
      });
    };

    if (index) {
      const idx = index.array;
      for (let i = drawStart; i < drawStart + drawCount; i += 3) {
        pushTriangle(idx[i], idx[i + 1], idx[i + 2]);
      }
    } else {
      for (let i = drawStart; i < drawStart + drawCount; i += 3) {
        pushTriangle(i, i + 1, i + 2);
      }
    }
  }

  projectVertex(pos, norm, uv, col, itemSize, normSize, uvSize, colSize, index, modelWorld, viewProj, outVec) {
    const i = index * itemSize;
    outVec.set(pos[i], pos[i + 1], pos[i + 2]);
    const worldPos = outVec.clone().applyMatrix4(modelWorld);
    const clip = outVec.clone().applyMatrix4(viewProj);
    const ndcX = clip.x, ndcY = clip.y, ndcZ = clip.z;
    const behind = ndcZ < -1 || ndcZ > 1;
    const sx = this.halfWidth + ndcX * this.halfWidth;
    const sy = this.halfHeight - ndcY * this.halfHeight;

    let normal = null;
    if (norm) {
      const ni = index * normSize;
      normal = new Vec3(norm[ni], norm[ni + 1], norm[ni + 2]);
      normal.applyMatrix4(modelWorld).normalize();
    }
    let uvVal = null;
    if (uv) {
      const ui = index * uvSize;
      uvVal = [uv[ui], uv[ui + 1]];
    }
    let colorVal = null;
    if (col) {
      const ci = index * colSize;
      colorVal = [col[ci], col[ci + 1], col[ci + 2]];
    }
    return {
      x: sx, y: sy, z: ndcZ, behind,
      vertex: {
        position: worldPos,
        normal,
        uv: uvVal,
        color: colorVal
      }
    };
  }

  interpolateColor(c0, c1, c2) {
    const parse = (s) => {
      if (s.startsWith('rgb')) {
        const m = s.match(/\d+/g);
        return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
      }
      const hex = s.replace('#', '');
      const n = parseInt(hex, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const a = parse(c0), b = parse(c1), c = parse(c2);
    const r = (a[0] + b[0] + c[0]) / 3 | 0;
    const g = (a[1] + b[1] + c[1]) / 3 | 0;
    const bl = (a[2] + b[2] + c[2]) / 3 | 0;
    return `rgb(${r},${g},${bl})`;
  }

  makePolygonElement(tri) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    el.setAttribute('points', `${tri.x1},${tri.y1} ${tri.x2},${tri.y2} ${tri.x3},${tri.y3}`);
    el.setAttribute('fill', tri.fill);
    if (tri.stroke) {
      el.setAttribute('stroke', tri.stroke);
      el.setAttribute('stroke-width', '1');
      el.setAttribute('fill', 'none');
    }
    return el;
  }

  makeLineElement(tri) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M ${tri.x1} ${tri.y1} L ${tri.x2} ${tri.y2} L ${tri.x3} ${tri.y3} Z`;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', tri.stroke || '#fff');
    path.setAttribute('stroke-width', '1');
    return path;
  }
}
