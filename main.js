// 3D animation of the towers of Hanoi
// Copyright (C) 2024 KONNO Akihisa <konno@researchers.jp>

import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import * as Vue from 'https://cdn.jsdelivr.net/npm/vue@3.2/dist/vue.esm-browser.js';

// scene, camera and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, 16./9.,
    0.1, 1000
);
const renderer = new THREE.WebGLRenderer({antialias: true});

const width = window.innerWidth;
renderer.setSize(width, width / 16 * 9);
document.getElementById("canvas").appendChild(renderer.domElement);

// Light
const light1 = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(light1);
const light2 = new THREE.DirectionalLight(0xffffff, 1);
light2.position.x = 10;
light2.position.y = 4;
light2.position.z = 10;
scene.add(light2);

// Ground
const groundGeometry = new THREE.BoxGeometry(2200, 0.1, 2200);
const groundTexture = new THREE.TextureLoader().load('public/textures/PavingStones128/PavingStones128_1K-JPG_Color.jpg');
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(1100, 1100);
const groundMaterial = new THREE.MeshLambertMaterial({map: groundTexture});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.y = -1.5 - 0.05;
scene.add(ground);

// Sky
const skyGeometry = new THREE.BoxGeometry(2200, 0.1, 2200);
const skyTexture = new THREE.TextureLoader().load('public/textures/cloudy-watercolor-background/4.jpg');
skyTexture.wrapS = THREE.RepeatWrapping;
skyTexture.wrapT = THREE.RepeatWrapping;
skyTexture.repeat.set(1, 1);
const skyMaterial = new THREE.MeshBasicMaterial({map: skyTexture});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
sky.position.y = 15.0;
scene.add(sky);

// Far walls
const wallGeometry = new THREE.BoxGeometry(2200, 2200, 0.1);
const wallMaterial = new THREE.MeshBasicMaterial({map: skyTexture});
const wall = new THREE.Mesh(wallGeometry, wallMaterial);
wall.position.z = -200;
scene.add(wall);

// Pillars
const pillarGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 16);
const pillarTexture = new THREE.TextureLoader().load('public/textures/Wood051/Wood051_1K-JPG_Color.jpg');
pillarTexture.wrapS = THREE.RepeatWrapping;
pillarTexture.wrapT = THREE.RepeatWrapping;
pillarTexture.repeat.set(2, 1);
const pillarMaterial = new THREE.MeshLambertMaterial({map: pillarTexture, color: 0xcfcfcf});
const pillar = [];
for (let i = -1; i <= 1; ++i) {
    const p = new THREE.Mesh(pillarGeometry, pillarMaterial);
    p.position.x += 3.2*i;
    scene.add(p);    
    pillar.push(p);
}

// Disks
const diskColors = [
    0xe69f00, 0x56b4e9, 0x009e73, 0xf0e442, 0x0072b2, 0xd55e00, 0xcc79a7
];
const diskTexture = new THREE.TextureLoader().load('public/textures/Travertine009/Travertine009_1K-JPG_Color.jpg');
diskTexture.wrapS = THREE.RepeatWrapping;
diskTexture.wrapT = THREE.RepeatWrapping;
diskTexture.repeat.set(2, 2);
const disks = [];
for (let i = 0; i < 7; ++i) {
    const radius = 0.4 + 0.1 * i;
    const geometry = new THREE.CylinderGeometry(radius, radius, 0.2, 32);
    const material = new THREE.MeshLambertMaterial({map: diskTexture, color: diskColors[i % 7]});
    const d = new THREE.Mesh(geometry, material);
    d.position.x = -3.2;
    d.position.y = -1.5 + 0.2*(7 - i - 1 + 0.5);
    scene.add(d);
    disks.push(d);
}

camera.position.z = 6;
camera.position.y = 1;

const y0 = disks[0].position.y;
let animating = false;
let step = 0;

function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
}

onResize();
window.addEventListener('resize', onResize);

if (WebGL.isWebGLAvailable()) {
    animate();
} else {
    const warning = WebGL.getWebGLErrorMessage();
    document.getElementById('container').appendChild(warning);
}

function onResize()
{
    const width = window.innerWidth;
    const height = width / 16 * 9;

    // レンダラーのサイズを調整する
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

  // カメラのアスペクト比を正す
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

Vue.createApp({
  data() {
    return {
      playMode: false,
      motionCommands: "A,B\nA,C\nB,C\nA,B\nC,A\nC,B\nA,B"
    };
  },
  methods: {
    move()
    {
        this.playMode = true;
        disks[0].position.x = 0;
    },
    pause()
    {
        this.playMode = false;
        disks[0].position.x = -3.2;
    },
    restore()
    {
        this.playMode = false;
        disks[0].position.x = -3.2;
    }
  }
}).mount('#app');
