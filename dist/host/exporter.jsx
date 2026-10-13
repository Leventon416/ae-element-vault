/**
 * AE Element Vault - Standalone Composition Exporter Engine
 * Modular ExtendScript ES3 Module
 */

(function() {
    if (typeof ElementVault === "undefined") {
        ElementVault = {};
    }

    /**
     * Sanitizes a string for safe filesystem filename usage
     * Replaces Unicode symbols (such as '↓', '→', '↑', '←') with clean ascii representations ('down', 'right', 'up', 'left') or underscores to prevent corrupt Windows file paths.
     * @param {string} str
     * @returns {string}
     */
    function sanitizeFileName(str) {
        if (!str) return "unnamed_comp";
        var clean = String(str);
        // Replace Unicode arrow symbols with clean ascii equivalents
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
        // Replace quotes and other illegal filesystem characters
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
     * Safely exports an isolated composition into a standalone .aep file
     * Protocol:
     * 1. Verifies project is saved
     * 2. Records original file path
     * 3. Locates target comp metadata
     * 4. Copies original project to temp file
     * 5. Opens temp project, finds target comp, runs reduceProject()
     * 6. Saves isolated project to destination
     * 7. Deletes temp file and re-opens original project
     *
     * @param {number} compId
     * @param {string} outputFolderPath
     * @returns {string} Serialized JSON response
     */
    ElementVault.exportCompositionToAep = function(compId, outputFolderPath) {
        var originalFilePath = null;
        var tempFile = null;

        try {
            // 1. Verify project is open and saved to disk
            if (!app.project || !app.project.file) {
                return ElementVault.formatError("Please save your project before exporting elements.");
            }

            // 2. Record original project file path
            originalFilePath = app.project.file.fsName;

            // 3. Locate target CompItem and capture metadata
            var sourceComp = findCompById(compId);
            if (!sourceComp) {
                return ElementVault.formatError("Composition with ID " + compId + " not found in active project.");
            }

            var compName = sourceComp.name;
            var compWidth = sourceComp.width;
            var compHeight = sourceComp.height;
            var compDuration = sourceComp.duration;
            var compFrameRate = sourceComp.frameRate;
            var compNumLayers = sourceComp.numLayers;

            // 4. Sanitize composition name
            var sanitizedName = sanitizeFileName(compName);

            // Resolve destination output folder
            var targetFolderPath = outputFolderPath;
            if (!targetFolderPath || targetFolderPath === "") {
                targetFolderPath = Folder.myDocuments.fsName + "/ElementVault/Library/assets";
            }
            var outputFolder = new Folder(targetFolderPath);
            if (!outputFolder.exists) {
                outputFolder.create();
            }

            // 5. Construct unique temporary file path
            var timestamp = (new Date()).getTime();
            tempFile = new File(Folder.temp.fsName + "/ae_vault_temp_" + timestamp + ".aep");

            // 6. Copy original project file to tempFile
            var copyOk = app.project.file.copy(tempFile);
            if (!copyOk || !tempFile.exists) {
                return ElementVault.formatError("Failed to create temporary project copy at: " + tempFile.fsName);
            }

            // 7. Open tempFile
            app.open(tempFile);

            // 8. Locate target composition inside temporary project
            var targetComp = null;
            for (var i = 1; i <= app.project.numItems; i++) {
                var itm = app.project.item(i);
                if (itm instanceof CompItem) {
                    if (itm.name == compName && itm.width == compWidth && itm.height == compHeight) {
                        targetComp = itm;
                        break;
                    }
                }
            }

            // Fallback match by name if exact dimensions shifted
            if (!targetComp) {
                for (var j = 1; j <= app.project.numItems; j++) {
                    var itm2 = app.project.item(j);
                    if (itm2 instanceof CompItem && itm2.name == compName) {
                        targetComp = itm2;
                        break;
                    }
                }
            }

            if (!targetComp) {
                // Restore original project before returning error
                app.open(new File(originalFilePath));
                if (tempFile && tempFile.exists) {
                    tempFile.remove();
                }
                return ElementVault.formatError("Failed to locate target composition '" + compName + "' in cloned project.");
            }

            // 9. Execute reduceProject to isolate composition
            app.project.reduceProject([targetComp]);

            // 10. Save isolated project to destination
            var targetFile = new File(outputFolder.fsName + "/" + sanitizedName + ".aep");
            app.project.save(targetFile);

            var finalSize = targetFile.length;
            var finalName = targetFile.name;
            var finalPath = targetFile.fsName;

            // Immediately capture thumbnail into the library's previews/ directory
            var previewsFolderPath = "";
            if (outputFolder.parent && outputFolder.parent.exists) {
                previewsFolderPath = outputFolder.parent.fsName + "/previews";
            } else {
                previewsFolderPath = outputFolder.fsName.replace(/[\\\/]assets[\\\/]?$/i, "") + "/previews";
            }
            var previewsFolder = new Folder(previewsFolderPath);
            if (!previewsFolder.exists) {
                previewsFolder.create();
            }

            var thumbPath = "";
            var thumbFileName = "";
            if (ElementVault.captureCompThumbnail && targetComp) {
                try {
                    var thumbResStr = ElementVault.captureCompThumbnail(targetComp.id, previewsFolder.fsName, targetComp.duration / 2);
                    if (typeof JSON !== "undefined" && JSON.parse) {
                        var parsedThumb = JSON.parse(thumbResStr);
                        if (parsedThumb && parsedThumb.success && parsedThumb.data) {
                            thumbPath = parsedThumb.data.thumbnailPath;
                            thumbFileName = parsedThumb.data.fileName;
                        }
                    }
                } catch (thumbErr) {
                    var fallbackThumbFile = new File(previewsFolder.fsName + "/thumb_" + compId + "_" + sanitizedName + ".png");
                    try {
                        targetComp.saveFrameToPng(targetComp.duration / 2, fallbackThumbFile);
                        if (fallbackThumbFile.exists) {
                            thumbPath = fallbackThumbFile.fsName;
                            thumbFileName = fallbackThumbFile.name;
                        }
                    } catch (e2) {}
                }
            }

            // Automatically discover Essential Properties / Master Properties in the composition
            var essentialProps = [];
            var egTemplateName = "";
            if (ElementVault.inspectEssentialProperties && targetComp) {
                try {
                    var egResStr = ElementVault.inspectEssentialProperties(targetComp.id);
                    if (typeof JSON !== "undefined" && JSON.parse) {
                        var parsedEg = JSON.parse(egResStr);
                        if (parsedEg && parsedEg.success && parsedEg.data) {
                            if (parsedEg.data.essentialProperties) {
                                essentialProps = parsedEg.data.essentialProperties;
                            }
                            if (parsedEg.data.egTemplateName) {
                                egTemplateName = parsedEg.data.egTemplateName;
                            }
                        }
                    }
                } catch (egErr) {}
            }

            // Automatically discover editable text layers in the composition
            var textProps = [];
            if (ElementVault.inspectTextLayers && targetComp) {
                try {
                    var textResStr = ElementVault.inspectTextLayers(targetComp.id);
                    if (typeof JSON !== "undefined" && JSON.parse) {
                        var parsedText = JSON.parse(textResStr);
                        if (parsedText && parsedText.success && parsedText.data && parsedText.data.textProperties) {
                            textProps = parsedText.data.textProperties;
                        }
                    }
                } catch (textErr) {}
            }

            // Automatically discover expression controls in the composition
            var controlsProps = [];
            if (ElementVault.inspectExpressionControls && targetComp) {
                try {
                    var ctrlResStr = ElementVault.inspectExpressionControls(targetComp.id);
                    if (typeof JSON !== "undefined" && JSON.parse) {
                        var parsedCtrl = JSON.parse(ctrlResStr);
                        if (parsedCtrl && parsedCtrl.success && parsedCtrl.data && parsedCtrl.data.controls) {
                            controlsProps = parsedCtrl.data.controls;
                        }
                    }
                } catch (ctrlErr) {}
            }

            // Prioritization & De-duplication Logic:
            // 1. Essential Properties are placed first with isEssentialProperty: true.
            // 2. Text layers and expression controls are appended if not already covered by Essential Properties.
            var coveredNames = {};
            for (var ep = 0; ep < essentialProps.length; ep++) {
                var epName = essentialProps[ep].propertyName || "";
                coveredNames[epName.toLowerCase()] = true;
            }

            var mergedTextProps = [];
            for (var tp = 0; tp < textProps.length; tp++) {
                var tName = textProps[tp].propertyName || "";
                var tLayer = textProps[tp].layerName || "";
                if (!coveredNames[tName.toLowerCase()] && !coveredNames[tLayer.toLowerCase()]) {
                    mergedTextProps.push(textProps[tp]);
                }
            }

            var mergedCtrlProps = [];
            for (var cp = 0; cp < controlsProps.length; cp++) {
                var cName = controlsProps[cp].propertyName || "";
                if (!coveredNames[cName.toLowerCase()]) {
                    mergedCtrlProps.push(controlsProps[cp]);
                }
            }

            var allCustomizableProps = essentialProps.concat(mergedTextProps).concat(mergedCtrlProps);

            // 11. Delete tempFile
            if (tempFile && tempFile.exists) {
                tempFile.remove();
            }

            // 12. Re-open original project to restore user's workspace
            app.open(new File(originalFilePath));

            // 13. Return structured JSON result
            return ElementVault.formatSuccess({
                compId: compId,
                compName: compName,
                egTemplateName: egTemplateName,
                aepPath: finalPath,
                fileName: finalName,
                fileSize: finalSize,
                thumbnailPath: thumbPath,
                thumbnailFileName: thumbFileName,
                width: compWidth,
                height: compHeight,
                duration: compDuration,
                frameRate: compFrameRate,
                numLayers: compNumLayers,
                customizableProps: allCustomizableProps
            });


        } catch (e) {
            // Guarantee original project is restored on failure
            if (originalFilePath) {
                try {
                    app.open(new File(originalFilePath));
                } catch (restoreErr) {}
            }
            if (tempFile && tempFile.exists) {
                try {
                    tempFile.remove();
                } catch (rmErr) {}
            }
            return ElementVault.formatError("Export composition failed: " + e.toString());
        }
    };

    /**
     * Batch exports multiple compositions by ID
     * @param {Array|string} compIds Array of comp IDs or comma-separated string
     * @param {string} outputFolderPath Destination directory path
     * @returns {string} Serialized JSON response
     */
    ElementVault.exportBatchCompositions = function(compIds, outputFolderPath) {
        try {
            if (!app.project || !app.project.file) {
                return ElementVault.formatError("Please save your project before exporting elements.");
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
                return ElementVault.formatError("No composition IDs specified for batch export.");
            }

            var results = [];
            for (var b = 0; b < ids.length; b++) {
                var cId = parseInt(ids[b], 10);
                if (isNaN(cId)) continue;

                var resJsonStr = ElementVault.exportCompositionToAep(cId, outputFolderPath);
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
            return ElementVault.formatError("Batch export failed: " + err.toString());
        }
    };
})();
