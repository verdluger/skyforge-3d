import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const viewer = document.getElementById('viewer');
const scene = new THREE.Scene();

// Camera Setup
const camera = new THREE.PerspectiveCamera(45, viewer.clientWidth / viewer.clientHeight, 0.1, 1000);
camera.position.set(2.5, 1.5, 2.5); 

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(viewer.clientWidth, viewer.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
viewer.appendChild(renderer.domElement);

// --- LIGHTING ---
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
mainLight.position.set(5, 10, 7);
scene.add(mainLight);

const backGlow = new THREE.PointLight(0x00f0ff, 2, 10);
backGlow.position.set(0, 0.5, 0);
scene.add(backGlow);

const grid = new THREE.GridHelper(20, 40, 0x222222, 0x111111);
grid.position.y = -0.5;
scene.add(grid);

let droneGroup = new THREE.Group();
let propellers = []; 
scene.add(droneGroup);

function buildDrone() {
    while(droneGroup.children.length > 0) droneGroup.remove(droneGroup.children[0]);
    propellers = []; 

    const type = document.getElementById('drone-type').value;
    const camType = document.getElementById('camera-type').value;
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.9, roughness: 0.1 });
    const motorMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff }); // Cyan Motors
    const propMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.6 });

    if (type === 'multi') {
        // --- MULTI-ROTOR ---
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 1.2), bodyMat);
        droneGroup.add(body);
        const armGeo = new THREE.BoxGeometry(2.5, 0.1, 0.1);
        const a1 = new THREE.Mesh(armGeo, bodyMat); a1.rotation.y = Math.PI/4; droneGroup.add(a1);
        const a2 = new THREE.Mesh(armGeo, bodyMat); a2.rotation.y = -Math.PI/4; droneGroup.add(a2);

        const propGeo = new THREE.BoxGeometry(1.1, 0.02, 0.1);
        [[0.9,0.2,0.9], [-0.9,0.2,0.9], [0.9,0.2,-0.9], [-0.9,0.2,-0.9]].forEach(pos => {
            const pGroup = new THREE.Group(); pGroup.position.set(...pos);
            const pMesh = new THREE.Mesh(propGeo, propMat); pGroup.add(pMesh);
            droneGroup.add(pGroup); propellers.push(pGroup);
        });
    } else {
        // --- FIXED-WING ---
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 3.5), bodyMat);
        droneGroup.add(body);
        
        const wingGeo = new THREE.BoxGeometry(4.5, 0.05, 0.8);
        const wings = new THREE.Mesh(wingGeo, bodyMat);
        wings.position.set(0, 0.1, 0.2); 
        droneGroup.add(wings);

        // ADDING 2 MOTORS ON WINGS
        const motorGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 16);
        const propGeo = new THREE.BoxGeometry(1.2, 0.02, 0.1);

        // Position motors on left and right wings
        [1.2, -1.2].forEach(xPos => {
            // Motor Housing
            const motor = new THREE.Mesh(motorGeo, motorMat);
            motor.position.set(xPos, 0.1, 0.5);
            motor.rotation.x = Math.PI / 2; // Face forward
            droneGroup.add(motor);

            // Propeller for each motor
            const pGroup = new THREE.Group();
            pGroup.position.set(xPos, 0.1, 0.7); // Slightly in front of motor
            const pMesh = new THREE.Mesh(propGeo, propMat);
            pGroup.add(pMesh);
            droneGroup.add(pGroup);
            propellers.push(pGroup);
        });
    }

    if (camType !== 'none') {
        let camColor = 0xffffff;
        if(camType === 'normal') camColor = 0xff0000;
        if(camType === 'thermal') camColor = 0x888888;
        if(camType === 'night') camColor = 0x00ff00;
        if(camType === 'pro') camColor = 0xffd700;

        const cam = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshStandardMaterial({ color: camColor, emissive: camColor, emissiveIntensity: 0.3 }));
        cam.position.set(0, -0.1, type === 'multi' ? 0.6 : 1.8);
        droneGroup.add(cam);
    }
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxDistance = 8;
controls.minDistance = 1.5;

function animate() {
    requestAnimationFrame(animate);
    // Rotating propellers (Z-axis rotation for fixed wing motors)
    const isMulti = document.getElementById('drone-type').value === 'multi';
    propellers.forEach(p => {
        if(isMulti) p.rotation.y += 0.4;
        else p.rotation.z += 0.4; // Fixed wing props spin like fans
    });
    controls.update();
    renderer.render(scene, camera);
}

document.getElementById('generate-btn').addEventListener('click', buildDrone);
window.addEventListener('resize', () => {
    camera.aspect = viewer.clientWidth / viewer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewer.clientWidth, viewer.clientHeight);
});

buildDrone();
animate();