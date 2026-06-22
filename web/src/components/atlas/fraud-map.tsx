"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Edges, Line, Grid } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import * as THREE from "three";

export type StateStat = {
  postal: string;
  name: string;
  count: number;
  known: number;
  avgScore: number;
  topType: string;
};

type Built = {
  name: string;
  geometry: THREE.ExtrudeGeometry;
  color: THREE.Color;
  stat?: StateStat;
  depth: number;
  cx: number; // world x
  cz: number; // world z
};

const PLANE_W = 120;
const PLANE_H = 75;

const LOW = new THREE.Color("#7a5a1f");
const MID = new THREE.Color("#c79a4a");
const HIGH = new THREE.Color("#e0463a");

function buildStates(topo: unknown, stats: Map<string, StateStat>): Built[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = topo as any;
  const fc = feature(t, t.objects.states) as unknown as {
    features: Array<{ properties: { name: string }; geometry: unknown }>;
  };

  const projection = geoAlbersUsa().fitSize([PLANE_W, PLANE_H], fc as never);
  const pathGen = geoPath(projection);
  const maxCount = Math.max(1, ...[...stats.values()].map((s) => s.count));
  const built: Built[] = [];

  for (const f of fc.features) {
    const stat = stats.get(f.properties.name);
    const ratio = stat ? stat.count / maxCount : 0;
    const shapes = svgPathToShapes(pathGen(f as never) || "");
    if (shapes.length === 0) continue;

    const depth = 1 + Math.pow(ratio, 0.85) * 14;
    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth,
      bevelEnabled: false,
    });
    geometry.translate(-PLANE_W / 2, -PLANE_H / 2, 0);
    geometry.scale(1, -1, 1);

    const color =
      ratio < 0.5
        ? LOW.clone().lerp(MID, ratio / 0.5)
        : MID.clone().lerp(HIGH, (ratio - 0.5) / 0.5);

    const c = pathGen.centroid(f as never);
    built.push({
      name: f.properties.name,
      geometry,
      color,
      stat,
      depth,
      cx: (c[0] || PLANE_W / 2) - PLANE_W / 2,
      cz: (c[1] || PLANE_H / 2) - PLANE_H / 2,
    });
  }
  return built;
}

function svgPathToShapes(d: string): THREE.Shape[] {
  if (!d) return [];
  const subpaths = d.split("Z").filter((s) => s.trim().length);
  const rings: THREE.Vector2[][] = [];
  for (const sp of subpaths) {
    const pts: THREE.Vector2[] = [];
    const re = /[ML]?\s*(-?\d*\.?\d+),(-?\d*\.?\d+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sp))) {
      pts.push(new THREE.Vector2(parseFloat(m[1]), parseFloat(m[2])));
    }
    if (pts.length >= 3) rings.push(pts);
  }
  if (rings.length === 0) return [];
  rings.sort((a, b) => ringArea(b) - ringArea(a));
  const shapes: THREE.Shape[] = [new THREE.Shape(rings[0])];
  for (let i = 1; i < rings.length; i++) shapes.push(new THREE.Shape(rings[i]));
  return shapes;
}

function ringArea(pts: THREE.Vector2[]): number {
  let a = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a / 2);
}

function StateMesh({
  b,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  b: Built;
  hovered: boolean;
  selected: boolean;
  onHover: (n: string | null) => void;
  onSelect: (s: StateStat | null, name: string) => void;
}) {
  const emissive = selected ? "#e0463a" : hovered ? "#f0b75a" : b.color.getStyle();
  return (
    <mesh
      geometry={b.geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      castShadow
      receiveShadow
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(b.name);
      }}
      onPointerOut={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(b.stat ?? null, b.name);
      }}
    >
      <meshStandardMaterial
        color={b.color}
        emissive={emissive}
        emissiveIntensity={selected ? 0.9 : hovered ? 0.6 : 0.12}
        roughness={0.45}
        metalness={0.25}
      />
      <Edges threshold={12} color={selected ? "#ffd27a" : "#c79a4a"} />
    </mesh>
  );
}

// pulsing beam + ring on a hotspot state
function Hotspot({ x, z, h, rank }: { x: number; z: number; h: number; rank: number }) {
  const ring = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = (state.clock.elapsedTime * 0.8 + rank * 0.5) % 2;
    if (ring.current) {
      const s = 0.6 + t * 2.4;
      ring.current.scale.set(s, s, s);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = Math.max(
        0,
        0.8 - t * 0.4
      );
    }
    if (beam.current) {
      (beam.current.material as THREE.MeshBasicMaterial).opacity =
        0.35 + Math.sin(state.clock.elapsedTime * 2 + rank) * 0.15;
    }
  });
  return (
    <group position={[x, 0, z]}>
      <mesh ref={beam} position={[0, h / 2 + 3, 0]}>
        <cylinderGeometry args={[0.18, 0.18, h + 6, 8]} />
        <meshBasicMaterial color="#ffd27a" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, h + 6.5, 0]}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshBasicMaterial color="#ffe0a0" />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <ringGeometry args={[1, 1.25, 32]} />
        <meshBasicMaterial color="#e0463a" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// comet travelling along an arc between two hotspots
