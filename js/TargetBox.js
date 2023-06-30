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

    constructor( position, rotation, scene, 
                 scale = {x: 1, y: 1, z: 1}, 
                 color = TargetBox.colors.blue ) 
    {

        // Group to hold each part of the box
        this.box = new THREE.Group()

        // Create box
        this.geometry = new THREE.BoxGeometry( scale.x, scale.y, scale.z )
        this.material = new THREE.MeshBasicMaterial( { color: color} )
        this.mesh = new THREE.Mesh( this.geometry, this.material )
        this.mesh.geometry.translate( 0, 0, -(scale.z/2))
        this.box.add(this.mesh)

        // Create bounding box
        this.boundingBox = new THREE.Box3().setFromObject( this.mesh )
        this.boundingBoxHelper = new THREE.Box3Helper( this.boundingBox, 0xffff00 )
        // scene.add( this.boundingBoxHelper )

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
        scene.add(this.box)

        // Position in scene
        this.setPosition(position)
        this.setRotation(rotation)

        console.log(this.attachmentPointBound)

        this.attachedRotation

    }

    setColor( color ) {
        this.material.color.setHex( color )
    }

    setBorderColor( color ) {
        this.border.material.color.setHex( color ) 
    }

    attach( position, rotation ) {
        if(this.attachedRotation === undefined) this.attachedRotation = rotation

        const diff = new THREE.Vector3().copy( this.attachedRotation )
        diff.sub( rotation )

        const newRotation = new THREE.Vector3(
            this.box.rotation.x - diff.x,
            this.box.rotation.y + diff.y,
            this.box.rotation.z + diff.z
        )

        const euler = new THREE.Euler().setFromVector3( newRotation, "XYZ" )
        this.box.rotation.copy(euler)
        this.setPosition( position )

        this.attachedRotation = rotation
    }

    transform( position, rotation ) {

        this.box.position.set( position.x, position.y, position.z )
        this.box.rotation.set( rotation.x, rotation.y, rotation.z )

        this.boundingBox.setFromObject( this.box )
        this.attachmentPointBound.copy( this.attachmentPoint.geometry.boundingSphere )
            .applyMatrix4( this.attachmentPoint.matrixWorld )
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
        this.attachmentPoint.visible = true
    }

    hideAttachmentPoint() {
        this.attachmentPoint.visible = false
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