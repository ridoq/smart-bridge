import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Physical Bridge Dimensions (100% GAMTEK IBDC 2027 Scale & Ratio)
// Bentang L = 100% (50.0), Tinggi Maks H = 25% (12.5), Lebar W = 12% (6.0), Tebal Batang t = 1.5% (0.75)
const SPAN_L = 50.0;
const DECK_W = 6.0;   // 12% L (GAMTEK Table: Lebar W = 12%)
const TRUSS_H = 12.5; // 25% L (GAMTEK Table: Tinggi Maks H = 25%)
const BEAM_T = 0.75;  // 1.5% L (GAMTEK Table: Tebal Batang t = 1.5% L)
const STAND_H = 7.2;
const BASE_Y = STAND_H; // Height where bridge rests on the abutments

function Bridge3DViewerComponent({
  deflection,
  loadTon = 0.0,
  status,
  deformScale,
  onSetDeformScale
}) {
  const mountRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

  // Dynamic references for deflection updates
  const dynamicMembersRef = useRef([]);
  const dynamicPlatesRef = useRef([]);
  const floorBeamsRef = useRef([]);
  const overheadStrutsRef = useRef([]);
  const deckMeshRef = useRef(null);
  const origDeckGeoRef = useRef(null);
  const curbsRef = useRef([]);
  const dashesRef = useRef([]);
  const sensorRef = useRef(null);
  const actuatorRefs = useRef(null);

  const currentDefRef = useRef(deflection);
  const currentLoadRef = useRef(loadTon);
  const currentScaleRef = useRef(deformScale);

  useEffect(() => {
    currentDefRef.current = deflection;
  }, [deflection]);

  useEffect(() => {
    currentLoadRef.current = loadTon;
  }, [loadTon]);

  useEffect(() => {
    currentScaleRef.current = deformScale;
  }, [deformScale]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene with Rich Sunset Sky
    const scene = new THREE.Scene();

    // Create realistic sunset sky gradient matching Image 1 & 2
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 1024;
    skyCanvas.height = 512;
    const ctx = skyCanvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#537d99'); // Twilight blue top
    grad.addColorStop(0.3, '#7e9ab1'); // Soft blue
    grad.addColorStop(0.55, '#c5959c'); // Sunset lavender-rose
    grad.addColorStop(0.75, '#ea9f82'); // Golden peach
    grad.addColorStop(0.92, '#f8b98a'); // Warm golden horizon
    grad.addColorStop(1.0, '#ffd8a6'); // Sunset glow
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Realistic Wispy Cirrocumulus Sunset Clouds
    ctx.fillStyle = 'rgba(255, 240, 230, 0.18)';
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      const cx = (i * 37) % 1024;
      const cy = 40 + (i * 23) % 280;
      ctx.ellipse(cx, cy, 70 + (i % 5) * 30, 5 + (i % 3) * 5, -0.04, 0, Math.PI * 2);
      ctx.fill();
    }

    const skyTexture = new THREE.CanvasTexture(skyCanvas);
    scene.background = skyTexture;

    // 2. Camera (Perspective with low FOV for photographic depth)
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 1000);
    camera.position.set(38, BASE_Y + 10.0, 44);
    cameraRef.current = camera;

    // 3. Renderer with Optimized Settings (Shadow Map Disabled for Maximum Clarity & Performance)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'default'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = false; // Zero shadows per user request (eliminates all dark deck artifacts & saves GPU)
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI - 0.05; // Full 360 vertical orbit (allows looking from underneath the bridge)
    controls.minDistance = 5;
    controls.maxDistance = 220;
    controls.target.set(0, BASE_Y + 3.5, 0);
    controlsRef.current = controls;

    // 5. Lighting (Clean, Warm, Shadowless Architectural Illumination)
    const hemiLight = new THREE.HemisphereLight(0xfffaed, 0x3d444e, 1.25);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.35);
    sunLight.position.set(-32, 34, 28);
    scene.add(sunLight);

    const sunsetFill = new THREE.DirectionalLight(0xf2a688, 0.7);
    sunsetFill.position.set(35, 16, -25);
    scene.add(sunsetFill);

    const frontFill = new THREE.DirectionalLight(0xffffff, 0.35);
    frontFill.position.set(0, 18, 45);
    scene.add(frontFill);

    // Upward fill light for crystal-clear underside inspection
    const underFill = new THREE.DirectionalLight(0xe8f0fe, 0.65);
    underFill.position.set(0, -10, 15);
    scene.add(underFill);

    // 6. Natural Land Terrain & River Environment (Daratan & Sungai)
    const envGeometries = [];
    const envMaterials = [];

    const regEnvGeo = (geo) => {
      envGeometries.push(geo);
      return geo;
    };
    const regEnvMat = (mat) => {
      envMaterials.push(mat);
      return mat;
    };

    // Environment Materials
    const grassMat = regEnvMat(new THREE.MeshStandardMaterial({
      color: 0x3b6e44, // Lush natural green grass
      roughness: 0.85,
      metalness: 0.08
    }));

    const slopeGrassMat = regEnvMat(new THREE.MeshStandardMaterial({
      color: 0x335e3a, // Deep green slope grass
      roughness: 0.9,
      metalness: 0.05
    }));

    const cliffRockMat = regEnvMat(new THREE.MeshStandardMaterial({
      color: 0x5c5347, // Rocky earthen cut cliff
      roughness: 0.95,
      metalness: 0.1
    }));

    const concreteMat = regEnvMat(new THREE.MeshStandardMaterial({
      color: 0x9ca2a8, // Reinforced concrete bridge abutments
      roughness: 0.65,
      metalness: 0.15
    }));

    const bearingSteelMat = regEnvMat(new THREE.MeshStandardMaterial({
      color: 0x2b2e33, // Heavy steel elastomeric bearing plate
      roughness: 0.35,
      metalness: 0.75
    }));

    const approachRoadMat = regEnvMat(new THREE.MeshStandardMaterial({
      color: 0x2d3237, // Smooth asphalt highway approach road
      roughness: 0.7,
      metalness: 0.25
    }));

    const waterMat = regEnvMat(new THREE.MeshStandardMaterial({
      color: 0x1f667d, // Scenic river water
      roughness: 0.22,
      metalness: 0.35,
      transparent: true,
      opacity: 0.94
    }));

    const riverBedMat = regEnvMat(new THREE.MeshStandardMaterial({
      color: 0x1d2720, // Dark rocky riverbed
      roughness: 0.95
    }));

    const roadLineMat = regEnvMat(new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const roadEdgeMat = regEnvMat(new THREE.MeshBasicMaterial({ color: 0xf5ba13 }));
    const landCurbMat = regEnvMat(new THREE.MeshStandardMaterial({ color: 0x757c85, roughness: 0.5 }));
    const treeTrunkMat = regEnvMat(new THREE.MeshStandardMaterial({ color: 0x4a3627, roughness: 0.9 }));
    const foliageMat1 = regEnvMat(new THREE.MeshStandardMaterial({ color: 0x285432, roughness: 0.85 }));
    const foliageMat2 = regEnvMat(new THREE.MeshStandardMaterial({ color: 0x366e44, roughness: 0.85 }));

    // A. River & Riverbed
    const waterGeo = regEnvGeo(new THREE.PlaneGeometry(300, 220));
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(0, 0.9, 0);
    scene.add(waterMesh);

    const riverBedGeo = regEnvGeo(new THREE.PlaneGeometry(320, 240));
    const riverBedMesh = new THREE.Mesh(riverBedGeo, riverBedMat);
    riverBedMesh.rotation.x = -Math.PI / 2;
    riverBedMesh.position.set(0, 0.05, 0);
    scene.add(riverBedMesh);

    // B. Reusable geometries for trees & hills
    const trunkGeo = regEnvGeo(new THREE.CylinderGeometry(0.22, 0.3, 1.8, 6));
    const coneGeo1 = regEnvGeo(new THREE.ConeGeometry(1.6, 2.2, 6));
    const coneGeo2 = regEnvGeo(new THREE.ConeGeometry(1.3, 1.9, 6));
    const coneGeo3 = regEnvGeo(new THREE.ConeGeometry(0.9, 1.5, 6));
    const hillGeo = regEnvGeo(new THREE.ConeGeometry(16, 9, 8));

    // C. Builder for Land Banks (Left: side = -1, Right: side = +1)
    const buildLandBank = (side) => {
      const bankGroup = new THREE.Group();
      const startX = side * 25.0; // Where bridge terminates
      const farX = side * 125.0;   // Extends out to horizon
      const bankLen = Math.abs(farX - startX); // 100 units
      const midBankX = (startX + farX) / 2;
      const bankWidth = 140;

      // 1. Main Land Plateau (Upper ground at BASE_Y)
      const plateauGeo = regEnvGeo(new THREE.BoxGeometry(bankLen, BASE_Y, bankWidth));
      const plateau = new THREE.Mesh(plateauGeo, grassMat);
      plateau.position.set(midBankX, BASE_Y / 2, 0);
      bankGroup.add(plateau);

      // 2. Sloping River Gorge Bank / Embankment
      const slopeW = 7.5;
      const slopeGeo = regEnvGeo(new THREE.BoxGeometry(slopeW, BASE_Y + 0.5, bankWidth));
      const slope = new THREE.Mesh(slopeGeo, cliffRockMat);
      slope.position.set(startX - side * (slopeW / 2 - 2.0), BASE_Y / 2 - 0.2, 0);
      slope.rotation.z = side * 0.16;
      bankGroup.add(slope);

      // 3. Green Grass Layer on the Top Shoulder of the Slope
      const slopeGrassGeo = regEnvGeo(new THREE.BoxGeometry(slopeW * 0.9, 0.3, bankWidth));
      const slopeGrass = new THREE.Mesh(slopeGrassGeo, slopeGrassMat);
      slopeGrass.position.set(startX - side * (slopeW / 2 - 1.8), BASE_Y - 0.1, 0);
      slopeGrass.rotation.z = side * 0.14;
      bankGroup.add(slopeGrass);

      // 4. Riverbank Grass Verge along the water edge
      const vergeGeo = regEnvGeo(new THREE.BoxGeometry(4.5, 0.7, bankWidth));
      const verge = new THREE.Mesh(vergeGeo, grassMat);
      verge.position.set(startX + side * 1.5, 0.85, 0);
      bankGroup.add(verge);

      // 5. Approach Road extending from Bridge Deck
      const roadGeo = regEnvGeo(new THREE.PlaneGeometry(bankLen, DECK_W));
      const road = new THREE.Mesh(roadGeo, approachRoadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(midBankX, BASE_Y + 0.36, 0);
      bankGroup.add(road);

      // White Center Dashed Markings on Road
      for (let rx = 3.5; rx < bankLen - 4; rx += 4.5) {
        const lineX = startX + side * rx;
        const dash = new THREE.Mesh(
          regEnvGeo(new THREE.PlaneGeometry(2.2, 0.16)),
          roadLineMat
        );
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(lineX, BASE_Y + 0.38, 0);
        bankGroup.add(dash);
      }

      // Yellow Shoulder Edge Lines
      [-DECK_W / 2 + 0.35, DECK_W / 2 - 0.35].forEach(zEdge => {
        const edgeLine = new THREE.Mesh(
          regEnvGeo(new THREE.PlaneGeometry(bankLen, 0.14)),
          roadEdgeMat
        );
        edgeLine.rotation.x = -Math.PI / 2;
        edgeLine.position.set(midBankX, BASE_Y + 0.38, zEdge);
        bankGroup.add(edgeLine);
      });

      // Concrete Curbs / Barriers along Approach Road
      [-DECK_W / 2 + 0.1, DECK_W / 2 - 0.1].forEach(zCurb => {
        const curb = new THREE.Mesh(
          regEnvGeo(new THREE.BoxGeometry(bankLen, 0.45, 0.24)),
          landCurbMat
        );
        curb.position.set(midBankX, BASE_Y + 0.56, zCurb);
        bankGroup.add(curb);
      });

      // 6. Reinforced Concrete Bridge Abutment (Kepala Jembatan)
      const abutGroup = new THREE.Group();
      abutGroup.position.set(startX, 0, 0);

      // Heavy Concrete Breastwall
      const abutWall = new THREE.Mesh(
        regEnvGeo(new THREE.BoxGeometry(3.6, BASE_Y + 0.2, DECK_W + 2.2)),
        concreteMat
      );
      abutWall.position.set(side * 1.6, (BASE_Y + 0.2) / 2, 0);
      abutGroup.add(abutWall);

      // Bearing Pedestals under B0 Shoes (Z = +- DECK_W/2)
      [-DECK_W / 2, DECK_W / 2].forEach(zShoe => {
        const ped = new THREE.Mesh(
          regEnvGeo(new THREE.BoxGeometry(1.8, 0.7, 1.5)),
          concreteMat
        );
        ped.position.set(0, BASE_Y - 0.35, zShoe);
        abutGroup.add(ped);

        // Heavy Steel Bearing Plate on which the bridge shoe sits
        const bearingPlate = new THREE.Mesh(
          regEnvGeo(new THREE.BoxGeometry(1.3, 0.16, 1.2)),
          bearingSteelMat
        );
        bearingPlate.position.set(0, BASE_Y + 0.08, zShoe);
        abutGroup.add(bearingPlate);
      });

      // Angled Retaining Wingwalls
      [-DECK_W / 2 - 1.2, DECK_W / 2 + 1.2].forEach(zWing => {
        const wing = new THREE.Mesh(
          regEnvGeo(new THREE.BoxGeometry(5.8, BASE_Y + 0.1, 0.65)),
          concreteMat
        );
        wing.position.set(side * 2.8, (BASE_Y + 0.1) / 2, zWing);
        wing.rotation.y = side * 0.14;
        abutGroup.add(wing);
      });

      bankGroup.add(abutGroup);

      // 7. Scenic Pine Trees on the Land (scattered along grass shoulders)
      const treeCoords = [
        { x: startX + side * 14, z: 12, s: 1.15 },
        { x: startX + side * 22, z: 18, s: 1.45 },
        { x: startX + side * 34, z: 14, s: 1.25 },
        { x: startX + side * 44, z: 24, s: 1.65 },
        { x: startX + side * 56, z: 16, s: 1.35 },
        { x: startX + side * 16, z: -14, s: 1.2 },
        { x: startX + side * 26, z: -22, s: 1.55 },
        { x: startX + side * 38, z: -16, s: 1.3 },
        { x: startX + side * 50, z: -26, s: 1.7 },
        { x: startX + side * 62, z: -18, s: 1.4 }
      ];

      treeCoords.forEach(tc => {
        const tree = new THREE.Group();
        tree.position.set(tc.x, BASE_Y, tc.z);
        tree.scale.set(tc.s, tc.s, tc.s);

        const trunk = new THREE.Mesh(trunkGeo, treeTrunkMat);
        trunk.position.y = 0.9;
        tree.add(trunk);

        const c1 = new THREE.Mesh(coneGeo1, foliageMat1);
        c1.position.y = 2.4;
        tree.add(c1);

        const c2 = new THREE.Mesh(coneGeo2, foliageMat2);
        c2.position.y = 3.6;
        tree.add(c2);

        const c3 = new THREE.Mesh(coneGeo3, foliageMat1);
        c3.position.y = 4.6;
        tree.add(c3);

        bankGroup.add(tree);
      });

      // 8. Background Rolling Hills
      [
        { x: startX + side * 48, z: 38, sx: 1.6, sy: 0.9, sz: 1.5 },
        { x: startX + side * 68, z: -44, sx: 1.8, sy: 1.1, sz: 1.7 }
      ].forEach(hc => {
        const hill = new THREE.Mesh(hillGeo, grassMat);
        hill.position.set(hc.x, BASE_Y + 3.0, hc.z);
        hill.scale.set(hc.sx, hc.sy, hc.sz);
        bankGroup.add(hill);
      });

      scene.add(bankGroup);
    };

    buildLandBank(-1); // Left Landmass
    buildLandBank(1);  // Right Landmass

    // 7. Materials matching Exact Civil Render
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0xd63d27, // Vibrant Red-Orange
      roughness: 0.36,
      metalness: 0.45
    });

    const gussetMat = new THREE.MeshStandardMaterial({
      color: 0xf5ba13, // Golden Yellow Plates
      roughness: 0.3,
      metalness: 0.4
    });

    const boltMat = new THREE.MeshStandardMaterial({
      color: 0x16181a, // Black Rivet / Bolt Heads
      roughness: 0.25,
      metalness: 0.85
    });

    const deckMat = new THREE.MeshStandardMaterial({
      color: 0xc0392b, // Reddish Roadway / Running Deck
      roughness: 0.6,
      metalness: 0.35
    });

    // 8. Exact Topology of Parker-Warren Truss (100% Matching GAMTEK Drawing & Table)
    // 7 Panels (14.3% L), 8 Bottom Nodes (B0-B7), 7 Top Nodes (A0-A6)
    // EXACTLY 2 Vertical Posts on Left Side & 2 Vertical Posts on Right Side
    const rawNodes = [
      // Bottom Chords (8 nodes: B0 to B7)
      { id: 'B0', x: -25.0, y: 0.0 },       // Left shoe joint (0.0% L)
      { id: 'B1', x: -19.2, y: 0.0 },       // Base of Vertical Post 1 Left (14.3% L)
      { id: 'B2', x: -10.5, y: 0.0 },       // Bottom Warren joint Left (28.6% L)
      { id: 'B3', x: -4.3, y: 0.0 },        // Base of Vertical Post 2 Left (42.9% L)
      { id: 'B4', x: 4.3, y: 0.0 },         // Base of Vertical Post 2 Right (57.1% L)
      { id: 'B5', x: 10.5, y: 0.0 },        // Bottom Warren joint Right (71.4% L)
      { id: 'B6', x: 19.2, y: 0.0 },        // Base of Vertical Post 1 Right (85.7% L)
      { id: 'B7', x: 25.0, y: 0.0 },        // Right shoe joint (100.0% L)

      // Top Arch Chords (7 nodes: A0 to A6, Max Height H = 25% L = 12.5)
      { id: 'A0', x: -19.2, y: 4.8 },       // Top of Vertical Post 1 Left (above B1)
      { id: 'A1', x: -13.5, y: 8.5 },       // Intermediate Top Arch Joint Left
      { id: 'A2', x: -4.3, y: 11.8 },       // Top of Vertical Post 2 Left (above B3)
      { id: 'A3', x: 0.0, y: 12.5 },        // Arch Apex / Crown at Mid-Span (H = 25% L)
      { id: 'A4', x: 4.3, y: 11.8 },        // Top of Vertical Post 2 Right (above B4)
      { id: 'A5', x: 13.5, y: 8.5 },        // Intermediate Top Arch Joint Right
      { id: 'A6', x: 19.2, y: 4.8 }         // Top of Vertical Post 1 Right (above B6)
    ];

    // Connectivity List for Truss Members (100% Matching GAMTEK Drawing)
    const trussEdges = [
      // Top Arch Chords (8 members)
      ['B0', 'A0'], ['A0', 'A1'], ['A1', 'A2'], ['A2', 'A3'],
      ['A3', 'A4'], ['A4', 'A5'], ['A5', 'A6'], ['A6', 'B7'],

      // Bottom Chords (7 members)
      ['B0', 'B1'], ['B1', 'B2'], ['B2', 'B3'], ['B3', 'B4'],
      ['B4', 'B5'], ['B5', 'B6'], ['B6', 'B7'],

      // Vertical Posts (EXACTLY 2 on Left Side & 2 on Right Side = 4 posts total)
      ['B1', 'A0'],         // Post 1 Left
      ['B3', 'A2'],         // Post 2 Left
      ['B4', 'A4'],         // Post 2 Right
      ['B6', 'A6'],         // Post 1 Right

      // Web Diagonals (8 members)
      ['B1', 'A1'],         // Diagonal Bay 2: Up-Right
      ['A1', 'B2'],         // Diagonal Bay 2: Down-Right
      ['B2', 'A2'],         // Diagonal Bay 3: Up-Right
      ['B3', 'A3'],         // Center Bay: Left Inverted Chevron to Apex
      ['B4', 'A3'],         // Center Bay: Right Inverted Chevron to Apex
      ['A4', 'B5'],         // Diagonal Bay 5: Down-Right
      ['B5', 'A5'],         // Diagonal Bay 6: Up-Right
      ['A5', 'B6']          // Diagonal Bay 6: Down-Right
    ];

    const unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
    const createTrussBeam = (n1, n2, z, width = 0.38, depth = 0.48) => {
      const mesh = new THREE.Mesh(unitBoxGeo, trussMat);
      scene.add(mesh);
      return { mesh, n1, n2, z, width, depth };
    };

    const unitBoltGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.16, 6);

    // Gusset Plate with Distinct Bolts (Matching GAMTEK Detail Sambungan)
    const createGussetPlate = (nodeId, x, y, z, plateW = 1.35, plateH = 1.15) => {
      const plateGroup = new THREE.Group();
      plateGroup.position.set(x, BASE_Y + y, z);

      // Yellow Plate
      const plateMesh = new THREE.Mesh(
        new THREE.BoxGeometry(plateW, plateH, 0.48),
        gussetMat
      );
      plateGroup.add(plateMesh);

      // Cluster of 8 Black Bolts matching Detail Sambungan (Gusset Plate Detail)
      const boltOffsets = [
        [-plateW * 0.32, -plateH * 0.28],
        [plateW * 0.32, -plateH * 0.28],
        [-plateW * 0.32, plateH * 0.28],
        [plateW * 0.32, plateH * 0.28],
        [-plateW * 0.12, 0],
        [plateW * 0.12, 0],
        [0, plateH * 0.30],
        [0, -plateH * 0.30]
      ];

      boltOffsets.forEach(([bx, by]) => {
        const boltF = new THREE.Mesh(unitBoltGeo, boltMat);
        boltF.rotation.x = Math.PI / 2;
        boltF.position.set(bx, by, 0.26);
        plateGroup.add(boltF);

        const boltB = new THREE.Mesh(unitBoltGeo, boltMat);
        boltB.rotation.x = Math.PI / 2;
        boltB.position.set(bx, by, -0.26);
        plateGroup.add(boltB);
      });

      scene.add(plateGroup);
      return { group: plateGroup, nodeId, origX: x, origY: y, z };
    };

    // Instantiate Dual Trusses (Front: +DECK_W/2, Back: -DECK_W/2)
    const membersList = [];
    const platesList = [];

    [-DECK_W / 2, DECK_W / 2].forEach(zPos => {
      rawNodes.forEach(n => {
        let pW = 1.35, pH = 1.15;
        if (n.id === 'B0' || n.id === 'B7') {
          pW = 1.65; pH = 1.25; // End shoe plates sitting on bearings
        } else if (n.id === 'A3') {
          pW = 1.55; pH = 1.25; // Crown apex plate uniting top chords and chevrons
        } else if (n.id === 'B3' || n.id === 'B4' || n.id === 'A2' || n.id === 'A4') {
          pW = 1.45; pH = 1.20; // Heavy junction plates at tall posts
        } else if (n.id === 'B1' || n.id === 'B6' || n.id === 'A0' || n.id === 'A6') {
          pW = 1.35; pH = 1.15; // Outer post plates
        } else {
          pW = 1.20; pH = 1.05; // Intermediate web joints
        }

        const plate = createGussetPlate(n.id, n.x, n.y, zPos, pW, pH);
        platesList.push(plate);
      });

      trussEdges.forEach(([id1, id2]) => {
        const isChord = id1.startsWith('B') && id2.startsWith('B');
        const isArch = (id1.startsWith('A') && id2.startsWith('A')) || (id1 === 'B0' && id2 === 'A0') || (id1 === 'A6' && id2 === 'B7');
        const isPost = (id1 === 'B1' && id2 === 'A0') || (id1 === 'B3' && id2 === 'A2') || (id1 === 'B4' && id2 === 'A4') || (id1 === 'B6' && id2 === 'A6');
        const w = (isChord || isArch) ? 0.44 : (isPost ? 0.38 : 0.34);
        const d = (isChord || isArch) ? 0.58 : (isPost ? 0.48 : 0.40);
        membersList.push(createTrussBeam(id1, id2, zPos, w, d));
      });
    });

    dynamicMembersRef.current = membersList;
    dynamicPlatesRef.current = platesList;

    // 10. Transverse Floor Beams (Cross Girders under Deck: B0 to B7)
    const bottomJoints = rawNodes.filter(n => n.id.startsWith('B'));
    const floorBeams = [];

    bottomJoints.forEach(bj => {
      const fbMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.58, DECK_W + 0.6),
        trussMat
      );
      scene.add(fbMesh);
      floorBeams.push({ mesh: fbMesh, x: bj.x });
    });

    // 10b. Center Longitudinal Beam / Stringer between B3 and B4 at Z = 0 (GAMTEK: Z = 6% L)
    const b3Node = rawNodes.find(n => n.id === 'B3');
    const b4Node = rawNodes.find(n => n.id === 'B4');
    const centerBeamLen = Math.abs(b4Node.x - b3Node.x);
    const centerLongitudinalBeam = new THREE.Mesh(
      new THREE.BoxGeometry(centerBeamLen, 0.44, 0.44),
      trussMat
    );
    centerLongitudinalBeam.position.set(0, BASE_Y + 0.15, 0);
    scene.add(centerLongitudinalBeam);

    floorBeamsRef.current = {
      transverse: floorBeams,
      centerStringer: centerLongitudinalBeam
    };

    // 11. Roadway Deck (Continuous Multi-Segment Mesh with Dynamic Deflection)
    const deckGeo = new THREE.BoxGeometry(SPAN_L, 0.35, DECK_W - 0.2, 40, 1, 2);
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.position.set(0, BASE_Y + 0.35, 0);
    scene.add(deckMesh);
    deckMeshRef.current = deckMesh;
    origDeckGeoRef.current = deckGeo.attributes.position.clone();

    // Roadway Markings (Stored in ref for dynamic bending with deck)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const dashesList = [];
    for (let lx = -SPAN_L / 2 + 2; lx < SPAN_L / 2 - 2; lx += 4) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.16), lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(lx, BASE_Y + 0.54, 0);
      scene.add(dash);
      dashesList.push({ mesh: dash, origX: lx });
    }
    dashesRef.current = dashesList;

    // Curbs along the deck (Segmented with 40 segments to bend smoothly in lockstep with the deck)
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xb03a2e, roughness: 0.5, metalness: 0.3 });
    const curbsList = [];
    [-DECK_W / 2 + 0.15, DECK_W / 2 - 0.15].forEach(cz => {
      const curbGeo = new THREE.BoxGeometry(SPAN_L, 0.45, 0.3, 40, 1, 1);
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(0, BASE_Y + 0.6, cz);
      scene.add(curb);
      curbsList.push({ mesh: curb, origGeo: curbGeo.attributes.position.clone() });
    });
    curbsRef.current = curbsList;

    // 12. Overhead Lateral Wind Struts (Palang Atas: 4 at A0, A2, A4, A6 matching GAMTEK)
    const topJoints = ['A0', 'A2', 'A4', 'A6'];
    const overheadStruts = [];
    topJoints.forEach(tjId => {
      const node = rawNodes.find(n => n.id === tjId);
      if (node) {
        const strut = new THREE.Mesh(
          new THREE.CylinderGeometry(0.20, 0.20, DECK_W, 8),
          trussMat
        );
        strut.rotation.x = Math.PI / 2;
        strut.position.set(node.x, BASE_Y + node.y, 0);
        scene.add(strut);
        overheadStruts.push({ mesh: strut, nodeId: tjId, origX: node.x, origY: node.y });
      }
    });
    overheadStrutsRef.current = overheadStruts;

    // 13. Mid-Span IoT Sensor Module (MPU6050 + ESP32 Underneath Bridge at X = 0)
    const sensorMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Industrial Blue Anodized Aluminum
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.3,
      roughness: 0.22,
      metalness: 0.82
    });
    const sensorBracketMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Steel Mounting Bracket
      roughness: 0.45,
      metalness: 0.75
    });

    const sensorGroup = new THREE.Group();
    sensorGroup.position.set(0, BASE_Y - 0.25, 0); // Mounted underneath the center stringer & floor beam

    // Main sensor enclosure
    const sensorBox = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.32, 0.6), sensorMat);
    sensorGroup.add(sensorBox);

    // Flange mounting brackets
    const bracket1 = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 0.45), sensorBracketMat);
    bracket1.position.y = 0.16;
    sensorGroup.add(bracket1);

    // Status LED indicator on bottom face pointing down
    const sensorLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    sensorLed.position.set(0, -0.18, 0);
    sensorGroup.add(sensorLed);

    // 4 Corner Mounting Hex Bolts
    const boltMiniGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.06, 6);
    const boltMiniMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.2 });
    [
      [-0.44, -0.18], [0.44, -0.18],
      [-0.44, 0.18], [0.44, 0.18]
    ].forEach(([bx, bz]) => {
      const b = new THREE.Mesh(boltMiniGeo, boltMiniMat);
      b.position.set(bx, 0.20, bz);
      sensorGroup.add(b);
    });

    scene.add(sensorGroup);
    sensorRef.current = sensorGroup;

    // 14. Mid-Span Industrial Servo-Hydraulic Actuator Assembly (100% Matching Uploaded Photo)
    // Features: Royal Blue Body, 4 Chrome Vertical Tie-Rods, Square Manifold Blocks,
    // Lifting Eye Rings, Chrome Piston Ram, and Cast Swivel Clevis Footplate Base.
    const actGeometries = [];
    const actMaterials = [];
    const regActGeo = (g) => { actGeometries.push(g); return g; };
    const regActMat = (m) => { actMaterials.push(m); return m; };

    // Authentic Actuator Materials
    const reactionBeamMat = regActMat(new THREE.MeshStandardMaterial({
      color: 0x22262c, // Heavy structural charcoal steel reaction gantry
      roughness: 0.6,
      metalness: 0.65
    }));

    const hazardYellowMat = regActMat(new THREE.MeshStandardMaterial({
      color: 0xf5ba13, // Safety hazard golden yellow accents
      roughness: 0.35,
      metalness: 0.4
    }));

    const actuatorBlueMat = regActMat(new THREE.MeshStandardMaterial({
      color: 0x134e9e, // Industrial Royal / Cobalt Blue (Semi-Gloss)
      roughness: 0.32,
      metalness: 0.52
    }));

    const actuatorCastBlueMat = regActMat(new THREE.MeshStandardMaterial({
      color: 0x103d78, // Heavy cast textured blue for swivel clevis footplate
      roughness: 0.65,
      metalness: 0.32
    }));

    const chromeMat = regActMat(new THREE.MeshStandardMaterial({
      color: 0xf2f6fa, // Polished chrome steel for piston ram & tie-rods
      roughness: 0.08,
      metalness: 0.96
    }));

    const silverRingMat = regActMat(new THREE.MeshStandardMaterial({
      color: 0xcbd5e1, // Silver galvanized forged steel lifting eye bolts
      roughness: 0.25,
      metalness: 0.85
    }));

    const darkSteelMat = regActMat(new THREE.MeshStandardMaterial({
      color: 0x252930, // Hardened tool steel for pivot pin & gland collar
      roughness: 0.45,
      metalness: 0.75
    }));

    const transducerPortMat = regActMat(new THREE.MeshStandardMaterial({
      color: 0x181a1d, // LVDT electrical transducer connector
      roughness: 0.4,
      metalness: 0.5
    }));

    const loadCellLedMat = regActMat(new THREE.MeshBasicMaterial({
      color: 0x10b981 // Status LED indicator (green idle, amber testing, red overload)
    }));

    const spreaderBeamMat = regActMat(new THREE.MeshStandardMaterial({
      color: 0x2e333a, // Heavy distribution steel plate on bridge deck
      roughness: 0.55,
      metalness: 0.65
    }));

    const rubberPadMat = regActMat(new THREE.MeshStandardMaterial({
      color: 0x181a1d, // High-pressure flexible hydraulic lines
      roughness: 0.85
    }));

    const forceArrowMat = regActMat(new THREE.MeshStandardMaterial({
      color: 0xf5ba13, // Downward load force vector
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
      roughness: 0.2
    }));

    // A. Overhead Reaction Crosshead Beam (Mounted across top chord apex at X = 0)
    const reactionBeam = new THREE.Mesh(
      regActGeo(new THREE.BoxGeometry(0.76, 0.52, DECK_W + 0.8)),
      reactionBeamMat
    );
    reactionBeam.position.set(0, BASE_Y + 12.75, 0);
    scene.add(reactionBeam);

    // Hazard yellow end caps on reaction beam
    [-DECK_W / 2 - 0.35, DECK_W / 2 + 0.35].forEach(zc => {
      const cap = new THREE.Mesh(
        regActGeo(new THREE.BoxGeometry(0.78, 0.54, 0.15)),
        hazardYellowMat
      );
      cap.position.set(0, BASE_Y + 12.75, zc);
      scene.add(cap);
    });

    // B. Fixed Upper Actuator Assembly (Overhead Blue Servo-Hydraulic Body)
    const fixedActuatorGroup = new THREE.Group();
    fixedActuatorGroup.position.set(0, BASE_Y, 0);

    // 1. Top Square Manifold Block (Mounted flush underneath reaction beam)
    const topManifold = new THREE.Mesh(
      regActGeo(new THREE.BoxGeometry(0.86, 0.65, 0.86)),
      actuatorBlueMat
    );
    topManifold.position.set(0, 12.16, 0);
    fixedActuatorGroup.add(topManifold);

    // 4 Chrome Hex Nuts on top of Manifold Block
    const nutGeo = regActGeo(new THREE.CylinderGeometry(0.065, 0.065, 0.12, 6));
    [
      [-0.32, -0.32], [0.32, -0.32],
      [-0.32, 0.32], [0.32, 0.32]
    ].forEach(([nx, nz]) => {
      const nut = new THREE.Mesh(nutGeo, chromeMat);
      nut.position.set(nx, 12.22, nz);
      fixedActuatorGroup.add(nut);
    });

    // Silver Lifting Eyebolts (Forged Eye Rings on Top Block Sides)
    const eyeRingGeo = regActGeo(new THREE.TorusGeometry(0.12, 0.035, 8, 16));
    [-0.44, 0.44].forEach(ez => {
      const ring = new THREE.Mesh(eyeRingGeo, silverRingMat);
      ring.position.set(0, 11.85, ez);
      ring.rotation.y = Math.PI / 2;
      fixedActuatorGroup.add(ring);
    });

    // Top Hydraulic Port Fitting Block
    const topPort = new THREE.Mesh(
      regActGeo(new THREE.BoxGeometry(0.18, 0.22, 0.24)),
      actuatorBlueMat
    );
    topPort.position.set(0.48, 11.85, 0);
    fixedActuatorGroup.add(topPort);

    const topPortFitting = new THREE.Mesh(
      regActGeo(new THREE.CylinderGeometry(0.065, 0.065, 0.18, 6)),
      chromeMat
    );
    topPortFitting.position.set(0.58, 11.85, 0);
    topPortFitting.rotation.z = Math.PI / 2;
    fixedActuatorGroup.add(topPortFitting);

    // 2. Four Chrome Vertical Tie-Rods (Connecting Top & Bottom Manifold Blocks)
    const tieRodGeo = regActGeo(new THREE.CylinderGeometry(0.038, 0.038, 3.6, 10));
    [
      [-0.32, -0.32], [0.32, -0.32],
      [-0.32, 0.32], [0.32, 0.32]
    ].forEach(([rx, rz]) => {
      const rod = new THREE.Mesh(tieRodGeo, chromeMat);
      rod.position.set(rx, 9.75, rz);
      fixedActuatorGroup.add(rod);
    });

    // 3. Central Royal Blue Hydraulic Cylinder Barrel
    const cylBarrel = new THREE.Mesh(
      regActGeo(new THREE.CylinderGeometry(0.36, 0.36, 3.5, 24)),
      actuatorBlueMat
    );
    cylBarrel.position.set(0, 9.75, 0);
    fixedActuatorGroup.add(cylBarrel);

    // 4. Lower Square Manifold Block
    const botManifold = new THREE.Mesh(
      regActGeo(new THREE.BoxGeometry(0.86, 0.65, 0.86)),
      actuatorBlueMat
    );
    botManifold.position.set(0, 7.65, 0);
    fixedActuatorGroup.add(botManifold);

    // 4 Chrome Hex Nuts under Bottom Manifold Block
    [
      [-0.32, -0.32], [0.32, -0.32],
      [-0.32, 0.32], [0.32, 0.32]
    ].forEach(([nx, nz]) => {
      const nut = new THREE.Mesh(nutGeo, chromeMat);
      nut.position.set(nx, 7.28, nz);
      fixedActuatorGroup.add(nut);
    });

    // Silver Lifting Eyebolts on Lower Block Sides
    [-0.44, 0.44].forEach(ez => {
      const ring = new THREE.Mesh(eyeRingGeo, silverRingMat);
      ring.position.set(0, 7.65, ez);
      ring.rotation.y = Math.PI / 2;
      fixedActuatorGroup.add(ring);
    });

    // Lower Hydraulic Port Fitting Block
    const botPort = new THREE.Mesh(
      regActGeo(new THREE.BoxGeometry(0.18, 0.22, 0.24)),
      actuatorBlueMat
    );
    botPort.position.set(0.48, 7.65, 0);
    fixedActuatorGroup.add(botPort);

    const botPortFitting = new THREE.Mesh(
      regActGeo(new THREE.CylinderGeometry(0.065, 0.065, 0.18, 6)),
      chromeMat
    );
    botPortFitting.position.set(0.58, 7.65, 0);
    botPortFitting.rotation.z = Math.PI / 2;
    fixedActuatorGroup.add(botPortFitting);

    // 5. Lower Cylindrical Extension / Transducer Housing
    const transducerBarrel = new THREE.Mesh(
      regActGeo(new THREE.CylinderGeometry(0.30, 0.30, 0.85, 20)),
      actuatorBlueMat
    );
    transducerBarrel.position.set(0, 7.0, 0);
    fixedActuatorGroup.add(transducerBarrel);

    // LVDT Electrical Connector Socket
    const lvdtPort = new THREE.Mesh(
      regActGeo(new THREE.BoxGeometry(0.14, 0.16, 0.14)),
      transducerPortMat
    );
    lvdtPort.position.set(0.33, 7.0, 0);
    fixedActuatorGroup.add(lvdtPort);

    const lvdtPins = new THREE.Mesh(
      regActGeo(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 12)),
      chromeMat
    );
    lvdtPins.position.set(0.41, 7.0, 0);
    lvdtPins.rotation.z = Math.PI / 2;
    fixedActuatorGroup.add(lvdtPins);

    // Bottom Gland Seal Ring
    const glandSeal = new THREE.Mesh(
      regActGeo(new THREE.CylinderGeometry(0.34, 0.34, 0.14, 20)),
      darkSteelMat
    );
    glandSeal.position.set(0, 6.55, 0);
    fixedActuatorGroup.add(glandSeal);

    // High-Pressure Flexible Hydraulic Hoses
    [-0.1, 0.1].forEach(zh => {
      const hose = new THREE.Mesh(
        regActGeo(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8)),
        rubberPadMat
      );
      hose.position.set(0.68, 9.75, zh);
      hose.rotation.z = -0.12;
      fixedActuatorGroup.add(hose);
    });

    scene.add(fixedActuatorGroup);

    // C. Dynamic Chrome Piston Rod (Polished Chrome Ram extending downward)
    const unitPistonGeo = regActGeo(new THREE.CylinderGeometry(0.22, 0.22, 1.0, 18));
    const pistonMesh = new THREE.Mesh(unitPistonGeo, chromeMat);
    pistonMesh.position.set(0, BASE_Y + 3.85, 0);
    pistonMesh.scale.set(1, 5.35, 1);
    scene.add(pistonMesh);

    // D. Heavy Cast Swivel Clevis Base Group (Tumpuan Sendi Knuckle Base)
    // Moves dynamically with bridge deck deflection
    const swivelBaseGroup = new THREE.Group();
    swivelBaseGroup.position.set(0, BASE_Y + 0.55, 0);

    // 1. Upper Rod End Knuckle / Clevis Eye (Mounted to bottom of piston rod)
    const upperKnuckle = new THREE.Mesh(
      regActGeo(new THREE.CylinderGeometry(0.22, 0.22, 0.32, 16)),
      actuatorBlueMat
    );
    upperKnuckle.position.set(0, 0.55, 0);
    swivelBaseGroup.add(upperKnuckle);

    // 2. Heavy Transverse Swivel Pivot Pin
    const pivotPin = new THREE.Mesh(
      regActGeo(new THREE.CylinderGeometry(0.12, 0.12, 0.72, 16)),
      darkSteelMat
    );
    pivotPin.position.set(0, 0.38, 0);
    pivotPin.rotation.x = Math.PI / 2; // Transverse pin across Z-axis
    swivelBaseGroup.add(pivotPin);

    // Pin retaining washers / circlips on both ends
    [-0.37, 0.37].forEach(zp => {
      const washer = new THREE.Mesh(
        regActGeo(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 16)),
        darkSteelMat
      );
      washer.position.set(0, 0.38, zp);
      washer.rotation.x = Math.PI / 2;
      swivelBaseGroup.add(washer);
    });

    // 3. Heavy Cast Swivel Ears (Pillow blocks flanking the knuckle)
    [-0.24, 0.24].forEach(ze => {
      const ear = new THREE.Mesh(
        regActGeo(new THREE.BoxGeometry(0.38, 0.44, 0.14)),
        actuatorCastBlueMat
      );
      ear.position.set(0, 0.32, ze);
      swivelBaseGroup.add(ear);
    });

    // 4. Heavy Cast Rectangular Footplate Base
    const footplate = new THREE.Mesh(
      regActGeo(new THREE.BoxGeometry(0.92, 0.22, 0.72)),
      actuatorCastBlueMat
    );
    footplate.position.set(0, 0.11, 0);
    swivelBaseGroup.add(footplate);

    // 4 Heavy Base Anchor Hex Bolts
    const anchorNutGeo = regActGeo(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 6));
    [
      [-0.34, -0.26], [0.34, -0.26],
      [-0.34, 0.26], [0.34, 0.26]
    ].forEach(([bx, bz]) => {
      const bolt = new THREE.Mesh(anchorNutGeo, darkSteelMat);
      bolt.position.set(bx, 0.24, bz);
      swivelBaseGroup.add(bolt);
    });

    // Status LED indicator on the knuckle base
    const baseLed = new THREE.Mesh(
      regActGeo(new THREE.SphereGeometry(0.065, 10, 10)),
      loadCellLedMat
    );
    baseLed.position.set(0.42, 0.16, 0);
    swivelBaseGroup.add(baseLed);

    scene.add(swivelBaseGroup);

    // E. Heavy Steel Load Distribution Plate on Bridge Deck (Covering Bay B3 to B4)
    // Span along X from B3 (-4.3) to B4 (+4.3): Length = 8.4 units
    // Width along Z fitting cleanly between curbs: Width = 5.2 units
    const plateLenX = 8.4;
    const plateWidthZ = DECK_W - 0.7; // ~5.3 units
    const plateGroup = new THREE.Group();
    plateGroup.position.set(0, BASE_Y + 0.44, 0);

    // Main heavy steel distribution slab
    const plateMesh = new THREE.Mesh(
      regActGeo(new THREE.BoxGeometry(plateLenX, 0.22, plateWidthZ)),
      spreaderBeamMat
    );
    plateGroup.add(plateMesh);

    // Longitudinal & Transverse Stiffener Ribs on plate top
    [-plateWidthZ / 3, plateWidthZ / 3].forEach(rz => {
      const rib = new THREE.Mesh(
        regActGeo(new THREE.BoxGeometry(plateLenX * 0.95, 0.14, 0.12)),
        spreaderBeamMat
      );
      rib.position.set(0, 0.15, rz);
      plateGroup.add(rib);
    });

    [-plateLenX * 0.3, plateLenX * 0.3].forEach(rx => {
      const ribX = new THREE.Mesh(
        regActGeo(new THREE.BoxGeometry(0.14, 0.14, plateWidthZ * 0.92)),
        spreaderBeamMat
      );
      ribX.position.set(rx, 0.15, 0);
      plateGroup.add(ribX);
    });

    // Hazard yellow safety perimeter borders on B3 and B4 ends
    [-plateLenX / 2, plateLenX / 2].forEach(px => {
      const endBorder = new THREE.Mesh(
        regActGeo(new THREE.BoxGeometry(0.18, 0.24, plateWidthZ)),
        hazardYellowMat
      );
      endBorder.position.set(px, 0, 0);
      plateGroup.add(endBorder);
    });

    // Hazard yellow borders on side edges along curbs
    [-plateWidthZ / 2, plateWidthZ / 2].forEach(pz => {
      const sideBorder = new THREE.Mesh(
        regActGeo(new THREE.BoxGeometry(plateLenX, 0.24, 0.16)),
        hazardYellowMat
      );
      sideBorder.position.set(0, 0, pz);
      plateGroup.add(sideBorder);
    });

    scene.add(plateGroup);

    // F. Downward Dynamic Force Vector Arrow
    const forceArrowGroup = new THREE.Group();
    forceArrowGroup.position.set(0, BASE_Y + 2.4, 0);

    const arrowShaft = new THREE.Mesh(
      regActGeo(new THREE.CylinderGeometry(0.12, 0.12, 1.3, 12)),
      forceArrowMat
    );
    arrowShaft.position.y = 0.55;
    forceArrowGroup.add(arrowShaft);

    const arrowTip = new THREE.Mesh(
      regActGeo(new THREE.ConeGeometry(0.32, 0.6, 12)),
      forceArrowMat
    );
    arrowTip.position.y = -0.3;
    arrowTip.rotation.x = Math.PI; // Point downwards
    forceArrowGroup.add(arrowTip);

    forceArrowGroup.visible = false; // Initially hidden until load is applied
    scene.add(forceArrowGroup);

    // G. 3D Floating Digital Load Tag (HUD Billboard Sprite)
    const actCanvas = document.createElement('canvas');
    actCanvas.width = 512;
    actCanvas.height = 160;
    const actCtx = actCanvas.getContext('2d');
    const actTexture = new THREE.CanvasTexture(actCanvas);

    const updateActuatorSprite = (loadVal) => {
      actCtx.clearRect(0, 0, 512, 160);

      // Background rounded pill
      actCtx.fillStyle = 'rgba(13, 17, 23, 0.94)';
      actCtx.beginPath();
      actCtx.roundRect(10, 10, 492, 140, 22);
      actCtx.fill();

      // Border colored by load level
      let strokeColor = '#3fb950'; // Green normal
      let textColor = '#3fb950';
      if (loadVal >= 2.4) {
        strokeColor = '#f85149'; // Red danger
        textColor = '#f85149';
      } else if (loadVal > 0) {
        strokeColor = '#d29922'; // Amber warning / testing load
        textColor = '#d29922';
      }

      actCtx.strokeStyle = strokeColor;
      actCtx.lineWidth = 6;
      actCtx.stroke();

      // Title
      actCtx.font = 'bold 22px Inter, sans-serif';
      actCtx.fillStyle = '#8b949e';
      actCtx.textAlign = 'center';
      actCtx.fillText('AKTUATOR TENGAH BENTANG', 256, 48);

      // Value
      actCtx.font = 'bold 50px Inter, sans-serif';
      actCtx.fillStyle = textColor;
      actCtx.fillText(`P = ${loadVal.toFixed(2)} Ton`, 256, 114);

      actTexture.needsUpdate = true;
    };

    updateActuatorSprite(loadTon);

    const spriteMat = regActMat(new THREE.SpriteMaterial({
      map: actTexture,
      transparent: true
    }));
    const actuatorSprite = new THREE.Sprite(spriteMat);
    actuatorSprite.scale.set(6.2, 1.9, 1.0);
    actuatorSprite.position.set(0, BASE_Y + 14.5, 0);
    scene.add(actuatorSprite);

    // Save actuator references
    actuatorRefs.current = {
      reactionBeam,
      fixedActuatorGroup,
      piston: pistonMesh,
      swivelBase: swivelBaseGroup,
      loadCellLedMat,
      spreader: plateGroup,
      forceArrow: forceArrowGroup,
      forceArrowMat,
      sprite: actuatorSprite,
      updateSprite: updateActuatorSprite,
      texture: actTexture
    };

    // Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Tab Visibility Handler (0% GPU usage when inactive)
    let isTabVisible = !document.hidden;
    const handleVisibility = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 15. Animation Loop with Real-Time Deflection Bending & Actuator Stroke Tracking
    let animId;
    let lastComputedDef = -999;
    let lastComputedScale = -999;
    let lastComputedLoad = -999;

    const nodeCoords = {};
    rawNodes.forEach(n => {
      nodeCoords[n.id] = { x: n.x, y: n.y };
    });

    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const mid = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isTabVisible) return;

      const curDef = currentDefRef.current;
      const curScale = currentScaleRef.current;
      const curLoad = currentLoadRef.current;

      // Update structural bending ONLY when deflection or scale changes
      if (Math.abs(curDef - lastComputedDef) > 0.005 || curScale !== lastComputedScale) {
        const nodeSag = {};
        rawNodes.forEach(n => {
          const normSpan = (n.x + SPAN_L / 2) / SPAN_L; // 0 to 1
          const sag = (curDef / 10.0) * (curScale * 0.38) * Math.sin(Math.PI * normSpan);
          nodeSag[n.id] = sag;
        });

        // 1. Update Gusset Plates Position
        dynamicPlatesRef.current.forEach(p => {
          const sag = nodeSag[p.nodeId] || 0;
          p.group.position.set(p.origX, BASE_Y + p.origY - sag, p.z);
        });

        // 2. Update Red Truss Members Scale, Position & Orientation
        dynamicMembersRef.current.forEach(m => {
          const n1 = nodeCoords[m.n1];
          const n2 = nodeCoords[m.n2];
          const sag1 = nodeSag[m.n1] || 0;
          const sag2 = nodeSag[m.n2] || 0;

          v1.set(n1.x, BASE_Y + n1.y - sag1, m.z);
          v2.set(n2.x, BASE_Y + n2.y - sag2, m.z);

          const dist = v1.distanceTo(v2);
          mid.addVectors(v1, v2).multiplyScalar(0.5);
          dir.subVectors(v2, v1).normalize();

          m.mesh.position.copy(mid);
          m.mesh.scale.set(m.width, dist, m.depth);
          m.mesh.quaternion.setFromUnitVectors(up, dir);
        });

        // 3. Update Floor Beams & Center Stringer
        if (floorBeamsRef.current) {
          const { transverse, centerStringer } = floorBeamsRef.current;
          if (transverse) {
            transverse.forEach(fb => {
              const normSpan = (fb.x + SPAN_L / 2) / SPAN_L;
              const sag = (curDef / 10.0) * (curScale * 0.38) * Math.sin(Math.PI * normSpan);
              fb.mesh.position.set(fb.x, BASE_Y + 0.15 - sag, 0);
            });
          }
          if (centerStringer) {
            const midSag = (curDef / 10.0) * (curScale * 0.38);
            centerStringer.position.set(0, BASE_Y + 0.15 - midSag, 0);
          }
        }

        // 3b. Update Overhead Lateral Struts (Truss Top Chord Deflection)
        overheadStrutsRef.current.forEach(st => {
          const sag = nodeSag[st.nodeId] || 0;
          st.mesh.position.set(st.origX, BASE_Y + st.origY - sag, 0);
        });

        // 4. Update Deck Deformation Vertices
        if (deckMeshRef.current && origDeckGeoRef.current) {
          const pos = deckMeshRef.current.geometry.attributes.position;
          const orig = origDeckGeoRef.current;
          for (let i = 0; i < pos.count; i++) {
            const ox = orig.getX(i);
            const oy = orig.getY(i);
            const normSpan = (ox + SPAN_L / 2) / SPAN_L;
            const sag = (curDef / 10.0) * (curScale * 0.38) * Math.sin(Math.PI * normSpan);
            pos.setY(i, oy - sag);
          }
          pos.needsUpdate = true;
          deckMeshRef.current.geometry.computeVertexNormals();
        }

        // 4b. Update Curbs Deformation Vertices (Bends in 100% lockstep with roadway deck)
        if (curbsRef.current) {
          curbsRef.current.forEach(({ mesh, origGeo }) => {
            const pos = mesh.geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
              const ox = origGeo.getX(i);
              const oy = origGeo.getY(i);
              const normSpan = (ox + SPAN_L / 2) / SPAN_L;
              const sag = (curDef / 10.0) * (curScale * 0.38) * Math.sin(Math.PI * normSpan);
              pos.setY(i, oy - sag);
            }
            pos.needsUpdate = true;
            mesh.geometry.computeVertexNormals();
          });
        }

        // 4c. Update Roadway White Dashes Position (Stays glued to sagging road surface)
        if (dashesRef.current) {
          dashesRef.current.forEach(({ mesh, origX }) => {
            const normSpan = (origX + SPAN_L / 2) / SPAN_L;
            const sag = (curDef / 10.0) * (curScale * 0.38) * Math.sin(Math.PI * normSpan);
            mesh.position.y = BASE_Y + 0.54 - sag;
          });
        }

        // 4d. Update IoT Sensor Position (Mounted underneath bridge, sags with floor beam)
        if (sensorRef.current) {
          const midSag = (curDef / 10.0) * (curScale * 0.38);
          sensorRef.current.position.y = BASE_Y - 0.25 - midSag;
        }

        // 5. Update Mid-Span Hydraulic Actuator Piston Stroke & Deflection Tracking (Zero-Floating Fix)
        if (actuatorRefs.current) {
          const midSag = (curDef / 10.0) * (curScale * 0.38); // Mid-span deck deflection sag
          const apexSag = nodeSag['A3'] || midSag;            // Arch crown apex deflection sag
          const act = actuatorRefs.current;

          // Reaction beam & upper actuator descend with the arch crown apex so they NEVER float
          if (act.reactionBeam) {
            act.reactionBeam.position.y = BASE_Y + 12.75 - apexSag;
          }
          if (act.fixedActuatorGroup) {
            act.fixedActuatorGroup.position.y = BASE_Y - apexSag;
          }
          if (act.sprite) {
            act.sprite.position.y = BASE_Y + 14.5 - apexSag;
          }

          // Distribution plate (B3 to B4) & swivel knuckle base descend with the roadway deck
          if (act.spreader) {
            act.spreader.position.y = BASE_Y + 0.44 - midSag;
          }
          if (act.swivelBase) {
            act.swivelBase.position.y = BASE_Y + 0.55 - midSag;
          }

          // Piston rod stroke smoothly bridges the descending cylinder body and the descending plate
          if (act.piston) {
            const topY = (BASE_Y - apexSag) + 6.55; // Bottom of gland seal
            const botY = (BASE_Y - midSag) + 1.10;  // Top of swivel knuckle base on distribution plate
            const pDist = Math.max(0.1, topY - botY);
            act.piston.scale.set(1, pDist, 1);
            act.piston.position.y = (topY + botY) / 2;
          }
          if (act.forceArrow) {
            act.forceArrow.position.y = BASE_Y + 3.2 - midSag;
          }
        }

        lastComputedDef = curDef;
        lastComputedScale = curScale;
      }

      // Check for loadTon changes to update Actuator Load HUD & Force Arrow
      if (Math.abs(curLoad - lastComputedLoad) > 0.01) {
        if (actuatorRefs.current) {
          const act = actuatorRefs.current;
          if (act.updateSprite) {
            act.updateSprite(curLoad);
          }
          if (act.forceArrow) {
            if (curLoad > 0) {
              act.forceArrow.visible = true;
              const arrowScale = Math.min(1.8, 0.7 + (curLoad / 2.4) * 0.7);
              act.forceArrow.scale.set(arrowScale, arrowScale, arrowScale);
              if (curLoad >= 2.4) {
                act.forceArrowMat.color.setHex(0xef4444);
                act.forceArrowMat.emissive.setHex(0xb91c1c);
                act.loadCellLedMat.color.setHex(0xef4444);
              } else {
                act.forceArrowMat.color.setHex(0xf5ba13);
                act.forceArrowMat.emissive.setHex(0xd97706);
                act.loadCellLedMat.color.setHex(0xf5ba13);
              }
            } else {
              act.forceArrow.visible = false;
              act.loadCellLedMat.color.setHex(0x10b981);
            }
          }
        }
        lastComputedLoad = curLoad;
      }

      // Dynamic force arrow pulse during active loading
      if (actuatorRefs.current && actuatorRefs.current.forceArrow && actuatorRefs.current.forceArrow.visible) {
        const pulse = 1 + 0.05 * Math.sin(Date.now() * 0.009);
        const baseScale = Math.min(1.8, 0.7 + (curLoad / 2.4) * 0.7);
        actuatorRefs.current.forceArrow.scale.set(baseScale, baseScale * pulse, baseScale);
      }

      // Sensor Beacon Pulse
      if (sensorRef.current) {
        const s = 1 + 0.08 * Math.sin(Date.now() * 0.006);
        sensorRef.current.scale.set(s, s, s);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on Component Unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);

      skyTexture.dispose();
      unitBoxGeo.dispose();
      unitBoltGeo.dispose();
      deckGeo.dispose();
      deckMat.dispose();
      trussMat.dispose();
      gussetMat.dispose();
      boltMat.dispose();
      curbMat.dispose();
      lineMat.dispose();
      sensorMat.dispose();

      // Dispose all environment geometries & materials
      envGeometries.forEach(g => g.dispose());
      envMaterials.forEach(m => m.dispose());

      // Dispose dynamic curbs & dashes
      curbsRef.current.forEach(({ mesh }) => mesh.geometry.dispose());
      dashesRef.current.forEach(({ mesh }) => mesh.geometry.dispose());

      // Dispose all actuator geometries, materials & texture
      actGeometries.forEach(g => g.dispose());
      actMaterials.forEach(m => m.dispose());
      actTexture.dispose();

      renderer.dispose();
      if (renderer.forceContextLoss) {
        renderer.forceContextLoss();
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Preset Camera Angles (Framing Bridge, Land Terrain & Actuator View)
  const setCameraView = (view) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (view === 'proposal') {
      // 3/4 Perspective Angle (Showing full bridge spanning between the two landmasses)
      cam.position.set(38, BASE_Y + 10.0, 44);
      ctrl.target.set(0, BASE_Y + 3.5, 0);
    } else if (view === 'elevation') {
      // Side Elevation (Profile showing arch spanning gorge between cliffs)
      cam.position.set(0, BASE_Y + 6.0, 80);
      ctrl.target.set(0, BASE_Y + 6.0, 0);
    } else if (view === 'actuator') {
      // Close-Up View directly on Mid-Span Hydraulic Actuator
      cam.position.set(8.5, BASE_Y + 7.5, 9.5);
      ctrl.target.set(0, BASE_Y + 5.5, 0);
    } else if (view === 'top') {
      // Bird's Eye Top View
      cam.position.set(0, BASE_Y + 70, 0.1);
      ctrl.target.set(0, BASE_Y + 2.0, 0);
    } else if (view === 'sensor') {
      // Close up on IoT Sensor Module underneath the bridge (looking up from below)
      cam.position.set(0, BASE_Y - 3.8, 6.8);
      ctrl.target.set(0, BASE_Y - 0.25, 0);
    }
    ctrl.update();
  };

  return (
    <section id="sectionModel3D" className="bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] rounded-xl p-5 shadow-xs space-y-4 transition">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-[#1F2328] dark:text-white">Visualisasi Struktur 3D</h2>
          <span className="text-xs text-[#656D76] dark:text-[#8B949E]">Through Tied Arch Parker-Warren (Skala & Rasio GAMTEK 100%)</span>
        </div>

        {/* Minimal Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Camera Angles */}
          <div className="bg-[#F6F8FA] dark:bg-[#0D1117] border border-[#D0D7DE] dark:border-[#30363D] p-0.5 rounded-lg flex items-center text-xs">
            <button
              onClick={() => setCameraView('proposal')}
              className="px-2.5 py-1 rounded-md text-[#1F2328] dark:text-white hover:bg-white dark:hover:bg-[#21262D] transition"
              title="Sudut Perspektif 3/4 Proposal Sesuai Gambar 2"
            >
              3/4 Oblique
            </button>
            <button
              onClick={() => setCameraView('elevation')}
              className="px-2.5 py-1 rounded-md text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white hover:bg-white dark:hover:bg-[#21262D] transition"
              title="Elevasi Samping Murni Sesuai Gambar 1"
            >
              Elevasi
            </button>
            <button
              onClick={() => setCameraView('actuator')}
              className="px-2.5 py-1 rounded-md text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white hover:bg-white dark:hover:bg-[#21262D] transition font-medium"
              title="Fokus Detail Aktuator Pembebanan Tengah Bentang"
            >
              Aktuator
            </button>
            <button
              onClick={() => setCameraView('top')}
              className="px-2.5 py-1 rounded-md text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white hover:bg-white dark:hover:bg-[#21262D] transition"
              title="Tampak Atas"
            >
              Atas
            </button>
            <button
              onClick={() => setCameraView('sensor')}
              className="px-2.5 py-1 rounded-md text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white hover:bg-white dark:hover:bg-[#21262D] transition"
              title="Lihat Bagian Bawah Jembatan & Sensor IoT MPU6050"
            >
              Bawah (Sensor)
            </button>
          </div>

          {/* Deflection Scale */}
          <div className="bg-[#F6F8FA] dark:bg-[#0D1117] border border-[#D0D7DE] dark:border-[#30363D] p-0.5 rounded-lg flex items-center text-xs">
            <span className="text-[#656D76] dark:text-[#8B949E] px-2 text-[11px]">Bending:</span>
            <button
              onClick={() => onSetDeformScale(1)}
              className={`px-2 py-0.5 rounded transition ${
                deformScale === 1
                  ? 'bg-white dark:bg-[#21262D] text-[#1F2328] dark:text-white font-medium shadow-xs'
                  : 'text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white'
              }`}
            >
              1x
            </button>
            <button
              onClick={() => onSetDeformScale(5)}
              className={`px-2 py-0.5 rounded transition ${
                deformScale === 5
                  ? 'bg-white dark:bg-[#21262D] text-[#1F2328] dark:text-white font-medium shadow-xs'
                  : 'text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white'
              }`}
            >
              5x
            </button>
          </div>
        </div>
      </div>

      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        className="relative w-full h-[410px] sm:h-[460px] bg-[#12151a] rounded-lg border border-[#D0D7DE] dark:border-[#21262D] overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-[#161B22]/90 border border-[#D0D7DE] dark:border-[#30363D] px-3 py-1.5 rounded-lg text-xs text-[#1F2328] dark:text-[#C9D1D9] backdrop-blur-sm pointer-events-none shadow-xs flex items-center gap-2">
          <span>Status: <strong className="text-[#1F2328] dark:text-white font-medium">{status} ({deflection.toFixed(2)} mm)</strong></span>
          <span className="text-[#D0D7DE] dark:text-[#30363D]">·</span>
          <span>Beban Aktuator: <strong className="text-[#1F2328] dark:text-white font-medium">{loadTon.toFixed(2)} Ton</strong></span>
        </div>

        <div className="absolute bottom-3 right-3 text-[11px] text-[#8C959F] dark:text-[#6E7681] pointer-events-none hidden sm:block">
          Drag untuk rotasi 360° · Scroll untuk zoom
        </div>
      </div>
    </section>
  );
}

export default React.memo(Bridge3DViewerComponent);
