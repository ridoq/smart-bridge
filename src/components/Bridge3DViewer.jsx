import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const SPAN_L = 50.0;
const DECK_W = 8.5;
const ARCH_H = 13.5;
const DECK_Y = 2.4;
const BAYS = 14;

export default function Bridge3DViewer({
  deflection,
  status,
  deformScale,
  onSetDeformScale
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

  // Structural dynamic references
  const deckGeomRef = useRef(null);
  const origDeckPosRef = useRef(null);
  const hangersGroupRef = useRef(null);
  const truckRef = useRef(null);
  const sensorRef = useRef(null);

  // Store latest deflection & scale in ref for the animation loop
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

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7fb3d5);
    scene.fog = new THREE.FogExp2(0x8ecae6, 0.0075);
    sceneRef.current = scene;

    // 2. Camera (3/4 Proposal Render Angle)
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(28, 14, 28);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minDistance = 8;
    controls.maxDistance = 140;
    controls.target.set(-1, 5, -1);
    controlsRef.current = controls;

    // 5. Lighting
    const hemiLight = new THREE.HemisphereLight(0xbde0fe, 0x2d6a4f, 0.65);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.35);
    sunLight.position.set(-35, 48, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x90e0ef, 0.4);
    fillLight.position.set(30, 20, -25);
    scene.add(fillLight);

    // 6. Build Environment
    // River Water
    const waterGeo = new THREE.PlaneGeometry(220, 220, 64, 64);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x165b6d,
      roughness: 0.18,
      metalness: 0.15,
      transparent: true,
      opacity: 0.92
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);

    // Abutment Piers
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x3d434a, roughness: 0.85 });
    const pierLeft = new THREE.Mesh(new THREE.BoxGeometry(6, 12, DECK_W + 3), pierMat);
    pierLeft.position.set(-SPAN_L / 2 - 2, DECK_Y - 4.5, 0);
    pierLeft.castShadow = true;
    pierLeft.receiveShadow = true;
    scene.add(pierLeft);

    const pierRight = new THREE.Mesh(new THREE.BoxGeometry(7, 14, DECK_W + 4), pierMat);
    pierRight.position.set(SPAN_L / 2 + 2.5, DECK_Y - 5.5, 0);
    pierRight.castShadow = true;
    pierRight.receiveShadow = true;
    scene.add(pierRight);

    // Mountains
    const mGreen = new THREE.MeshStandardMaterial({ color: 0x2b5329, roughness: 0.9 });
    const mRock = new THREE.MeshStandardMaterial({ color: 0x5c677d, roughness: 0.95 });

    const mLeft = new THREE.Mesh(new THREE.ConeGeometry(38, 45, 7), mGreen);
    mLeft.position.set(-48, 16, -35);
    scene.add(mLeft);

    const mCenter = new THREE.Mesh(new THREE.ConeGeometry(46, 58, 8), mRock);
    mCenter.position.set(-8, 22, -60);
    scene.add(mCenter);

    const mRight = new THREE.Mesh(new THREE.ConeGeometry(36, 42, 6), mGreen);
    mRight.position.set(42, 14, -30);
    scene.add(mRight);

    const hillFore = new THREE.Mesh(new THREE.CylinderGeometry(16, 26, 12, 10), mGreen);
    hillFore.position.set(SPAN_L / 2 + 14, -2, 12);
    scene.add(hillFore);

    // 7. Build Bridge (Parker-Warren Through Tied Arch)
    const bridgeGroup = new THREE.Group();
    const hangersGroup = new THREE.Group();
    scene.add(bridgeGroup);
    scene.add(hangersGroup);
    hangersGroupRef.current = hangersGroup;

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xd0d7de,
      roughness: 0.35,
      metalness: 0.75
    });

    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x1e2022,
      roughness: 0.8
    });

    // Road Deck
    const deckGeo = new THREE.BoxGeometry(SPAN_L, 0.45, DECK_W, BAYS * 2, 1, 2);
    const deckMesh = new THREE.Mesh(deckGeo, asphaltMat);
    deckMesh.position.set(0, DECK_Y, 0);
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    bridgeGroup.add(deckMesh);
    deckGeomRef.current = deckGeo;
    origDeckPosRef.current = deckGeo.attributes.position.clone();

    // Road Markings
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = -SPAN_L / 2 + 1.5; i < SPAN_L / 2 - 1.5; i += 3.5) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.14), lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(i, DECK_Y + 0.24, 0);
      bridgeGroup.add(dash);
    }

    // Curbs & Railings
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.4 });
    const curbLeft = new THREE.Mesh(new THREE.BoxGeometry(SPAN_L, 0.5, 0.35), curbMat);
    curbLeft.position.set(0, DECK_Y + 0.35, -DECK_W / 2 + 0.2);
    bridgeGroup.add(curbLeft);

    const curbRight = new THREE.Mesh(new THREE.BoxGeometry(SPAN_L, 0.5, 0.35), curbMat);
    curbRight.position.set(0, DECK_Y + 0.35, DECK_W / 2 - 0.2);
    bridgeGroup.add(curbRight);

    // Arch Ribs Helper
    const createStrut = (p1, p2, radius, mat, grp) => {
      const dist = p1.distanceTo(p2);
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, dist, 8), mat);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      cyl.position.copy(mid);
      cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(p2, p1).normalize());
      cyl.castShadow = true;
      grp.add(cyl);
    };

    [-DECK_W / 2, DECK_W / 2].forEach(zPos => {
      const topNodes = [];
      const botNodes = [];

      for (let i = 0; i <= BAYS; i++) {
        const t = i / BAYS;
        const x = -SPAN_L / 2 + t * SPAN_L;
        const normX = (2 * x) / SPAN_L;
        const curve = Math.max(0, 1 - normX * normX);

        const yTop = DECK_Y - 0.6 + ARCH_H * curve;
        topNodes.push(new THREE.Vector3(x, yTop, zPos));

        const ribbonDepth = 1.6 * (0.6 + 0.4 * curve);
        const yBot = DECK_Y - 0.6 + (ARCH_H - ribbonDepth) * curve;
        botNodes.push(new THREE.Vector3(x, Math.max(DECK_Y - 0.6, yBot), zPos));
      }

      for (let i = 0; i < BAYS; i++) {
        createStrut(topNodes[i], topNodes[i + 1], 0.32, steelMat, bridgeGroup);
        createStrut(botNodes[i], botNodes[i + 1], 0.28, steelMat, bridgeGroup);
      }

      for (let i = 0; i < BAYS; i++) {
        if (i % 2 === 0) {
          createStrut(topNodes[i], botNodes[i + 1], 0.22, steelMat, bridgeGroup);
          createStrut(botNodes[i], topNodes[i], 0.22, steelMat, bridgeGroup);
        } else {
          createStrut(botNodes[i], topNodes[i + 1], 0.22, steelMat, bridgeGroup);
          createStrut(botNodes[i + 1], topNodes[i + 1], 0.22, steelMat, bridgeGroup);
        }
      }
    });

    // Overhead Wind X-Bracing
    for (let i = 2; i <= BAYS - 2; i++) {
      const t = i / BAYS;
      const x = -SPAN_L / 2 + t * SPAN_L;
      const normX = (2 * x) / SPAN_L;
      const curve = Math.max(0, 1 - normX * normX);
      const yTop = DECK_Y - 0.6 + ARCH_H * curve;

      const pLeft = new THREE.Vector3(x, yTop, -DECK_W / 2);
      const pRight = new THREE.Vector3(x, yTop, DECK_W / 2);
      createStrut(pLeft, pRight, 0.24, steelMat, bridgeGroup);

      if (i < BAYS - 2) {
        const nextX = -SPAN_L / 2 + ((i + 1) / BAYS) * SPAN_L;
        const nextCurve = Math.max(0, 1 - Math.pow((2 * nextX) / SPAN_L, 2));
        const nextYTop = DECK_Y - 0.6 + ARCH_H * nextCurve;

        createStrut(pLeft, new THREE.Vector3(nextX, nextYTop, DECK_W / 2), 0.16, steelMat, bridgeGroup);
        createStrut(pRight, new THREE.Vector3(nextX, nextYTop, -DECK_W / 2), 0.16, steelMat, bridgeGroup);
      }
    }

    // Mid-span Sensor Box
    const sensorMat = new THREE.MeshStandardMaterial({
      color: 0x2f81f7,
      emissive: 0x1f6feb,
      roughness: 0.2,
      metalness: 0.8
    });
    const sensor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.6), sensorMat);
    sensor.position.set(0, DECK_Y + 0.35, -DECK_W / 2 + 0.6);
    bridgeGroup.add(sensor);
    sensorRef.current = sensor;

    const led = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshBasicMaterial({ color: 0x3fb950 }));
    led.position.set(0, 0.25, 0);
    sensor.add(led);

    // Test Truck Rig
    const truck = new THREE.Group();
    const truckBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.6, 2.2), new THREE.MeshStandardMaterial({ color: 0x2f81f7, roughness: 0.3 }));
    truckBody.position.y = 1.3;
    truckBody.castShadow = true;
    truck.add(truckBody);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 2.1), new THREE.MeshStandardMaterial({ color: 0x2f81f7, roughness: 0.3 }));
    cab.position.set(2.0, 1.5, 0);
    truck.add(cab);

    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.9 });
    [-1.4, 0.6, 2.2].forEach(wx => {
      [-1.15, 1.15].forEach(wz => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 12), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.55, wz);
        truck.add(wheel);
      });
    });

    truck.position.set(0, DECK_Y, 1.5);
    bridgeGroup.add(truck);
    truckRef.current = truck;

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation & Physics Loop
    let animId;
    let truckPos = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const curDef = currentDefRef.current;
      const curScale = currentScaleRef.current;

      // Dynamic Deflection Bending of Deck
      if (deckGeomRef.current && origDeckPosRef.current) {
        const pos = deckGeomRef.current.attributes.position;
        const orig = origDeckPosRef.current;
        for (let i = 0; i < pos.count; i++) {
          const ox = orig.getX(i);
          const oy = orig.getY(i);
          const normSpan = (ox + SPAN_L / 2) / SPAN_L;
          const sag = (curDef / 10.0) * (curScale * 0.4) * Math.sin(Math.PI * normSpan);
          pos.setY(i, oy - sag);
        }
        pos.needsUpdate = true;
        deckGeomRef.current.computeVertexNormals();
      }

      // Rebuild Dynamic Hangers
      if (hangersGroupRef.current) {
        const grp = hangersGroupRef.current;
        while (grp.children.length > 0) grp.remove(grp.children[0]);

        const hMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
        if (curDef >= 8.0) hMat.color.setHex(0xf85149);
        else if (curDef >= 5.0) hMat.color.setHex(0xd29922);

        [-DECK_W / 2 + 0.25, DECK_W / 2 - 0.25].forEach(zPos => {
          for (let i = 1; i < BAYS; i++) {
            const t = i / BAYS;
            const x = -SPAN_L / 2 + t * SPAN_L;
            const normX = (2 * x) / SPAN_L;
            const curve = Math.max(0, 1 - normX * normX);
            const ribbonDepth = 1.6 * (0.6 + 0.4 * curve);
            const yBot = DECK_Y - 0.6 + (ARCH_H - ribbonDepth) * curve;

            const sag = (curDef / 10.0) * (curScale * 0.4) * Math.sin(Math.PI * t);
            const yDeckPoint = DECK_Y - sag;

            if (yBot > yDeckPoint + 0.4) {
              const pTop = new THREE.Vector3(x, yBot, zPos);
              const pBot = new THREE.Vector3(x, yDeckPoint, zPos);
              createStrut(pTop, pBot, 0.08, hMat, grp);
            }
          }
        });
      }

      // Truck Animation
      if (truckRef.current) {
        truckPos += 0.08;
        if (truckPos > SPAN_L / 2 - 2) truckPos = -SPAN_L / 2 + 2;
        truckRef.current.position.x = truckPos;
        const norm = (truckPos + SPAN_L / 2) / SPAN_L;
        const sag = (curDef / 10.0) * (curScale * 0.4) * Math.sin(Math.PI * norm);
        truckRef.current.position.y = DECK_Y - sag;
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

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const setCameraView = (view) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (view === 'proposal') {
      cam.position.set(28, 14, 28);
      ctrl.target.set(-1, 5, -1);
    } else if (view === 'elevation') {
      cam.position.set(0, 8, 48);
      ctrl.target.set(0, 6, 0);
    } else if (view === 'top') {
      cam.position.set(0, 52, 0.1);
      ctrl.target.set(0, 2, 0);
    } else if (view === 'sensor') {
      cam.position.set(4, 5.2, 5.5);
      ctrl.target.set(0, 3.2, 0);
    }
    ctrl.update();
  };

  return (
    <section id="sectionModel3D" className="bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] rounded-xl p-5 shadow-xs space-y-4 transition">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-[#1F2328] dark:text-white">Visualisasi Struktur 3D</h2>
          <span className="text-xs text-[#656D76] dark:text-[#8B949E]">Through Tied Arch Parker-Warren</span>
        </div>

        {/* Minimal Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Camera Angles */}
          <div className="bg-[#F6F8FA] dark:bg-[#0D1117] border border-[#D0D7DE] dark:border-[#30363D] p-0.5 rounded-lg flex items-center text-xs">
            <button
              onClick={() => setCameraView('proposal')}
              className="px-2.5 py-1 rounded-md text-[#1F2328] dark:text-white hover:bg-white dark:hover:bg-[#21262D] transition"
            >
              3/4 Oblique
            </button>
            <button
              onClick={() => setCameraView('elevation')}
              className="px-2.5 py-1 rounded-md text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white hover:bg-white dark:hover:bg-[#21262D] transition"
            >
              Elevasi
            </button>
            <button
              onClick={() => setCameraView('top')}
              className="px-2.5 py-1 rounded-md text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white hover:bg-white dark:hover:bg-[#21262D] transition"
            >
              Atas
            </button>
            <button
              onClick={() => setCameraView('sensor')}
              className="px-2.5 py-1 rounded-md text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white hover:bg-white dark:hover:bg-[#21262D] transition"
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
        className="relative w-full h-[400px] sm:h-[440px] bg-[#0A0D13] rounded-lg border border-[#D0D7DE] dark:border-[#21262D] overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-[#161B22]/90 border border-[#D0D7DE] dark:border-[#30363D] px-3 py-1.5 rounded-lg text-xs text-[#1F2328] dark:text-[#C9D1D9] backdrop-blur-sm pointer-events-none shadow-xs">
          Status: <span className="text-[#1F2328] dark:text-white font-medium">{status} ({deflection.toFixed(2)} mm)</span>
        </div>

        <div className="absolute bottom-3 right-3 text-[11px] text-[#8C959F] dark:text-[#6E7681] pointer-events-none hidden sm:block">
          Drag untuk rotasi · Scroll untuk zoom
        </div>
      </div>
    </section>
  );
}
