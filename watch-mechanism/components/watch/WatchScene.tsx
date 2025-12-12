"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  AccumulativeShadows,
  ContactShadows,
  Environment,
  Html,
  OrbitControls,
  PerspectiveCamera,
  SoftShadows,
  Stats,
} from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Color, ExtrudeGeometry, Group, Mesh, Shape, Vector3 } from "three";
import { useWatchStore, WatchPart } from "./store";

const brass = new Color("#d6b370");
const steel = new Color("#cfd8df");
const bluedSteel = new Color("#4a7097");
const ruby = new Color("#d24257");
const lume = new Color("#f4f1d0");

type GearOptions = {
  teeth: number;
  outerRadius: number;
  innerRadius: number;
  toothDepth: number;
  thickness: number;
  chamfer?: number;
};

function useGearGeometry({ teeth, outerRadius, innerRadius, toothDepth, thickness }: GearOptions) {
  return useMemo(() => {
    const shape = new Shape();
    const step = (Math.PI * 2) / (teeth * 2);
    for (let i = 0; i < teeth * 2; i++) {
      const angle = i * step;
      const radius = i % 2 === 0 ? outerRadius : outerRadius - toothDepth;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();
    if (innerRadius > 0) {
      const hole = new Shape();
      hole.absellipse(0, 0, innerRadius, innerRadius, 0, Math.PI * 2, false, 0);
      shape.holes.push(hole);
    }
    const geometry = new ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false,
    });
    geometry.center();
    geometry.rotateX(Math.PI / 2);
    return geometry;
  }, [teeth, outerRadius, innerRadius, toothDepth, thickness]);
}

function Gear({
  part,
  color,
  rotationDirection = 1,
  rpm = 1,
  ...options
}: GearOptions & {
  part: WatchPart;
  color: Color | string;
  rotationDirection?: 1 | -1;
  rpm?: number;
}) {
  const geometry = useGearGeometry(options);
  const meshRef = useRef<Mesh>(null);
  const setSelectedPart = useWatchStore((state) => state.setSelectedPart);
  const animationSpeed = useWatchStore((state) => state.animationSpeed);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const rotationsPerSecond = (rpm / 60) * rotationDirection * animationSpeed;
    meshRef.current.rotation.y += rotationsPerSecond * Math.PI * 2 * delta;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onPointerDown={(event) => {
        event.stopPropagation();
        setSelectedPart(part);
      }}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={color instanceof Color ? color : new Color(color)}
        metalness={0.85}
        roughness={0.25}
      />
    </mesh>
  );
}

function Screw({ position }: { position: [number, number, number] }) {
  const setSelectedPart = useWatchStore((state) => state.setSelectedPart);
  return (
    <group position={position}>
      <mesh
        onPointerDown={(event) => {
          event.stopPropagation();
          setSelectedPart("baseplate");
        }}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.12, 0.12, 0.4, 16]} />
        <meshStandardMaterial color={steel} metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.04, 12, 24]} />
        <meshStandardMaterial color={steel} metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Jewel({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.18, 0.14, 0.18, 24]} />
      <meshStandardMaterial color={ruby} metalness={0.1} roughness={0.15} emissive={ruby.clone().multiplyScalar(0.1)} />
    </mesh>
  );
}

function Baseplate() {
  const visible = useWatchStore((state) => state.visibleLayers.baseplate);
  if (!visible) return null;

  const screwPositions: [number, number, number][] = [
    [-3.5, 0.4, -2.2],
    [2.8, 0.4, -2.6],
    [3.1, 0.4, 2.2],
    [-2.8, 0.4, 3],
  ];

  const jewelPositions: [number, number, number][] = [
    [-1.6, 0.35, 0],
    [1.9, 0.35, 0.8],
    [0, 0.35, -1.7],
    [0.2, 0.35, 1.8],
  ];

  return (
    <group position={[0, -0.5, 0]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[6.5, 6.5, 0.6, 80]} />
        <meshPhysicalMaterial
          color={brass}
          metalness={0.8}
          roughness={0.35}
          clearcoat={0.2}
          clearcoatRoughness={0.3}
        />
      </mesh>
      {screwPositions.map((pos, index) => (
        <Screw key={index} position={pos} />
      ))}
      {jewelPositions.map((pos, index) => (
        <Jewel key={index} position={pos} />
      ))}
    </group>
  );
}

