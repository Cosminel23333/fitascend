import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

// Hologram figure like the user's Higgsfield clips: glassy cyan skin, skeleton inside, worked muscles glowing red.
// Geometry: BodyParts3D (DBCLS, CC BY 4.0), see scratchpad tools for how body.glb was built.

// muscle zones in body space (metres, feet at y=0, facing +z); [x, y, z] centre and radii, mirrored left/right when x != 0
const ZONES: [string, [number, number, number], [number, number, number]][] = [
  ['chest', [0.09, 1.3, 0.09], [0.1, 0.08, 0.07]],
  ['shoulders', [0.2, 1.36, 0], [0.07, 0.08, 0.09]],
  ['traps', [0.07, 1.42, -0.06], [0.09, 0.07, 0.07]],
  ['neck', [0, 1.5, 0], [0.05, 0.05, 0.06]],
  ['biceps', [0.24, 1.17, 0.03], [0.045, 0.1, 0.05]],
  ['triceps', [0.24, 1.17, -0.04], [0.045, 0.11, 0.05]],
  ['forearms', [0.27, 0.93, 0], [0.05, 0.13, 0.06]],
  ['abdominals', [0, 1.05, 0.09], [0.11, 0.15, 0.06]],
  ['abdominals', [0.12, 1.05, 0.04], [0.05, 0.12, 0.07]],
  ['lats', [0.12, 1.18, -0.08], [0.08, 0.13, 0.07]],
  ['middle back', [0, 1.25, -0.11], [0.08, 0.1, 0.05]],
  ['lower back', [0, 1.03, -0.1], [0.07, 0.09, 0.05]],
  ['glutes', [0.08, 0.9, -0.1], [0.09, 0.09, 0.07]],
  ['abductors', [0.15, 0.9, 0], [0.04, 0.08, 0.07]],
  ['quadriceps', [0.1, 0.65, 0.04], [0.07, 0.17, 0.06]],
  ['adductors', [0.05, 0.7, 0], [0.04, 0.12, 0.05]],
  ['hamstrings', [0.1, 0.65, -0.05], [0.07, 0.17, 0.05]],
  ['calves', [0.09, 0.33, -0.05], [0.05, 0.12, 0.05]],
]
const zones = ZONES.flatMap(([m, c, r]) => (c[0] ? [[m, c, r], [m, [-c[0], c[1], c[2]], r]] : [[m, c, r]]) as [string, number[], number[]][])
const N = zones.length

const vertex = /* glsl */ `
  uniform mat4 uBody;
  varying vec3 vN;
  varying vec3 vView;
  varying vec3 vPos;
  void main() {
    vPos = (uBody * vec4(position, 1.0)).xyz;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = -mv.xyz;
    vN = normalMatrix * normal;
    gl_Position = projectionMatrix * mv;
  }`

// rim-lit glass: faint fill, bright edges; zones blend to a pulsing red
const fragment = /* glsl */ `
  #define N ${N}
  uniform vec3 uColor;
  uniform float uBase;
  uniform float uRim;
  uniform float uTime;
  uniform vec3 uC[N];
  uniform vec3 uR[N];
  uniform float uW[N];
  varying vec3 vN;
  varying vec3 vView;
  varying vec3 vPos;
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vView))), 2.0);
    float w = 0.0;
    for (int i = 0; i < N; i++) w = max(w, uW[i] * (1.0 - smoothstep(0.5, 1.0, length((vPos - uC[i]) / uR[i]))));
    vec3 cyan = uColor * (uBase + fres * uRim);
    vec3 red = vec3(1.0, 0.16, 0.06) * (1.1 + fres * 1.4) * (0.8 + 0.2 * sin(uTime * 2.4));
    gl_FragColor = vec4(mix(cyan, red, w), 1.0);
  }`

// zone weights stay 0 except on the muscles, which get them from `load`
function material(color: number, base: number, rim: number, side: THREE.Side) {
  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uBody: { value: new THREE.Matrix4() },
      uColor: { value: new THREE.Color(color) },
      uBase: { value: base },
      uRim: { value: rim },
      uTime: { value: 0 },
      uC: { value: zones.map(z => new THREE.Vector3(...z[1])) },
      uR: { value: zones.map(z => new THREE.Vector3(...z[2])) },
      uW: { value: new Array(N).fill(0) },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side,
  })
}

export default function Body3D({ load, onFail }: { load: Record<string, number>; onFail: () => void }) {
  const host = useRef<HTMLDivElement>(null)
  const muscles = useRef<THREE.ShaderMaterial | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = host.current!
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      onFail()
      return
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 20)
    camera.position.set(0, 0.9, 4.3)
    camera.lookAt(0, 0.86, 0)
    const body = new THREE.Group()
    scene.add(body)
    let t0 = performance.now()

    // glowing holographic floor rings, as in the clips
    for (const [r, o] of [[0.34, 0.9], [0.42, 0.35]] as const) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.008, 128), new THREE.MeshBasicMaterial({ color: 0x5ad2ff, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false }))
      ring.rotation.x = -Math.PI / 2
      scene.add(ring)
    }
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.34, 64), new THREE.MeshBasicMaterial({ color: 0x2aa8e0, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false }))
    disc.rotation.x = -Math.PI / 2
    scene.add(disc)

    const mats = {
      skin: material(0x5ad2ff, 0.015, 0.55, THREE.DoubleSide),
      bone: material(0x8fe6ff, 0.05, 0.55, THREE.FrontSide),
      muscle: material(0x3cbcf0, 0.02, 0.32, THREE.FrontSide),
    }
    muscles.current = mats.muscle

    new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(`${import.meta.env.BASE_URL}models/body.glb`).then(gltf => {
      gltf.scene.traverse(o => {
        if (!(o instanceof THREE.Mesh)) return
        const m = mats[o.name as keyof typeof mats]
        if (!m) return
        o.updateMatrix()
        // the mesh's own transform undoes quantization: zones are written in real metres
        m.uniforms.uBody.value.copy(o.matrix)
        o.material = m
        o.renderOrder = o.name === 'skin' ? 2 : o.name === 'bone' ? 0 : 1
      })
      body.add(gltf.scene)
      t0 = performance.now() // the turn starts from the front once the figure is there
      setReady(true)
    }, onFail)

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    // starts facing front, one slow full turn every 30 s; only drawn while on screen
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(el)
    renderer.setAnimationLoop(() => {
      if (!visible) return
      const t = (performance.now() - t0) / 1000
      if (!still) body.rotation.y = (t / 30) * Math.PI * 2
      for (const m of Object.values(mats)) m.uniforms.uTime.value = t
      renderer.render(scene, camera)
    })

    return () => {
      renderer.setAnimationLoop(null)
      ro.disconnect()
      io.disconnect()
      scene.traverse(o => {
        if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose() }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [onFail])

  // any set this week shows clearly; 8 sets light a muscle fully
  useEffect(() => {
    const m = muscles.current
    if (m) m.uniforms.uW.value = zones.map(z => (load[z[0]] ? 0.55 + 0.45 * Math.min(load[z[0]] / 8, 1) : 0))
  }, [load, ready])

  return <div className="body3d" ref={host}>{!ready && <span className="body3d-wait" aria-hidden="true" />}</div>
}
