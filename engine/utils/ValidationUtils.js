import * as THREE from 'three';

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function mergeOptions(defaults, overrides = {}) {
  const result = { ...defaults };

  if (!isPlainObject(overrides)) {
    return result;
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (isPlainObject(value) && isPlainObject(defaults[key])) {
      result[key] = mergeOptions(defaults[key], value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

export function toFiniteNumber(value, fallback, name, { min = -Infinity, max = Infinity, integer = false } = {}) {
  const numericValue = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

  if (!Number.isFinite(numericValue)) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new TypeError(`${name} must be a finite number.`);
  }

  const normalized = integer ? Math.round(numericValue) : numericValue;

  if (normalized < min || normalized > max) {
    if (fallback !== undefined) {
      return clamp(normalized, min, max);
    }
    throw new RangeError(`${name} must be between ${min} and ${max}.`);
  }

  return normalized;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function ensurePositiveNumber(value, fallback, name, { allowZero = false } = {}) {
  const min = allowZero ? 0 : Number.EPSILON;
  return toFiniteNumber(value, fallback, name, { min });
}

export function ensureVector3(value, fallback = new THREE.Vector3(), name = 'Vector3') {
  if (value instanceof THREE.Vector3) {
    return value.clone();
  }

  if (Array.isArray(value) && value.length >= 3) {
    const [x, y, z] = value;
    return new THREE.Vector3(
      toFiniteNumber(x, fallback.x, `${name}.x`),
      toFiniteNumber(y, fallback.y, `${name}.y`),
      toFiniteNumber(z, fallback.z, `${name}.z`)
    );
  }

  if (isPlainObject(value) && 'x' in value && 'y' in value && 'z' in value) {
    return new THREE.Vector3(
      toFiniteNumber(value.x, fallback.x, `${name}.x`),
      toFiniteNumber(value.y, fallback.y, `${name}.y`),
      toFiniteNumber(value.z, fallback.z, `${name}.z`)
    );
  }

  return fallback.clone();
}

export function ensureColorString(value, fallback, name = 'color') {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (value instanceof THREE.Color) {
    return `#${value.getHexString()}`;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new TypeError(`${name} must be a CSS color string or THREE.Color.`);
}

export function ensureTypedArray(value, name) {
  if (ArrayBuffer.isView(value)) {
    return value;
  }

  throw new TypeError(`${name} must be a typed array.`);
}

export function ensureBrowserApi(name, predicate) {
  if (!predicate()) {
    throw new Error(`${name} is unavailable in the current environment.`);
  }
}

export function noop() {}