function MainspringBarrel() {
  const visible = useWatchStore((state) => state.visibleLayers.gearTrain);
  const animationSpeed = useWatchStore((state) => state.animationSpeed);
  const setSelectedPart = useWatchStore((state) => state.setSelectedPart);
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!visible || !group.current) return;
    group.current.rotation.y += delta * 0.4 * animationSpeed;
  });

  if (!visible) return null;

  return (
    <group position={[-2.5, 0.6, 0]} ref={group}>
      <mesh
        onPointerDown={(event) => {
          event.stopPropagation();
          setSelectedPart("barrel");
        }}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[1.1, 1.1, 0.9, 64]} />
        <meshStandardMaterial color={brass} metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 1.1, 64]} />
        <meshStandardMaterial color="#917447" metalness={0.9} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.1, 16, 64]} />
        <meshStandardMaterial color={steel} metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <torusGeometry args={[0.55, 0.07, 16, 48]} />
        <meshStandardMaterial color="#c6b47d" metalness={0.85} roughness={0.35} />
      </mesh>
    </group>
  );
}

function GearTrain() {
  const visible = useWatchStore((state) => state.visibleLayers.gearTrain);
  if (!visible) return null;

  return (
    <group position={[0, 0.8, 0]}>
      <group position={[0, 0, 0]}>
        <Gear
          part="centerWheel"
          color={brass}
          teeth={64}
          outerRadius={1.4}
          innerRadius={0.2}
          toothDepth={0.16}
          thickness={0.35}
          rpm={1}
        />
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.9, 24]} />
          <meshStandardMaterial color={steel} metalness={0.9} roughness={0.25} />
        </mesh>
      </group>

      <group position={[2.9, 0.2, -0.6]}>
        <Gear
          part="thirdWheel"
          color="#f0d59b"
          teeth={56}
          outerRadius={1.1}
          innerRadius={0.22}
          toothDepth={0.14}
          thickness={0.28}
          rpm={3}
          rotationDirection={-1}
        />
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.8, 24]} />
          <meshStandardMaterial color={steel} metalness={0.9} roughness={0.3} />
        </mesh>
      </group>

      <group position={[3.8, 0.45, 1.4]}>
        <Gear
          part="fourthWheel"
          color={brass}
          teeth={48}
          outerRadius={0.9}
          innerRadius={0.2}
          toothDepth={0.12}
          thickness={0.25}
          rpm={6}
        />
        <mesh position={[0, 0.32, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.7, 24]} />
          <meshStandardMaterial color={steel} metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function EscapeWheel() {
  const geometry = useGearGeometry({
    teeth: 30,
    outerRadius: 0.75,
    innerRadius: 0.18,
    toothDepth: 0.22,
    thickness: 0.22,
  });
  const setSelectedPart = useWatchStore((state) => state.setSelectedPart);
  const animationSpeed = useWatchStore((state) => state.animationSpeed);
  const meshRef = useRef<Mesh>(null);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * Math.PI * 6 * animationSpeed;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onPointerDown={(event) => {
        event.stopPropagation();
        setSelectedPart("escapeWheel");
      }}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color="#f9d17f" metalness={0.85} roughness={0.24} />
    </mesh>
  );
}

function Escapement() {
  const visible = useWatchStore((state) => state.visibleLayers.escapement);
  const animationSpeed = useWatchStore((state) => state.animationSpeed);
  const setSelectedPart = useWatchStore((state) => state.setSelectedPart);
  const forkRef = useRef<Group>(null);

  useFrame(() => {
    if (!visible || !forkRef.current) return;
    forkRef.current.rotation.set(0, 0, Math.sin(performance.now() * 0.004 * animationSpeed) * 0.45);
  });

  if (!visible) return null;

  return (
    <group position={[2.9, 1.35, 1.55]}>
      <group position={[0, 0, 0]}>
        <EscapeWheel />
      </group>
      <group ref={forkRef} position={[0.92, 0.08, 0]} onPointerDown={(event) => { event.stopPropagation(); setSelectedPart("palletFork"); }}>
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.04, 0.5]} />
          <meshStandardMaterial color={steel} metalness={0.78} roughness={0.3} />
        </mesh>
        <mesh position={[0.1, 0.03, 0.24]}>
          <boxGeometry args={[0.18, 0.04, 0.24]} />
          <meshStandardMaterial color={ruby} metalness={0.2} roughness={0.2} emissive={ruby.clone().multiplyScalar(0.12)} />
        </mesh>
        <mesh position={[0.1, 0.03, -0.24]}>
          <boxGeometry args={[0.18, 0.04, 0.24]} />
          <meshStandardMaterial color={ruby} metalness={0.2} roughness={0.2} emissive={ruby.clone().multiplyScalar(0.12)} />
        </mesh>
      </group>
    </group>
  );
}

