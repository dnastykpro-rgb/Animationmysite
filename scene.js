// === ЧАСТЬ 1: НАСТРОЙКИ СЦЕНЫ И МИР ===
const DURATION = 22.0;
let currentTime = 0;
let isPlaying = true;
let isRecording = false;
let aspectMode = '9:16';

const outputCanvas = document.getElementById('outputCanvas');
const ctx2d = outputCanvas.getContext('2d');

const glCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7cc4ff);
scene.fog = new THREE.FogExp2(0x9bd6ff, 0.016);

const camera = new THREE.PerspectiveCamera(48, 720 / 1280, 0.1, 200);

// Освещение
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x4a7c59, 0.85);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xfff5d6, 1.3);
dirLight.position.set(18, 32, 15);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 80;
const d = 22;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
scene.add(dirLight);

// Генератор пиксельных текстур
function createPixelTexture(drawFn, size = 16) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const cx = c.getContext('2d');
    drawFn(cx, size);
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
}

const texGrassTop = createPixelTexture((cx) => {
    cx.fillStyle = '#5da832'; cx.fillRect(0, 0, 16, 16);
    for (let i = 0; i < 40; i++) {
        cx.fillStyle = Math.random() > 0.5 ? '#6ec23e' : '#4d8f28';
        cx.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 1, 1);
    }
});

const texGrassSide = createPixelTexture((cx) => {
    cx.fillStyle = '#79553a'; cx.fillRect(0, 0, 16, 16);
    for (let i = 0; i < 45; i++) {
        cx.fillStyle = Math.random() > 0.5 ? '#8c6446' : '#61432d';
        cx.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 1, 1);
    }
    cx.fillStyle = '#5da832'; cx.fillRect(0, 0, 16, 4);
    for (let x = 0; x < 16; x++) {
        if (x % 2 === 0) cx.fillRect(x, 4, 1, 2);
    }
});

const texDirt = createPixelTexture((cx) => {
    cx.fillStyle = '#79553a'; cx.fillRect(0, 0, 16, 16);
    for (let i = 0; i < 50; i++) {
        cx.fillStyle = Math.random() > 0.5 ? '#8c6446' : '#5e402b';
        cx.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 1, 1);
    }
});

const texStone = createPixelTexture((cx) => {
    cx.fillStyle = '#7d7d7d'; cx.fillRect(0, 0, 16, 16);
    for (let i = 0; i < 60; i++) {
        cx.fillStyle = Math.random() > 0.5 ? '#919191' : '#666666';
        cx.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 2, 1);
    }
});

const texWood = createPixelTexture((cx) => {
    cx.fillStyle = '#6b5132'; cx.fillRect(0, 0, 16, 16);
    cx.fillStyle = '#523d24';
    for (let x = 1; x < 16; x += 3) cx.fillRect(x, 0, 1, 16);
});

const texPlanks = createPixelTexture((cx) => {
    cx.fillStyle = '#a8844c'; cx.fillRect(0, 0, 16, 16);
    cx.fillStyle = '#876838';
    cx.fillRect(0, 3, 16, 1); cx.fillRect(0, 7, 16, 1); cx.fillRect(0, 11, 16, 1); cx.fillRect(0, 15, 16, 1);
});

const texLeaves = createPixelTexture((cx) => {
    cx.fillStyle = '#3c8527'; cx.fillRect(0, 0, 16, 16);
    for (let i = 0; i < 55; i++) {
        cx.fillStyle = Math.random() > 0.5 ? '#4ea334' : '#2b631b';
        cx.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 2, 2);
    }
});

const matGrass = [
    new THREE.MeshLambertMaterial({ map: texGrassSide }),
    new THREE.MeshLambertMaterial({ map: texGrassSide }),
    new THREE.MeshLambertMaterial({ map: texGrassTop }),
    new THREE.MeshLambertMaterial({ map: texDirt }),
    new THREE.MeshLambertMaterial({ map: texGrassSide }),
    new THREE.MeshLambertMaterial({ map: texGrassSide })
];
const matDirt = new THREE.MeshLambertMaterial({ map: texDirt });
const matStone = new THREE.MeshLambertMaterial({ map: texStone });
const matWood = new THREE.MeshLambertMaterial({ map: texWood });
const matPlanks = new THREE.MeshLambertMaterial({ map: texPlanks });
const matLeaves = new THREE.MeshLambertMaterial({ map: texLeaves });
const matLantern = new THREE.MeshBasicMaterial({ color: 0xffd54f });

