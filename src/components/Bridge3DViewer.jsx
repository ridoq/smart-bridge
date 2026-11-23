import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Physical Bridge Dimensions (Matching ITB Civil Model & Render Images 100%)
const SPAN_L = 50.0;
const DECK_W = 7.2;
const TRUSS_H = 9.2;
const STAND_H = 7.2;
const BASE_Y = STAND_H; // Height where bridge rests on the trestle stands

function Bridge3DViewerComponent({
  deflection,
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
  const deckMeshRef = useRef(null);
  const origDeckGeoRef = useRef(null);
  const sensorRef = useRef(null);

  const currentDefRef = useRef(deflection);
  const currentScaleRef = useRef(deformScale);

  useEffect(() => {
    currentDefRef.current = deflection;
  }, [deflection]);

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
    camera.position.set(38, BASE_Y + 8.5, 46);
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
    controls.maxPolarAngle = Math.PI / 2 - 0.01; // Can't dip below horizon
    controls.minDistance = 5;
    controls.maxDistance = 220;
    controls.target.set(0, BASE_Y + 2.5, 0);
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

    // 8. Exact Topology of Parker-Warren Truss (100% Matching Uploaded Images)
    // Primary Nodes with Flat Apex Crest
    const rawNodes = [
      // Bottom Chord
      { id: 'B0', x: -25.0, y: 0.0 },
      { id: 'B1', x: -19.9, y: 0.0 },
      { id: 'B2', x: -9.9, y: 0.0 },
      { id: 'B3', x: -4.4, y: 0.0 },
      { id: 'B_mid', x: 0.0, y: 0.0 },
      { id: 'B3_r', x: 4.4, y: 0.0 },
      { id: 'B2_r', x: 9.9, y: 0.0 },
      { id: 'B1_r', x: 19.9, y: 0.0 },
      { id: 'B0_r', x: 25.0, y: 0.0 },

      // Top Arch Chord (Parker Truss with Horizontal Apex Flat)
      { id: 'T1', x: -19.9, y: 3.7 },
      { id: 'T2', x: -13.5, y: 6.5 },
      { id: 'T3', x: -4.4, y: 8.8 },
      { id: 'T_mid_L', x: -2.1, y: 9.2 },
      { id: 'T_mid_R', x: 2.1, y: 9.2 },
      { id: 'T3_r', x: 4.4, y: 8.8 },
      { id: 'T2_r', x: 13.5, y: 6.5 },
      { id: 'T1_r', x: 19.9, y: 3.7 },

      // Subdivided Panels & Intersections
      { id: 'M1', x: -15.5, y: 1.8 },
      { id: 'M2', x: -8.0, y: 3.8 },
      { id: 'M3', x: -4.4, y: 6.3 },
      { id: 'M_mid', x: 0.0, y: 6.3 }, // Center chevron apex
      { id: 'M3_r', x: 4.4, y: 6.3 },
      { id: 'M2_r', x: 8.0, y: 3.8 },
      { id: 'M1_r', x: 15.5, y: 1.8 }
    ];

    // Connectivity List for Truss Members
    const trussEdges = [
      // Bottom Chords
      ['B0', 'B1'], ['B1', 'B2'], ['B2', 'B3'], ['B3', 'B_mid'],
      ['B_mid', 'B3_r'], ['B3_r', 'B2_r'], ['B2_r', 'B1_r'], ['B1_r', 'B0_r'],

      // Top Chords with Flat Crest
      ['B0', 'T1'], ['T1', 'T2'], ['T2', 'T3'], ['T3', 'T_mid_L'],
      ['T_mid_L', 'T_mid_R'],
      ['T_mid_R', 'T3_r'], ['T3_r', 'T2_r'], ['T2_r', 'T1_r'], ['T1_r', 'B0_r'],

      // Verticals
      ['B1', 'T1'], ['B1_r', 'T1_r'],
      ['B3', 'M3'], ['M3', 'T3'],
      ['B3_r', 'M3_r'], ['M3_r', 'T3_r'],
      ['M_mid', 'T_mid_L'], ['M_mid', 'T_mid_R'],

      // Diagonals with Sub-panel Bracing
      // Bay 1: X-Brace
      ['T1', 'M1'], ['M1', 'B2'],
      ['B1', 'M1'], ['M1', 'T2'],

      // Bay 2: X-Brace
      ['T2', 'M2'], ['M2', 'B3'],
      ['B2', 'M2'], ['M2', 'T3'],

      // Center Bay: Inverted Chevron + Horizontal Tie
      ['M3', 'M_mid'], ['M_mid', 'M3_r'],
      ['B3', 'M_mid'], ['B3_r', 'M_mid'],

      // Right Bay 2: X-Brace
      ['T3_r', 'M2_r'], ['M2_r', 'B2_r'],
      ['B3_r', 'M2_r'], ['M2_r', 'T2_r'],

      // Right Bay 1: X-Brace
      ['T2_r', 'M1_r'], ['M1_r', 'B1_r'],
      ['B2_r', 'M1_r'], ['M1_r', 'T1_r']
    ];

    const unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
    const createTrussBeam = (n1, n2, z, width = 0.32, depth = 0.38) => {
      const mesh = new THREE.Mesh(unitBoxGeo, trussMat);
      scene.add(mesh);
      return { mesh, n1, n2, z, width, depth };
    };

    const unitBoltGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.14, 6);

    // Gusset Plate with Distinct Bolts
    const createGussetPlate = (nodeId, x, y, z, plateSize = 0.95) => {
      const plateGroup = new THREE.Group();
      plateGroup.position.set(x, BASE_Y + y, z);

      // Yellow Plate
      const plateMesh = new THREE.Mesh(
        new THREE.BoxGeometry(plateSize, plateSize * 0.85, 0.44),
        gussetMat
      );
      plateGroup.add(plateMesh);

      // Cluster of Black Bolts
      const boltOffsets = [
        [-plateSize * 0.3, -plateSize * 0.25],
        [plateSize * 0.3, -plateSize * 0.25],
        [-plateSize * 0.3, plateSize * 0.25],
        [plateSize * 0.3, plateSize * 0.25],
        [0, 0]
      ];

      boltOffsets.forEach(([bx, by]) => {
        const boltF = new THREE.Mesh(unitBoltGeo, boltMat);
        boltF.rotation.x = Math.PI / 2;
        boltF.position.set(bx, by, 0.24);
        plateGroup.add(boltF);

        const boltB = new THREE.Mesh(unitBoltGeo, boltMat);
        boltB.rotation.x = Math.PI / 2;
        boltB.position.set(bx, by, -0.24);
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
        let pSize = 0.9;
        if (n.id.startsWith('B0')) pSize = 1.35; // Shoe plates
        else if (n.id === 'M_mid' || n.id.startsWith('T3') || n.id.startsWith('T_mid')) pSize = 1.1;
        else if (n.id.startsWith('M1') || n.id.startsWith('M2')) pSize = 0.68; // Intersection plates

        const plate = createGussetPlate(n.id, n.x, n.y, zPos, pSize);
        platesList.push(plate);
      });

      trussEdges.forEach(([id1, id2]) => {
        const isChord = id1.startsWith('B') && id2.startsWith('B');
        const isArch = id1.startsWith('T') && id2.startsWith('T');
        const w = (isChord || isArch) ? 0.36 : 0.26;
        const d = (isChord || isArch) ? 0.42 : 0.32;
        membersList.push(createTrussBeam(id1, id2, zPos, w, d));
      });
    });

    dynamicMembersRef.current = membersList;
    dynamicPlatesRef.current = platesList;

    // 10. Transverse Floor Beams (Cross Girders under Deck)
    const bottomJoints = rawNodes.filter(n => n.id.startsWith('B'));
    const floorBeams = [];

    bottomJoints.forEach(bj => {
      const fbMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.55, DECK_W + 0.6),
        trussMat
      );
      scene.add(fbMesh);
      floorBeams.push({ mesh: fbMesh, x: bj.x });
    });
    floorBeamsRef.current = floorBeams;

    // 11. Roadway Deck (Continuous Multi-Segment Mesh with Dynamic Deflection)
    const deckGeo = new THREE.BoxGeometry(SPAN_L, 0.35, DECK_W - 0.2, 40, 1, 2);
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.position.set(0, BASE_Y + 0.35, 0);
    scene.add(deckMesh);
    deckMeshRef.current = deckMesh;
    origDeckGeoRef.current = deckGeo.attributes.position.clone();

    // Roadway Markings
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let lx = -SPAN_L / 2 + 2; lx < SPAN_L / 2 - 2; lx += 4) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.16), lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(lx, BASE_Y + 0.54, 0);
      scene.add(dash);
    }

    // Curbs along the deck
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xb03a2e, roughness: 0.5, metalness: 0.3 });
    [-DECK_W / 2 + 0.15, DECK_W / 2 - 0.15].forEach(cz => {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(SPAN_L, 0.45, 0.3), curbMat);
      curb.position.set(0, BASE_Y + 0.6, cz);
      scene.add(curb);
    });

    // 12. Overhead Lateral Wind Struts connecting Left & Right Arches
    const topJoints = ['T1', 'T2', 'T3', 'T_mid_L', 'T_mid_R', 'T3_r', 'T2_r', 'T1_r'];
    topJoints.forEach(tjId => {
      const node = rawNodes.find(n => n.id === tjId);
      if (node) {
        const strut = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, DECK_W, 8),
          trussMat
        );
        strut.rotation.x = Math.PI / 2;
        strut.position.set(node.x, BASE_Y + node.y, 0);
        scene.add(strut);
      }
    });

    // 13. Mid-Span IoT Sensor Module (MPU6050 + ESP32 Box on Bottom Chord)
    const sensorMat = new THREE.MeshStandardMaterial({
      color: 0x2f81f7,
      emissive: 0x1f6feb,
      roughness: 0.2,
      metalness: 0.8
    });
    const sensor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.5), sensorMat);
    sensor.position.set(0, BASE_Y + 0.5, -DECK_W / 2 + 0.7);
    scene.add(sensor);
    sensorRef.current = sensor;

    const led = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshBasicMaterial({ color: 0x3fb950 }));
    led.position.set(0, 0.2, 0);
    sensor.add(led);

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

    // 14. Animation Loop with Real-Time Deflection Bending (Zero-Allocation Performance)
    let animId;
    let lastComputedDef = -999;
    let lastComputedScale = -999;

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

        // 3. Update Floor Beams
        floorBeamsRef.current.forEach(fb => {
          const normSpan = (fb.x + SPAN_L / 2) / SPAN_L;
          const sag = (curDef / 10.0) * (curScale * 0.38) * Math.sin(Math.PI * normSpan);
          fb.mesh.position.set(fb.x, BASE_Y + 0.15 - sag, 0);
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

        lastComputedDef = curDef;
        lastComputedScale = curScale;
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

      renderer.dispose();
      if (renderer.forceContextLoss) {
        renderer.forceContextLoss();
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Preset Camera Angles (Framing Bridge, Land Terrain & River Gorge)
  const setCameraView = (view) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (view === 'proposal') {
      // 3/4 Perspective Angle (Showing full bridge spanning between the two landmasses)
      cam.position.set(38, BASE_Y + 8.5, 46);
      ctrl.target.set(0, BASE_Y + 2.5, 0);
    } else if (view === 'elevation') {
      // Side Elevation (Profile showing arch spanning gorge between cliffs)
      cam.position.set(0, BASE_Y + 4.0, 76);
      ctrl.target.set(0, BASE_Y + 4.0, 0);
    } else if (view === 'top') {
      // Bird's Eye Top View
      cam.position.set(0, BASE_Y + 65, 0.1);
      ctrl.target.set(0, BASE_Y + 1.0, 0);
    } else if (view === 'sensor') {
      // Close up on IoT Sensor Module
      cam.position.set(3.5, BASE_Y + 3.5, 5.5);
      ctrl.target.set(0, BASE_Y + 0.8, -DECK_W / 2 + 0.7);
    }
    ctrl.update();
  };

  return (
    <section id="sectionModel3D" className="bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] rounded-xl p-5 shadow-xs space-y-4 transition">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-[#1F2328] dark:text-white">Visualisasi Struktur 3D</h2>
          <span className="text-xs text-[#656D76] dark:text-[#8B949E]">Through Tied Arch Parker-Warren (100% Desain Asli)</span>
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
              onClick={() => setCameraView('top')}
              className="px-2.5 py-1 rounded-md text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white hover:bg-white dark:hover:bg-[#21262D] transition"
              title="Tampak Atas"
            >
              Atas
            </button>
            <button
              onClick={() => setCameraView('sensor')}
              className="px-2.5 py-1 rounded-md text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white hover:bg-white dark:hover:bg-[#21262D] transition"
              title="Fokus Sensor IoT MPU6050"
            >
              Sensor
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
        <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-[#161B22]/90 border border-[#D0D7DE] dark:border-[#30363D] px-3 py-1.5 rounded-lg text-xs text-[#1F2328] dark:text-[#C9D1D9] backdrop-blur-sm pointer-events-none shadow-xs">
          Status: <span className="text-[#1F2328] dark:text-white font-medium">{status} ({deflection.toFixed(2)} mm)</span>
        </div>

        <div className="absolute bottom-3 right-3 text-[11px] text-[#8C959F] dark:text-[#6E7681] pointer-events-none hidden sm:block">
          Drag untuk rotasi 360° · Scroll untuk zoom
        </div>
      </div>
    </section>
  );
}

export default React.memo(Bridge3DViewerComponent);