function BalanceAssembly() {
  const visible = useWatchStore((state) => state.visibleLayers.balanceAssembly);
  const animationSpeed = useWatchStore((state) => state.animationSpeed);
  const setSelectedPart = useWatchStore((state) => state.setSelectedPart);
  const balanceRef = useRef<Group>(null);

  useFrame(() => {
    if (!visible || !balanceRef.current) return;
    const time = performance.now() * 0.003 * animationSpeed;
    balanceRef.current.rotation.set(0, Math.sin(time) * 0.35, 0);
  });

  if (!visible) return null;

  return (
    <group position={[0.8, 2.9, 1.6]} ref={balanceRef}>
      <group
        onPointerDown={(event) => {
          event.stopPropagation();
          setSelectedPart("balanceWheel");
        }}
      >
        <mesh castShadow receiveShadow>
          <torusGeometry args={[1.1, 0.12, 24, 100]} />
          <meshStandardMaterial color={steel} metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh castShadow receiveShadow>
          <torusGeometry args={[0.5, 0.1, 24, 80]} />
          <meshStandardMaterial color={brass} metalness={0.9} roughness={0.25} />
        </mesh>
      </group>
      <mesh
        position={[0, 0.06, 0]}
        onPointerDown={(event) => {
          event.stopPropagation();
          setSelectedPart("hairspring");
        }}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.2, 0.95, 64, 1]} />
        <meshStandardMaterial
          color={bluedSteel}
          metalness={0.95}
          roughness={0.15}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.4, 24]} />
        <meshStandardMaterial color={steel} metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.08, 0.03, 12, 24]} />
        <meshStandardMaterial color={ruby} metalness={0.2} roughness={0.2} emissive={ruby.clone().multiplyScalar(0.15)} />
      </mesh>
    </group>
  );
}

function DialTrain() {
  const visible = useWatchStore((state) => state.visibleLayers.hands);
  const animationSpeed = useWatchStore((state) => state.animationSpeed);
  const setSelectedPart = useWatchStore((state) => state.setSelectedPart);
  const minuteHand = useRef<Group>(null);
  const hourHand = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!visible) return;
    if (minuteHand.current) {
      minuteHand.current.rotation.y += (delta * animationSpeed * Math.PI) / 30;
    }
    if (hourHand.current) {
      hourHand.current.rotation.y += (delta * animationSpeed * Math.PI) / 360;
    }
  });

  if (!visible) return null;

  return (
    <group position={[0, 4.2, 0]}>
      <mesh
        onPointerDown={(event) => {
          event.stopPropagation();
          setSelectedPart("dialTrain");
        }}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[2.8, 2.8, 0.06, 64]} />
        <meshStandardMaterial color="#f7f5ef" metalness={0.1} roughness={0.9} />
      </mesh>

      <group ref={hourHand} onPointerDown={(event) => { event.stopPropagation(); setSelectedPart("hourHand"); }}>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.3, 0.02, 1.8]} />
          <meshStandardMaterial color={bluedSteel} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      <group ref={minuteHand} onPointerDown={(event) => { event.stopPropagation(); setSelectedPart("minuteHand"); }}>
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.24, 0.02, 2.4]} />
          <meshStandardMaterial color={bluedSteel} metalness={0.8} roughness={0.18} />
        </mesh>
      </group>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.32, 0]}>
        <torusGeometry args={[0.14, 0.05, 16, 32]} />
        <meshStandardMaterial color={ruby} metalness={0.2} roughness={0.3} emissive={ruby.clone().multiplyScalar(0.12)} />
      </mesh>
    </group>
  );
}

