import * as THREE from 'three';
import {MeshLine, MeshLineGeometry, MeshLineMaterial} from '@lume/three-meshline'

export class TargetBox {
    static colors = {
        red: 0xff0000, 
        green: 0x00ff00,
        blue: 0x0000ff,
        cyan: 0x00ffff,
        yellow: 0xffff00
    }

    static upVector = new THREE.Vector3( 0, 0, 1 )

    constructor( position, rotation, scene, 
                 scale = {x: 1, y: 1, z: 1}, 
                 color = TargetBox.colors.blue ) {

        // Group to hold each part of the box
        this.box = new THREE.Group()

        // Create box
        this.geometry = new THREE.BoxGeometry( scale.x, scale.y, scale.z )
        this.material = new THREE.MeshBasicMaterial( { color: color} )
        this.mesh = new THREE.Mesh( this.geometry, this.material )
        this.mesh.geometry.translate( 0, 0, -(scale.z/2))
        this.box.add(this.mesh)
        this.scene = scene

        // Create bounding box
        this.boundingBox = new THREE.Box3().setFromObject( this.mesh )
        this.boundingBoxHelper = new THREE.Box3Helper( this.boundingBox, 0xffff00 )
        this.scene.add( this.boundingBoxHelper )

        // Add border
        const corners = getCornersOfCube( this.boundingBox.min, this.boundingBox.max )
        const borderGeometry = new MeshLineGeometry()
        borderGeometry.setPoints(corners)
        const resolution = new THREE.Vector2( window.innerWidth, window.innerHeight )
        const borderMaterial = new MeshLineMaterial({		
            useMap: false,
            color: new THREE.Color("white"),
            opacity: 1,
            resolution: resolution,
            sizeAttenuation: false,
            lineWidth: 10,
        })
        this.border = new MeshLine(borderGeometry, borderMaterial)
        this.box.add(this.border)

        // Add attachment point
        const attachmentGeometry = new THREE.SphereGeometry(0.3, 32, 16)
        const attachmentMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00 } )
        this.attachmentPoint = new THREE.Mesh( attachmentGeometry, attachmentMaterial ); 
        this.box.add( this.attachmentPoint )

        // Create bound for attachment point
        this.attachmentPoint.geometry.computeBoundingSphere()
        this.attachmentPointBound = new THREE.Sphere().copy(
            this.attachmentPoint.geometry.boundingSphere
        )

        // Add whole group to scene
        this.scene.add(this.box)

        // Make vector represent orientation of box
        this.orientation = new THREE.Vector3().copy( TargetBox.upVector )
        this.orientation.normalize();

        const origin = new THREE.Vector3( 0, 0, 0 )
        const length = 1

        this.arrowHelper = new THREE.ArrowHelper( this.orientation, origin, length, TargetBox.colors.yellow )
        this.scene.add( this.arrowHelper )
        
        // Position in scene
        this.setPosition(position)
        this.setRotation(rotation)

        // Used to track the previous rotation when attached to arm
        this.previousRotation
    }

    setColor( color ) {
        this.material.color.setHex( color )
    }

    setBorderColor( color ) {
        this.border.material.color.setHex( color ) 
    }
    
    setAttachmentPointColor( color ) {
        this.attachmentPoint.material.color.setHex( color )
    }

    attach( position, rotation ) {
        const newRotation = new THREE.Vector3().copy( rotation )
        newRotation.y += Math.PI
        newRotation.z *= -1
        this.transform( position, newRotation )
    }

    detach() {
        this.previousRotation = undefined
    }

    transform( position, rotation ) {

        this.box.position.set( position.x, position.y, position.z )
        this.box.rotation.set( rotation.x, rotation.y, rotation.z )

        // Update bounding box
        this.boundingBox.setFromObject( this.box )
        this.attachmentPointBound.copy( this.attachmentPoint.geometry.boundingSphere )
            .applyMatrix4( this.attachmentPoint.matrixWorld )

        
        this.orientation.copy( TargetBox.upVector ).applyQuaternion( this.box.quaternion )
        this.orientation.normalize()
        this.arrowHelper.setDirection( this.orientation )
    }

    setPosition( position ) {
        this.transform( position, this.box.rotation )
    }

    setRotation( rotation ) {
        this.transform( this.box.position, rotation )
    }

    showMesh() {
        this.mesh.visible = true
    }

    hideMesh() {
        this.mesh.visible = false
    }

    showBorder() {
        this.border.visible = true
    }

    hideBorder() {
        this.border.visible = false
    }

    showAttachmentPoint() {
        this.scene.add(this.attachmentPoint)
        this.boundingBox.setFromObject( this.box )
        
    }

    hideAttachmentPoint() {
        this.attachmentPoint.removeFromParent()
        this.boundingBox.setFromObject( this.box )
    }
}

function getCornersOfCube( min, max ) {
    const startingPoints = [ min, max ]
    let points = []
    const axes = [ "x", "y", "z" ]
    for(let i = 0; i < 2; i++) {
        let j = (i + 1) % 2
        let p = startingPoints[i]
        let arr = [ p.x, p.y, p.z ]
        const point = new THREE.Vector3().fromArray( arr )
        points.push(point)
        
        for(let k = 0; k < 3; k++) {
            arr[k] = startingPoints[j][ axes[k] ]
            const point = new THREE.Vector3().fromArray( arr )
            points.push(point)
            arr = [ p.x, p.y, p.z ]
        }
    }

    points = [ 
        new THREE.Vector3( min.x, min.y, min.z ), // 1
        new THREE.Vector3( max.x, min.y, min.z ), // 2
        new THREE.Vector3( max.x, max.y, min.z ), // 3
        new THREE.Vector3( min.x, max.y, min.z ), // 4
        new THREE.Vector3( min.x, min.y, min.z ), // 1

        new THREE.Vector3( min.x, min.y, max.z ), // 5
        new THREE.Vector3( max.x, min.y, max.z ), // 6
        new THREE.Vector3( max.x, max.y, max.z ), // 7
        new THREE.Vector3( min.x, max.y, max.z ), // 8
        new THREE.Vector3( min.x, min.y, max.z ), // 5

        new THREE.Vector3( max.x, min.y, max.z ), // 6
        new THREE.Vector3( max.x, min.y, min.z ), // 2
        new THREE.Vector3( max.x, max.y, min.z ), // 3
        new THREE.Vector3( max.x, max.y, max.z ), // 7
        new THREE.Vector3( min.x, max.y, max.z ), // 8
        new THREE.Vector3( min.x, max.y, min.z ), // 4

    ]

    return points
}