// Построение парящего мира
const worldGroup = new THREE.Group();
scene.add(worldGroup);
const blockGeo = new THREE.BoxGeometry(1, 1, 1);

function addBlock(x, y, z, mat) {
    const m = new THREE.Mesh(blockGeo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    worldGroup.add(m);
    return m;
}

// Остров 1
for (let x = -3; x <= 3; x++) {
    for (let z = -2; z <= 3; z++) {
        if (Math.abs(x) === 3 && Math.abs(z) === 3) continue;
        addBlock(x, -0.5, z, matGrass);
        addBlock(x, -1.5, z, matDirt);
        if (Math.abs(x) <= 2 && Math.abs(z) <= 2) addBlock(x, -2.5, z, matStone);
        if (Math.abs(x) <= 1 && Math.abs(z) <= 1) addBlock(x, -3.5, z, matStone);
    }
}

// Дерево на Острове 1
for (let y = 0.5; y <= 3.5; y++) addBlock(-2, y, -1, matWood);
for (let lx = -3; lx <= -1; lx++) {
    for (let lz = -2; lz <= 0; lz++) {
        for (let ly = 3.5; ly <= 4.5; ly++) {
            if (lx === -2 && lz === -1 && ly === 3.5) continue;
            addBlock(lx, ly, lz, matLeaves);
        }
    }
}
addBlock(-2, 5.5, -1, matLeaves);

// Мостик с фонарями
for (let z = 4; z <= 9; z++) {
    addBlock(-1, -0.5, z, matPlanks);
    addBlock(0, -0.5, z, matPlanks);
    addBlock(1, -0.5, z, matPlanks);
    if (z % 3 === 1) {
        const postGeo = new THREE.BoxGeometry(0.25, 1.2, 0.25);
        const p1 = new THREE.Mesh(postGeo, matWood); p1.position.set(-1.3, 0.5, z); worldGroup.add(p1);
        const p2 = new THREE.Mesh(postGeo, matWood); p2.position.set(1.3, 0.5, z); worldGroup.add(p2);
        const lGeo = new THREE.BoxGeometry(0.35, 0.4, 0.35);
        const l1 = new THREE.Mesh(lGeo, matLantern); l1.position.set(-1.3, 1.2, z); worldGroup.add(l1);
        const l2 = new THREE.Mesh(lGeo, matLantern); l2.position.set(1.3, 1.2, z); worldGroup.add(l2);
    }
}

// Остров 2
for (let x = -4; x <= 4; x++) {
    for (let z = 10; z <= 16; z++) {
        if (Math.abs(x) === 4 && (z === 10 || z === 16)) continue;
        addBlock(x, -0.5, z, matGrass);
        addBlock(x, -1.5, z, matDirt);
        if (Math.abs(x) <= 2 && z >= 11 && z <= 15) addBlock(x, -2.5, z, matStone);
        if (Math.abs(x) <= 1 && z >= 12 && z <= 14) addBlock(x, -3.5, z, matStone);
    }
}

// Дерево и кристалл на Острове 2
for (let y = 0.5; y <= 4.5; y++) addBlock(3, y, 12, matWood);
for (let lx = 2; lx <= 4; lx++) {
    for (let lz = 11; lz <= 13; lz++) {
        for (let ly = 4.5; ly <= 5.5; ly++) addBlock(lx, ly, lz, matLeaves);
    }
}
const crystalMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.7 });
const crystal1 = new THREE.Mesh(new THREE.OctahedronGeometry(0.55), crystalMat);
crystal1.position.set(-3, 0.6, 13);
worldGroup.add(crystal1);
// === ЧАСТЬ 2: ОБЛАКА, 3D-ПЛАШКИ И ПЕРСОНАЖ ===
const bgIslands = [];
const islandCoords = [
    [-14, 2, 6],
    [15, -1, 10],
    [-12, 5, 22]
];
islandCoords.forEach((coord) => {
    const ix = coord.at(0), iy = coord.at(1), iz = coord.at(2);
    const g = new THREE.Group();
    for (let x = -2; x <= 2; x++) {
        for (let z = -2; z <= 2; z++) {
            const b = new THREE.Mesh(blockGeo, matGrass); b.position.set(x, 0, z); g.add(b);
            if (Math.abs(x) <= 1 && Math.abs(z) <= 1) {
                const s = new THREE.Mesh(blockGeo, matStone); s.position.set(x, -1, z); g.add(s);
            }
        }
    }
    g.position.set(ix, iy, iz);
    scene.add(g);
    bgIslands.push({ mesh: g, baseY: iy, phase: Math.random() * 6 });
});

