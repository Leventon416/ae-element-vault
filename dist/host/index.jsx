/**
 * AE Element Vault - ExtendScript Host Script
 * Executed in Adobe After Effects ExtendScript engine (ECMAScript 3).
 */

var ElementVault = (function() {
    var self = {};

    /**
     * ECMAScript 3 JSON Fallback Serializer
     */
    self.stringify = function(obj) {
        if (typeof JSON !== "undefined" && JSON.stringify) {
            return JSON.stringify(obj);
        }
        var t = typeof obj;
        if (t !== "object" || obj === null) {
            if (t === "string") return '"' + obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
            return String(obj);
        } else {
            var json = [];
            var isArr = (obj && obj.constructor === Array);
            for (var n in obj) {
                if (obj.hasOwnProperty(n)) {
                    var v = obj[n];
                    var vt = typeof v;
                    if (vt === "string") {
                        v = '"' + v.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
                    } else if (vt === "object" && v !== null) {
                        v = self.stringify(v);
                    }
                    json.push((isArr ? "" : '"' + n + '":') + String(v));
                }
            }
            return (isArr ? "[" : "{") + String(json) + (isArr ? "]" : "}");
        }
    };

    /**
     * Standardized Success Response Serializer
     * Returns: { "success": true, "data": ... }
     */
    self.formatSuccess = function(data) {
        return self.stringify({
            success: true,
            data: data
        });
    };

    /**
     * Standardized Error Response Serializer
     * Returns: { "success": false, "error": ... }
     */
    self.formatError = function(errorMsg) {
        return self.stringify({
            success: false,
            error: String(errorMsg)
        });
    };

    /**
     * ElementVault.ping()
     * Returns After Effects version, application name, and active project state.
     */
    self.ping = function() {
        try {
            var hasProject = (app.project !== null && typeof app.project !== "undefined");
            var projectName = null;

            if (hasProject) {
                if (app.project.file) {
                    projectName = app.project.file.name;
                } else {
                    projectName = "Untitled Project";
                }
            }

            return self.formatSuccess({
                appName: app.appName || "Adobe After Effects",
                version: app.version || "Unknown",
                hasActiveProject: hasProject,
                projectName: projectName,
                os: $.os,
                locale: $.locale
            });
        } catch (e) {
            return self.formatError("Failed to ping After Effects: " + e.toString());
        }
    };

    /**
     * Returns metadata for active composition
     */
    self.getActiveComp = function() {
        try {
            var comp = app.project ? app.project.activeItem : null;
            if (!comp || !(comp instanceof CompItem)) {
                return self.formatError("No active composition found. Please open or select a composition in After Effects.");
            }

            var selCount = comp.selectedLayers.length;
            var selNames = [];
            for (var i = 0; i < selCount; i++) {
                selNames.push(comp.selectedLayers[i].name);
            }

            return self.formatSuccess({
                id: comp.id,
                name: comp.name,
                width: comp.width,
                height: comp.height,
                pixelAspect: comp.pixelAspect,
                frameRate: comp.frameRate,
                duration: comp.duration,
                time: comp.time,
                numLayers: comp.numLayers,
                selectedLayersCount: selCount,
                selectedLayers: selNames
            });
        } catch (e) {
            return self.formatError("Error getting active comp: " + e.toString());
        }
    };

    /**
     * Creates an Adjustment Layer in the active composition
     */
    self.createAdjustmentLayer = function(layerName) {
        try {
            var comp = app.project ? app.project.activeItem : null;
            if (!comp || !(comp instanceof CompItem)) {
                return self.formatError("Open a composition first.");
            }

            app.beginUndoGroup("Vault: Create Adjustment Layer");
            var adj = comp.layers.addSolid([1, 1, 1], layerName || "Adjustment Layer", comp.width, comp.height, comp.pixelAspect);
            adj.adjustmentLayer = true;
            app.endUndoGroup();

            return self.formatSuccess({
                layerIndex: adj.index,
                name: adj.name
            });
        } catch (e) {
            return self.formatError("Error creating adjustment layer: " + e.toString());
        }
    };

    /**
     * Creates a Null Controller in the active composition
     */
    self.createNullController = function(layerName) {
        try {
            var comp = app.project ? app.project.activeItem : null;
            if (!comp || !(comp instanceof CompItem)) {
                return self.formatError("Open a composition first.");
            }

            app.beginUndoGroup("Vault: Create Null Controller");
            var nullLayer = comp.layers.addNull();
            nullLayer.name = layerName || "Vault_Null_Controller";
            app.endUndoGroup();

            return self.formatSuccess({
                layerIndex: nullLayer.index,
                name: nullLayer.name
            });
        } catch (e) {
            return self.formatError("Error creating null controller: " + e.toString());
        }
    };

    /**
     * Adds a Kinetic Text Layer in the active composition
     */
    self.addTextLayer = function(textString) {
        try {
            var comp = app.project ? app.project.activeItem : null;
            if (!comp || !(comp instanceof CompItem)) {
                return self.formatError("Open a composition first.");
            }

            app.beginUndoGroup("Vault: Add Kinetic Text");
            var textLayer = comp.layers.addText(textString || "ELEMENT VAULT");
            var sourceText = textLayer.property("Source Text");
            var textDoc = sourceText.value;
            textDoc.fontSize = 80;
            textDoc.fillColor = [1, 1, 1];
            textDoc.strokeColor = [0.08, 0.45, 0.90];
            textDoc.strokeWidth = 2;
            textDoc.applyStroke = true;
            textDoc.font = "Arial-BoldMT";
            textDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
            sourceText.setValue(textDoc);

            textLayer.property("Position").setValue([comp.width / 2, comp.height / 2]);
            app.endUndoGroup();

            return self.formatSuccess({
                layerIndex: textLayer.index,
                name: textLayer.name
            });
        } catch (e) {
            return self.formatError("Error adding text layer: " + e.toString());
        }
    };

    /**
     * Applies a preset element into the active composition
     */
    self.applyElement = function(elementId, elementName) {
        try {
            var comp = app.project ? app.project.activeItem : null;
            if (!comp || !(comp instanceof CompItem)) {
                return self.formatError("Open a composition first.");
            }

            app.beginUndoGroup("Vault: Apply " + (elementName || elementId));

            if (elementId === "kinetic-title") {
                var tLayer = comp.layers.addText(elementName || "CINEMATIC TITLE");
                var src = tLayer.property("Source Text");
                var doc = src.value;
                doc.fontSize = 92;
                doc.fillColor = [1, 0.85, 0.2];
                doc.justification = ParagraphJustification.CENTER_JUSTIFY;
                src.setValue(doc);
                tLayer.property("Position").setValue([comp.width / 2, comp.height / 2]);
                var scaleProp = tLayer.property("Scale");
                scaleProp.setValueAtTime(comp.time, [80, 80, 100]);
                scaleProp.setValueAtTime(comp.time + 1.2, [100, 100, 100]);
            } else if (elementId === "vignette-fx") {
                var solid = comp.layers.addSolid([0, 0, 0], "Vault_Vignette", comp.width, comp.height, comp.pixelAspect);
                solid.adjustmentLayer = false;
                var mask = solid.Masks.addProperty("Mask");
                mask.maskMode = MaskMode.SUBTRACT;
                mask.maskFeather.setValue([250, 250]);
            } else if (elementId === "glitch-layer") {
                var adjLayer = comp.layers.addSolid([1, 1, 1], "Vault_Glitch_FX", comp.width, comp.height, comp.pixelAspect);
                adjLayer.adjustmentLayer = true;
            } else if (elementId === "null-rig") {
                var n = comp.layers.addNull();
                n.name = "Vault_Camera_Rig";
            } else {
                comp.layers.addSolid([0.08, 0.45, 0.90], "Vault_" + (elementName || "Element"), comp.width, comp.height, comp.pixelAspect);
            }

            app.endUndoGroup();

            return self.formatSuccess({
                message: "Applied element '" + elementName + "' successfully.",
                elementId: elementId
            });
        } catch (e) {
            return self.formatError("Error applying element: " + e.toString());
        }
    };

    /**
     * Centers Anchor Point of selected layers
     */
    self.centerAnchorPoint = function() {
        try {
            var comp = app.project ? app.project.activeItem : null;
            if (!comp || !(comp instanceof CompItem)) {
                return self.formatError("No active composition.");
            }
            var layers = comp.selectedLayers;
            if (layers.length === 0) {
                return self.formatError("Select at least one layer.");
            }

            app.beginUndoGroup("Vault: Center Anchor Point");
            for (var i = 0; i < layers.length; i++) {
                var lyr = layers[i];
                if (lyr.sourceRectAtTime) {
                    var rect = lyr.sourceRectAtTime(comp.time, false);
                    var newAnchor = [rect.left + rect.width / 2, rect.top + rect.height / 2];
                    var curAnchor = lyr.property("Anchor Point").value;
                    var curPos = lyr.property("Position").value;
                    lyr.property("Anchor Point").setValue(newAnchor);
                    lyr.property("Position").setValue([
                        curPos[0] + (newAnchor[0] - curAnchor[0]),
                        curPos[1] + (newAnchor[1] - curAnchor[1])
                    ]);
                }
            }
            app.endUndoGroup();

            return self.formatSuccess({
                modifiedCount: layers.length
            });
        } catch (e) {
            return self.formatError("Error centering anchor point: " + e.toString());
        }
    };

    return self;
})();

// Backward compatibility alias
var $AE_VAULT = ElementVault;
$AE_VAULT.pingHost = ElementVault.ping;

// Include modular scanner engine
//@include "scanner.jsx"

// Include modular dependency reducer engine
//@include "reducer.jsx"

// Include modular thumbnail capture engine
//@include "thumbnail.jsx"

// Include modular text layer inspector engine
//@include "textInspector.jsx"

// Include modular expression controls inspector engine
//@include "controlsInspector.jsx"

// Include modular essential graphics inspector engine
//@include "essentialProps.jsx"

// Include modular export engine
//@include "exporter.jsx"

// Include modular preview renderer engine
//@include "previewRenderer.jsx"

// Include modular timeline inserter engine
//@include "inserter.jsx"

// Include modular parameter synchronization engine
//@include "syncEngine.jsx"



