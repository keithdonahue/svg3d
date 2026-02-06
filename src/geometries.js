/**
 * Built-in geometries - minimal set for small bundle
 */

import { BufferGeometry, createAttribute } from './core.js';

function createBoxGeometry(width, height, depth) {
  const w = width / 2, h = height / 2, d = depth / 2;
  const positions = new Float32Array([
    -w,-h,d, w,-h,d, w,h,d, -w,h,d,
    -w,-h,-d, -w,h,-d, w,h,-d, w,-h,-d,
    -w,h,-d, -w,h,d, w,h,d, w,h,-d,
    -w,-h,-d, w,-h,-d, w,-h,d, -w,-h,d,
    w,-h,-d, w,h,-d, w,h,d, w,-h,d,
    -w,-h,d, -w,h,d, -w,h,-d, -w,-h,-d
  ]);
  const normals = new Float32Array([
    0,0,1, 0,0,1, 0,0,1, 0,0,1,
    0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
    0,1,0, 0,1,0, 0,1,0, 0,1,0,
    0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
    1,0,0, 1,0,0, 1,0,0, 1,0,0,
    -1,0,0, -1,0,0, -1,0,0, -1,0,0
  ]);
  const index = new Uint16Array([
    0,1,2, 0,2,3, 4,5,6, 4,6,7, 8,9,10, 8,10,11,
    12,13,14, 12,14,15, 16,17,18, 16,18,19, 20,21,22, 20,22,23
  ]);
  const geo = new BufferGeometry();
  geo.setAttribute('position', createAttribute(positions, 3));
  geo.setAttribute('normal', createAttribute(normals, 3));
  geo.setIndex({ array: index });
  return geo;
}

function createPlaneGeometry(width, height) {
  const w = width / 2, h = height / 2;
  const positions = new Float32Array([
    -w,-h,0, w,-h,0, w,h,0, -w,h,0
  ]);
  const normals = new Float32Array([0,0,1, 0,0,1, 0,0,1, 0,0,1]);
  const uvs = new Float32Array([0,0, 1,0, 1,1, 0,1]);
  const index = new Uint16Array([0,1,2, 0,2,3]);
  const geo = new BufferGeometry();
  geo.setAttribute('position', createAttribute(positions, 3));
  geo.setAttribute('normal', createAttribute(normals, 3));
  geo.setAttribute('uv', createAttribute(uvs, 2));
  geo.setIndex({ array: index });
  return geo;
}

function createSphereGeometry(radius, widthSegments = 8, heightSegments = 6) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments;
    const phi = v * Math.PI;
    for (let x = 0; x <= widthSegments; x++) {
      const u = x / widthSegments;
      const theta = u * Math.PI * 2;
      const px = -radius * Math.sin(phi) * Math.cos(theta);
      const py = radius * Math.cos(phi);
      const pz = radius * Math.sin(phi) * Math.sin(theta);
      positions.push(px, py, pz);
      normals.push(px/radius, py/radius, pz/radius);
      uvs.push(u, 1 - v);
    }
  }
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const a = y * (widthSegments + 1) + x;
      const b = a + widthSegments + 1;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, c, a, c, d);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', createAttribute(new Float32Array(positions), 3));
  geo.setAttribute('normal', createAttribute(new Float32Array(normals), 3));
  geo.setAttribute('uv', createAttribute(new Float32Array(uvs), 2));
  geo.setIndex({ array: new Uint16Array(indices) });
  return geo;
}

function createTetrahedronGeometry(radius = 1) {
  const t = radius;
  const positions = new Float32Array([
    t,t,t, -t,-t,t, -t,t,-t,
    t,t,t, -t,t,-t, t,-t,-t,
    t,t,t, t,-t,-t, -t,-t,t,
    -t,-t,t, t,-t,-t, -t,t,-t
  ]);
  const normals = [];
  for (let i = 0; i < 4; i++) {
    const i0 = i * 9, i1 = i0 + 3, i2 = i0 + 6;
    const ax = positions[i1]-positions[i0], ay = positions[i1+1]-positions[i0+1], az = positions[i1+2]-positions[i0+2];
    const bx = positions[i2]-positions[i0], by = positions[i2+1]-positions[i0+1], bz = positions[i2+2]-positions[i0+2];
    let nx = ay*bz - az*by, ny = az*bx - ax*bz, nz = ax*by - ay*bx;
    const len = Math.sqrt(nx*nx+ny*ny+nz*nz) || 1;
    nx/=len; ny/=len; nz/=len;
    normals.push(nx,ny,nz, nx,ny,nz, nx,ny,nz);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', createAttribute(positions, 3));
  geo.setAttribute('normal', createAttribute(new Float32Array(normals), 3));
  return geo;
}

export const Geometries = {
  box: createBoxGeometry,
  plane: createPlaneGeometry,
  sphere: createSphereGeometry,
  tetrahedron: createTetrahedronGeometry,
};
