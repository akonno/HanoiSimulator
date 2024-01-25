// 3D animation of the towers of Hanoi
// Copyright (C) 2024 KONNO Akihisa <konno@researchers.jp>

/*
MIT License

Copyright (c) 2024 KONNO Akihisa <konno@researchers.jp>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';

// Vue I18n
const messages = {
    en: {
        message: {
            hanoisimulatortitle: 'The Tower of Hanoi Simulator',
            hanoisimulatordesc: 'Here is the Hanoi Tower Simulator (Web version). Instructions are at the bottom of the page.',
            controller: 'Controller',
            motioncommands: 'Motion commands',
            reset: 'Reset',
            play: 'Run simulation',
            pause: 'Pause',
            moveIfError: 'Move until error',
            step: 'Step',
            screenshot: 'Take screenshot'
        },
    },
    ja: {
        message: {
            hanoisimulatortitle: 'ハノイの塔シミュレータ',
            hanoisimulatordesc: 'ハノイの塔シミュレータ（Web版）です．使い方は画面の下部にあります．',
            controller: 'シミュレータ制御',
            motioncommands: '動作指示',
            reset: '最初に戻る',
            play: '実行',
            pause: '一時停止',
            moveIfError: 'エラーの場所まで実行',
            step: 'ステップ',
            screenshot: '画像を保存'
        },
    }
};

const i18n = createI18n({
    locale: navigator.language.split('-')[0],
    fallbackLocale: 'en',
    messages,
});

// setup Vue app
const app = createApp({
    data() {
      return {
        playMode: false,
        compiled: false,
        errorOccured: false,
        errorMessage: "",
        currentMotionStep: 0,
        numTotalSteps: 0,
        finished: false,
        motionCommands: "A,B\nA,C\nB,C\nA,B\nC,A\nC,B\nA,B",
        selectedLocale: ''
      };
    },
    methods: {
      play()
      {
          if (!this.compiled) {
              this.compiled = compile(this.motionCommands);
          }
          if (!this.compiled) {
              this.errorOccured = true;
              this.playMode = false;
          } else {
              this.errorOccured = false;
              this.playMode = true;
              // console.time('Execution Time');
          }
      },
      pause()
      {
          this.playMode = false;
      },
      restore()
      {
          this.playMode = false;
          // Restore all the discs to the initial positions.
          for (let i = 0; i < numDiscs; ++i) {
              discs[i].position.x = -pillarDistance;
              discs[i].position.y = -0.5*pillarHeight + discThickness*(numDiscs - i - 1 + 0.5);
          }
          step = 0;
          this.currentMotionStep = 0;
          this.finished = false;
      },
      moveIfError()
      {
        if (this.errorOccured == false) {
            // Called with no error; program bug?
            console.error('error: moveIfError called with errorOccured == false');
            return;
        }
        this.playMode = true;
      },
      commandChanged()
      {
          this.restore();
          this.compiled = this.errorOccured = false;
          this.currentMotionStep = this.numTotalSteps = 0;
          this.finished = false;
      },
      canvasClicked()
      {
        if (this.playMode === true) {
            // pause
            this.playMode = false;
        } else if (this.errorOccured == false) {
            this.play();
        } else if (!this.finished) {
            // error occured but can run.
            this.playMode = true;
        }
      },
      takeScreenShot()
      {
        // https://jsfiddle.net/n853mhwo/
        var a = document.createElement('a');
        // Without 'preserveDrawingBuffer' set to true, we must render now
        renderer.render(scene, camera);
        a.href = renderer.domElement.toDataURL().replace("image/png", "image/octet-stream");
        a.download = 'screenshot.png';
        a.click();
      },
      switchLocale()
      {
        this.$i18n.locale = this.selectedLocale;
        // console.log('locale is changed to ', this.$i18n.locale);
      }
    }
  }).use(i18n).mount("#app");

// The tower of Hanoi visualization/animation
// scene, camera and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, 16./9.,
    0.1, 1000
);
const renderer = new THREE.WebGLRenderer({antialias: true});

const width = document.getElementById("canvas").scrollWidth;
renderer.setSize(width, width / 16 * 9);
document.getElementById("canvas").appendChild(renderer.domElement);

// constants
const numDiscsDefault = 7;
const pillarDiameter = 0.2;
const discThickness = 0.2;
const animNumSteps = 60;

// number of discs: can specify from URL
let numDiscs = numDiscsDefault;
let uri = window.location.href.split('?');
if(uri.length == 2) {
    let vars = uri[1].split('&');
    let parsedVars = { 'numDiscs' : numDiscsDefault };
    let tmp = '';
    vars.forEach(function(v) {
        tmp = v.split('=');
        if(tmp.length == 2) {
            if (tmp[0] === 'numDiscs') {
                parsedVars[tmp[0]] = parseInt(tmp[1]);
            } else {
                console.warn('warning: irregal query parameter', tmp[0], 'is specified (ignored).');
            }

        }
    });
    // console.log(parsedVars);
    if (1 < parsedVars.numDiscs) {
        numDiscs = parsedVars.numDiscs;
    } else {
        console.warn('warning: numDiscs in query should be >2 but is <= 1');
    }
}

// calculate visualization parameters such as the length of pillars and distance between them.
const pillarHeight = (numDiscs + 2) * discThickness >= 3.0 ? (numDiscs + 2) * discThickness : 3.0;
const largestDiscRadius = 0.4 + 0.1 * (numDiscs - 1);
const pillarDistance = 2 * largestDiscRadius + 0.2 > 3.2 ? 2 * largestDiscRadius + 0.2 : 3.2;
const hoverHeight = 0.5 * pillarHeight + 3 * discThickness > 1.8 ? 0.5 * pillarHeight + 3 * discThickness : 1.8;
const cameraZ = 0.35 * numDiscs > 6 ? 0.35 * numDiscs : 6;

// Light
const light1 = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(light1);
const light2 = new THREE.DirectionalLight(0xffffff, 1);
light2.position.x = 10;
light2.position.y = 4;
light2.position.z = 10;
scene.add(light2);

// Ground
const groundGeometry = new THREE.BoxGeometry(5000, 0.1, 2200);
const groundTexture = new THREE.TextureLoader().load('public/textures/PavingStones128/PavingStones128_1K-JPG_Color.jpg');
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(2500, 1100);
const groundMaterial = new THREE.MeshLambertMaterial({map: groundTexture});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.y = -0.5*pillarHeight - 0.05;
scene.add(ground);

// Sky
const skyGeometry = new THREE.BoxGeometry(5000, 0.1, 2200);
const skyTexture = new THREE.TextureLoader().load('public/textures/skytile1.png');
skyTexture.wrapS = THREE.RepeatWrapping;
skyTexture.wrapT = THREE.RepeatWrapping;
skyTexture.repeat.set(20, 8);
const skyMaterial = new THREE.MeshBasicMaterial({map: skyTexture});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
sky.position.y = 15.0;
sky.rotation.x = -0.016;
scene.add(sky);

// Far walls
// const wallGeometry = new THREE.BoxGeometry(2200, 2200, 0.1);
// const wallMaterial = new THREE.MeshBasicMaterial({map: skyTexture});
// const wall = new THREE.Mesh(wallGeometry, wallMaterial);
// wall.position.y = - 1100 + 15
// wall.position.z = -200;
// scene.add(wall);

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

// discs
const discColors = [
    0xe69f00, 0x56b4e9, 0x009e73, 0xf0e442, 0x0072b2, 0xd55e00, 0xcc79a7
];
const discTexture = new THREE.TextureLoader().load('public/textures/Travertine009/Travertine009_1K-JPG_Color.jpg');
discTexture.wrapS = THREE.RepeatWrapping;
discTexture.wrapT = THREE.RepeatWrapping;
discTexture.repeat.set(2, 2);
const discs = [];
for (let i = 0; i < numDiscs; ++i) {
    const radius = 0.4 + 0.1 * i;
    const geometry = new THREE.CylinderGeometry(radius, radius, 0.2, 32);
    const material = new THREE.MeshLambertMaterial({map: discTexture, color: discColors[i % 7]});
    const d = new THREE.Mesh(geometry, material);
    d.position.x = -pillarDistance;
    d.position.y = -0.5*pillarHeight + discThickness*(numDiscs - i - 1 + 0.5);
    scene.add(d);
    discs.push(d);
}

// Camera position
// normal
camera.position.z = cameraZ;
camera.position.y = 1;
// close view
// camera.position.z = 4;
// camera.position.y = 3;
// camera.rotation.x = -0.5;

let step = 0;
let compiledMotions = [];
let errorLine = -1;

function compile(commands) {
    // Parse commands and simulate disc motions
    compiledMotions = [];
    errorLine = -1;
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
            if (!errorOccured) {
                app.errorMessage = 'error: cannot parse line ' + lineno;
                errorLine = lineno - 1;
            }
            console.error(app.errorMessage);
            errorOccured = true;
        }
        ++lineno;
    });
    app.numTotalSteps = motionLines.length;

    // Simulate disc motions.
    let towers = [ [], [], [] ];
    for (let i = 0; i < numDiscs; ++i) {
        towers[0].push(numDiscs - i - 1);
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
            if (!errorOccured) {
                app.errorMessage = 'error: tower ' + ['A', 'B', 'C'][p1] + ' is empty at line ' + lineno;
                errorLine = lineno - 1;
            }
            console.error(app.errorMessage);
            errorOccured = true;
            return;
        }
        const discId = towers[p1].pop();
        const p2top = towers[p2][towers[p2].length - 1];
        compiledMotions.push([discId, p1, p2, towers[p1].length + 1, towers[p2].length]);
        if (p1 == p2) {
            if (!errorOccured) {
                app.errorMessage = 'error: the disc is not moved on tower ' + ['A', 'B', 'C'][p1] + ' at line ' + lineno;
                errorLine = lineno;
            }
            console.error(app.errorMessage);
            errorOccured = true;
            return;
        } else if (towers[p2].length > 0 && p2top < discId) {
            if (!errorOccured) {
                app.errorMessage = 'error: the size of disc at the top of tower ' + ['A', 'B', 'C'][p2] + ' is ' + (p2top+1) + ', smaller than ' + (discId+1) + ' at line ' + lineno;
                errorLine = lineno;
            }
            console.error(app.errorMessage);
            errorOccured = true;
            return;
        }
        towers[p2].push(discId);

        ++lineno;
    });

    // console.log(compiledMotions);
    return !errorOccured;
}

function animate() {
    requestAnimationFrame(animate);

    // Motion
    if (app.playMode) {
        const animStep = parseInt(step / (3 * animNumSteps));
        const animStartStep = animStep * (3 * animNumSteps);
        const finalStep = errorLine >= 0 ? errorLine : compiledMotions.length;
        app.currentMotionStep = animStep + 1 >= compiledMotions.length ? compiledMotions.length : animStep + 1;
        if (animStep >= finalStep) {
            app.playMode = false;
            app.finished = true;
            // console.timeEnd('Execution Time');
        } else {
            app.finished = false;
            const disc = discs[compiledMotions[animStep][0]];
            const startX = pillarDistance * (compiledMotions[animStep][1] - 1);
            const startHeight = -0.5*pillarHeight + discThickness * (compiledMotions[animStep][3] + 0.5);
            const endX = pillarDistance * (compiledMotions[animStep][2] - 1);
            const endHeight = -0.5*pillarHeight + discThickness * (compiledMotions[animStep][4] + 0.5);
            // console.log(disc, startX, startHeight, endX, endHeight);
            if (step - animStartStep < animNumSteps) {
                const height = startHeight + (hoverHeight - startHeight) * (step - animStartStep) / animNumSteps;
                disc.position.x = startX;
                disc.position.y = height;
            }
            else if (step - animStartStep < 2 * animNumSteps) {
                const x = startX + (endX - startX) * ((step - animStartStep) - animNumSteps) / animNumSteps;
                disc.position.x = x;
                disc.position.y = hoverHeight;
            }
            else if (step - animStartStep < 3 * animNumSteps) {
                const height = endHeight + (hoverHeight - endHeight) * (3 * animNumSteps - (step - animStartStep)) / animNumSteps;
                disc.position.x = endX;
                disc.position.y = height;
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
    const width = document.getElementById("controllerBox").scrollWidth;
    const height = width / 16 * 9;

    // レンダラーのサイズを調整する
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

  // カメラのアスペクト比を正す
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

// Start visualization
// This should be after initializing app, because animate() uses app.playMode.
if (WebGL.isWebGLAvailable()) {
    animate();
} else {
    app.errorMessage = WebGL.getWebGLErrorMessage();
    app.errorOccured = true;
}
