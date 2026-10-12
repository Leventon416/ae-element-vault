/**
 * AE Element Vault - Timeline Insertion Engine
 * Executed in Adobe After Effects ExtendScript engine (ECMAScript 3).
 * Imports isolated .aep assets into the user's active After Effects composition
 * and places them at the current playhead with single-click undo grouping.
 */

(function() {
    if (typeof ElementVault === "undefined") {
        ElementVault = {};
    }

    /**
     * Imports an isolated .aep asset and inserts it into the active composition at the CTI.
     *
     * @param {string} aepPath Path to target .aep file on disk
     * @param {Object} [options] Insertion options: { elementName, targetTime, customParams }
     * @returns {string|Object} Success or error response
     */
    ElementVault.insertElementIntoActiveComp = function(aepPath, options) {
        if (!options) options = {};
        if (typeof options === "string") {
            try {
                if (typeof JSON !== "undefined" && JSON.parse) {
                    options = JSON.parse(options);
                }
            } catch (parseErr) {
                options = {};
            }
        }
        var elementName = options.elementName || "Element";

        try {
            // 1. Active Composition Validation
            var activeComp = app.project ? app.project.activeItem : null;
            if (!activeComp || !(activeComp instanceof CompItem)) {
                var noCompMsg = "Please open a composition in the timeline to insert elements.";
                if (typeof ElementVault.formatError === "function") {
                    return ElementVault.formatError(noCompMsg);
                }
                return { success: false, error: noCompMsg };
            }

            // 2. Asset File Validation
            if (!aepPath) {
                var noPathMsg = "No asset file path provided for insertion.";
                if (typeof ElementVault.formatError === "function") {
                    return ElementVault.formatError(noPathMsg);
                }
                return { success: false, error: noPathMsg };
            }

            var assetFile = new File(aepPath);
            if (!assetFile.exists) {
                var missingFileMsg = "Target asset file does not exist on disk: " + aepPath;
                if (typeof ElementVault.formatError === "function") {
                    return ElementVault.formatError(missingFileMsg);
                }
                return { success: false, error: missingFileMsg };
            }

            // 3. Undo Group Encapsulation
            app.beginUndoGroup("Element Vault - Insert " + elementName);

            // 4. Project Bin Organization
            var importsFolder = null;
            for (var i = 1; i <= app.project.items.length; i++) {
                if (app.project.items[i] instanceof FolderItem && app.project.items[i].name === "Element Vault Imports") {
                    importsFolder = app.project.items[i];
                    break;
                }
            }
            if (!importsFolder) {
                importsFolder = app.project.items.addFolder("Element Vault Imports");
            }

            // 5. Import Mini-AEP File
            var importOptions = new ImportOptions(assetFile);
            var importedFolder = app.project.importFile(importOptions);

            if (!importedFolder) {
                app.endUndoGroup();
                var importFailedMsg = "Failed to import asset file into project.";
                if (typeof ElementVault.formatError === "function") {
                    return ElementVault.formatError(importFailedMsg);
                }
                return { success: false, error: importFailedMsg };
            }

            // Move importedFolder into importsFolder to keep Project panel organized
            if (importsFolder && importedFolder.parentFolder !== importsFolder) {
                try {
                    importedFolder.parentFolder = importsFolder;
                } catch (eParent) {}
            }

            // 6. Locate the Master/Root Composition
            var masterComp = null;
            if (importedFolder instanceof CompItem) {
                masterComp = importedFolder;
            } else if (importedFolder instanceof FolderItem) {
                var candidateComps = [];
                for (var j = 1; j <= importedFolder.numItems; j++) {
                    var item = importedFolder.item(j);
                    if (item instanceof CompItem) {
                        candidateComps.push(item);
                        // Prioritize comp with usedIn.length === 0
                        if (item.usedIn && item.usedIn.length === 0) {
                            masterComp = item;
                            break;
                        }
                    }
                }

                if (!masterComp && candidateComps.length > 0) {
                    // Try match by elementName
                    for (var k = 0; k < candidateComps.length; k++) {
                        if (candidateComps[k].name === elementName) {
                            masterComp = candidateComps[k];
                            break;
                        }
                    }
                    if (!masterComp) {
                        masterComp = candidateComps[0];
                    }
                }
            }

            if (!masterComp) {
                app.endUndoGroup();
                var noMasterMsg = "Could not find a master composition within the imported asset.";
                if (typeof ElementVault.formatError === "function") {
                    return ElementVault.formatError(noMasterMsg);
                }
                return { success: false, error: noMasterMsg };
            }

            // 7. Smart Retargeting, Timeline Placement & Alignment
            var newLayer = activeComp.layers.add(masterComp);

            // Align start time to the Current Time Indicator (CTI / playhead) or specified targetTime
            var targetTime = (typeof options.targetTime === "number") ? options.targetTime : activeComp.time;
            newLayer.startTime = targetTime;

            // Frame Rate Conformation
            var fpsMatched = false;
            var matchFps = (options.matchFps !== false);
            if (matchFps && masterComp.frameRate !== activeComp.frameRate) {
                try {
                    masterComp.frameRate = activeComp.frameRate;
                    fpsMatched = true;
                } catch (eFps) {}
            }

            // Read Dimensions & Calculate Smart Scaling
            var activeWidth = activeComp.width;
            var activeHeight = activeComp.height;
            var masterWidth = masterComp.width;
            var masterHeight = masterComp.height;

            var scaleMode = options.scaleMode || "auto";
            var scaleFactor = 100;

            if (masterWidth > 0 && masterHeight > 0) {
                if (scaleMode === "fit-width") {
                    scaleFactor = (activeWidth / masterWidth) * 100;
                } else if (scaleMode === "fill") {
                    scaleFactor = Math.max(activeWidth / masterWidth, activeHeight / masterHeight) * 100;
                } else if (scaleMode === "original") {
                    scaleFactor = 100;
                } else {
                    // "auto" (Default): Uniform Fit
                    scaleFactor = Math.min(activeWidth / masterWidth, activeHeight / masterHeight) * 100;
                }
            }

            if (newLayer.property("Scale")) {
                try {
                    newLayer.property("Scale").setValue([scaleFactor, scaleFactor]);
                } catch (scaleErr) {}
            }

            // Calculate Smart Positioning
            var positionMode = options.positionMode || "center";
            var posX = activeWidth / 2;
            var posY = activeHeight / 2;

            if (positionMode === "lower-third") {
                // Lower 20% safe margin
                posX = activeWidth / 2;
                posY = activeHeight * 0.8;
            } else if (positionMode === "top-third" || positionMode === "top-banner") {
                // Upper 25% safe margin
                posX = activeWidth / 2;
                posY = activeHeight * 0.25;
            } else {
                // "center"
                posX = activeWidth / 2;
                posY = activeHeight / 2;
            }

            if (newLayer.property("Position")) {
                try {
                    newLayer.property("Position").setValue([posX, posY]);
                } catch (posErr) {}
            }

            // Select the newly created layer so it is highlighted in the timeline
            for (var l = 1; l <= activeComp.numLayers; l++) {
                activeComp.layer(l).selected = false;
            }
            newLayer.selected = true;

            // Apply custom parameters if provided via sync engine
            if (options.customParams && typeof options.customParams === "object") {
                try {
                    if (typeof ElementVault.applyCustomParameters === "function") {
                        ElementVault.applyCustomParameters(newLayer, options.customParams, true);
                    } else {
                        var egProp = newLayer.property("ADBE Essential Properties") || newLayer.property("Essential Properties");
                        if (egProp) {
                            for (var paramId in options.customParams) {
                                if (options.customParams.hasOwnProperty(paramId)) {
                                    var val = options.customParams[paramId];
                                    for (var p = 1; p <= egProp.numProperties; p++) {
                                        var prop = egProp.property(p);
                                        if (prop.name === paramId) {
                                            if (typeof val === "string") {
                                                prop.setValue(val);
                                            } else if (typeof val === "number" || typeof val === "boolean") {
                                                prop.setValue(val);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (egAssignErr) {}
            }

            // 8. Close Undo Group & Return
            app.endUndoGroup();

            var resultPayload = {
                layerIndex: newLayer.index,
                layerName: newLayer.name,
                startTime: newLayer.startTime,
                compName: activeComp.name,
                compWidth: activeComp.width,
                compHeight: activeComp.height,
                compFps: activeComp.frameRate,
                scaleApplied: Math.round(scaleFactor * 100) / 100,
                positionApplied: [Math.round(posX * 10) / 10, Math.round(posY * 10) / 10],
                originalDimensions: [masterWidth, masterHeight],
                targetDimensions: [activeWidth, activeHeight],
                fpsMatched: fpsMatched
            };

            if (typeof ElementVault.formatSuccess === "function") {
                return ElementVault.formatSuccess(resultPayload);
            }

            return {
                success: true,
                data: resultPayload
            };

        } catch (err) {
            try {
                app.endUndoGroup();
            } catch (eUndo) {}

            var errStr = err.toString();
            if (typeof ElementVault.formatError === "function") {
                return ElementVault.formatError("Failed to insert element into active composition: " + errStr);
            }
            return {
                success: false,
                error: errStr
            };
        }
    };
})();
