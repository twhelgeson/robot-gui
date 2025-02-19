import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'


/* SCENE SETUP */

// threejs setup
const renderer = new THREE.WebGLRenderer({ antialias: true })
setupRenderer()

const scene = new THREE.Scene()

const directionalLight = new THREE.AmbientLight( 0xffffff )
const pointLight = new THREE.PointLight(0xffffff)
setupLights()


// manage loading models
const manager = new THREE.LoadingManager()
const objectLoader = new THREE.ObjectLoader( manager )
const rgbeLoader = new RGBELoader( manager )

// display loading progress
const progressBar = document.getElementById('progress-bar')
const progressLabel = document.getElementById('progress-bar-label')

var loadingText = 'Loading...'
manager.onProgress = function ( url, itemsLoaded, itemsTotal) {
	const actualTotal = 34
	progressBar.value = (itemsLoaded / actualTotal) * 100
	if(url.includes('robot_arm')) loadingText = 'Designing robot arm...'
	if(url.includes('ISS.json')) loadingText = 'Sending space station into orbit...'
	if(url.includes('HDRI_Orbital')) loadingText = 'Generating Earth...'
    progressLabel.innerHTML = loadingText
}

manager.onError = function ( url ) {
	console.log( 'There was an error loading ' + url )
}

// load background and space station
loadEnv()


/* HELPER FUNCTIONS */

function setupRenderer() {
	renderer.setClearColor(0x333333)
	renderer.outputColorSpace = THREE.SRGBColorSpace
	renderer.setSize(window.innerWidth, window.innerHeight)
	document.body.appendChild( renderer.domElement )
}

function setupLights() {
	// directional
	directionalLight.intensity = 0.2
	scene.add(directionalLight)

	// point
	pointLight.position.set(100, 0, 0)
	// pointLight.castShadow = true
	pointLight.intensity = 1.3
	pointLight.shadow.mapSize.set(16384, 16384)
	pointLight.shadow.radius = 5
	scene.add(pointLight)
}

function loadEnv() {
	loadObject("ISS.json", {
		position: [-17.5, -13.375, -1.5], 
		rotation: [(Math.PI)/2, (Math.PI)/2, 0],
		castShadow: false,
		receiveShadow: false,
		addTo: scene
	})

	rgbeLoader.load('RenderCrate-HDRI_Orbital_46_Sunset_4K.hdr', function(texture) {
		texture.mapping = THREE.EquirectangularRefractionMapping
		scene.background = texture
	})
}

export function loadObject(filename, options) {
	objectLoader.load(
		filename,
		function( obj ) {
			setupObject(obj, options)
		}
	)
}

function setupObject( obj, options ) {
	if(options.position !== undefined) obj.position.fromArray(options.position)
	if(options.rotation !== undefined) obj.rotation.fromArray(options.rotation)

	if(options.name !== undefined) obj.name = options.name

	obj.traverse(function(node) {
		if(node.isMesh) {
			if(options.castShadow !== undefined) node.castShadow = options.castShadow
			if(options.receiveShadow !== undefined) node.receiveShadow = options.receiveShadow
		}
	})

	if(options.addTo === undefined) scene.add(obj)
	else options.addTo.add(obj)
}


/* EXPORTS */

export { scene }
export { renderer }
export { manager }