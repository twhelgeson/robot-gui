import * as THREE from 'three'
import { scene } from './scene';
import { storeManager } from './State';
import { manager } from "./scene";
import { updateCamera } from "./camera";
import { robotEEIntersecting, updateRobot } from "./RobotTHREE";
import updateControls from "./gamepad";
import { TargetBox } from "./targetBox";
import { robotEEOrientation } from './RobotTHREE';



const position = new THREE.Vector3(4, 4, 0)
const rotation = new THREE.Vector3(0, 0, 0)
const targetBox = new TargetBox(position, rotation, scene)
targetBox.hideBorder()

const position1 = new THREE.Vector3(3, 2, 1)
const rotation1 = new THREE.Vector3(0, 0, 0)
const goalBox = new TargetBox(position1, rotation1, scene, {x: 2, y: 3, z: 2})
goalBox.setBorderColor( TargetBox.colors.green )
goalBox.hideMesh()
goalBox.hideAttachmentPoint()
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
let stuckOn = false

export function animate() {
    // wait for objects to fully load
    if(counter < 2) counter++
    if(counter === 2) progressBarContainer.style.display = 'none'

    const state = storeManager.getStore("Robot").getState()
    const target = state.target

    targetBox.setColor( TargetBox.colors.blue )
    const inGoal = goalBox.boundingBox.containsBox(targetBox.boundingBox)

    const armTargetDot = robotEEOrientation.dot( targetBox.orientation )
    const armTargetAligned = Math.abs( armTargetDot + 1 ) < 0.01

    const targetGoalDot = goalBox.orientation.dot( targetBox.orientation )
    const targetGoalAligned = Math.abs( targetGoalDot - 1 ) < 0.01

    if(robotEEIntersecting(targetBox.attachmentPointBound) && armTargetAligned ) {
        targetBox.setColor( TargetBox.colors.green )
        // targetBox.setPosition( target.position )
        stuckOn = true
    }

    if(stuckOn) targetBox.attach( target.position, target.rotation )

    targetBox.setAttachmentPointColor( TargetBox.colors.yellow )
    if(armTargetAligned) {
        targetBox.setAttachmentPointColor( TargetBox.colors.green )
    }

    goalBox.setBorderColor( TargetBox.colors.green )
    if(inGoal) {
        goalBox.setBorderColor( TargetBox.colors.cyan )
        if(!attach) {
            targetBox.detach()
            stuckOn = false
            const targetPos = getRandomPosition( bounds );
            const targetRot = getRandomRotation()
            const targetRotArr = [ targetRot.x, targetRot.y, targetRot.z ]
            console.log(targetRotArr.map(function(x) { return (x * 180) / Math.PI}))
            targetBox.transform( targetPos, targetRot )
        }
    }

    updateRobot()
    updateControls()
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

function getRandomRotation() {
    const x = Math.PI / 2
    const y = Math.PI / 2
    const z = 0

    return { x: x, y: y, z: z }
}