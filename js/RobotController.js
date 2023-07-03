import { robotInvalid } from "./Robot"

// units per frame
const MAX_TRANS_VEL = 0.16 
const MAX_ROT_VEL = 0.1

export class RobotController {
    static DEG_TO_RAD = Math.PI / 180
    constructor(robotStore, transStep = 0.25, rotStep = (Math.PI)/36) {
        // Allows us to get and set robot state
        this.robotStore = robotStore
        
        // Robot current state
        this.angles = robotStore.getState().angles
        this.eePosition = robotStore.getState().target.position
        this.eeRotation = robotStore.getState().target.rotation
    
        // How much to move by
        this.rotStep = rotStep
        this.transStep = transStep

        this.positionGoal = { x: 0, y: 5, z: 1 }
        this.rotationGoal = { x: -Math.PI, y: 0, z: 0 }
    }

    setTransStep( step ) {
        this.transStep = step
    }

    setRotStepDeg( angleDeg ) {
        this.rotStep = angleDeg * RobotController.DEG_TO_RAD
    }

    setJointAngle( jointNumber, angleRad ) {
        this.angles[ "A" + jointNumber ] = angleRad
        this.#setRobotAngles( this.angles )
    }

    setPosition( axis, position ) {
        this.positionGoal[ axis ] = position
        // this.#setTweenTarget( this.EEposition, this.EErotation )
    }

    setRotation( axis, rotation ) {
        this.rotationGoal[ axis ] = rotation
    }

    incrementJoint( jointNumber ) { this.moveJoint( jointNumber, 1 ) }
    decrementJoint( jointNumber ) { this.moveJoint( jointNumber, -1 ) }
    incrementPosition( axis ) { this.moveAlongAxis( axis, 1 ) }
    decrementPosition( axis ) { this.moveAlongAxis( axis, -1 ) }
    incrementRotation( axis ) { this.rotateAroundAxis( axis, 1 ) }
    decrementRotation( axis ) { this.rotateAroundAxis( axis, -1 ) }

    moveJoint( jointNumber, direction ) {
        const step = this.rotStep * direction
        this.moveJointAmt( jointNumber, step )
    }

    moveJointAmt( jointNumber, amt ) {
        const key = "A" + jointNumber
        const angles = incrementDictVal( this.angles, key, amt )
        this.#setRobotAngles( angles )
    }

    moveAlongAxis( axis, direction ) {
        const step = this.transStep * direction
        this.moveAlongAxisAmt( axis, step )
    }

    rotateAroundAxis( axis, direction ) {
        const step = this.rotStep * direction
        this.rotateAroundAxisAmt( axis, step )
    }

    moveAlongAxisAmt( axis, amt ) {
        this.positionGoal[ axis ] += amt
    }

    rotateAroundAxisAmt( axis, amt ) {
        this.rotationGoal[ axis ] += amt
    }

    #updateState() {
        this.angles = this.robotStore.getState().angles
        this.eePosition = this.robotStore.getState().target.position
        this.eeRotation = this.robotStore.getState().target.rotation
    }

    #setTweenTarget(position) {

    }

    goToGoal() {
        this.tween( this.eeRotation, this.rotationGoal, MAX_ROT_VEL )
        this.tween( this.eePosition, this.positionGoal, MAX_TRANS_VEL )
        this.#setRobotTarget(this.eePosition, this.eeRotation)
    }

    tween( state, goal, max_vel ) {
        let totalDiff = 0
        let diffs = { x: 0, y: 0, z: 0 }
        for( let axisName in goal ) {
            const goalAxis = goal[ axisName ]
            const eeAxis = state[ axisName ]
            const diff = goalAxis - eeAxis

            diffs[ axisName ] = diff
            totalDiff += Math.abs( diff )
        }   

        for( let axisName in goal ) {
            const goalAxis = goal[ axisName ]
            const diff = diffs[ axisName ]
            let prop = 1
            if (totalDiff !== 0) prop = Math.abs( diff / totalDiff )
            const propVel = max_vel * prop

            if( Math.abs( diff ) < propVel / 2 ) {
                state[ axisName ] = goalAxis
                continue
            } 

            state[ axisName ] += propVel * Math.sign( diff )
        }
    }

    #setRobotTarget( position, rotation ) {
        this.robotStore.dispatch('ROBOT_CHANGE_TARGET', { position, rotation })
        this.#updateState()
    }

    #setRobotAngles( angles ) {
        this.robotStore.dispatch('ROBOT_CHANGE_ANGLES', angles)
        this.#updateState()
    }
}


function incrementDictVal( dict, key, amount ) {
    var dictCopy = {}
    Object.assign( dictCopy, dict )
    dictCopy[ key ] += amount
    return dictCopy
}

function setDictVal( dict, key, val ) {
    var dictCopy = {}
    Object.assign( dictCopy, dict )
    dictCopy[ key ] = val
    return dictCopy
}

function distance( point1, point2 ) {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    const dz = point2.z - point1.z
    const sum = Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2)

    return Math.sqrt(sum)
}