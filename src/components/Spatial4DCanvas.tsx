import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Spatial4DCanvasProps {
  modoVisual: 'holograma' | 'matriz' | 'cyber';
  velocidadeTempo: number; // 0.5x, 1x, 2x
}

export const Spatial4DCanvas: React.FC<Spatial4DCanvasProps> = ({
  modoVisual,
  velocidadeTempo,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.015);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 18);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Group for 4D Hyper-Core
    const hyperCoreGroup = new THREE.Group();
    scene.add(hyperCoreGroup);

    // 1. Central Quantum Nucleus (Icosahedron + Wireframe)
    const nucleusGeo = new THREE.IcosahedronGeometry(2.2, 1);
    const nucleusMat = new THREE.MeshBasicMaterial({
      color: modoVisual === 'cyber' ? 0xf97316 : 0xa855f7,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    hyperCoreGroup.add(nucleusMesh);

    // Inner glowing sphere
    const innerGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    hyperCoreGroup.add(innerMesh);

    // 2. 4D Orbiting Quantum Rings (Luna, Terra, Sol, Astra)
    const rings: THREE.Mesh[] = [];
    const ringConfigs = [
      { radius: 3.6, tube: 0.04, color: 0x10b981, rotX: 0.4, rotY: 0.2 }, // Luna
      { radius: 4.8, tube: 0.045, color: 0xeab308, rotX: 1.1, rotY: 0.7 }, // Terra
      { radius: 6.0, tube: 0.05, color: 0xf97316, rotX: 0.8, rotY: 1.4 }, // Sol
      { radius: 7.2, tube: 0.055, color: 0xef4444, rotX: 1.5, rotY: 0.3 }, // Astra
    ];

    ringConfigs.forEach((cfg) => {
      const ringGeo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 8, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.7,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = cfg.rotX;
      ringMesh.rotation.y = cfg.rotY;
      rings.push(ringMesh);
      hyperCoreGroup.add(ringMesh);
    });

    // 3. 10 Neural Node Spheres representing the 10 Professions
    const nodeSpheres: THREE.Mesh[] = [];
    const nodeCount = 10;
    const nodeOrbitRadius = 5.4;

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const x = Math.cos(angle) * nodeOrbitRadius;
      const y = Math.sin(angle) * nodeOrbitRadius;
      const z = Math.sin(angle * 2) * 1.5;

      const sphereGeo = new THREE.SphereGeometry(0.25, 12, 12);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xf97316 : 0xa855f7,
        transparent: true,
        opacity: 0.85,
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.position.set(x, y, z);
      nodeSpheres.push(sphereMesh);
      hyperCoreGroup.add(sphereMesh);
    }

    // 4. Energy lines connecting nodes
    const linePoints: THREE.Vector3[] = [];
    for (let i = 0; i < nodeCount; i++) {
      linePoints.push(nodeSpheres[i].position);
      linePoints.push(nodeSpheres[(i + 1) % nodeCount].position);
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.3,
    });
    const energyLines = new THREE.LineSegments(lineGeo, lineMat);
    hyperCoreGroup.add(energyLines);

    // 5. Starfield / Ambient Particle Matrix (1200 particles)
    const particleCount = 1200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 50;
      positions[i + 1] = (Math.random() - 0.5) * 40;
      positions[i + 2] = (Math.random() - 0.5) * 35;

      // Color variation between orange, violet, and bright cyan
      const rVal = Math.random();
      if (rVal < 0.45) {
        colors[i] = 0.98; // R
        colors[i + 1] = 0.45; // G
        colors[i + 2] = 0.08; // B (Orange)
      } else if (rVal < 0.8) {
        colors[i] = 0.65;
        colors[i + 1] = 0.33;
        colors[i + 2] = 0.96; // (Purple)
      } else {
        colors[i] = 0.2;
        colors[i + 1] = 0.9;
        colors[i + 2] = 0.8; // (Cyan)
      }
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Mouse listener for Parallax Depth
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseRef.current.targetX = (e.clientX / innerWidth - 0.5) * 2;
      mouseRef.current.targetY = (e.clientY / innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime() * velocidadeTempo;

      // Damped mouse movement for spatial camera parallax
      mouseRef.current.x = THREE.MathUtils.damp(
        mouseRef.current.x,
        mouseRef.current.targetX,
        4,
        delta
      );
      mouseRef.current.y = THREE.MathUtils.damp(
        mouseRef.current.y,
        mouseRef.current.targetY,
        4,
        delta
      );

      camera.position.x = mouseRef.current.x * 2.5;
      camera.position.y = -mouseRef.current.y * 2.0;
      camera.lookAt(0, 0, 0);

      // Rotate 4D Hyper-Core in time
      hyperCoreGroup.rotation.y = time * 0.25;
      hyperCoreGroup.rotation.x = Math.sin(time * 0.15) * 0.2;

      nucleusMesh.rotation.y += delta * 0.4 * velocidadeTempo;
      nucleusMesh.rotation.x += delta * 0.3 * velocidadeTempo;

      // Rotate each quantum ring around distinct spatial axis
      rings.forEach((r, idx) => {
        r.rotation.z += delta * (0.2 + idx * 0.15) * velocidadeTempo;
        r.rotation.y += delta * (0.1 + idx * 0.08) * velocidadeTempo;
      });

      // Slowly rotate particle field
      particleSystem.rotation.y = time * 0.03;
      particleSystem.rotation.x = time * 0.015;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      nucleusGeo.dispose();
      nucleusMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      rings.forEach((r) => {
        r.geometry.dispose();
        (r.material as THREE.Material).dispose();
      });
      nodeSpheres.forEach((s) => {
        s.geometry.dispose();
        (s.material as THREE.Material).dispose();
      });
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modoVisual, velocidadeTempo]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-80"
      style={{
        maskImage: 'radial-gradient(ellipse 90% 80% at 50% 50%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 50%, black 40%, transparent 100%)',
      }}
    />
  );
};