function FlyLine({ from, to }: { from: THREE.Vector3; to: THREE.Vector3 }) {
  const comet = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => {
    const mid = from.clone().add(to).multiplyScalar(0.5);
    mid.y = Math.max(from.y, to.y) + from.distanceTo(to) * 0.45;
    return new THREE.QuadraticBezierCurve3(from, mid, to);
  }, [from, to]);
  const points = useMemo(() => curve.getPoints(40), [curve]);
  useFrame((state) => {
    if (!comet.current) return;
    const t = (state.clock.elapsedTime * 0.35) % 1;
    comet.current.position.copy(curve.getPoint(t));
  });
  return (
    <>
      <Line points={points} color="#f0b75a" lineWidth={1} transparent opacity={0.35} />
      <mesh ref={comet}>
        <sphereGeometry args={[0.45, 12, 12]} />
        <meshBasicMaterial color="#ffe0a0" />
      </mesh>
    </>
  );
}

function Scene({
  built,
  hover,
  selectedName,
  setHover,
  onSelect,
}: {
  built: Built[];
  hover: string | null;
  selectedName: string | null;
  setHover: (n: string | null) => void;
  onSelect: (s: StateStat | null, name: string) => void;
}) {
  const hotspots = useMemo(
    () =>
      built
        .filter((b) => b.stat)
        .sort((a, b) => (b.stat!.count || 0) - (a.stat!.count || 0))
        .slice(0, 6),
    [built]
  );
  const flylines = useMemo(() => {
    if (hotspots.length < 2) return [];
    const hub = hotspots[0];
    const a = new THREE.Vector3(hub.cx, hub.depth + 6.5, hub.cz);
    return hotspots.slice(1).map((h) => ({
      from: a,
      to: new THREE.Vector3(h.cx, h.depth + 6.5, h.cz),
    }));
  }, [hotspots]);

  return (
    <>
      <color attach="background" args={["#0a0705"]} />
      <fog attach="fog" args={["#0a0705", 120, 260]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[40, 90, 30]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-50, 40, -30]} intensity={0.5} color="#e0463a" />

      <Grid
        position={[0, -0.4, 0]}
        args={[300, 300]}
        cellSize={4}
        cellColor="#3a2a12"
        sectionSize={20}
        sectionColor="#5a3a16"
        fadeDistance={220}
        fadeStrength={1.5}
        infiniteGrid
      />

      {built.map((b) => (
        <StateMesh
          key={b.name}
          b={b}
          hovered={hover === b.name}
          selected={selectedName === b.name}
          onHover={setHover}
          onSelect={onSelect}
        />
      ))}

      {hotspots.map((h, i) => (
        <Hotspot key={h.name} x={h.cx} z={h.cz} h={h.depth} rank={i} />
      ))}
      {flylines.map((f, i) => (
        <FlyLine key={i} from={f.from} to={f.to} />
      ))}

      {hover && (
        <Html position={[0, 24, 0]} center distanceFactor={120}>
          <div className="pointer-events-none whitespace-nowrap rounded-sm border border-gold/50 bg-ink/90 px-3 py-1.5 text-xs text-washi shadow-[0_0_20px_rgba(224,70,58,0.4)]">
            {hover}
            {built.find((b) => b.name === hover)?.stat && (
              <span className="text-gold">
                {" "}
                · {built.find((b) => b.name === hover)!.stat!.count} flagged
              </span>
            )}
          </div>
        </Html>
      )}

      <EffectComposer>
        <Bloom intensity={0.9} luminanceThreshold={0.35} luminanceSmoothing={0.5} mipmapBlur />
      </EffectComposer>
    </>
  );
}

export function FraudMap({
  onSelect,
}: {
  onSelect: (s: StateStat | null) => void;
}) {
  const [topo, setTopo] = useState<unknown>(null);
  const [stats, setStats] = useState<Map<string, StateStat>>(new Map());
  const [hover, setHover] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/us-states-10m.json").then((r) => r.json()),
      fetch("/data/state-fraud.json").then((r) => r.json()),
    ]).then(([t, s]: [unknown, StateStat[]]) => {
      setTopo(t);
      setStats(new Map(s.map((x) => [x.name, x])));
    });
  }, []);

  const built = useMemo(
    () => (topo ? buildStates(topo, stats) : []),
    [topo, stats]
  );

  return (
    <Canvas shadows camera={{ position: [0, 62, 78], fov: 40 }} gl={{ antialias: true }} dpr={[1, 1.6]}>
      <Scene
        built={built}
        hover={hover}
        selectedName={selectedName}
        setHover={setHover}
        onSelect={(s, name) => {
          setSelectedName(name);
          onSelect(s);
        }}
      />
      <OrbitControls
        enablePan={false}
        minDistance={45}
        maxDistance={170}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate
        autoRotateSpeed={0.4}
      />
    </Canvas>
  );
}