const clouds = [];
const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.88 });
for (let i = 0; i < 18; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(4 + Math.random()*5, 0.8, 2 + Math.random()*3), cloudMat);
    c.position.set((Math.random()-0.5)*55, 8 + Math.random()*12, -10 + Math.random()*55);
    scene.add(c);
    clouds.push(c);
}

// 3D-плашки в мире
function create3DBanner(text, bgColor, borderColor, subtext = '') {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 160;
    const cx = c.getContext('2d');

    cx.fillStyle = bgColor;
    cx.fillRect(8, 8, 496, 144);
    cx.strokeStyle = borderColor;
    cx.lineWidth = 10;
    cx.strokeRect(8, 8, 496, 144);

    cx.fillStyle = '#ffffff';
    cx.font = 'bold 42px "Press Start 2P", monospace';
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    cx.fillText(text, 256, subtext ? 62 : 82);

    if (subtext) {
        cx.fillStyle = '#fde047';
        cx.font = 'bold 20px "Press Start 2P", monospace';
        cx.fillText(subtext, 256, 118);
    }

    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
    return new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.0), mat);
}

const bannerTitle = create3DBanner('AETHERFALL', 'rgba(15, 23, 42, 0.88)', '#38bdf8', 'SMP SERVER');
bannerTitle.position.set(0, 3.3, 0.5);
scene.add(bannerTitle);

const bannerVer1 = create3DBanner('1.21.11', 'rgba(15, 23, 42, 0.9)', '#4ade80', 'JAVA EDITION');
bannerVer1.position.set(1.85, 2.35, 13.5);
bannerVer1.rotation.y = -0.25;
bannerVer1.scale.set(0, 0, 0);
scene.add(bannerVer1);

const bannerVer2 = create3DBanner('26.2', 'rgba(15, 23, 42, 0.9)', '#facc15', 'ПОДДЕРЖКА');
bannerVer2.position.set(1.85, 1.35, 13.5);
bannerVer2.rotation.y = -0.25;
bannerVer2.scale.set(0, 0, 0);
scene.add(bannerVer2);

// Стандартный скин персонажа
function createDefaultSkinCanvas() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const cx = c.getContext('2d');
    cx.fillStyle = '#f5cba7'; cx.fillRect(0, 0, 64, 64);
    cx.fillStyle = '#3b2818';
    cx.fillRect(0, 0, 32, 8);
    cx.fillRect(8, 8, 8, 3);
    cx.fillRect(0, 8, 8, 8);
    cx.fillRect(16, 8, 16, 8);
    cx.fillStyle = '#0284c7'; cx.fillRect(16, 16, 24, 16);
    cx.fillStyle = '#38bdf8'; cx.fillRect(20, 20, 8, 8);
    cx.fillStyle = '#0369a1'; cx.fillRect(40, 16, 16, 12);
    cx.fillStyle = '#f5cba7'; cx.fillRect(40, 28, 16, 4);
    cx.fillStyle = '#1e293b'; cx.fillRect(0, 16, 16, 16);
    return c;
}

const skinTexture = new THREE.CanvasTexture(createDefaultSkinCanvas());
skinTexture.magFilter = THREE.NearestFilter;
skinTexture.minFilter = THREE.NearestFilter;

