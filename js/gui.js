import initialControls from "../config/controls.json" assert { type: "json" }
import mapping from "../config/mapping.json" assert { type: "json" }
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// Make a deep copy of the control config so we can reset controls later
var allControlLayers = JSON.parse(JSON.stringify(initialControls));
var editControls = JSON.parse(JSON.stringify(allControlLayers[ "Controls Layer 1" ]))
export var controls = JSON.parse(JSON.stringify(allControlLayers[ "Controls Layer 1" ]))

let layer = {
    current: 1,
    edit: 1
}

const layerInfo = document.getElementById("layer-info")

/* CREATE GUI */
const gui = new GUI({width: 400})
gui.close()

// Create dropdown for switching layers
const layerDropdown = gui.add( layer, "edit", {"Layer 1": 1, "Layer 2": 2}).name("Edit Layer")
layerDropdown.onChange(function () {
    setEditLayer( layer.edit )
    updateGUI()
})

const guiFolders = addFolders( editControls, gui)
createControls()

// META!! controls for the controls
let controlControls = {
    "Download Controls Config": downloadControlsConfig,
    "Upload Controls Config": uploadControlsConfig,
    "Reset Controls": resetControls
}
gui.add(controlControls, "Download Controls Config")
gui.add(controlControls, "Upload Controls Config")
gui.add(controlControls, "Reset Controls")

gui.onChange(event => {
    const controllerName = event.controller._name

    // Don't update layer when layer dropdown switched, otherwise one layer is copied to other
    if(controllerName !== layerDropdown._name) {
        updateControls(allControlLayers[ "Controls Layer " + layer.edit ], editControls)
        
        // if we are editing the current layer, update the controls
        if(layer.current === layer.edit) {
            updateControls(controls, allControlLayers[ "Controls Layer " + layer.current])
        }
    }
})



/* GUI CREATION FUNCTIONS */

function createControls() {
    createIncrementalControls()
    createAxisControls()
}

// Create all the incremental controls
function createIncrementalControls() {
    // Get list of buttons, add option for no assignment
    const buttonList = getButtonNames( mapping )
    buttonList.unshift("none")

    // Create end effector incremental controls
    addControlsToGUI( 
        guiFolders["End Effector Controls"]["Incremental Controls"].folder,
        editControls["End Effector Controls"]["Incremental Controls"],
        buttonList
    )

    // Create joint level incremental controls
    addControlsToGUI( 
        guiFolders["Joint Controls"]["Incremental Controls"].folder,
        editControls["Joint Controls"]["Incremental Controls"],
        buttonList
    )
}

function createAxisControls() {
    // Get list of axes, add option for no assignment
    const axisList = getAxisNames( mapping )    
    axisList.unshift("none")

    // End effector axis controls
    addControlsToGUI(
        guiFolders["End Effector Controls"]["Axis Controls"].folder,
        editControls["End Effector Controls"]["Axis Controls"],
        axisList
    )

    // Joint axis controls
    addControlsToGUI(
        guiFolders["Joint Controls"]["Angle Controls"].folder,
        editControls["Joint Controls"]["Angle Controls"],
        axisList
    )
}


/* HELPER FUNCTIONS */

// Recursively add all subobjects in an object as gui folders
// Returns an object containing all the gui folder objects
function addFolders( object, gui ){
    const folders = {}
    for(let folderName in object) {
        const folder = object[ folderName ]
        if( typeof(folder) !== "object" ) continue

        const guiFolder = gui.addFolder( folderName )
        folders[ folderName ] = addFolders( folder, guiFolder )
        folders[ folderName ][ "folder" ] = guiFolder

        guiFolder.close()
    }
    
    return folders
}

// Returns the names of all buttons, including rotary encoder buttons
function getButtonNames( mapping ) {
    let buttonNames = Object.keys(mapping["Buttons"])

    for(let rotaryEncoderName in mapping["Rotary Encoders"]) {
        const rotaryEncoderMapping = mapping["Rotary Encoders"][rotaryEncoderName]

        // for(let buttonName in rotaryEncoderMapping["Buttons"]) {
        //     const name = rotaryEncoderName + " " + buttonName
        //     buttonNames.push(name)
        // }

        const name = rotaryEncoderName + " button"
        buttonNames.push(name)
    }

    return buttonNames
}

function getAxisNames( mapping ) {
    let axisNames = Object.keys(mapping["Rotary Encoders"])
    axisNames = axisNames.concat(Object.keys(mapping["Potentiometers"]))
    
    return axisNames
}

/*
Adds all controls from the controls object to the gui folder
Allows user to select device from the device names pass in
Any controls that are not defined by strings (controls that are not devices)
are not created with a dropdown
*/
function addControlsToGUI( guiFolder, controls, deviceNames ) {
    for(let controlName in controls) {
        if(typeof(controls[controlName]) !== "string") {
            guiFolder.add( controls, controlName )
            continue
        }

        guiFolder.add( controls, controlName, deviceNames )
    }
}

// Download the given json object
function downloadControlsConfig() {
    const filename = "controls.json"
    const jsonStr = JSON.stringify(allControlLayers)

    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonStr))
    element.setAttribute('download', filename)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
}

// Prompt user to upload a controls config and set the controls to it
function uploadControlsConfig() {
    var input = document.createElement('input');
    input.type = 'file';

    input.onchange = e => { 

    // getting a hold of the file reference
    var file = e.target.files[0]; 

    // setting up the reader
    var reader = new FileReader();
    reader.readAsText(file,'UTF-8');

    // here we tell the reader what to do when it's done reading...
    reader.onload = readerEvent => {
        var content = readerEvent.target.result; // this is the content!
        const newControls = JSON.parse(content)
        updateControls( allControlLayers, newControls )
        updateActiveLayers()
        updateGUI()
    }

    }

    input.click();
}

function resetControls() {
    updateControls( allControlLayers, initialControls )
    updateActiveLayers()
    updateGUI()
}


// Updates display of all GUI elements
function updateGUI() {
    const guiControllers = gui.controllersRecursive()
    for( let controller of guiControllers ) {
        controller.updateDisplay()
    }
}

// Have to update controls recursively so that GUI updates
function updateControls(oldControls, newControls) {
    for(let controlName in oldControls) {
        if(typeof(oldControls[controlName]) === "object") {
            updateControls( oldControls[controlName], newControls[controlName] )
            continue
        }

        if(oldControls[controlName] !== newControls[controlName]) {
            oldControls[controlName] = newControls[controlName]
        }
    }
}

function updateActiveLayers() {
    updateControls( editControls, allControlLayers[ "Controls Layer " + layer.edit ])
    updateControls( controls, allControlLayers[ "Controls Layer " + layer.current ])
}

function setEditLayer( layerNum ) {
    console.log("Editing Layer " + layerNum)
    layer.edit = layerNum
    updateControls( editControls, allControlLayers[ "Controls Layer " + layerNum ])
    updateGUI()
}

export function setCurrentLayer( layerNum ) {
    console.log("Using Layer " + layerNum)
    layer.current = layerNum
    layerInfo.innerHTML = "Layer " + layerNum
    updateControls( controls, allControlLayers[ "Controls Layer " + layerNum ] )
}