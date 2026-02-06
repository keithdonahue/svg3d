/**
 * Minimal 3D math for SVG3D - Vec3 and Mat4 only
 */

export class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  set(x, y, z) {
    this.x = x; this.y = y; this.z = z;
    return this;
  }
  clone() { return new Vec3(this.x, this.y, this.z); }
  add(v) {
    this.x += v.x; this.y += v.y; this.z += v.z;
    return this;
  }
  sub(v) {
    this.x -= v.x; this.y -= v.y; this.z -= v.z;
    return this;
  }
  multiplyScalar(s) {
    this.x *= s; this.y *= s; this.z *= s;
    return this;
  }
  applyMatrix4(m) {
    const x = this.x, y = this.y, z = this.z;
    const e = m.elements;
    const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
    this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
    this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
    this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
    return this;
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  normalize() {
    const len = this.length();
    if (len > 0) this.multiplyScalar(1 / len);
    return this;
  }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
  cross(v) {
    const ax = this.x, ay = this.y, az = this.z;
    const bx = v.x, by = v.y, bz = v.z;
    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;
    return this;
  }
}

export class Mat4 {
  constructor() {
    this.elements = new Float32Array(16);
    this.identity();
  }
  identity() {
    const e = this.elements;
    e[0]=1;e[1]=0;e[2]=0;e[3]=0;
    e[4]=0;e[5]=1;e[6]=0;e[7]=0;
    e[8]=0;e[9]=0;e[10]=1;e[11]=0;
    e[12]=0;e[13]=0;e[14]=0;e[15]=1;
    return this;
  }
  multiply(m) {
    const a = this.elements, b = m.elements;
    const out = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        out[i * 4 + j] = a[i*4]*b[j] + a[i*4+1]*b[4+j] + a[i*4+2]*b[8+j] + a[i*4+3]*b[12+j];
      }
    }
    this.elements.set(out);
    return this;
  }
  copy(m) {
    this.elements.set(m.elements);
    return this;
  }
  clone() {
    const c = new Mat4();
    c.elements.set(this.elements);
    return c;
  }
  makePerspective(fovY, aspect, near, far) {
    const e = this.elements;
    const f = 1 / Math.tan(fovY * Math.PI / 360);
    const nf = 1 / (near - far);
    e[0]=f/aspect; e[5]=f; e[10]=(far+near)*nf; e[11]=-1;
    e[14]=2*far*near*nf; e[1]=e[2]=e[3]=e[4]=e[6]=e[7]=e[8]=e[9]=e[12]=e[13]=e[15]=0;
    return this;
  }
  makeTranslation(x, y, z) {
    this.identity();
    this.elements[12] = x;
    this.elements[13] = y;
    this.elements[14] = z;
    return this;
  }
  makeRotationX(theta) {
    const c = Math.cos(theta), s = Math.sin(theta);
    this.identity();
    this.elements[5]=c; this.elements[6]=-s;
    this.elements[9]=s; this.elements[10]=c;
    return this;
  }
  makeRotationY(theta) {
    const c = Math.cos(theta), s = Math.sin(theta);
    this.identity();
    this.elements[0]=c; this.elements[2]=s;
    this.elements[8]=-s; this.elements[10]=c;
    return this;
  }
  makeRotationZ(theta) {
    const c = Math.cos(theta), s = Math.sin(theta);
    this.identity();
    this.elements[0]=c; this.elements[1]=-s;
    this.elements[4]=s; this.elements[5]=c;
    return this;
  }
  makeScale(x, y, z) {
    this.identity();
    this.elements[0]=x; this.elements[5]=y; this.elements[10]=z;
    return this;
  }
  compose(position, quat, scale) {
    const te = this.elements;
    const x = quat.x, y = quat.y, z = quat.z, w = quat.w;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;
    const sx = scale.x, sy = scale.y, sz = scale.z;
    te[0] = (1 - (yy + zz)) * sx;
    te[1] = (xy + wz) * sx;
    te[2] = (xz - wy) * sx;
    te[3] = 0;
    te[4] = (xy - wz) * sy;
    te[5] = (1 - (xx + zz)) * sy;
    te[6] = (yz + wx) * sy;
    te[7] = 0;
    te[8] = (xz + wy) * sz;
    te[9] = (yz - wx) * sz;
    te[10] = (1 - (xx + yy)) * sz;
    te[11] = 0;
    te[12] = position.x;
    te[13] = position.y;
    te[14] = position.z;
    te[15] = 1;
    return this;
  }
}

/** Simple quaternion for rotation (only from Euler used here) */
export class Quaternion {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x; this.y = y; this.z = z; this.w = w;
  }
  setFromEuler(euler) {
    const x = euler.x * 0.5, y = euler.y * 0.5, z = euler.z * 0.5;
    const cx = Math.cos(x), cy = Math.cos(y), cz = Math.cos(z);
    const sx = Math.sin(x), sy = Math.sin(y), sz = Math.sin(z);
    this.x = sx * cy * cz - cx * sy * sz;
    this.y = cx * sy * cz + sx * cy * sz;
    this.z = cx * cy * sz - sx * sy * cz;
    this.w = cx * cy * cz + sx * sy * sz;
    return this;
  }
}

export class Euler {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x; this.y = y; this.z = z;
  }
}