function createSkinBox(w, h, d, u, v, tex) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const uv = geo.attributes.uv;
    const tw = 64, th = 64;
    function setFace(faceIdx, x, y, fw, fh) {
        const u0 = x / tw, v0 = 1 - (y + fh) / th;
        const u1 = (x + fw) / tw, v1 = 1 - y / th;
        const i = faceIdx * 4;
        uv.setXY(i, u0, v1); uv.setXY(i+1, u1, v1);
        uv.setXY(i+2, u0, v0); uv.setXY(i+3, u1, v0);
    }
    setFace(0, u + d + w, v + d, d, h);
    setFace(1, u, v + d, d, h);
    setFace(2, u + d, v, w, d);
    setFace(3, u + d + w, v, w, d);
    setFace(4, u + d, v + d, w, h);
    setFace(5, u + d*2 + w, v + d, w, h);
    uv.needsUpdate = true;

    const mat = new THREE.MeshLambertMaterial({ map: tex });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    return mesh;
}

const playerRoot = new THREE.Group();
scene.add(playerRoot);

const bodyMesh = createSkinBox(0.5, 0.75, 0.25, 16, 16, skinTexture);
bodyMesh.position.y = 1.125;
playerRoot.add(bodyMesh);

const headPivot = new THREE.Group();
headPivot.position.set(0, 1.5, 0);
playerRoot.add(headPivot);

const headMesh = createSkinBox(0.5, 0.5, 0.5, 0, 0, skinTexture);
headMesh.position.y = 0.25;
headPivot.add(headMesh);

// Лицевая мимика
const faceGroup = new THREE.Group();
faceGroup.position.set(0, 0.25, 0.255);
headPivot.add(faceGroup);

const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
const browMat = new THREE.MeshBasicMaterial({ color: 0x2b1b0e });
const mouthMat = new THREE.MeshBasicMaterial({ color: 0x450a0a });

function makeEye(x) {
    const g = new THREE.Group();
    g.position.set(x, 0.02, 0);
    const white = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.065), eyeWhiteMat);
    const pupil = new THREE.Mesh(new THREE.PlaneGeometry(0.055, 0.065), pupilMat);
    pupil.position.z = 0.002;
    g.add(white, pupil);
    return g;
}
const leftEye = makeEye(0.11);
const rightEye = makeEye(-0.11);
faceGroup.add(leftEye, rightEye);

const leftBrow = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.025), browMat);
leftBrow.position.set(0.11, 0.075, 0.002);
const rightBrow = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.025), browMat);
rightBrow.position.set(-0.11, 0.075, 0.002);
faceGroup.add(leftBrow, rightBrow);

const mouthMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.06), mouthMat);
mouthMesh.position.set(0, -0.11, 0.002);
faceGroup.add(mouthMesh);

// Руки и ноги
const leftArmPivot = new THREE.Group();
leftArmPivot.position.set(0.375, 1.45, 0);
const leftArmMesh = createSkinBox(0.25, 0.75, 0.25, 40, 16, skinTexture);
leftArmMesh.position.y = -0.325;
leftArmPivot.add(leftArmMesh);
playerRoot.add(leftArmPivot);

const rightArmPivot = new THREE.Group();
rightArmPivot.position.set(-0.375, 1.45, 0);
const rightArmMesh = createSkinBox(0.25, 0.75, 0.25, 40, 16, skinTexture);
rightArmMesh.position.y = -0.325;
rightArmPivot.add(rightArmMesh);
playerRoot.add(rightArmPivot);

const leftLegPivot = new THREE.Group();
leftLegPivot.position.set(0.125, 0.75, 0);
const leftLegMesh = createSkinBox(0.25, 0.75, 0.25, 0, 16, skinTexture);
leftLegMesh.position.y = -0.375;
leftLegPivot.add(leftLegMesh);
playerRoot.add(leftLegPivot);

