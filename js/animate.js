import * as THREE from 'three'
import { scene } from './scene';
import { updateTarget } from "./Target"
import { storeManager } from './State';
import { manager } from "./scene";
import { updateCamera } from "./camera";
import { robotEEIntersecting, updateRobotBounds } from "./RobotTHREE";
import { robotIntersecting } from "./RobotTHREE";
import { targetCylinder } from "./Target";
import updateControls from "./gamepad";
import { TargetBox } from "./targetBox";

import { targetBB } from "./Target";


const position = new THREE.Vector3(1, 2, 3)
const rotation = new THREE.Vector3(0, 0, 0)
const targetBox = new TargetBox(position, rotation, scene)
targetBox.hideBorder()

const position1 = new THREE.Vector3(3, 2, 1)
const rotation1 = new THREE.Vector3(0, 0, 0)
const goalBox = new TargetBox(position1, rotation1, scene, {x: 2, y: 3, z: 2})
goalBox.setBorderColor( TargetBox.colors.green )
goalBox.hideMesh()
// goalBox.setBoundColor(TargetBox.colors.green)


const progressBarContainer = document.querySelector('.progress-bar-container')
manager.onLoad = function ( ) {
    animate()
};

let attach = false
window.addEventListener("keydown", (e) => {
    if(e.shiftKey) {
        if(attach == true) attach = false
        else attach = true
    }
})

const bounds = {
    x: { min: -4, max: 4},
    y: { min: 3, max: 4},
    z: { min: -4, max: 4}
}

let counter = 0

export function animate() {
    // wait for objects to fully load
    if(counter < 2) counter++
    if(counter === 2) progressBarContainer.style.display = 'none'

    targetBox.setColor( TargetBox.colors.blue )
    const inGoal = goalBox.boundingBox.containsBox(targetBox.boundingBox)
    if(robotEEIntersecting(targetBox.attachmentPointBound)) {
        targetBox.setColor( TargetBox.colors.green )

        const target = storeManager.getStore("Robot").getState().target

        targetBox.setPosition( target.position )
        targetBox.setRotation( target.rotation )
        
        console.log(targetBox.attachmentPointBound)
    }

    goalBox.setBorderColor( TargetBox.colors.green )
    if(inGoal) {
        goalBox.setBorderColor( TargetBox.colors.cyan )
        if(!attach) {
            targetBox.setPosition( getRandomPosition( bounds ) )
        }
    }

    updateControls()
    updateRobotBounds()
    updateCamera()

    setTimeout( function() {

        requestAnimationFrame( animate );

    }, 1000 / 60 );
};

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomPosition( bounds ) {
    const x = getRandomArbitrary( bounds.x.min, bounds.x.max )
    const y = getRandomArbitrary( bounds.y.min, bounds.y.max )
    const z = getRandomArbitrary( bounds.z.min, bounds.z.max )

    return new THREE.Vector3( x, y, z )
}