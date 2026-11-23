import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Physical Bridge Dimensions (Matching ITB Civil Model & Render Images 100%)
const SPAN_L = 50.0;
const DECK_W = 7.2;
const TRUSS_H = 9.2;
const STAND_H = 8.2;
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
  const dynamicNodesRef = useRef([]);
  const dynamicMembersRef = useRef([]);
  const dynamicPlatesRef = useRef([]);
  const floorBeamsRef = useRef([]);
  const deckMeshRef = useRef(null);
  const origDeckGeoRef = useRef(null);
  const truckRef = useRef(null);
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

    // 1. Scene with Sunset Golden Hour Background
    const scene = new THREE.Scene();

    // Create realistic sunset sky gradient texture
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 512;
    skyCanvas.height = 512;
    const ctx = skyCanvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#4a6d8c'); // Twilight blue top
    grad.addColorStop(0.35, '#847fa5'); // Soft lavender
    grad.addColorStop(0.65, '#cb837b'); // Sunset rose
    grad.addColorStop(0.85, '#f5a676'); // Warm golden peach
    grad.addColorStop(1.0, '#ffcb9a'); // Golden horizon glow
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Wispy subtle sunset clouds
    ctx.fillStyle = 'rgba(255, 235, 220, 0.12)';
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      const cx = (i * 35) % 512;
      const cy = 100 + (i * 19) % 220;
      ctx.ellipse(cx, cy, 60 + (i % 4) * 25, 6 + (i % 3) * 4, -0.05, 0, Math.PI * 2);
      ctx.fill();
    }

    const skyTexture = new THREE.CanvasTexture(skyCanvas);
    scene.background = skyTexture;
    scene.fog = new THREE.FogExp2(0xf5a676, 0.0035);

    // 2. Camera (3/4 Perspective Default matching Image 2)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(32, 17, 34);
    cameraRef.current = camera;

    // 3. Renderer with Optimized Settings
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'default'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going below floor
    controls.minDistance = 6;
    controls.maxDistance = 150;
    controls.target.set(0, BASE_Y + 3.0, 0);
    controlsRef.current = controls;

    // 5. Lighting (Sunset Golden Hour)
    const hemiLight = new THREE.HemisphereLight(0xffdfcb, 0x1f262e, 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffe1b5, 1.6);
    sunLight.position.set(-28, 38, 26);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    const sunsetFill = new THREE.DirectionalLight(0xf29d79, 0.6);
    sunsetFill.position.set(35, 18, -25);
    scene.add(sunsetFill);

    // 6. Ground Studio Floor
    const floorGeo = new THREE.PlaneGeometry(260, 260);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x101317,
      roughness: 0.75,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 7. Reusable Materials (Red Truss, Yellow Gusset Plates, Black Bolts, Dark Steel Stands)
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0xd63d27, // Vibrant Civil Red-Orange
      roughness: 0.38,
      metalness: 0.45
    });

    const gussetMat = new THREE.MeshStandardMaterial({
      color: 0xf5ba13, // Golden Yellow Gusset Plate
      roughness: 0.32,
      metalness: 0.4
    });

    const boltMat = new THREE.MeshStandardMaterial({
      color: 0x181a1b, // Black Rivet / Bolt Head
      roughness: 0.2,
      metalness: 0.85
    });

    const standMat = new THREE.MeshStandardMaterial({
      color: 0x222528, // Dark Charcoal Steel Frame
      roughness: 0.55,
      metalness: 0.6
    });

    const padMat = new THREE.MeshStandardMaterial({
      color: 0x935541, // Bronze/Copper Bearing Plate
      roughness: 0.45,
      metalness: 0.5
    });

    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x1f2328, // Dark Asphalt / Steel Running Surface
      roughness: 0.75,
      metalness: 0.3
    });

    // 8. Build Trestle Support Stands (Trapezoidal Open Steel Stands in Images)
    const buildTrestleStand = (posX) => {
      const standGroup = new THREE.Group();
      standGroup.position.set(posX, 0, 0);

      const topW = 9.5;
      const topD = 9.0;
      const botW = 13.5;
      const botD = 12.0;
      const legR = 0.38;

      // Top Platform Plate
      const topPlate = new THREE.Mesh(
        new THREE.BoxGeometry(topW, 0.45, topD),
        standMat
      );
      topPlate.position.set(0, STAND_H - 0.22, 0);
      topPlate.castShadow = true;
      topPlate.receiveShadow = true;
      standGroup.add(topPlate);

      // Bearing Pad on Top
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(topW * 0.75, 0.25, DECK_W + 0.8),
        padMat
      );
      pad.position.set(0, STAND_H + 0.12, 0);
      pad.castShadow = true;
      pad.receiveShadow = true;
      standGroup.add(pad);

      // Helper for stand tubular struts
      const addTubularStrut = (p1, p2, r, mat) => {
        const dist = p1.distanceTo(p2);
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dist, 8), mat);
        cyl.position.copy(p1).add(p2).multiplyScalar(0.5);
        cyl.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3().subVectors(p2, p1).normalize()
        );
        cyl.castShadow = true;
        standGroup.add(cyl);
      };

      // 4 Inclined Trapezoidal Legs
      const corners = [
        { tx: -topW / 2 + 0.4, tz: -topD / 2 + 0.4, bx: -botW / 2, bz: -botD / 2 },
        { tx: topW / 2 - 0.4, tz: -topD / 2 + 0.4, bx: botW / 2, bz: -botD / 2 },
        { tx: -topW / 2 + 0.4, tz: topD / 2 - 0.4, bx: -botW / 2, bz: botD / 2 },
        { tx: topW / 2 - 0.4, tz: topD / 2 - 0.4, bx: botW / 2, bz: botD / 2 }
      ];

      corners.forEach(c => {
        const topPt = new THREE.Vector3(c.tx, STAND_H - 0.4, c.tz);
        const botPt = new THREE.Vector3(c.bx, 0.2, c.bz);
        addTubularStrut(topPt, botPt, legR, standMat);
      });

      // Bottom Rectangular Tubular Base Frame
      const bPts = [
        new THREE.Vector3(-botW / 2, 0.2, -botD / 2),
        new THREE.Vector3(botW / 2, 0.2, -botD / 2),
        new THREE.Vector3(botW / 2, 0.2, botD / 2),
        new THREE.Vector3(-botW / 2, 0.2, botD / 2)
      ];
      for (let i = 0; i < 4; i++) {
        addTubularStrut(bPts[i], bPts[(i + 1) % 4], legR * 0.9, standMat);
      }

      scene.add(standGroup);
    };

    buildTrestleStand(-SPAN_L / 2);
    buildTrestleStand(SPAN_L / 2);

    // 9. Exact Topology of Parker-Warren Truss (100% Matching Uploaded Images)
    // Primary Nodes (Left Half normalized to Span, Mirrored to Right Half)
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

      // Top Arch Chord (Faceted Polygon Bowstring)
      { id: 'T1', x: -19.9, y: 3.7 },
      { id: 'T2', x: -13.5, y: 6.5 },
      { id: 'T3', x: -4.4, y: 8.8 },
      { id: 'T_mid', x: 0.0, y: 9.2 },
      { id: 'T3_r', x: 4.4, y: 8.8 },
      { id: 'T2_r', x: 13.5, y: 6.5 },
      { id: 'T1_r', x: 19.9, y: 3.7 },

      // Sub-Panel & Intersection Gusset Plates (Subdivided Parker Truss)
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

      // Top Chords
      ['B0', 'T1'], ['T1', 'T2'], ['T2', 'T3'], ['T3', 'T_mid'],
      ['T_mid', 'T3_r'], ['T3_r', 'T2_r'], ['T2_r', 'T1_r'], ['T1_r', 'B0_r'],

      // Verticals
      ['B1', 'T1'], ['B1_r', 'T1_r'],
      ['B3', 'M3'], ['M3', 'T3'],
      ['B3_r', 'M3_r'], ['M3_r', 'T3_r'],
      ['M_mid', 'T_mid'],

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

    // Helper to instantiate a 3D box truss member
    const unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
    const createTrussBeam = (n1, n2, z, width = 0.32, depth = 0.38) => {
      const mesh = new THREE.Mesh(unitBoxGeo, trussMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return { mesh, n1, n2, z, width, depth };
    };

    // Shared Bolt Geometry (Hex/Cylinder)
    const unitBoltGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.14, 6);

    // Helper to create realistic Yellow Gusset Plate with Black Bolts
    const createGussetPlate = (nodeId, x, y, z, plateSize = 0.95) => {
      const plateGroup = new THREE.Group();
      plateGroup.position.set(x, BASE_Y + y, z);

      // Yellow Octagonal / Chamfered Plate
      const plateMesh = new THREE.Mesh(
        new THREE.BoxGeometry(plateSize, plateSize * 0.85, 0.44),
        gussetMat
      );
      plateMesh.castShadow = true;
      plateGroup.add(plateMesh);

      // Cluster of 4 to 6 Black Bolts
      const boltOffsets = [
        [-plateSize * 0.3, -plateSize * 0.25],
        [plateSize * 0.3, -plateSize * 0.25],
        [-plateSize * 0.3, plateSize * 0.25],
        [plateSize * 0.3, plateSize * 0.25],
        [0, 0]
      ];

      boltOffsets.forEach(([bx, by]) => {
        // Front bolt
        const boltF = new THREE.Mesh(unitBoltGeo, boltMat);
        boltF.rotation.x = Math.PI / 2;
        boltF.position.set(bx, by, 0.24);
        plateGroup.add(boltF);

        // Back bolt
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
      // Create Gusset Plates for each node
      rawNodes.forEach(n => {
        let pSize = 0.85;
        if (n.id.startsWith('B0')) pSize = 1.35; // Shoe plates
        else if (n.id === 'M_mid' || n.id.startsWith('T3') || n.id === 'T_mid') pSize = 1.1;
        else if (n.id.startsWith('M1') || n.id.startsWith('M2')) pSize = 0.65; // Intersection plates

        const plate = createGussetPlate(n.id, n.x, n.y, zPos, pSize);
        platesList.push(plate);
      });

      // Create Red Truss Members
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

    // 10. Transverse Floor Beams (Cross Girders under Deck at Bottom Joints)
    const bottomJoints = rawNodes.filter(n => n.id.startsWith('B'));
    const floorBeams = [];

    bottomJoints.forEach(bj => {
      const fbMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.55, DECK_W + 0.6),
        trussMat
      );
      fbMesh.castShadow = true;
      fbMesh.receiveShadow = true;
      scene.add(fbMesh);
      floorBeams.push({ mesh: fbMesh, x: bj.x });
    });
    floorBeamsRef.current = floorBeams;

    // 11. Roadway Deck (Continuous Multi-Segment Mesh with Dynamic Deflection)
    const deckGeo = new THREE.BoxGeometry(SPAN_L, 0.35, DECK_W - 0.2, 40, 1, 2);
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.position.set(0, BASE_Y + 0.35, 0);
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
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
    const topJoints = ['T1', 'T2', 'T3', 'T_mid', 'T3_r', 'T2_r', 'T1_r'];
    topJoints.forEach(tjId => {
      const node = rawNodes.find(n => n.id === tjId);
      if (node) {
        const strut = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, DECK_W, 8),
          trussMat
        );
        strut.rotation.x = Math.PI / 2;
        strut.position.set(node.x, BASE_Y + node.y, 0);
        strut.castShadow = true;
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

    // 14. Testing Load Rig / Truck
    const truck = new THREE.Group();
    const truckBody = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 1.4, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x2f81f7, roughness: 0.3 })
    );
    truckBody.position.y = 1.1;
    truckBody.castShadow = true;
    truck.add(truckBody);

    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.25, 1.9),
      new THREE.MeshStandardMaterial({ color: 0x2f81f7, roughness: 0.3 })
    );
    cab.position.set(1.8, 1.3, 0);
    truck.add(cab);

    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.9 });
    [-1.2, 0.5, 2.0].forEach(wx => {
      [-1.05, 1.05].forEach(wz => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.35, 10), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.48, wz);
        truck.add(wheel);
      });
    });

    truck.position.set(0, BASE_Y + 0.45, 1.2);
    scene.add(truck);
    truckRef.current = truck;

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

    // 15. Animation Loop with Real-Time Deflection Bending (Zero-Allocation Performance)
    let animId;
    let truckPos = 0;
    let lastComputedDef = -999;
    let lastComputedScale = -999;

    // Helper map of node coordinates
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
        // Compute sagging for each node: sag(x) = (def / 10.0) * (scale * 0.4) * cos(pi * x / span)
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

      // Truck Patrol Movement
      if (truckRef.current) {
        truckPos += 0.08;
        if (truckPos > SPAN_L / 2 - 2) truckPos = -SPAN_L / 2 + 2;
        truckRef.current.position.x = truckPos;
        const norm = (truckPos + SPAN_L / 2) / SPAN_L;
        const sag = (curDef / 10.0) * (curScale * 0.38) * Math.sin(Math.PI * norm);
        truckRef.current.position.y = BASE_Y + 0.45 - sag;
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

      // Cleanly dispose Three.js geometries, textures, materials to avoid leaks
      skyTexture.dispose();
      unitBoxGeo.dispose();
      unitBoltGeo.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      deckGeo.dispose();
      deckMat.dispose();
      trussMat.dispose();
      gussetMat.dispose();
      boltMat.dispose();
      standMat.dispose();
      padMat.dispose();
      curbMat.dispose();
      lineMat.dispose();
      sensorMat.dispose();

      renderer.dispose();
      if (renderer.forceContextLoss) {
        renderer.forceContextLoss();
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Preset Camera Angles
  const setCameraView = (view) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (view === 'proposal') {
      // 3/4 Perspective Angle (Image 2)
      cam.position.set(30, 16, 32);
      ctrl.target.set(0, BASE_Y + 3.0, 0);
    } else if (view === 'elevation') {
      // Exact Orthographic Side View (Image 1)
      cam.position.set(0, BASE_Y + 3.0, 48);
      ctrl.target.set(0, BASE_Y + 3.0, 0);
    } else if (view === 'top') {
      // Bird's Eye Top View
      cam.position.set(0, BASE_Y + 45, 0.1);
      ctrl.target.set(0, BASE_Y + 2.0, 0);
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
              title="Sudut Perspektif 3/4 Proposal"
            >
              3/4 Oblique
            </button>
            <button
              onClick={() => setCameraView('elevation')}
              className="px-2.5 py-1 rounded-md text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white hover:bg-white dark:hover:bg-[#21262D] transition"
              title="Elevasi Samping Sesuai Gambar 1"
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
