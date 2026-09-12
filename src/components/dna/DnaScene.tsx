import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  CatmullRomCurve3,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Vector3,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { mockCapture } from '../../data/mockCapture'
import type { NetworkConnection } from '../../types/network'
import { getDnaRungLayout, getHelixCoordinate } from '../../visualization/dnaGeometry'

function toVector3(point: { x: number; y: number; z: number }) {
  return new Vector3(point.x, point.y, point.z)
}

function DampedControls({ isHandoff }: { isHandoff: boolean }) {
  const { camera, gl } = useThree()
  const controls = useMemo(() => new OrbitControls(camera, gl.domElement), [camera, gl])
  const resumeTimer = useRef<number | undefined>(undefined)
  const handoffRef = useRef(isHandoff)

  useEffect(() => {
    handoffRef.current = isHandoff
    window.clearTimeout(resumeTimer.current)
    controls.autoRotate = false
    if (!isHandoff) {
      resumeTimer.current = window.setTimeout(() => {
        controls.autoRotate = true
      }, 700)
    }
  }, [controls, isHandoff])

  useEffect(() => {
    controls.enableDamping = true
    controls.dampingFactor = 0.055
    controls.enablePan = false
    controls.minDistance = 6.2
    controls.maxDistance = 14
    controls.autoRotate = false
    controls.autoRotateSpeed = 0.58
    controls.target.set(0, 0, 0)
    const pauseRotation = () => {
      window.clearTimeout(resumeTimer.current)
      controls.autoRotate = false
    }
    const scheduleRotation = () => {
      window.clearTimeout(resumeTimer.current)
      if (handoffRef.current) return
      resumeTimer.current = window.setTimeout(() => {
        controls.autoRotate = true
      }, 2400)
    }

    controls.addEventListener('start', pauseRotation)
    controls.addEventListener('end', scheduleRotation)

    return () => {
      window.clearTimeout(resumeTimer.current)
      controls.removeEventListener('start', pauseRotation)
      controls.removeEventListener('end', scheduleRotation)
      controls.dispose()
    }
  }, [controls])

  useFrame(() => controls.update())
  return null
}

interface RungProps {
  isHandoff: boolean
  connection: NetworkConnection
  index: number
  count: number
  hovered: boolean
  selected: boolean
  onHover: (connectionId: string | null) => void
  onSelect: (connectionId: string) => void
}