const rightLegPivot = new THREE.Group();
rightLegPivot.position.set(-0.125, 0.75, 0);
const rightLegMesh = createSkinBox(0.25, 0.75, 0.25, 0, 16, skinTexture);
rightLegMesh.position.y = -0.375;
rightLegPivot.add(rightLegMesh);
playerRoot.add(rightLegPivot);
// === ЧАСТЬ 3: ОЗВУЧКА, СУБТИТРЫ И СЦЕНАРИЙ АНИМАЦИИ ===
let audioElement = null;
let audioCtx = null;
let analyser = null;
let audioDataArray = null;
let audioDestination = null;

function setupAudio(file) {
    if (audioElement) audioElement.pause();
    const url = URL.createObjectURL(file);
    audioElement = new Audio(url);
    audioElement.crossOrigin = "anonymous";

    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const src = audioCtx.createMediaElementSource(audioElement);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    audioDataArray = new Uint8Array(analyser.frequencyBinCount);

    audioDestination = audioCtx.createMediaStreamDestination();
    src.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.connect(audioDestination);

    audioElement.currentTime = currentTime;
    if (isPlaying) audioElement.play();
}

function getSpeechAmplitude(t) {
    if (analyser && audioElement && !audioElement.paused) {
        analyser.getByteFrequencyData(audioDataArray);
        let sum = 0;
        for (let i = 0; i < 30; i++) sum += audioDataArray.at(i);
        return Math.min(1, (sum / 30) / 140);
    }
    const activeSub = subtitlesList.find(s => t >= s.start && t <= s.end);
    if (!activeSub) return 0.12;
    return 0.15 + Math.abs(Math.sin(t * 19) * Math.cos(t * 11)) * 0.85;
}

let subtitlesList = [];
function parseSubtitles() {
    const raw = document.getElementById('subsIn').value;
    subtitlesList = raw.split('\n').map(line => {
        const parts = line.split('|');
        if (parts.length < 2) return null;
        const times = parts.at(0).trim().split('-');
        return {
            start: parseFloat(times.at(0)) || 0,
            end: parseFloat(times.at(1)) || 0,
            text: parts.slice(1).join('|').trim()
        };
    }).filter(Boolean);
}
parseSubtitles();

function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

