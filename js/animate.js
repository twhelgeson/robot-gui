import * as THREE from 'three'

import { scene } from './scene';
import { manager } from "./scene";
import { updateCamera } from "./camera";
import { robotEEIntersecting, robotIntersecting, robotStore, updateRobot } from "./RobotTHREE";
import updateControls, { graspControlActive } from "./gamepad";
import { TargetBox } from "./targetBox";
import { robotEEOrientation } from './RobotTHREE';
import { robotInvalid } from './Robot';
import { robotController } from './RobotEEControl';
import { gui as controlGUI } from './gui';
import goalPositions from "../config/goal_positions.json" assert { type: "json" }

let targets = []
let goals = []
let goalTimers = []

let score = 0

const SCORE_COOLDOWN_SECONDS = 2
const DAMAGE_COOLDOWN_SECONDS = 1
const TIME_TRIAL_LENGTH_SECONDS = 90
const TIME_TRIAL_WARN_SECONDS = 10

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
    new THREE.Vector3(2, 5, 1),
    new THREE.Vector3(0, 0, 0),
    TargetBox.colors.green
)

const progressBarContainer = document.querySelector('.progress-bar-container')
manager.onLoad = function ( ) {
    animate()
}

var graspOverride = false
window.addEventListener("keydown", (e) => {
    if(e.key === "G") {
        graspOverride = !graspOverride
    }
})

const bounds = {
    x: { min: -4, max: 4},
    y: { min: 3, max: 4},
    z: { min: -4, max: 4}
}

const scoreDisplay = document.getElementById("score")

let counter = 0
let startUpdatingArm = false
let damageFrames = []

const timerDisplay = document.getElementById("timer")

setClock( TIME_TRIAL_LENGTH_SECONDS )

let timerSeconds = TIME_TRIAL_LENGTH_SECONDS
let timeTrial = false
let start

const startButton = document.getElementById('start-button')
const endButton = document.getElementById('end-button')
startButton.onclick = beginTimeTrial
endButton.onclick = endTimeTrial

export function animate() {
    var grasping = graspControlActive
    if( graspOverride ) grasping = true

    // wait for objects to fully load
    counter++
    if(counter === 2) {
        progressBarContainer.style.display = 'none'
        showGUI()
        startUpdatingArm = true
    }
    if( startUpdatingArm ) robotController.goToGoal()

    if (score < 0) score = 0
    scoreDisplay.innerHTML = "Score: " + score

    if( timeTrial ) {
        let delta = Date.now() - start
        let deltaSeconds = Math.floor(delta / 1000)
        timerSeconds = TIME_TRIAL_LENGTH_SECONDS - deltaSeconds
        if( timerSeconds <= 0 ) endTimeTrial()

        setClock( timerSeconds )
    }

    for(let i = 0; i < targets.length; i++) {
        const target = targets[i]
        const damage = robotIntersecting( target.mesh.userData.obb )

        // arm end effector is touching attachment point
        const armInRange = robotEEIntersecting( target.attachmentPointBound )
            
        // arm angle is aligned with target
        const armTargetDot = robotEEOrientation.dot( target.orientation )
        const armAligned = Math.abs( armTargetDot + 1 ) < 0.02

        // Indicate whether arm is properly aligned
        updateTargetColors(target, armInRange, armAligned, grasping, damage )

        if(damageFrames[i] === undefined || counter - damageFrames[i] > 10) {
            updateTargetColors(target, armInRange, armAligned, grasping, false )
        }

        if(damage && (!armInRange || !armAligned)) {
            if(damageFrames[i] === undefined || counter - damageFrames[i] > DAMAGE_COOLDOWN_SECONDS * 60) {
                damageFrames[i] = counter
                if( timeTrial ) score -= 1
                target.setBorderColor(TargetBox.colors.magenta)
            }
        }

        if( armInRange && armAligned && grasping ) {
            const robotTarget = robotStore.getState().target
            if(!robotInvalid) target.attach( robotTarget.position, robotTarget.rotation )
        }

        for(let i = 0; i < goals.length; i++) {
            const goal = goals[i]
            // Make sure colors are proper
            if(goal.borderColor !== target.color) continue

            // Check if box has been placed
            if(!grasping && goalTimers[i] > SCORE_COOLDOWN_SECONDS) {
                const goal = getRandomGoal()
                target.transform( goal.position, goal.rotation )
                target.setColor( getRandomColorRGB() )
                if( timeTrial ) score += 10
            }

            // Update cooldown border
            if(grasping && goal.boundingBox.containsBox(target.boundingBox)) {
                goalTimers[i] += 1/60

                goal.setProgressBorderProp( goalTimers[i] / SCORE_COOLDOWN_SECONDS)
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

function getRandomGoal() {
    let i = getRandomInt(0, goalPositions.length)
    return goalPositions[i]
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

function updateTargetColors( target, armInRange, armAligned, grasping, damage ) {

    // Handle attachment point colors
    let attachmentPointColor = TargetBox.colors.orange
    if(armAligned) attachmentPointColor = TargetBox.colors.cyan

    // Handle border of target
    if(armInRange && armAligned) {
        if(grasping) attachmentPointColor = TargetBox.colors.black
        target.setBorderColor( TargetBox.colors.cyan )
    } else if (damage) {
        target.setBorderColor( TargetBox.colors.magenta )
    } else {
        target.setBorderColor( TargetBox.colors.black )
    }

    target.setAttachmentPointColor(attachmentPointColor)
}


// Handle time trial controls
function setClock( seconds ) {
    let tMin = Math.floor( seconds / 60 )
    let tSec = Math.floor( seconds % 60 )
    if( tSec < 10 ) tSec = "0" + tSec
    let time = tMin + ":" + tSec
    timerDisplay.innerHTML = time
    if( seconds <= TIME_TRIAL_WARN_SECONDS ) timerDisplay.style.color = "red"
}

function showGUI() {
    const gui = document.getElementsByClassName("initial-gui")
    for(let i = 0; i < gui.length; i++) {
        gui[i].style.display = "block"
    }
    controlGUI.show()
}

function beginTimeTrial() {
    for(const target of targets) {
        const goal = getRandomGoal()
        target.transform( goal.position, goal.rotation )
        target.setColor( getRandomColorRGB() )
    }
    endButton.style.display = "inline"
    startButton.style.display = "none"
    scoreDisplay.style.display = "inline"
    score = 0
    timeTrial = true
    start = Date.now();
    controlGUI.hide()
}

function endTimeTrial() {
    endButton.style.display = "none"
    startButton.style.display = "inline"
    // scoreDisplay.style.display = "none"
    timeTrial = false
    timerSeconds = TIME_TRIAL_LENGTH_SECONDS
    timerDisplay.style.color = "white"
    setClock(timerSeconds)
    controlGUI.show()
}