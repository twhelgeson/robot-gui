import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js'

import { scene } from './scene';
import { storeManager } from './State';
import { manager } from "./scene";
import { updateCamera } from "./camera";
import { robotEEIntersecting, robotStore, updateRobot } from "./RobotTHREE";
import updateControls, { grasping } from "./gamepad";
import { TargetBox } from "./targetBox";
import { robotEEOrientation } from './RobotTHREE';

import { targetBB } from "./Target";
import { robotController } from './RobotEEControl';


let targets = []
let goals = []
let goalTimers = []

const COOLDOWN_SECONDS = 2

createGoal(
    new THREE.Vector3(1, 2, 3),
    new THREE.Vector3(0, 0, 0),
    TargetBox.colors.green,
    new THREE.Color("darkgreen")
)

createGoal(
    new THREE.Vector3(4, 2, 3),
    new THREE.Vector3(0, 0, 0),
    TargetBox.colors.red,
    new THREE.Color("darkred")
)

createGoal(
    new THREE.Vector3(4, 7, 3),
    new THREE.Vector3(0, 0, 0),
    TargetBox.colors.blue,
    new THREE.Color("cyan")
)

createTarget(
    new THREE.Vector3(0, 5, 1),
    new THREE.Vector3(0, 0, 0),
    TargetBox.colors.green
)

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
let startUpdatingArm = false
export function animate() {
    // wait for objects to fully load
    if(counter < 3) counter++
    if(counter === 2) {
        progressBarContainer.style.display = 'none'
        startUpdatingArm = true
    }
    
    if( startUpdatingArm ) robotController.goToGoal()

    for(const target of targets) {
        // arm end effector is touching attachment point
        const armInRange = robotEEIntersecting( target.attachmentPointBound )
            
        // arm angle is aligned with target
        const armTargetDot = robotEEOrientation.dot( target.orientation )
        const armAligned = Math.abs( armTargetDot + 1 ) < 0.02

        // Indicate whether arm is properly aligned
        updateTargetColors(target, armInRange, armAligned, grasping )

        if( armInRange && armAligned && grasping ) {
            const robotTarget = robotStore.getState().target
            target.attach( robotTarget.position, robotTarget.rotation )
        }

        for(let i = 0; i < goals.length; i++) {
            const goal = goals[i]
            // Make sure colors are proper
            if(goal.borderColor !== target.color) continue

            // Check if box has been placed
            if(!grasping && goalTimers[i] > COOLDOWN_SECONDS) {
                target.transform( getRandomPosition( bounds ), getRandomRotation() )
                target.setColor( getRandomColorRGB() )
            }

            // Update cooldown border
            if(grasping && goal.boundingBox.containsBox(target.boundingBox)) {
                goalTimers[i] += 1/60

                goal.setProgressBorderProp( goalTimers[i] / COOLDOWN_SECONDS)
                // goal.setBorderColor( TargetBox.colors.cyan )
            } else {
                goalTimers[i] = 0
                goal.setProgressBorderProp(0)
            }
        }
    }

    updateRobot()
    updateControls()
    updateCamera()
    TWEEN.update()

    setTimeout( function() {

        requestAnimationFrame( animate );

    }, 1000 / 60 );
};




/* HELPER FUNCTIONS */

// Randomization
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); 
    // The maximum is exclusive and the minimum is inclusive
  }

function getRandomPosition( bounds ) {
    const x = getRandomArbitrary( bounds.x.min, bounds.x.max )
    const y = getRandomArbitrary( bounds.y.min, bounds.y.max )
    const z = getRandomArbitrary( bounds.z.min, bounds.z.max )

    return new THREE.Vector3( x, y, z )
}

function getRandomRotation() {
    const x = getRandomArbitrary(-Math.PI, Math.PI)
    const y = getRandomArbitrary(-Math.PI, Math.PI)
    const z = getRandomArbitrary(-Math.PI, Math.PI)

    return { x: x, y: y, z: z }
}

function getRandomColorRGB() {
    const int = getRandomInt(0, 3)

    switch(int) {
        case 0:
            return TargetBox.colors.red
        case 1:
            return TargetBox.colors.green
        case 2:
            return TargetBox.colors.blue
        default:
            return TargetBox.colors.red
    }
    
}


// Creating targets/goals

function createTarget( position, rotation, color ) {
    const target = new TargetBox(position, rotation, scene)
    target.setBorderColor( TargetBox.colors.black )
    target.setColor( color )

    targets.push( target )
}

function createGoal( position, rotation, color, progressColor ) {
    const goal = new TargetBox(position, rotation, scene, {x: 2, y: 3, z: 2})
    goal.setBorderColor( color )
    goal.hideMesh()
    goal.hideAttachmentPoint()
    goal.addProgressBorder()
    goal.setProgressBorderProp( 0 )
    goal.progressBorder.material.color = progressColor

    goals.push(goal)
    goalTimers.push(0)
}

// Handle target interactions

function updateTargetColors( target, armInRange, armAligned, grasping ) {

    // Handle attachment point colors
    let attachmentPointColor = TargetBox.colors.orange
    if(armAligned) attachmentPointColor = TargetBox.colors.cyan

    // Handle border of target
    if(armInRange && armAligned) {
        if(grasping) attachmentPointColor = TargetBox.colors.black
        target.setBorderColor( TargetBox.colors.cyan )
    } else {
        target.setBorderColor( TargetBox.colors.black )
    }

    target.setAttachmentPointColor(attachmentPointColor)
}