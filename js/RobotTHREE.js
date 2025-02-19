import { storeManager } from './State'
import { scene } from './scene'
import { robotStore } from './Robot'
import * as THREE from 'three'
import THREERobot from './THREERobot'

const THREESimulationRobot = new THREE.Group()
scene.add(THREESimulationRobot)

const robotTHREEStore = storeManager.createStore('RobotTHREE', {})

let VisualRobot
robotStore.listen([state => state.geometry, state => state.jointLimits], (geometry, jointLimits) => {
  buildRobot({ geometry, jointLimits }) // after GUI loaded in the stored values
})

const cacheState = {
  jointOutOfBound: [false, false, false, false, false, false],
}
robotStore.listen((state) => {
  const angles = Object.values(state.angles)
  VisualRobot.setAngles(angles)

  for (let i = 0; i < 6; i++) { // do some caching
    if (!cacheState.jointOutOfBound[i] && state.jointOutOfBound[i]) { // highlight only on change
      VisualRobot.highlightJoint(i, 0xff0000)
    } else if (cacheState.jointOutOfBound[i] && !state.jointOutOfBound[i]) {
      VisualRobot.highlightJoint(i)
    }
  }

  cacheState.jointOutOfBound = state.jointOutOfBound
})

function buildRobot(state) {
  if (state.geometry.V3.y !== 0 || state.geometry.V3.z !== 0 || state.geometry.V4.y !== 0 || state.geometry.V4.z !== 0) {
    alert('geometry where V3 y,z not 0 and V4 x,z not 0 are not supported, yet')
    state.geometry.V3.y =
        state.geometry.V3.z =
          state.geometry.V4.y =
              state.geometry.V4.x = 0
  }

  while (THREESimulationRobot.children.length) {
    THREESimulationRobot.remove(THREESimulationRobot.children[0])
  }
  // object to nested arrays
  const geometry = Object.values(state.geometry).map((val, i, array) => [val.x, val.y, val.z])
  const jointLimits = Object.values(state.jointLimits)

  VisualRobot = new THREERobot(geometry, jointLimits, THREESimulationRobot)
}

// Make vector represent orientation of end effector
const initOrientation = new THREE.Vector3( 0, 0, 1 )
const robotEEOrientation = new THREE.Vector3().copy( initOrientation )
const orientationRotation = new THREE.Euler( 0, 0, 0, "XYZ" )

const origin = new THREE.Vector3( 0, 0, 0 )
const length = 1
const hex = 0xff00ff

const arrowHelper = new THREE.ArrowHelper( robotEEOrientation, origin, length, hex )
// scene.add( arrowHelper )


function updateEEOrientationVector() {
  const EErotation = robotStore.getState().target.rotation
  orientationRotation.setFromVector3( EErotation )
  robotEEOrientation.copy( initOrientation ).applyEuler( orientationRotation )
  arrowHelper.setDirection( robotEEOrientation )
}

function updateRobotBounds() {
  VisualRobot.updateBounds()
}

export function updateRobot() {
  updateEEOrientationVector()
  updateRobotBounds()
}

export function robotIntersecting(boundingBox) {
  return VisualRobot.intersectingArm(boundingBox)
}

export function robotEEIntersecting(boundingBox) {
  return VisualRobot.intersectingEE(boundingBox)
}

export { robotStore }
export { robotEEOrientation }