/**
 * AE Element Vault - Project & Composition Scanner Engine
 * Modular ExtendScript ES3 Module
 */

(function() {
    if (typeof ElementVault === "undefined") {
        ElementVault = {};
    }

    /**
     * Extracts full structural metadata from an individual CompItem
     * @param {CompItem} comp
     * @returns {Object}
     */
    ElementVault.extractCompMetadata = function(comp) {
        if (!comp || !(comp instanceof CompItem)) {
            return null;
        }

        // Check if any layer in composition has active audio
        var hasAudio = false;
        try {
            for (var l = 1; l <= comp.numLayers; l++) {
                var lyr = comp.layer(l);
                if (lyr.hasAudio && lyr.audioEnabled) {
                    hasAudio = true;
                    break;
                }
            }
        } catch (audioErr) {
            hasAudio = false;
        }

        // Check if composition is nested as a precomp in other compositions
        var usedInOtherComps = false;
        try {
            if (comp.usedIn && comp.usedIn.length > 0) {
                usedInOtherComps = true;
            }
        } catch (usedErr) {
            usedInOtherComps = false;
        }

        return {
            id: comp.id,
            name: comp.name,
            width: Math.round(comp.width),
            height: Math.round(comp.height),
            duration: Math.round(comp.duration * 1000) / 1000,
            frameRate: Math.round(comp.frameRate * 100) / 100,
            numLayers: comp.numLayers,
            hasAudio: hasAudio,
            dropFrame: Boolean(comp.dropFrame),
            usedInOtherComps: usedInOtherComps
        };
    };

    /**
     * Scans currently open After Effects project and returns all compositions
     * @returns {string} Serialized JSON response
     */
    ElementVault.scanCurrentProject = function() {
        try {
            if (!app.project || !app.project.items) {
                return ElementVault.formatError("No active project open in After Effects.");
            }

            var proj = app.project;
            var projName = (proj.file && proj.file.name) ? proj.file.name : "Untitled Project";
            var projPath = (proj.file && proj.file.fsName) ? proj.file.fsName : "";
            var compositions = [];

            // Traverse project items (1-indexed in After Effects ExtendScript DOM)
            for (var i = 1; i <= proj.numItems; i++) {
                var item = proj.item(i);
                if (item && item instanceof CompItem) {
                    var meta = ElementVault.extractCompMetadata(item);
                    if (meta) {
                        compositions.push(meta);
                    }
                }
            }

            return ElementVault.formatSuccess({
                projectName: projName,
                projectPath: projPath,
                compCount: compositions.length,
                compositions: compositions
            });
        } catch (e) {
            return ElementVault.formatError("Error scanning current project: " + e.toString());
        }
    };

    /**
     * Safely inspects an external .aep file on disk without destroying active project state
     * @param {string} filePath Absolute filesystem path to .aep file
     * @returns {string} Serialized JSON response
     */
    ElementVault.scanAepFile = function(filePath) {
        try {
            if (!filePath || filePath.length === 0) {
                return ElementVault.formatError("A valid .aep file path is required.");
            }

            var targetFile = new File(filePath);
            if (!targetFile.exists) {
                return ElementVault.formatError("File does not exist: " + filePath);
            }

            if (!app.project) {
                return ElementVault.formatError("No active project environment to process import.");
            }

            app.beginUndoGroup("Vault: Temporary AEP Scan");
            var io = new ImportOptions(targetFile);
            var importedItem = app.project.importFile(io);
            var compositions = [];

            // Recursive helper for FolderItem items
            function scanFolderItem(folder) {
                for (var j = 1; j <= folder.numItems; j++) {
                    var cur = folder.item(j);
                    if (cur instanceof CompItem) {
                        var m = ElementVault.extractCompMetadata(cur);
                        if (m) compositions.push(m);
                    } else if (cur instanceof FolderItem) {
                        scanFolderItem(cur);
                    }
                }
            }

            if (importedItem instanceof CompItem) {
                var singleMeta = ElementVault.extractCompMetadata(importedItem);
                if (singleMeta) compositions.push(singleMeta);
            } else if (importedItem instanceof FolderItem) {
                scanFolderItem(importedItem);
            }

            // Clean up: remove the temporary imported item so user project remains pristine
            if (importedItem) {
                importedItem.remove();
            }
            app.endUndoGroup();

            return ElementVault.formatSuccess({
                projectName: targetFile.name,
                projectPath: targetFile.fsName,
                compCount: compositions.length,
                compositions: compositions
            });
        } catch (e) {
            return ElementVault.formatError("Failed to scan AEP file: " + e.toString());
        }
    };
})();
