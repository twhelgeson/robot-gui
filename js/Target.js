import { storeManager } from './State'
import { scene } from './scene'
import * as THREE from 'three'
import { TransformControls } from 'three/addons/controls/TransformControls.js';
//import {potentValue} from 'ROBOT-GUI/index';

/**
 * + state per module
 * + render on state changed
 * + get state from other modules
 *
 * --- onStore update render ---
 * get data From other stores
 * - store might not have changed, so no update
 */

const defaultState = {
  controlSpace: 'local',
  eulerRingsVisible: false,
  controlVisible: false,
  controlMode: 'translate',
  followTarget: false,
  manipulate: 'rotate',
  position: {
    x: 0,
    y: 3,
    z: 1,
  },
  rotation: {
    x: 0,
    y: 0,
    z: 0,
  },
}

const store = storeManager.createStore('Target', defaultState)

const sphereGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.2 * 2, 16)
const target = new THREE.Group()

const targetCylinder = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({
  transparent: false,
  opacity: 1,
  color: 0xF64129,
}))

targetCylinder.rotation.x = Math.PI / 2
targetCylinder.position.z += 1
target.add(targetCylinder)
target.rotation.y = Math.PI / 2
target.rotation.z = -Math.PI
target.rotation.order = 'XYZ'
scene.add(target)

const targetBB = new THREE.Box3()
targetCylinder.geometry.computeBoundingBox()
const helper = new THREE.Box3Helper( targetBB, 0xffff00 )
scene.add( helper );

store.listen([() => store.getStore('Robot').getState().target, state => state], (targetT, state) => {
  if (state.followTarget) {
    state.position.x = targetT.position.x
    state.position.y = targetT.position.y
    state.position.z = targetT.position.z

    state.rotation.x = targetT.rotation.x
    state.rotation.y = targetT.rotation.y
    state.rotation.z = targetT.rotation.z
  }
  ///*
  target.position.x = state.position.x
  target.position.y = state.position.y
  target.position.z = state.position.z

  target.rotation.x = state.rotation.x
  target.rotation.y = state.rotation.y
  target.rotation.z = state.rotation.z
  //*/
})

const targetChangedAction = () => {
  setTarget(target.position, target.rotation)

  // bonus points: how to not fire an action from this reducer and still be able
  // to call CHANGE_TARGET on Target and sync the ROBOT_TARGET
  // state.dispatch('ROBOT_CHANGE_TARGET', {
  //   position: target.position,
  //   rotation: target.rotation,
  // })
}

//            control.rotation.x = 2
control.addEventListener('change', () => {
  if (!disableUpdate) { // changing controlmode causes a loop
    targetChangedAction()
  }
})

// control.attach(target)

// scene.add(control)

eulerRings.visible = store.getState().eulerRingsVisible
control.visible = store.getState().controlVisible

window.addEventListener('keydown', (event) => {
  switch (event.keyCode) {
    case 82:
      console.log('rotation mode')
      setMode('rotate')
      break
    case 84:
      console.log('translation mode')
      setMode('translate')
      break
    default:
      break
  }
}, false)


var robPosition = store.getStore('Robot').getState().target.position
var robRotation = store.getStore('Robot').getState().target.rotation

const targetBound = 0.8
function checkWin() {
  if((robPosition.x < target.position.x + targetBound) && (robPosition.x > target.position.x - targetBound)) {
    if(robPosition.y < target.position.y + targetBound && robPosition.y > target.position.y - targetBound) {
      if(robPosition.z < target.position.z + targetBound && robPosition.z > target.position.z - targetBound) {

        // if((state.rotation.x < targetT.rotation.x + 1) && (state.rotation.x > targetT.rotation.x - 1)) { //1 radian of error allowed lols
        //   if(state.rotation.y < targetT.rotation.y + 1 && state.rotation.y > targetT.rotation.y - 1) {
        //     if(state.rotation.z < targetT.rotation.z + 1 && state.rotation.z > targetT.rotation.z - 1) {

        target.rotation.x = Math.random() * (2 * Math.PI)
        target.rotation.y = Math.random() * (2 * Math.PI)
        target.rotation.z = Math.random() * (2 * Math.PI)

        let bounds = {
          x: [-3, 3],
          y: [0, 6],
          z: [-2.5, 3]
        }

        target.position.x = Math.random() * (bounds.x[1]-bounds.x[0]) + bounds.x[0]
        target.position.y = Math.random() * (bounds.y[1]-bounds.y[0]) + bounds.y[0]
        target.position.z = Math.random() * (bounds.z[1]-bounds.z[0]) + bounds.z[0]

        console.log(target.position)
          
        targetChangedAction()
        //     }
        //   }
        // }

      }
    }
  }
}

