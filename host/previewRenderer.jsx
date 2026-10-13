/**
 * AE Element Vault - Animated Preview Generation Engine
 * Modular ExtendScript ES3 Module
 * Generates lightweight scrub sequences and animated preview files for library compositions.
 */

(function() {
    if (typeof ElementVault === "undefined") {
        ElementVault = {};
    }

    /**
     * Sanitizes a string for safe filesystem filename and folder usage
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
     * Renders an evenly-spaced multi-frame PNG scrub sequence across the composition duration.
     * Capped to a max of 4.0 seconds so rendering is near-instantaneous.
     *
     * @param {number} compId Composition ID
     * @param {string} outputFolderPath Destination directory
     * @param {number} [frameCount=10] Number of frames to capture (e.g. 8 to 12)
     * @returns {string} Serialized JSON response
     */
    ElementVault.renderPreviewSequence = function(compId, outputFolderPath, frameCount) {
        try {
            if (!app.project) {
                return ElementVault.formatError("No active project open in After Effects.");
            }

            // 1. Locate target CompItem by compId
            var comp = findCompById(compId);
            if (!comp) {
                return ElementVault.formatError("Composition with ID " + compId + " not found.");
            }

            // 2. Set default frame count (8 to 12 frames, default 10)
            var count = parseInt(frameCount, 10);
            if (isNaN(count) || count < 2) {
                count = 10;
            }
            if (count > 24) {
                count = 24;
            }

            // 3. Cap duration to a max of 4.0 seconds so rendering is near-instantaneous
            var previewDuration = Math.min(comp.duration, 4.0);
            if (previewDuration <= 0) {
                previewDuration = 1.0;
            }

            // 4. Resolve output folder and subfolder: previews/seq_{compId}_{name}
            var targetFolderPath = outputFolderPath;
            if (!targetFolderPath || targetFolderPath === "") {
                targetFolderPath = Folder.myDocuments.fsName + "/ElementVault/Library/previews";
            }
            var previewsFolder = new Folder(targetFolderPath);
            if (!previewsFolder.exists) {
                previewsFolder.create();
            }

            var sanitizedName = sanitizeFileName(comp.name);
            var sequenceFolderName = "seq_" + comp.id + "_" + sanitizedName;
            var sequenceFolder = new Folder(previewsFolder.fsName + "/" + sequenceFolderName);
            if (!sequenceFolder.exists) {
                sequenceFolder.create();
            }

            // 5. Calculate timestamps evenly spaced across the duration:
            // var step = (previewDuration) / (frameCount - 1);
            var step = previewDuration / (count - 1);
            var framePaths = [];

            // 6. Iterate and capture each frame using comp.saveFrameToPng(time, frameFile)
            for (var i = 0; i < count; i++) {
                var captureTime = Math.min(i * step, comp.duration);
                var frameFile = new File(sequenceFolder.fsName + "/frame_" + i + ".png");

                comp.saveFrameToPng(captureTime, frameFile);

                if (frameFile.exists) {
                    framePaths.push(frameFile.fsName);
                }
            }

            if (framePaths.length === 0) {
                return ElementVault.formatError("Failed to render preview sequence frames into: " + sequenceFolder.fsName);
            }

            // 7. Return standardized success response
            return ElementVault.formatSuccess({
                compId: comp.id,
                compName: comp.name,
                frameCount: framePaths.length,
                framePaths: framePaths,
                sequenceFolder: sequenceFolder.fsName
            });
        } catch (e) {
            return ElementVault.formatError("Render preview sequence failed: " + e.toString());
        }
    };

    /**
     * Attempts to render a fast, lightweight preview video via After Effects RenderQueue.
     * If RenderQueue is disabled or in background mode, falls back cleanly to renderPreviewSequence.
     *
     * @param {number} compId Target composition ID
     * @param {string} outputFolderPath Destination directory
     * @returns {string} Serialized JSON response
     */
    ElementVault.renderCompPreviewVideo = function(compId, outputFolderPath) {
        try {
            if (!app.project) {
                return ElementVault.formatError("No active project open in After Effects.");
            }

            var comp = findCompById(compId);
            if (!comp) {
                return ElementVault.formatError("Composition with ID " + compId + " not found.");
            }

            // Check if renderQueue is valid and available
            if (!app.project.renderQueue || !app.project.renderQueue.items) {
                return ElementVault.renderPreviewSequence(compId, outputFolderPath, 10);
            }

            var targetFolderPath = outputFolderPath;
            if (!targetFolderPath || targetFolderPath === "") {
                targetFolderPath = Folder.myDocuments.fsName + "/ElementVault/Library/previews";
            }
            var previewsFolder = new Folder(targetFolderPath);
            if (!previewsFolder.exists) {
                previewsFolder.create();
            }

            var sanitizedName = sanitizeFileName(comp.name);
            var videoFile = new File(previewsFolder.fsName + "/preview_" + comp.id + "_" + sanitizedName + ".mov");

            // Configure native After Effects app.project.renderQueue.items.add(comp)
            var rqItem = null;
            try {
                rqItem = app.project.renderQueue.items.add(comp);
            } catch (addErr) {
                return ElementVault.renderPreviewSequence(compId, outputFolderPath, 10);
            }

            if (!rqItem) {
                return ElementVault.renderPreviewSequence(compId, outputFolderPath, 10);
            }

            try {
                var om = rqItem.outputModule(1);
                if (om) {
                    om.file = videoFile;
                    // Attempt lightweight template if available
                    try {
                        om.applyTemplate("Lossless");
                    } catch (tErr) {}
                }

                // If RenderQueue is disabled or in background mode, clean up and fallback
                if (app.project.renderQueue.canQueueInAME || !app.project.renderQueue.render) {
                    try { rqItem.remove(); } catch (rmErr) {}
                    return ElementVault.renderPreviewSequence(compId, outputFolderPath, 10);
                }

                // Render synchronously
                app.project.renderQueue.render();

                if (videoFile.exists) {
                    return ElementVault.formatSuccess({
                        compId: comp.id,
                        previewVideoPath: videoFile.fsName
                    });
                } else {
                    try { rqItem.remove(); } catch (rmErr2) {}
                    return ElementVault.renderPreviewSequence(compId, outputFolderPath, 10);
                }
            } catch (renderErr) {
                try { rqItem.remove(); } catch (rmErr3) {}
                return ElementVault.renderPreviewSequence(compId, outputFolderPath, 10);
            }
        } catch (e) {
            return ElementVault.renderPreviewSequence(compId, outputFolderPath, 10);
        }
    };
})();
