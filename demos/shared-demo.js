import * as THREE from 'three';

export function createDemoShell({ background = '#020617', cameraPosition = [0, 65, 180] } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(...cameraPosition);
  camera.lookAt(0, 20, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let theta = 0;
  let radius = Math.hypot(camera.position.x, camera.position.z);
  let isDragging = false;
  let lastX = 0;
  let pitch = camera.position.y;

  renderer.domElement.addEventListener('pointerdown', (event) => {
    isDragging = true;
    lastX = event.clientX;
  });
  window.addEventListener('pointerup', () => {
    isDragging = false;
  });
  window.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    theta += (event.clientX - lastX) * 0.005;
    lastX = event.clientX;
    camera.position.x = Math.sin(theta) * radius;
    camera.position.z = Math.cos(theta) * radius;
    camera.position.y = pitch;
    camera.lookAt(0, 20, 0);
  });
  window.addEventListener('wheel', (event) => {
    radius = THREE.MathUtils.clamp(radius + event.deltaY * 0.05, 60, 420);
    camera.position.x = Math.sin(theta) * radius;
    camera.position.z = Math.cos(theta) * radius;
    camera.lookAt(0, 20, 0);
  }, { passive: true });

  return { scene, camera, renderer };
}

export function addOverlay(title, details) {
  const overlay = document.createElement('div');
  overlay.innerHTML = `<strong>${title}</strong><span>${details}</span>`;
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '16px',
    left: '16px',
    display: 'grid',
    gap: '6px',
    padding: '12px 16px',
    background: 'rgba(2, 6, 23, 0.72)',
    color: '#e2e8f0',
    border: '1px solid rgba(125, 211, 252, 0.35)',
    borderRadius: '14px',
    fontFamily: 'Inter, system-ui, sans-serif',
    backdropFilter: 'blur(12px)',
    zIndex: '5'
  });
  document.body.appendChild(overlay);
}
