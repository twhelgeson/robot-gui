import * as THREE from 'three';

import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';

import { scene } from './scene';
import { renderer } from './scene';
import { manager } from './scene';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';


/* CONFIG */

const bloomParams = {
    threshold: 0,
    strength: 0.1,
    radius: 0,
    exposure: 1,
    show: false
};

const views = [
    {
        left: 0.5,
        bottom: 0,
        width: 0.5,
        height: 1.0,
        eye: [ -10.7, 11.4, 6.9 ],
        lookAt: [0, 6, 0],
        up: [ 0, 0, 1 ],
        fov: 40,
    },
    {
        left: 0,
        bottom: 0,
        width: 0.5,
        height: 0.5,
        eye: [ 3.7, -0.75, -0.5 ],
        lookAt: [0, 5, 0],
        up: [ 0, 0, 1 ],
        fov: 100,
    },
    {
        left: 0,
        bottom: 0.5,
        width: 0.5,
        height: 0.5,
        eye: [ 0, 11, 0 ],
        lookAt: [0, 12, 0],
        up: [ 0, 0, 1 ],
        fov: 50,
    }
];



/* CAMERA AND RENDERING SETUP */
let view0CurrentAngle = -Math.PI/4
let view0GoalAngle = -Math.PI / 6
const MAX_CAMERA_VEL = 0.015
const CAMERA_STEP = MAX_CAMERA_VEL
export const cameraLimits = [-Math.PI/2, 0]

// post-processing passes
const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
bloomPass.threshold = bloomParams.threshold;
bloomPass.strength = bloomParams.strength;
bloomPass.radius = bloomParams.radius;

const outputPass = new OutputPass( THREE.ACESFilmicToneMapping );

// setup
setupCams()
setupPostProc()

let windowWidth, windowHeight;
function render() {

    updateSize();

    for ( let ii = 0; ii < views.length; ++ ii ) {

        const view = views[ ii ];
        const camera = view.camera;

        const left = Math.floor( windowWidth * view.left );
        const bottom = Math.floor( windowHeight * view.bottom );
        const width = Math.floor( windowWidth * view.width );
        const height = Math.floor( windowHeight * view.height );

        renderer.setViewport( left, bottom, width, height );
        renderer.setScissor( left, bottom, width, height );
        renderer.setScissorTest( true );
        renderer.setClearColor( view.background );

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        view.composer.render()
    }

    goToGoal()
}


/* HELPER FUNCTIONS */

function updateSize() {
    if ( windowWidth != window.innerWidth || windowHeight != window.innerHeight ) {

        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;

        renderer.setSize( windowWidth, windowHeight );
    }
}

function setupCams() {
    for ( let ii = 0; ii < views.length; ++ ii ) {
        const view = views[ ii ];
        const camera = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 0.1, 10000 );
        camera.position.fromArray( view.eye );
        camera.up.fromArray( view.up );
        camera.lookAt(new THREE.Vector3().fromArray( view.lookAt ))
        view.camera = camera;
    }

    panCamera( view0CurrentAngle, views[0] )
}

function setupPostProc() {
    for ( let ii = 0; ii < views.length; ++ ii ) {
        const view = views[ii]
        const camera = view.camera
        const composer = new EffectComposer( renderer );

        const renderPass = new RenderPass( scene, camera );
        composer.addPass( renderPass ); 
        
        const glitchPass = new GlitchPass();
        // composer.addPass( glitchPass );

        if(bloomParams.show) composer.addPass( bloomPass );
        composer.addPass( outputPass ); 

        view.composer = composer
    }
}

function setupBloomGui() {
    const gui = new GUI();

    const bloomFolder = gui.addFolder( 'bloom' );

    bloomFolder.add( bloomParams, 'threshold', 0.0, 1.0 ).onChange( function ( value ) {
        bloomPass.threshold = Number( value );
    } );

    bloomFolder.add( bloomParams, 'strength', 0.0, 3.0 ).onChange( function ( value ) {
        bloomPass.strength = Number( value );
    } );

    bloomFolder.add( bloomParams, 'radius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {
        bloomPass.radius = Number( value );
    } );

    bloomFolder.add(bloomParams, 'show').onChange(setupPostProc)

    const toneMappingFolder = gui.addFolder( 'tone mapping' );

    toneMappingFolder.add( bloomParams, 'exposure', 0.1, 2 ).onChange( function ( value ) {
        outputPass.toneMappingExposure = Math.pow( value, 4.0 );
    } );
}

function getPannedLookAt( angle, positionArray, lookAtArray ) {
    let position = new THREE.Vector3().fromArray( positionArray )
    let lookAt = new THREE.Vector3().fromArray( lookAtArray )

    const r1 = Math.pow( (position.x - lookAt.x), 2 )
    const r2 = Math.pow( (position.y - lookAt.y), 2 )
    const radius = Math.sqrt( r1 + r2 )

    const x = radius * Math.cos( angle ) + position.x
    const y = radius * Math.sin( angle ) + position.y
    const z = lookAt.z

    return new THREE.Vector3( x, y, z )
}

function panCamera( angle, view ) {
    view.camera.lookAt( getPannedLookAt( angle, view.eye, view.lookAt ))
}

function goToGoal() {
    const diff = view0GoalAngle - view0CurrentAngle
    if( Math.abs( view0GoalAngle - view0CurrentAngle ) < MAX_CAMERA_VEL ) {
        panCamera( view0GoalAngle, views[0] )
        view0CurrentAngle = view0GoalAngle
        return
    }

    view0CurrentAngle += Math.sign( diff) * MAX_CAMERA_VEL
    panCamera( view0CurrentAngle, views[0] )
}


/* EXPORTS */
export function updateCamera() {
    render()
}
export const camera3 = views[2].camera
export { views }

// camera controls
function enforceCameraLimits() {
    if(view0GoalAngle < cameraLimits[0]) view0GoalAngle = cameraLimits[0]
    if(view0GoalAngle > cameraLimits[1]) view0GoalAngle = cameraLimits[1]
}

export function setCameraAngle( angle ) {
    view0GoalAngle = angle
}

export function incrementCameraAngle() {
    view0GoalAngle += CAMERA_STEP
    enforceCameraLimits()
}

export function decrementCameraAngle() {
    view0GoalAngle -= CAMERA_STEP
    enforceCameraLimits()
}

export function moveCameraAmt( amt ) {
    view0GoalAngle += amt
    enforceCameraLimits()
}

export function moveCamera( direction ) {
    moveCameraAmt( direction * CAMERA_STEP)
}