function ConnectionRung({
  isHandoff,
  connection,
  index,
  count,
  hovered,
  selected,
  onHover,
  onSelect,
}: RungProps) {
  const layout = useMemo(() => getDnaRungLayout(index, count), [index, count])
  const start = useMemo(() => toVector3(layout.start), [layout])
  const end = useMemo(() => toVector3(layout.end), [layout])
  const midpoint = useMemo(() => start.clone().add(end).multiplyScalar(0.5), [start, end])
  const length = start.distanceTo(end)
  const orientation = useMemo(
    () => new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), end.clone().sub(start).normalize()),
    [start, end],
  )
  const pulse = useRef<Mesh>(null)
  const pulseMaterial = useRef<MeshBasicMaterial>(null)
  const pulseProgress = useRef((index * 0.173) % 1)
  const activity = Math.min(connection.packets / 850, 1)
  const highlighted = hovered || selected

  useFrame((_, delta) => {
    if (isHandoff) return
    pulseProgress.current = (pulseProgress.current + delta * (0.16 + activity * 0.24)) % 1
    const travel = pulseProgress.current
    pulse.current?.position.lerpVectors(start, end, travel)
    if (pulseMaterial.current) {
      pulseMaterial.current.opacity = 0.42 + Math.sin(travel * Math.PI) * (0.3 + activity * 0.2)
    }
  })

  return (
    <group>
      <mesh
        position={midpoint}
        quaternion={orientation}
        scale={highlighted ? 1.08 : 1}
      >
        <cylinderGeometry args={[highlighted ? 0.055 : 0.035, highlighted ? 0.055 : 0.035, length, 10]} />
        <meshStandardMaterial
          color={highlighted ? '#e8fdff' : '#72dce9'}
          emissive={highlighted ? '#86effa' : '#1e8d9d'}
          emissiveIntensity={highlighted ? 1.5 : 0.55}
          metalness={0.45}
          roughness={0.28}
        />
      </mesh>
      <mesh
        position={midpoint}
        quaternion={orientation}
        onPointerEnter={(event) => {
          event.stopPropagation()
          onHover(connection.id)
        }}
        onPointerLeave={(event) => {
          event.stopPropagation()
          onHover(null)
        }}
        onClick={(event) => {
          event.stopPropagation()
          onSelect(connection.id)
        }}
      >
        <cylinderGeometry args={[0.13, 0.13, length, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh position={start}>
        <sphereGeometry args={[highlighted ? 0.105 : 0.075, 12, 12]} />
        <meshStandardMaterial color="#dffcff" emissive="#56ddeb" emissiveIntensity={highlighted ? 1.8 : 0.8} />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[highlighted ? 0.105 : 0.075, 12, 12]} />
        <meshStandardMaterial color="#dffcff" emissive="#56ddeb" emissiveIntensity={highlighted ? 1.8 : 0.8} />
      </mesh>

      <mesh ref={pulse} position={start}>
        <sphereGeometry args={[0.045 + activity * 0.035, 10, 10]} />
        <meshBasicMaterial
          ref={pulseMaterial}
          color="#f1feff"
          transparent
          opacity={0.8}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

interface HelixProps {
  isHandoff: boolean
  hoveredId: string | null
  selectedId: string | null
  onHover: (connectionId: string | null) => void
  onSelect: (connectionId: string) => void
}

function DataHelix({ isHandoff, hoveredId, selectedId, onHover, onSelect }: HelixProps) {
  const helix = useRef<Group>(null)
  const railCurves = useMemo(() => {
    const segments = 90
    return ([0, 1] as const).map(
      (side) => new CatmullRomCurve3(
        Array.from(
          { length: segments },
          (_, index) => toVector3(getHelixCoordinate(index / (segments - 1), side)),
        ),
      ),
    )
  }, [])

  useFrame((_, delta) => {
    if (!helix.current) return
    const smoothing = Math.min(1, delta * 2.4)
    const target = isHandoff ? 0 : 0.08
    helix.current.rotation.x += (target - helix.current.rotation.x) * smoothing
    helix.current.rotation.z += (-target - helix.current.rotation.z) * smoothing
  })

  return (
    <group ref={helix} rotation={[0, 0, 0]}>
      {railCurves.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 150, 0.055, 10, false]} />
          <meshStandardMaterial
            color={index === 0 ? '#70dce9' : '#d5f9fc'}
            emissive={index === 0 ? '#197e8c' : '#4daeba'}
            emissiveIntensity={0.72}
            metalness={0.55}
            roughness={0.24}
          />
        </mesh>
      ))}

      {mockCapture.connections.map((connection, index) => (
        <ConnectionRung
          key={connection.id}
          isHandoff={isHandoff}
          connection={connection}
          index={index}
          count={mockCapture.connections.length}
          hovered={hoveredId === connection.id}
          selected={selectedId === connection.id}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </group>
  )
}

interface DnaSceneProps {
  isHandoff?: boolean
  hoveredId: string | null
  selectedId: string | null
  onHover: (connectionId: string | null) => void
  onSelect: (connectionId: string) => void
  onClearSelection: () => void
}

export function DnaScene(props: DnaSceneProps) {
  const isHandoff = props.isHandoff ?? false

  return (
    <Canvas
      className="dna-canvas"
      camera={{ position: [0, 0.2, 9.4], fov: 42, near: 0.1, far: 100 }}
      dpr={[1, 1.7]}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={props.onClearSelection}
    >
      <color attach="background" args={[new Color('#03080b')]} />
      <fog attach="fog" args={['#03080b', 10, 19]} />
      <ambientLight intensity={0.38} />
      <directionalLight position={[4, 7, 6]} intensity={1.25} color="#c8faff" />
      <pointLight position={[-4, -2, 3]} intensity={18} distance={10} color="#20bfd3" />
      <DataHelix
        isHandoff={isHandoff}
        hoveredId={props.hoveredId}
        selectedId={props.selectedId}
        onHover={props.onHover}
        onSelect={props.onSelect}
      />
      <DampedControls isHandoff={isHandoff} />
    </Canvas>
  )
}
