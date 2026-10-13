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
     * Sanitizes a string for safe filesystem filename matching / comparison
     * Replaces Unicode symbols (such as '↓', '→', '↑', '←') with clean ascii representations ('down', 'right', 'up', 'left') or underscores to prevent corrupt Windows file paths.
     * @param {string} str
     * @returns {string}
     */
    function sanitizeFileName(str) {
        if (!str) return "unnamed_comp";
        var clean = String(str);
        clean = clean.replace(/[\u2193\u21E3\u2B07\u21E9]|↓/g, "_down_");
        clean = clean.replace(/[\u2191\u21E1\u2B06\u21E7]|↑/g, "_up_");
        clean = clean.replace(/[\u2192\u21E2\u279C\u27A1\u21E8]|→/g, "_right_");
        clean = clean.replace(/[\u2190\u21E0\u2B05\u21E6]|←/g, "_left_");
        clean = clean.replace(/[\u2197]|↗/g, "_up_right_");
        clean = clean.replace(/[\u2198]|↘/g, "_down_right_");
        clean = clean.replace(/[\u2199]|↙/g, "_down_left_");
        clean = clean.replace(/[\u2196]|↖/g, "_up_left_");
        clean = clean.replace(/[\u2194]|↔/g, "_left_right_");
        clean = clean.replace(/[\u2195]|↕/g, "_up_down_");
        clean = clean.replace(/["'“”‘’\x60]/g, "_");
        clean = clean.replace(/[^a-zA-Z0-9_\-]/g, "_");
        clean = clean.replace(/_+/g, "_");
        clean = clean.replace(/^_+|_+$/g, "");
        return clean.length > 0 ? clean : "comp";
    }

    /**
     * Safely compares composition names handling Unicode arrows, quotes, and whitespace
     * @param {string} a
     * @param {string} b
     * @returns {boolean}
     */
    function isCompNameMatch(a, b) {
        if (!a || !b) return false;
        if (a === b) return true;

        var trimA = String(a).replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
        var trimB = String(b).replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
        if (trimA === trimB) return true;

        if (trimA.toLowerCase() === trimB.toLowerCase()) return true;

        try {
            if (decodeURIComponent(trimA) === trimB || trimA === decodeURIComponent(trimB)) {
                return true;
            }
        } catch (eDec) {}

        if (sanitizeFileName(trimA) === sanitizeFileName(trimB)) {
            return true;
        }

        return false;
    }

    /**
     * Safely checks if an item matches compId (numeric or 'element-{id}-{ts}')
     * @param {CompItem} item
     * @param {number|string} targetId
     * @returns {boolean}
     */
    function isCompIdMatch(item, targetId) {
        if (!item || targetId === null || targetId === undefined || targetId === "") return false;
        if (item.id == targetId) return true;

        var strId = String(targetId);
        var match = strId.match(/element-(\d+)-/);
        if (match && match[1] && item.id == parseInt(match[1], 10)) {
            return true;
        }
        var parsed = parseInt(strId, 10);
        if (!isNaN(parsed) && item.id === parsed) {
            return true;
        }
        return false;
    }

    /**
     * Safely checks if a file path exists on disk, handling wrapping quotes and URI encoding
     * @param {string} rawPath
     * @returns {File|null}
     */
    function resolveExistingFile(rawPath) {
        if (!rawPath || typeof rawPath !== "string") return null;
        var p = rawPath.replace(/^["']|["']$/g, "");
        if (!p) return null;

        var f = new File(p);
        if (f.exists) return f;

        try {
            var decoded = File.decode(p);
            if (decoded && decoded !== p) {
                var fDec = new File(decoded);
                if (fDec.exists) return fDec;
            }
        } catch (eDec) {}

        return null;
    }

    /**
     * Finds or creates the "Element Vault Imports" folder in app.project
     * @returns {FolderItem}
     */
    function getOrCreateImportsFolder() {
        if (!app.project) return null;
        for (var i = 1; i <= app.project.items.length; i++) {
            var item = app.project.items[i];
            if (item instanceof FolderItem && item.name === "Element Vault Imports") {
                return item;
            }
        }
        return app.project.items.addFolder("Element Vault Imports");
    }

    /**
     * Recursively searches an imported FolderItem for target composition
     * @param {FolderItem} folder
     * @param {string} targetName
     * @param {number|string} targetId
     * @returns {CompItem|null}
     */
    function findCompInImportedFolder(folder, targetName, targetId) {
        if (!folder || !(folder instanceof FolderItem)) return null;

        var candidateComps = [];

        function collectComps(f) {
            for (var idx = 1; idx <= f.numItems; idx++) {
                var it = f.item(idx);
                if (it instanceof CompItem) {
                    candidateComps.push(it);
                } else if (it instanceof FolderItem) {
                    collectComps(it);
                }
            }
        }

        collectComps(folder);

        // 1. Match by name
        if (targetName) {
            for (var i = 0; i < candidateComps.length; i++) {
                if (isCompNameMatch(candidateComps[i].name, targetName)) {
                    return candidateComps[i];
                }
            }
        }

        // 2. Match by ID
        if (targetId) {
            for (var j = 0; j < candidateComps.length; j++) {
                if (isCompIdMatch(candidateComps[j], targetId)) {
                    return candidateComps[j];
                }
            }
        }

        // 3. Prioritize comp with usedIn.length === 0 (root comp)
        for (var k = 0; k < candidateComps.length; k++) {
            if (candidateComps[k].usedIn && candidateComps[k].usedIn.length === 0) {
                return candidateComps[k];
            }
        }

        // 4. Fallback to first comp
        if (candidateComps.length > 0) {
            return candidateComps[0];
        }

        return null;
    }

    /**
     * Imports an element and inserts it into the active composition at the CTI with 3-tier fallback.
     *
     * Tier 1: Check if matching comp already exists in app.project. If found, add directly to activeComp.layers.
     * Tier 2: If aepPath exists on disk, import standalone .aep into "Element Vault Imports" and insert comp.
     * Tier 3: If aepPath missing, but options.sourceProjectPath / sourceProject exists on disk, import master .aep,
     *         find the target comp inside imported folder, and insert it into activeComp.
     *
     * @param {string} aepPath Path to target .aep file on disk
     * @param {Object} [options] Insertion options: { elementName, compId, sourceProjectPath, sourceProject, targetTime, customParams, ... }
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
        var compId = options.compId;

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

            // 2. Undo Group Encapsulation
            app.beginUndoGroup("Element Vault - Insert " + elementName);

            var masterComp = null;
            var insertionTier = 0;

            // Tier 1: Check if a composition matching options.elementName or options.compId already exists in app.project
            if (app.project && app.project.numItems > 0) {
                if (compId !== undefined && compId !== null && compId !== "") {
                    for (var i = 1; i <= app.project.numItems; i++) {
                        var item = app.project.item(i);
                        if (item && item instanceof CompItem && item !== activeComp) {
                            if (isCompIdMatch(item, compId)) {
                                masterComp = item;
                                insertionTier = 1;
                                break;
                            }
                        }
                    }
                }

                if (!masterComp && elementName) {
                    for (var n = 1; n <= app.project.numItems; n++) {
                        var itemN = app.project.item(n);
                        if (itemN && itemN instanceof CompItem && itemN !== activeComp) {
                            if (isCompNameMatch(itemN.name, elementName)) {
                                masterComp = itemN;
                                insertionTier = 1;
                                break;
                            }
                        }
                    }
                }
            }

            // Tier 2: If aepPath exists on disk (new File(aepPath).exists), import standalone .aep
            if (!masterComp && aepPath) {
                var assetFile = resolveExistingFile(aepPath);
                if (assetFile && assetFile.exists) {
                    var importsFolder = getOrCreateImportsFolder();
                    var importOptions = new ImportOptions(assetFile);
                    var importedItem = app.project.importFile(importOptions);

                    if (importedItem) {
                        if (importsFolder && importedItem.parentFolder !== importsFolder) {
                            try {
                                importedItem.parentFolder = importsFolder;
                            } catch (eParent) {}
                        }

                        if (importedItem instanceof CompItem) {
                            masterComp = importedItem;
                            insertionTier = 2;
                        } else if (importedItem instanceof FolderItem) {
                            masterComp = findCompInImportedFolder(importedItem, elementName, compId);
                            if (masterComp) {
                                insertionTier = 2;
                            }
                        }
                    }
                }
            }

            // Tier 3: If aepPath does not exist on disk, but options.sourceProjectPath or options.sourceProject is provided and exists on disk
            if (!masterComp) {
                var masterCandidatePath = options.sourceProjectPath || options.sourceProject;
                var masterFile = resolveExistingFile(masterCandidatePath);
                if (!masterFile && options.sourceProject && options.sourceProject !== masterCandidatePath) {
                    masterFile = resolveExistingFile(options.sourceProject);
                }
                if (!masterFile && options.sourceProjectPath && options.sourceProjectPath !== masterCandidatePath) {
                    masterFile = resolveExistingFile(options.sourceProjectPath);
                }

                if (masterFile && masterFile.exists) {
                    var importsFolderTier3 = getOrCreateImportsFolder();
                    var masterImportOptions = new ImportOptions(masterFile);
                    var importedMasterItem = app.project.importFile(masterImportOptions);

                    if (importedMasterItem) {
                        if (importsFolderTier3 && importedMasterItem.parentFolder !== importsFolderTier3) {
                            try {
                                importedMasterItem.parentFolder = importsFolderTier3;
                            } catch (eParent3) {}
                        }

                        if (importedMasterItem instanceof CompItem) {
                            masterComp = importedMasterItem;
                            insertionTier = 3;
                        } else if (importedMasterItem instanceof FolderItem) {
                            masterComp = findCompInImportedFolder(importedMasterItem, elementName, compId);
                            if (masterComp) {
                                insertionTier = 3;
                            }
                        }
                    }
                }
            }

            if (!masterComp) {
                app.endUndoGroup();
                var notFoundMsg = "Could not locate composition '" + elementName + "' in project or on disk.";
                if (aepPath) {
                    notFoundMsg += " Standalone AEP: " + aepPath;
                }
                if (options.sourceProjectPath || options.sourceProject) {
                    notFoundMsg += " Master Project: " + (options.sourceProjectPath || options.sourceProject);
                }
                if (typeof ElementVault.formatError === "function") {
                    return ElementVault.formatError(notFoundMsg);
                }
                return { success: false, error: notFoundMsg };
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
                posX = activeWidth / 2;
                posY = activeHeight * 0.8;
            } else if (positionMode === "top-third" || positionMode === "top-banner") {
                posX = activeWidth / 2;
                posY = activeHeight * 0.25;
            } else {
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
                                            if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
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
                fpsMatched: fpsMatched,
                tier: insertionTier
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