function updateScene(t) {
    bgIslands.forEach(item => {
        item.mesh.position.y = item.baseY + Math.sin(t * 1.2 + item.phase) * 0.35;
    });
    clouds.forEach(c => {
        c.position.x += 0.015;
        if (c.position.x > 30) c.position.x = -30;
    });
    crystal1.rotation.y = t * 1.5;
    crystal1.position.y = 0.65 + Math.sin(t * 3) * 0.1;

    leftArmPivot.rotation.set(0, 0, 0.08);
    rightArmPivot.rotation.set(0, 0, -0.08);
    leftLegPivot.rotation.set(0, 0, 0);
    rightLegPivot.rotation.set(0, 0, 0);
    headPivot.rotation.set(0, 0, 0);
    playerRoot.rotation.set(0, 0, 0);

    if (t < 3.0) {
        // [0:00 - 0:03] Пролет сквозь облака и приветствие
        const p = smoothstep(0, 2.2, t);
        playerRoot.position.set(0, 0, 0);
        camera.position.set(lerp(-1.5, 0, p), lerp(11.0, 1.85, p), lerp(9.0, 3.4, p));
        camera.lookAt(0, lerp(2.5, 1.35, p), 0);

        if (t > 1.0) {
            leftArmPivot.rotation.z = 2.6 + Math.sin(t * 14) * 0.35;
            leftArmPivot.rotation.x = 0.2;
            headPivot.rotation.z = Math.sin(t * 6) * 0.08;
        }
        const bScale = smoothstep(1.3, 1.9, t);
        bannerTitle.scale.set(bScale, bScale, bScale);
        bannerTitle.position.set(0, 2.85 + Math.sin(t * 3) * 0.08, 0.5);

    } else if (t < 11.2) {
        // [0:03 - 0:11.2] Прогулка по красивому миру, камера следит впереди него
        const walkProgress = (t - 3.0) / 8.2;
        const zPos = lerp(0, 13.0, walkProgress);
        const walkCycle = t * 8.5;

        playerRoot.position.set(0, Math.abs(Math.sin(walkCycle)) * 0.08, zPos);

        leftLegPivot.rotation.x = Math.sin(walkCycle) * 0.65;
        rightLegPivot.rotation.x = -Math.sin(walkCycle) * 0.65;
        rightArmPivot.rotation.x = Math.sin(walkCycle) * 0.5;

        leftArmPivot.rotation.x = -0.7 + Math.sin(t * 4.5) * 0.35;
        leftArmPivot.rotation.z = 0.35 + Math.cos(t * 3.8) * 0.25;

        headPivot.rotation.y = Math.sin(t * 2.2) * 0.12;
        headPivot.rotation.x = Math.sin(t * 5.0) * 0.06;

        const camX = Math.sin(t * 0.9) * 0.65;
        const camY = 1.75 + Math.sin(t * 4.2) * 0.05;
        camera.position.set(camX, camY, zPos + 3.3);
        camera.lookAt(0, 1.35, zPos);

        bannerTitle.scale.set(0, 0, 0);

    } else if (t < 16.2) {
        // [0:11.2 - 0:16.2] Остановка и показ версий 1.21.11 / 26.2
        const localT = t - 11.2;
        playerRoot.position.set(-0.7, 0, 13.2);
        playerRoot.rotation.y = 0.15;

        leftArmPivot.rotation.z = 1.1 + Math.sin(t * 4) * 0.15;
        leftArmPivot.rotation.x = -0.3;
        rightArmPivot.rotation.x = Math.sin(t * 3) * 0.15;

        if (localT > 0.5 && localT < 2.5) {
            headPivot.rotation.y = 0.45;
            headPivot.rotation.x = Math.sin(t * 8) * 0.08;
        } else {
            headPivot.rotation.y = 0.05;
        }

        const v1 = smoothstep(0.4, 0.9, localT);
        const v2 = smoothstep(1.1, 1.6, localT);
        bannerVer1.scale.set(v1 * 0.85, v1 * 0.85, v1 * 0.85);
        bannerVer2.scale.set(v2 * 0.85, v2 * 0.85, v2 * 0.85);
        bannerVer1.position.y = 2.15 + Math.sin(t * 3) * 0.05;
        bannerVer2.position.y = 1.15 + Math.cos(t * 3) * 0.05;

        camera.position.set(0.35, 1.75, 17.2);
        camera.lookAt(0.35, 1.4, 13.3);

    } else {
        // [0:16.2 - 0:22.0] Призыв "IP в описании" и прыжок в облака
        const localT = t - 16.2;
        bannerVer1.scale.set(0, 0, 0);
        bannerVer2.scale.set(0, 0, 0);

        if (localT < 3.4) {
            playerRoot.position.set(0, 0, 13.8);
            rightArmPivot.rotation.x = -0.65;
            rightArmPivot.rotation.z = -0.25 + Math.sin(t * 10) * 0.12;
            headPivot.rotation.x = 0.12 + Math.sin(t * 6) * 0.05;

            camera.position.set(0, 1.7, 17.0);
            camera.lookAt(0, 1.3, 13.8);
        } else {
            const jumpT = localT - 3.4;
            playerRoot.rotation.y = 0;
            const jumpZ = 13.8 + jumpT * 3.8;
            const jumpY = Math.sin(Math.min(1, jumpT / 1.4) * Math.PI) * 2.2 - Math.pow(Math.max(0, jumpT - 0.5), 2) * 3.5;
            playerRoot.position.set(0, jumpY, jumpZ);

            leftArmPivot.rotation.z = 2.2;
            rightArmPivot.rotation.z = -2.2;
            leftLegPivot.rotation.x = -0.4;
            rightLegPivot.rotation.x = 0.5;

            camera.position.set(0, 2.2, 18.2);
            camera.lookAt(0, Math.max(-2, jumpY + 1.0), jumpZ);

            const endScale = smoothstep(0.8, 1.5, jumpT);
            bannerTitle.position.set(0, 2.1, 14.5);
            bannerTitle.scale.set(endScale, endScale, endScale);
        }
    }

    // Моргание и движение рта
    const blinkCycle = t % 3.6;
    const eyeScaleY = (blinkCycle > 3.45) ? 0.1 : 1.0;
    leftEye.scale.y = eyeScaleY;
    rightEye.scale.y = eyeScaleY;

    const amp = getSpeechAmplitude(t);
    mouthMesh.scale.y = 0.3 + amp * 1.8;
    mouthMesh.scale.x = 1.0 - amp * 0.15;
}
// === ЧАСТЬ 4: СУБТИТРЫ, ИНТЕРФЕЙС И СКАЧИВАНИЕ ВИДЕО ===
function renderCompositeFrame(t) {
    const W = outputCanvas.width;
    const H = outputCanvas.height;

    if (glCanvas.width !== W || glCanvas.height !== H) {
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);

    ctx2d.clearRect(0, 0, W, H);
    ctx2d.drawImage(glCanvas, 0, 0, W, H);

    // Плашка "IP В ОПИСАНИИ"
    if (t >= 16.5 && t <= 19.8) {
        const alpha = Math.min(1, (t - 16.5) * 4) * Math.min(1, (19.8 - t) * 4);
        ctx2d.save();
        ctx2d.globalAlpha = alpha;
        const boxW = W * 0.78;
        const boxH = 64;
        const bx = (W - boxW) / 2;
        const by = H * 0.68;

        ctx2d.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx2d.fillRect(bx, by, boxW, boxH);
        ctx2d.strokeStyle = '#38bdf8';
        ctx2d.lineWidth = 4;
        ctx2d.strokeRect(bx, by, boxW, boxH);

        ctx2d.fillStyle = '#fde047';
        ctx2d.font = `bold ${aspectMode === '9:16' ? 20 : 26}px "Press Start 2P", monospace`;
        ctx2d.textAlign = 'center';
        ctx2d.textBaseline = 'middle';
        ctx2d.fillText('IP В ОПИСАНИИ', W / 2, by + boxH / 2 + 2);
        ctx2d.restore();
    }

    // Майнкрафтовские пиксельные субтитры
    const activeSub = subtitlesList.find(s => t >= s.start && t <= s.end);
    if (activeSub) {
        ctx2d.save();
        const fontSize = aspectMode === '9:16' ? 20 : 26;
        ctx2d.font = `${fontSize}px "Press Start 2P", monospace`;
        ctx2d.textAlign = 'center';
        ctx2d.textBaseline = 'middle';

        const maxWidth = W * 0.86;
        const words = activeSub.text.split(' ');
        const lines = [];
        let currentLine = '';

        for (let word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            if (ctx2d.measureText(testLine).width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);

        const lineHeight = fontSize * 1.55;
        const totalH = lines.length * lineHeight + 24;
        const startY = H * 0.82 - totalH / 2;

        ctx2d.fillStyle = 'rgba(0, 0, 0, 0.68)';
        ctx2d.fillRect(W * 0.05, startY - 12, W * 0.9, totalH);

        lines.forEach((line, idx) => {
            const ly = startY + 12 + idx * lineHeight + fontSize / 2;
            ctx2d.fillStyle = '#1e1e1e';
            ctx2d.fillText(line, W / 2 + 3, ly + 3);

            if (line.includes('Aetherfall') || line.includes('1.21.11') || line.includes('26.2') || line.includes('IP')) {
                ctx2d.fillStyle = '#38bdf8';
            } else {
                ctx2d.fillStyle = '#ffffff';
            }
            ctx2d.fillText(line, W / 2, ly);
        });
        ctx2d.restore();
    }
}

// Управление плеером
const playPauseBtn = document.getElementById('playPauseBtn');
const restartBtn = document.getElementById('restartBtn');
const timelineSlider = document.getElementById('timelineSlider');
const timeDisplay = document.getElementById('timeDisplay');
const recordBtn = document.getElementById('recBtn');
const recordStatus = document.getElementById('recordStatus');

playPauseBtn.onclick = () => {
    isPlaying = !isPlaying;
    playPauseBtn.textContent = isPlaying ? 'Пауза' : 'Играть';
    if (audioElement) {
        if (isPlaying) {
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
            audioElement.currentTime = currentTime;
            audioElement.play();
        } else {
            audioElement.pause();
        }
    }
};

restartBtn.onclick = () => {
    currentTime = 0;
    if (audioElement) {
        audioElement.currentTime = 0;
        if (isPlaying) audioElement.play();
    }
};

timelineSlider.oninput = (e) => {
    currentTime = parseFloat(e.target.value);
    if (audioElement) audioElement.currentTime = currentTime;
};

document.getElementById('btnVertical').onclick = (e) => {
    aspectMode = '9:16';
    outputCanvas.width = 720;
    outputCanvas.height = 1280;
    e.target.classList.add('active');
    document.getElementById('btnHorizontal').classList.remove('active');
};

document.getElementById('btnHorizontal').onclick = (e) => {
    aspectMode = '16:9';
    outputCanvas.width = 1280;
    outputCanvas.height = 720;
    e.target.classList.add('active');
    document.getElementById('btnVertical').classList.remove('active');
};

document.getElementById('skinInput').onchange = (e) => {
    const file = e.target.files.item(0);
    if (!file) return;
    const img = new Image();
    img.onload = () => {
        skinTexture.image = img;
        skinTexture.needsUpdate = true;
        recordStatus.textContent = 'Скин успешно применён!';
    };
    img.src = URL.createObjectURL(file);
};

document.getElementById('audIn').onchange = (e) => {
    const file = e.target.files.item(0);
    if (file) {
        setupAudio(file);
        recordStatus.textContent = 'Озвучка загружена!';
    }
};

document.getElementById('subBtn').onclick = () => {
    parseSubtitles();
    recordStatus.textContent = 'Субтитры обновлены!';
};

// Запись и скачивание видео
let mediaRecorder = null;
let recordedChunks = [];

recordBtn.onclick = () => {
    if (isRecording) return;
    
    try {
        isRecording = true;
        recordBtn.classList.add('recording');
        recordBtn.textContent = 'Идет запись (0:22)...';
        recordStatus.textContent = 'Не закрывайте вкладку, ролик записывается 22 секунды...';

        currentTime = 0;
        isPlaying = true;
        playPauseBtn.textContent = 'Пауза';

        const canvasStream = outputCanvas.captureStream(30);
        if (audioDestination) {
            audioDestination.stream.getAudioTracks().forEach(track => canvasStream.addTrack(track));
        }

        recordedChunks = [];
        let mimeType = 'video/webm';
        let ext = 'webm';
        if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
            ext = 'mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            mimeType = 'video/webm;codecs=vp9';
        }

        mediaRecorder = new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond: 5000000 });
        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) recordedChunks.push(e.data);
        };
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Aetherfall_SMP_Promo_${aspectMode.replace(':', 'x')}.${ext}`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 1000);

            isRecording = false;
            recordBtn.classList.remove('recording');
            recordBtn.textContent = '● Записать и скачать видео';
            recordStatus.textContent = 'Готово! Видео сохранено в загрузки.';
        };

        if (audioElement) {
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
            audioElement.currentTime = 0;
            audioElement.play();
        }

        mediaRecorder.start(200);
    } catch (err) {
        isRecording = false;
        recordBtn.classList.remove('recording');
        recordBtn.textContent = '● Записать и скачать видео';
        recordStatus.textContent = 'Ошибка записи: ' + err.message;
    }
};

// Главный цикл
let lastTimestamp = performance.now();
function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.1, (now - lastTimestamp) / 1000);
    lastTimestamp = now;

    if (isPlaying) {
        currentTime += dt;
        if (currentTime >= DURATION) {
            if (isRecording && mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                currentTime = DURATION;
                isPlaying = false;
                playPauseBtn.textContent = 'Играть';
            } else {
                currentTime = 0;
                if (audioElement) {
                    audioElement.currentTime = 0;
                    audioElement.play();
                }
            }
        }
    }

    timelineSlider.value = currentTime;
    timeDisplay.textContent = `${currentTime.toFixed(1)} / ${DURATION.toFixed(1)}с`;

    updateScene(currentTime);
    renderCompositeFrame(currentTime);
}

requestAnimationFrame(animate);