function updateRobPose() {
  robPosition = store.getStore('Robot').getState().target.position
  robRotation = store.getStore('Robot').getState().target.rotation
}

let keys = {
  "w": false,
  "a": false,
  "s": false,
  "d": false,
  "q": false,
  "e": false,
  "1": false,
  "2": false,
  "3": false,
  "4": false,
  "5": false,
  "6": false,

  //this is a test
  "m": false,
}

const transStep = 0.25;
const rotStep = 5 / 180 * Math.PI;

window.addEventListener("keydown", (e) => {
  updateRobPose();
  // setRobotTarget(robPosition, robRotation)
  if(e.key in keys) {
    keys[e.key] = true
  }

  if(keys["w"]) { robPosition.x += transStep }
  if(keys["s"]) { robPosition.x -= transStep }
  if(keys["a"]) { robPosition.y += transStep }
  if(keys["d"]) { robPosition.y -= transStep }
  if(keys["q"]) { robPosition.z += transStep }
  if(keys["e"]) { robPosition.z -= transStep }
  if(keys["1"]) { robRotation.x += rotStep }
  if(keys["2"]) { robRotation.x -= rotStep }
  if(keys["3"]) { robRotation.y += rotStep }
  if(keys["4"]) { robRotation.y -= rotStep }
  if(keys["5"]) { robRotation.z += rotStep }
  if(keys["6"]) { robRotation.z -= rotStep }


  if(keys["m"]) { /*robPosition.y = potentValue/500 */ //This does not work yet :(
                  robPosition.y += transStep}

  if(e.key in keys) { setRobotTarget(robPosition, robRotation) }
  checkWin();
})

window.addEventListener("keyup", (e) => {
  if(e.key in keys) {
    keys[e.key] = false
  }
})

store.action('CONTROL_SPACE_TOGGLE', state => state.controlSpace, controlSpace => ((controlSpace === 'local') ? 'world' : 'local'))

function toggleSpace() {
  store.dispatch('CONTROL_SPACE_TOGGLE')
}

function getState() {
  return store.getState()
}

// TODO change this to match the state first API

function setMode(mode) {
  store.dispatch('CHANGE_CONTROL_MODE', mode)
}

store.action('CHANGE_CONTROL_MODE', (state, data) => ({ ...state,
  controlMode: data,
}))

store.action('TARGET_CHANGE_TARGET', (state, data) => {
  // + this function can be called from outside
  // + may otherwise lead to inconsistent state, where followTarget: true, but pos of target and robot do not match (or not?, listen() will always be consistent)
  // - action should only care about its own state
  // - can lead to loop
  // - need only one way to do it, UI may only need to update other modules state, so only update others sate is needed
  // const pos = { ...state.rotation,
  //   ...data.rotation,
  // }
  //
  // console.log(pos)
  if (state.followTarget) {
    store.getStore('Robot').dispatch('ROBOT_CHANGE_TARGET', {
      position: { ...state.position, // allow for changing only one parameter (x,y,z)
        ...data.position,
      },
      rotation: { ...state.rotation,
        ...data.rotation,
      },
    })
  }
  return { ...state,
    position: { ...state.position, // allow for changing only one parameter (x,y,z)
      ...data.position,
    },
    rotation: { ...state.rotation,
      ...data.rotation,
    },
  }
})

function updateTarget() {
  targetBB.copy( targetCylinder.geometry.boundingBox ).applyMatrix4( targetCylinder.matrixWorld )
}

export {store}
export {updateTarget}
export {targetBB}
export {targetCylinder}