
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.159.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.159.0/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, controls, model;
let wireframe = false;
const canvasHolder = document.getElementById('canvasHolder');
const loadBtn = document.getElementById('loadBtn');
const fitBtn = document.getElementById('fitBtn');
const wireBtn = document.getElementById('wireBtn');
const hint = document.getElementById('hint');
const loaderEl = document.getElementById('loader');

function initScene(){
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, canvasHolder.clientWidth/canvasHolder.clientHeight, 0.01, 2000);
  camera.position.set(2.6,1.2,3.2);
  renderer = new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(canvasHolder.clientWidth, canvasHolder.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  canvasHolder.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xffffff,0x222b41,1.1); scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff,1.2); dir.position.set(3,4,5); scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0xaaccff,0.4); dir2.position.set(-3,2,-2); scene.add(dir2);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.07; controls.minDistance=0.2; controls.maxDistance=50;
  window.addEventListener('resize', onResize);
  animate();
}

function onResize(){ if(!camera || !renderer) return; camera.aspect = canvasHolder.clientWidth/canvasHolder.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(canvasHolder.clientWidth, canvasHolder.clientHeight); }

function animate(){ requestAnimationFrame(animate); if(controls) controls.update(); renderer.render(scene, camera); }

function setWire(root, enable){ root.traverse(obj=>{ if(obj.isMesh && obj.material){ if(Array.isArray(obj.material)){ obj.material.forEach(m=>{ m.wireframe = enable; m.needsUpdate = true; }); } else { obj.material.wireframe = enable; obj.material.needsUpdate = true; } } }); }

function fitToView(obj){ const box = new THREE.Box3().setFromObject(obj); const size = box.getSize(new THREE.Vector3()); const center = box.getCenter(new THREE.Vector3()); const maxDim = Math.max(size.x,size.y,size.z); const fov = camera.fov * (Math.PI/180); let camZ = Math.abs(maxDim/(2*Math.tan(fov/2))); camZ *= 1.6; camera.position.set(center.x+camZ*0.6, center.y+camZ*0.6, center.z+camZ*0.6); camera.near = camZ/100; camera.far = camZ*100; camera.updateProjectionMatrix(); controls.target.copy(center); controls.update(); }

function setView(view){ if(!model) return; const box = new THREE.Box3().setFromObject(model); const size = box.getSize(new THREE.Vector3()); const center = box.getCenter(new THREE.Vector3()); const dist = Math.max(size.x,size.y,size.z)*2.2; const pos = { front:new THREE.Vector3(center.x,center.y,center.z+dist), rear:new THREE.Vector3(center.x,center.y,center.z-dist), left:new THREE.Vector3(center.x-dist,center.y,center.z), right:new THREE.Vector3(center.x+dist,center.y,center.z), top:new THREE.Vector3(center.x,center.y+dist,center.z), iso:new THREE.Vector3(center.x+dist*0.8,center.y+dist*0.6,center.z+dist*0.8) }; const p = pos[view]; if(p){ camera.position.copy(p); controls.target.copy(center); controls.update(); } else { fitToView(model); } }

async function loadModel(){ if(!scene) initScene(); const loader = new GLTFLoader(); const url = './emdd-4unit3.glb'; return new Promise((resolve,reject)=>{ loader.load(url,(gltf)=>{ model = gltf.scene; scene.add(model); fitToView(model); hint.classList.remove('hidden'); loaderEl.classList.add('hidden'); resolve(model); },(xhr)=>{ /*progress*/ },(err)=>{ console.error(err); loaderEl.classList.add('hidden'); alert('Model load nahi hua — check path aur deploy config'); reject(err); }); }); }

// UI events
wireBtn?.addEventListener('click', ()=>{ if(!model) return; wireframe = !wireframe; setWire(model, wireframe); wireBtn.textContent = wireframe? 'Solid':'Wireframe'; });
fitBtn?.addEventListener('click', ()=>{ if(model) fitToView(model); });
document.querySelectorAll('[data-view]').forEach(btn=>{ btn.addEventListener('click', ()=>{ const view = btn.getAttribute('data-view'); if(view==='reset'){ if(model) fitToView(model); } else { setView(view); } }); });
loadBtn.addEventListener('click', async ()=>{ canvasHolder.classList.remove('hidden'); canvasHolder.setAttribute('aria-hidden','false'); loaderEl.classList.remove('hidden'); loadBtn.disabled = true; loadBtn.textContent = 'Loading...'; try{ await loadModel(); loadBtn.textContent = 'Loaded ✓'; } catch(e){ loadBtn.disabled = false; loadBtn.textContent = 'Load 3D Model'; } });