function CaseAndCrystal() {
  return (
    <group>
      <mesh position={[0, -0.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[7.2, 7.2, 0.8, 80]} />
        <meshStandardMaterial color="#9b8a6d" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, 5, 0]}>
        <cylinderGeometry args={[3.2, 3.2, 0.06, 64]} />
        <meshStandardMaterial color={lume} transparent opacity={0.08} metalness={0.1} roughness={0.1} />
      </mesh>
      <mesh position={[0, 4.6, 0]}>
        <sphereGeometry args={[3.3, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.25}
          transmission={0.95}
          roughness={0}
          thickness={0.4}
          clearcoat={1}
          clearcoatRoughness={0.05}
          ior={1.5}
        />
      </mesh>
    </group>
  );
}

function CameraRig() {
  const focusDescriptor = useWatchStore((state) => state.focusDescriptor);
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const desiredPosition = useRef<Vector3>(focusDescriptor.position.clone());
  const desiredTarget = useRef<Vector3>(focusDescriptor.target.clone());

  useEffect(() => {
    desiredPosition.current = focusDescriptor.position.clone();
    desiredTarget.current = focusDescriptor.target.clone();
  }, [focusDescriptor]);

  useEffect(() => {
    camera.position.copy(desiredPosition.current);
  }, [camera]);

  useFrame((_, delta) => {
    const lerpFactor = 1 - Math.pow(0.02, delta);
    camera.position.lerp(desiredPosition.current, lerpFactor);
    const controls = controlsRef.current;
    if (controls) {
      controls.target.lerp(desiredTarget.current, lerpFactor);
      controls.update();
    } else {
      camera.lookAt(desiredTarget.current);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={4}
      maxDistance={18}
      maxPolarAngle={Math.PI * 0.92}
    />
  );
}

function Lighting() {
  return (
    <>
      <color attach="background" args={["#101315"]} />
      <hemisphereLight args={["#fdf6e3", "#1a1f24", 0.5]} />
      <spotLight
        position={[7, 12, 8]}
        angle={0.48}
        penumbra={0.3}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-4, 6, -3]} intensity={0.5} />
      <Environment preset="studio" />
    </>
  );
}

function InspectionLabels() {
  const selectedPart = useWatchStore((state) => state.selectedPart);
  if (!selectedPart) return null;
  return (
    <Html position={[0, 6.5, 0]} center distanceFactor={12} className="pointer-events-none">
      <div className="rounded-full border border-white/40 bg-black/70 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-xl">
        {selectedPart.replace(/([A-Z])/g, " $1").toUpperCase()}
      </div>
    </Html>
  );
}

export function WatchScene() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-zinc-900/10 bg-black/80 shadow-[0_35px_120px_-45px_rgba(0,0,0,0.75)] dark:border-white/10">
      <Canvas shadows>
        <Suspense
          fallback={
            <Html center className="rounded-md bg-black/70 px-4 py-2 text-sm font-semibold text-white">
              Loading movement…
            </Html>
          }
        >
          <PerspectiveCamera makeDefault position={[0, 8, 14]} fov={50} />
          <Lighting />
          <CameraRig />
          <SoftShadows size={15} samples={20} focus={0.4} />
          <AccumulativeShadows temporal frames={60} color="#0e1116" colorBlend={0.5} toneMapped={true} />
          <Baseplate />
          <MainspringBarrel />
          <GearTrain />
          <Escapement />
          <BalanceAssembly />
          <DialTrain />
          <CaseAndCrystal />
          <InspectionLabels />
          <ContactShadows position={[0, -1.5, 0]} opacity={0.45} scale={20} blur={2.8} far={8} />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
      <div className="pointer-events-none absolute left-6 top-6 flex flex-col gap-2 text-white/90">
        <span className="text-xs font-semibold uppercase tracking-[0.35em]">Chronoscope</span>
        <span className="text-2xl font-light">Calibre M-23</span>
      </div>
      <Stats className="!pointer-events-none !select-none" />
    </div>
  );
}

export default WatchScene;
