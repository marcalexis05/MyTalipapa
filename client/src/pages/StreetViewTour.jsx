import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, X, Maximize2, RotateCcw, ZoomIn, ZoomOut, Compass, Map as MapIcon, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Navigation
} from 'lucide-react'
import mapImage from '../images/map.png'

// Generate a sequence of hallway nodes mapping to images
const generateHallwayNodes = () => {
  const nodes = []
  const total = 34
  const X_CORRIDORS = [30, 265, 530, 790, 1050, 1300, 1570, 1845, 2120]
  const Y_PATHWAYS = [100, 300, 500, 700, 910, 1100, 1300, 1500, 1720]
  
  // Create a structured path covering main aisles
  const pathCoords = [
    {x: 1050, y: 1720}, {x: 1050, y: 1500}, {x: 1050, y: 1300}, {x: 1050, y: 1100}, {x: 1050, y: 910}, // Up center
    {x: 1300, y: 910}, {x: 1570, y: 910}, {x: 1845, y: 910}, {x: 2120, y: 910}, // Right across middle
    {x: 2120, y: 1100}, {x: 2120, y: 1300}, {x: 2120, y: 1500}, {x: 2120, y: 1720}, // Down right edge
    {x: 1845, y: 1720}, {x: 1570, y: 1720}, {x: 1300, y: 1720}, // Left along bottom right
    {x: 1300, y: 1500}, {x: 1300, y: 1300}, {x: 1300, y: 1100}, {x: 1570, y: 1100}, // Snake around
    {x: 1570, y: 1300}, {x: 1570, y: 1500}, {x: 1845, y: 1500}, {x: 1845, y: 1300},
    {x: 1845, y: 1100}, {x: 2120, y: 700}, {x: 2120, y: 500}, {x: 2120, y: 300}, {x: 2120, y: 100}, // Top right
    {x: 1845, y: 100}, {x: 1570, y: 100}, {x: 1300, y: 100}, {x: 1050, y: 100}, // Top middle
    {x: 1050, y: 300}, {x: 1050, y: 500}, {x: 1050, y: 700} // Down center
  ]

  for (let i = 1; i <= total; i++) {
    // If we have more images than coordinates, we loop the coordinates safely
    const coord = pathCoords[(i - 1) % pathCoords.length]
    nodes.push({
      id: `hallway${i}`,
      name: `Hallway ${i}`,
      imagePath: `/export360/hallway${i}.jpg`,
      x: coord.x,
      y: coord.y,
      index: i - 1
    })
  }
  return nodes
}

const HALLWAY_NODES = generateHallwayNodes()

