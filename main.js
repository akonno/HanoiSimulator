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

// constants
const pillarDistance = 3.2;
const pillarDiameter = 0.2;
const pillarHeight = 3.0;
const diskThickness = 0.2;
const numDisks = 7;
const animNumSteps = 60;

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
ground.position.y = -0.5*pillarHeight - 0.05;
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
const pillarGeometry = new THREE.CylinderGeometry(0.5*pillarDiameter, 0.5*pillarDiameter, pillarHeight, 16);
const pillarTexture = new THREE.TextureLoader().load('public/textures/Wood051/Wood051_1K-JPG_Color.jpg');
pillarTexture.wrapS = THREE.RepeatWrapping;
pillarTexture.wrapT = THREE.RepeatWrapping;
pillarTexture.repeat.set(2, 1);
const pillarMaterial = new THREE.MeshLambertMaterial({map: pillarTexture, color: 0xcfcfcf});
const pillar = [];
for (let i = -1; i <= 1; ++i) {
    const p = new THREE.Mesh(pillarGeometry, pillarMaterial);
    p.position.x += pillarDistance*i;
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
for (let i = 0; i < numDisks; ++i) {
    const radius = 0.4 + 0.1 * i;
    const geometry = new THREE.CylinderGeometry(radius, radius, 0.2, 32);
    const material = new THREE.MeshLambertMaterial({map: diskTexture, color: diskColors[i % 7]});
    const d = new THREE.Mesh(geometry, material);
    d.position.x = -pillarDistance;
    d.position.y = -0.5*pillarHeight + diskThickness*(numDisks - i - 1 + 0.5);
    scene.add(d);
    disks.push(d);
}

// Camera position
// normal
camera.position.z = 6;
camera.position.y = 1;
// close view
// camera.position.z = 4;
// camera.position.y = 3;
// camera.rotation.x = -0.5;

const hoverHeight = 1.8;
let step = 0;
let compiledMotions = [];

function compile(commands) {
    // Parse commands and simulate disk motions
    compiledMotions = [];
    // First parse commands.
    const motionLines = commands.split("\n");
    const re = new RegExp("([ABC123])[, ]([ABC123])");
    const motions = [];
    let lineno = 1;
    let errorOccured = false;
    motionLines.forEach((line) => {
        if (line === '') {
            // empty line
            return; // continue
        }
        const m = line.match(re);
        if (m) {
            motions.push([m[1], m[2]]);
            // console.log(m[1], " -> ", m[2]);
        } else {
            app.errorMessage = 'error: cannot parse line ' + lineno;
            console.error(app.errorMessage);
            errorOccured = true;
        }
        ++lineno;
    });

    // Simulate disk motions.
    let towers = [ [], [], [] ];
    for (let i = 0; i < numDisks; ++i) {
        towers[0].push(numDisks - i - 1);
    }

    lineno = 1;
    motions.forEach((m) => {
        let p1 = 0, p2 = 0;
        if (m[0] === "1" || m[0] === "A") {
            p1 = 0;
        } else if (m[0] === "2" || m[0] === "B") {
            p1 = 1;
        } else if (m[0] === "3" || m[0] === "C") {
            p1 = 2;
        }
        if (m[1] === "1" || m[1] === "A") {
            p2 = 0;
        } else if (m[1] === "2" || m[1] === "B") {
            p2 = 1;
        } else if (m[1] === "3" || m[1] === "C") {
            p2 = 2;
        }

        if (towers[p1].length === 0) {
            app.errorMessage = 'error: tower ' + p1 + ' is empty at line ' + lineno;
            console.error(app.errorMessage);
            errorOccured = true;
            return;
        }
        const diskId = towers[p1].pop();
        const p2top = towers[p2][towers[p2].length - 1];
        if (towers[p2].length > 0 && p2top < diskId) {
            app.errorMessage = 'error: top disk of tower ' + p2 + ' is smaller than ' + diskId + ' at line ' + lineno;
            console.error(app.errorMessage);
            errorOccured = true;
            return;
        }
        compiledMotions.push([diskId, p1, p2, towers[p1].length + 1, towers[p2].length]);
        towers[p2].push(diskId);

        ++lineno;
    });

    app.numTotalSteps = compiledMotions.length;
    // console.log(compiledMotions);
    return !errorOccured;
}

function animate() {
    requestAnimationFrame(animate);

    // Motion
    if (app.playMode) {
        const animStep = parseInt(step / (3 * animNumSteps));
        const animStartStep = animStep * (3 * animNumSteps);
        app.currentMotionStep = animStep + 1 >= compiledMotions.length ? compiledMotions.length : animStep + 1;
        if (animStep >= compiledMotions.length) {
            app.playMode = false;
        } else {
            const disk = disks[compiledMotions[animStep][0]];
            const startX = pillarDistance * (compiledMotions[animStep][1] - 1);
            const startHeight = -0.5*pillarHeight + diskThickness * (compiledMotions[animStep][3] + 0.5);
            const endX = pillarDistance * (compiledMotions[animStep][2] - 1);
            const endHeight = -0.5*pillarHeight + diskThickness * (compiledMotions[animStep][4] + 0.5);
            // console.log(disk, startX, startHeight, endX, endHeight);
            if (step - animStartStep < animNumSteps) {
                const height = startHeight + (hoverHeight - startHeight) * (step - animStartStep) / animNumSteps;
                disk.position.x = startX;
                disk.position.y = height;
            }
            else if (step - animStartStep < 2 * animNumSteps) {
                const x = startX + (endX - startX) * ((step - animStartStep) - animNumSteps) / animNumSteps;
                disk.position.x = x;
                disk.position.y = hoverHeight;
            }
            else if (step - animStartStep < 3 * animNumSteps) {
                const height = endHeight + (hoverHeight - endHeight) * (3 * animNumSteps - (step - animStartStep)) / animNumSteps;
                disk.position.x = endX;
                disk.position.y = height;
            }

            ++step;
        }
    }

    renderer.render(scene, camera);
}

onResize();
window.addEventListener('resize', onResize);

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

const app = Vue.createApp({
  data() {
    return {
      playMode: false,
      compiled: false,
      compileError: false,
      errorMessage: "",
      currentMotionStep: 0,
      numTotalSteps: 0,
      motionCommands: "A,B\nA,C\nB,C\nA,B\nC,A\nC,B\nA,B"
    };
  },
  methods: {
    move()
    {
        if (!this.compiled) {
            this.compiled = compile(this.motionCommands);
        }
        if (!this.compiled) {
            this.compileError = true;
            this.playMode = false;
        } else {
            this.compileError = false;
            this.playMode = true;
        }
    },
    pause()
    {
        this.playMode = false;
    },
    restore()
    {
        this.playMode = false;
        // Restore all the disks to the initial positions.
        for (let i = 0; i < numDisks; ++i) {
            disks[i].position.x = -pillarDistance;
            disks[i].position.y = -0.5*pillarHeight + diskThickness*(numDisks - i - 1 + 0.5);
        }
        step = 0;
        this.currentMotionStep = 0;
    },
    commandChanged()
    {
        this.restore();
        this.compiled = false;
        this.currentMotionStep = this.numTotalSteps = 0;
    }
  }
}).mount('#app');

// Start visualization
// This should be after initializing app, because animate() uses app.playMode.
if (WebGL.isWebGLAvailable()) {
    animate();
} else {
    const warning = WebGL.getWebGLErrorMessage();
    document.getElementById('container').appendChild(warning);
}
