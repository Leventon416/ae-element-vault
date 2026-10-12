/**
 * AE Element Vault - Composition Thumbnail Capture Engine
 * Modular ExtendScript ES3 Module
 */

(function() {
    if (typeof ElementVault === "undefined") {
        ElementVault = {};
    }

    /**
     * Sanitizes a string for safe filesystem filename usage
     * @param {string} str
     * @returns {string}
     */
    function sanitizeFileName(str) {
        if (!str) return "unnamed_comp";
        var clean = str.replace(/[^a-zA-Z0-9_\-]/g, "_");
        clean = clean.replace(/_+/g, "_");
        clean = clean.replace(/^_+|_+$/g, "");
        return clean.length > 0 ? clean : "comp";
    }

    /**
     * Finds a composition by ID in the active project
     * @param {number} compId
     * @returns {CompItem|null}
     */
    function findCompById(compId) {
        if (!app.project || !app.project.items) {
            return null;
        }
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item && item instanceof CompItem && item.id == compId) {
                return item;
            }
        }
        return null;
    }

    /**
     * Captures a visual PNG snapshot from a composition at a given or smart-calculated time
     *
     * @param {number} compId Target composition ID
     * @param {string} outputFolderPath Destination directory for PNG snapshot
     * @param {number} [timeInSeconds] Optional specific frame time in seconds
     * @returns {string} Serialized JSON response
     */
    ElementVault.captureCompThumbnail = function(compId, outputFolderPath, timeInSeconds) {
        try {
            if (!app.project) {
                return ElementVault.formatError("No active project open in After Effects.");
            }

            // 1. Locate target CompItem by compId
            var comp = findCompById(compId);
            if (!comp) {
                return ElementVault.formatError("Composition with ID " + compId + " not found.");
            }

            // 2. Smart Frame Timing Selection:
            // If timeInSeconds >= 0, use it. Otherwise, calculate the midpoint of the composition
            // because frame 0 of motion graphics is frequently empty or transparent.
            var captureTime = comp.duration / 2;
            if (typeof timeInSeconds !== "undefined" && timeInSeconds !== null && !isNaN(timeInSeconds) && timeInSeconds >= 0) {
                captureTime = Math.min(timeInSeconds, comp.duration);
            }

            // 3. Resolve output folder and sanitize file name
            var targetFolderPath = outputFolderPath;
            if (!targetFolderPath || targetFolderPath === "") {
                targetFolderPath = Folder.myDocuments.fsName + "/ElementVault/Library/previews";
            }
            var outputFolder = new Folder(targetFolderPath);
            if (!outputFolder.exists) {
                outputFolder.create();
            }

            var sanitizedName = sanitizeFileName(comp.name);
            var targetFile = new File(outputFolder.fsName + "/thumb_" + comp.id + "_" + sanitizedName + ".png");

            // 4. Capture frame using After Effects' native API
            comp.saveFrameToPng(captureTime, targetFile);

            // 5. Verify targetFile exists
            if (!targetFile.exists) {
                return ElementVault.formatError("saveFrameToPng failed to write file at: " + targetFile.fsName);
            }

            return ElementVault.formatSuccess({
                compId: comp.id,
                compName: comp.name,
                captureTime: captureTime,
                thumbnailPath: targetFile.fsName,
                fileName: targetFile.name,
                width: comp.width,
                height: comp.height
            });
        } catch (e) {
            return ElementVault.formatError("Capture thumbnail failed: " + e.toString());
        }
    };

    /**
     * Batch captures thumbnails for an array of compositions
     * @param {Array|string} compIds Array of composition IDs
     * @param {string} outputFolderPath Destination folder
     * @returns {string} Serialized JSON response
     */
    ElementVault.captureBatchThumbnails = function(compIds, outputFolderPath) {
        try {
            if (!app.project) {
                return ElementVault.formatError("No active project open in After Effects.");
            }

            var ids = compIds;
            if (typeof ids === "string") {
                try {
                    if (typeof JSON !== "undefined" && JSON.parse) {
                        ids = JSON.parse(ids);
                    } else {
                        ids = ids.replace(/[\[\]\s]/g, "").split(",");
                    }
                } catch (parseErr) {
                    ids = ids.replace(/[\[\]\s]/g, "").split(",");
                }
            }

            if (!ids || ids.length === 0) {
                return ElementVault.formatError("No composition IDs specified for batch thumbnail capture.");
            }

            var results = [];
            for (var b = 0; b < ids.length; b++) {
                var cId = parseInt(ids[b], 10);
                if (isNaN(cId)) continue;

                var resJsonStr = ElementVault.captureCompThumbnail(cId, outputFolderPath);
                var parsedRes = null;
                try {
                    if (typeof JSON !== "undefined" && JSON.parse) {
                        parsedRes = JSON.parse(resJsonStr);
                    }
                } catch (e) {}

                if (parsedRes && parsedRes.success && parsedRes.data) {
                    results.push(parsedRes.data);
                }
            }

            return ElementVault.formatSuccess(results);
        } catch (err) {
            return ElementVault.formatError("Batch thumbnail capture failed: " + err.toString());
        }
    };
})();