export default function StreetViewTour() {
  const navigate = useNavigate()

  // State
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0)
  const currentNode = HALLWAY_NODES[currentNodeIndex]
  
  const [loaded, setLoaded] = useState(false)
  const [mapCollapsed, setMapCollapsed] = useState(false)
  const [compassAngle, setCompassAngle] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Three.js Refs
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const materialRef = useRef(null)
  const spherical = useRef({ phi: Math.PI / 2, theta: 0 })
  const isDragging = useRef(false)
  const hotspotMeshes = useRef([])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Navigation Logic
  const handleNextNode = () => {
    setCurrentNodeIndex(prev => {
      const nextIdx = (prev + 1) % HALLWAY_NODES.length
      triggerSceneTransition(HALLWAY_NODES[nextIdx].imagePath, nextIdx)
      return nextIdx
    })
  }

  const handlePrevNode = () => {
    setCurrentNodeIndex(prev => {
      const prevIdx = (prev - 1 + HALLWAY_NODES.length) % HALLWAY_NODES.length
      triggerSceneTransition(HALLWAY_NODES[prevIdx].imagePath, prevIdx)
      return prevIdx
    })
  }

  // Pre-load texture helper
  const triggerSceneTransition = (texturePath, newIdx) => {
    setLoaded(false)
    setTimeout(() => {
      if (!window.THREE || !materialRef.current || !sceneRef.current) return
      
      const THREE = window.THREE
      new THREE.TextureLoader().load(
        texturePath,
        (tex) => {
          materialRef.current.map = tex
          materialRef.current.needsUpdate = true
          recreateHotspots(sceneRef.current, THREE, newIdx)
          setLoaded(true)
        },
        null,
        (err) => {
          console.error('Failed to load panorama', err)
          setLoaded(true)
        }
      )
    }, 100)
  }

  // Draw arrow hotspots
  const createArrowTexture = (THREE, direction) => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, 128, 128)

    ctx.fillStyle = 'rgba(232, 98, 26, 0.8)'
    ctx.beginPath()
    ctx.arc(64, 64, 50, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(64, 64, 50, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'bold 40px sans-serif'
    ctx.fillText(direction === 'forward' ? '▲' : '▼', 64, 68)

    return new THREE.CanvasTexture(canvas)
  }

  const recreateHotspots = (scene, THREE, nodeIdx) => {
    hotspotMeshes.current.forEach((mesh) => scene.remove(mesh))
    hotspotMeshes.current = []

    const matFwd = new THREE.SpriteMaterial({ map: createArrowTexture(THREE, 'forward'), transparent: true })
    const spriteFwd = new THREE.Sprite(matFwd)
    // Place forward arrow in front
    spriteFwd.position.set(0, -10, -30)
    spriteFwd.scale.set(8, 8, 1)
    spriteFwd.userData = { type: 'next' }
    scene.add(spriteFwd)
    hotspotMeshes.current.push(spriteFwd)

    const matBck = new THREE.SpriteMaterial({ map: createArrowTexture(THREE, 'backward'), transparent: true })
    const spriteBck = new THREE.Sprite(matBck)
    // Place backward arrow behind
    spriteBck.position.set(0, -10, 30)
    spriteBck.scale.set(8, 8, 1)
    spriteBck.userData = { type: 'prev' }
    scene.add(spriteBck)
    hotspotMeshes.current.push(spriteBck)
  }

  // Init Three.js
  useEffect(() => {
    let THREE
    let animationId

    async function init() {
      if (!window.THREE) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
          s.onload = resolve
          s.onerror = reject
          document.head.appendChild(s)
        })
      }
      THREE = window.THREE

      const W = mountRef.current.clientWidth
      const H = mountRef.current.clientHeight

      const scene = new THREE.Scene()
      sceneRef.current = scene

      const camera = new THREE.PerspectiveCamera(70, W / H, 0.1, 1000)
      camera.position.set(0, 0, 0.001)
      cameraRef.current = camera

      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(W, H)
      mountRef.current.appendChild(renderer.domElement)
      rendererRef.current = renderer

      const geometry = new THREE.SphereGeometry(500, 64, 40)
      geometry.scale(-1, 1, 1)

      const texture = new THREE.TextureLoader().load(currentNode.imagePath, () => {
        setLoaded(true)
      })
      const material = new THREE.MeshBasicMaterial({ map: texture })
      materialRef.current = material
      scene.add(new THREE.Mesh(geometry, material))

      recreateHotspots(scene, THREE, currentNodeIndex)

      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2()

      const onPointerDownClick = (e) => {
        const rect = renderer.domElement.getBoundingClientRect()
        const touch = e.changedTouches ? e.changedTouches[0] : (e.touches ? e.touches[0] : null)
        const clientX = touch ? touch.clientX : e.clientX
        const clientY = touch ? touch.clientY : e.clientY

        if (clientX === undefined || clientY === undefined) return

        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(mouse, camera)
        const hits = raycaster.intersectObjects(hotspotMeshes.current)

        if (hits.length > 0) {
          const uData = hits[0].object.userData
          if (uData.type === 'next') handleNextNode()
          else if (uData.type === 'prev') handlePrevNode()
        }
      }

      renderer.domElement.addEventListener('click', onPointerDownClick)
      renderer.domElement.addEventListener('touchend', onPointerDownClick)

      // Drag to pan
      let lastX = 0, lastY = 0
      const onPointerDownPan = (e) => {
        isDragging.current = true
        const touch = e.touches ? e.touches[0] : null
        lastX = touch ? touch.clientX : e.clientX
        lastY = touch ? touch.clientY : e.clientY
      }
      const onPointerMovePan = (e) => {
        if (!isDragging.current) return
        const touch = e.touches ? e.touches[0] : null
        const x = touch ? touch.clientX : e.clientX
        const y = touch ? touch.clientY : e.clientY
        
        if (x === undefined || y === undefined) return

        const dx = x - lastX
        const dy = y - lastY
        lastX = x
        lastY = y

        spherical.current.theta -= dx * 0.004
        spherical.current.phi = Math.max(0.4, Math.min(Math.PI - 0.4, spherical.current.phi + dy * 0.004))
      }
      const onPointerUpPan = () => { isDragging.current = false }

      renderer.domElement.addEventListener('mousedown', onPointerDownPan)
      window.addEventListener('mousemove', onPointerMovePan)
      window.addEventListener('mouseup', onPointerUpPan)
      renderer.domElement.addEventListener('touchstart', onPointerDownPan)
      window.addEventListener('touchmove', onPointerMovePan)
      window.addEventListener('touchend', onPointerUpPan)

      function updateCamera() {
        const { phi, theta } = spherical.current
        const x = Math.sin(phi) * Math.cos(theta)
        const y = Math.cos(phi)
        const z = Math.sin(phi) * Math.sin(theta)
        camera.lookAt(x, y, z)
        setCompassAngle(-Math.round((theta * 180) / Math.PI))
      }

      function animate() {
        animationId = requestAnimationFrame(animate)
        updateCamera()
        renderer.render(scene, camera)
      }
      animate()
      
      const handleResize = () => {
        if (!mountRef.current) return
        const w = mountRef.current.clientWidth
        const h = mountRef.current.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
      window.addEventListener('resize', handleResize)
    }

    init()
    return () => {
      cancelAnimationFrame(animationId)
      if (rendererRef.current) rendererRef.current.dispose()
    }
  }, []) // Empty dependency array, handles its own state updates via refs and closures

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
      
      {/* Back Button */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 50 }}>
        <button onClick={() => navigate(-1)} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <ArrowLeft size={20} color="#1a5c2a" />
        </button>
      </div>

      {/* Loading Overlay */}
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
          Loading 360 View...
        </div>
      )}

      {/* Viewport 360 */}
      <div ref={mountRef} style={{ flex: 1, position: 'relative', minHeight: isMobile ? '50vh' : '100%' }} />

      {/* Map Overlay Panel */}
      <div style={{
        width: isMobile ? '100%' : (mapCollapsed ? 50 : 400),
        height: isMobile ? (mapCollapsed ? 50 : '50vh') : '100%',
        background: '#fff',
        borderLeft: isMobile ? 'none' : '2px solid #e2e8f0',
        borderTop: isMobile ? '2px solid #e2e8f0' : 'none',
        display: 'flex', flexDirection: 'column',
        transition: 'all 0.3s ease',
        zIndex: 40,
        position: isMobile ? 'absolute' : 'relative',
        bottom: isMobile ? 0 : 'auto',
      }}>
        {/* Map Header */}
        <div onClick={() => setMapCollapsed(!mapCollapsed)} style={{ height: 50, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapIcon size={18} color="#e8621a" />
            {!mapCollapsed && <span style={{ fontWeight: 800, color: '#1e293b', fontSize: 14 }}>Street View Map</span>}
          </div>
          {mapCollapsed ? (isMobile ? <ChevronUp size={20} /> : <ChevronLeft size={20} />) : (isMobile ? <ChevronDown size={20} /> : <ChevronRight size={20} />)}
        </div>

        {/* Map Body */}
        {!mapCollapsed && (
          <div style={{ flex: 1, position: 'relative', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 2305 1824" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
              <image href={mapImage} x="-20" y="-15" width="2305" height="1824" preserveAspectRatio="none" />
              
              {/* Path line connecting all hallways */}
              <polyline 
                points={HALLWAY_NODES.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none" stroke="rgba(232,98,26,0.3)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" 
              />

              {/* The User Indicator (Red Dot + View Cone) */}
              <g transform={`translate(${currentNode.x},${currentNode.y})`}>
                <path d="M0 0 L-100 -200 A200 200 0 0 1 100 -200 Z" fill="rgba(232,98,26,0.3)" transform={`rotate(${compassAngle})`} />
                <circle r="30" fill="#e8621a" stroke="#fff" strokeWidth="6" />
              </g>
            </svg>

            {/* Current Status Info */}
            <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, background: 'rgba(255,255,255,0.95)', padding: 12, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1a5c2a' }}>{currentNode.name}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Drag camera to look around. Click arrows to walk.</div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
