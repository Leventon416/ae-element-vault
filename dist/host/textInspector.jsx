/**
 * AE Element Vault - Text Layer Inspection Engine
 * Modular ExtendScript ES3 Module
 * Discovers editable text layers, typography settings, and string values inside compositions and nested precomps.
 */

(function() {
    if (typeof ElementVault === "undefined") {
        ElementVault = {};
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
     * Converts ParagraphJustification enum to human-readable string
     * @param {number} just
     * @returns {string}
     */
    function getJustificationString(just) {
        try {
            if (typeof ParagraphJustification !== "undefined") {
                if (just === ParagraphJustification.CENTER_JUSTIFY) return "CENTER";
                if (just === ParagraphJustification.RIGHT_JUSTIFY) return "RIGHT";
                if (just === ParagraphJustification.LEFT_JUSTIFY) return "LEFT";
                if (just === ParagraphJustification.FULL_JUSTIFY_LASTLINE_LEFT ||
                    just === ParagraphJustification.FULL_JUSTIFY_LASTLINE_RIGHT ||
                    just === ParagraphJustification.FULL_JUSTIFY_LASTLINE_CENTER ||
                    just === ParagraphJustification.FULL_JUSTIFY_LASTLINE_FULL) {
                    return "JUSTIFY";
                }
            }
        } catch (e) {}
        return "LEFT";
    }

    /**
     * Recursively traverses composition layers to discover all text layers
     *
     * @param {CompItem} comp Composition to inspect
     * @param {string} prefix Hierarchical precomp prefix
     * @param {Array} visited Array of visited comp IDs to prevent cycles
     * @param {Array} results Collected customizable text property objects
     */
    function scanCompTextLayers(comp, prefix, visited, results, rootCompId) {
        if (!comp || !(comp instanceof CompItem)) return;

        // Check cycle prevention
        for (var v = 0; v < visited.length; v++) {
            if (visited[v] === comp.id) {
                return; // Already inspected this composition
            }
        }
        visited.push(comp.id);

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (!layer) continue;

            // 1. Check if layer is a nested Precomp
            if (layer.source && layer.source instanceof CompItem) {
                var nextPrefix = (prefix ? prefix + " / " : "") + "[" + layer.name + "]";
                scanCompTextLayers(layer.source, nextPrefix, visited, results, rootCompId);
                continue;
            }

            // 2. Identify Text Layers by matchName or Source Text property
            var isTextLayer = false;
            if (layer.matchName === "ADBE Text Layer") {
                isTextLayer = true;
            } else {
                try {
                    if (layer.property("Source Text") !== null) {
                        isTextLayer = true;
                    }
                } catch (pErr) {}
            }

            if (isTextLayer) {
                try {
                    var sourceTextProp = layer.property("Source Text");
                    if (sourceTextProp) {
                        var textDoc = sourceTextProp.value;
                        var layerDisplayName = (prefix ? prefix + " / " : "") + layer.name;
                        var propId = "text_" + (comp.id !== rootCompId ? comp.id + "_" : "") + layer.index;

                        var textContent = "";
                        var fontName = "Arial";
                        var fontSize = 48;
                        var justification = "LEFT";
                        var tracking = 0;
                        var fillColor = null;

                        if (textDoc) {
                            if (typeof textDoc.text !== "undefined") {
                                textContent = String(textDoc.text);
                            }
                            if (typeof textDoc.font !== "undefined") {
                                fontName = String(textDoc.font);
                            }
                            if (typeof textDoc.fontSize !== "undefined") {
                                fontSize = Number(textDoc.fontSize);
                            }
                            if (typeof textDoc.justification !== "undefined") {
                                justification = getJustificationString(textDoc.justification);
                            }
                            if (typeof textDoc.tracking !== "undefined") {
                                tracking = Number(textDoc.tracking);
                            }
                            if (textDoc.applyFill && textDoc.fillColor && textDoc.fillColor.length >= 3) {
                                fillColor = [
                                    Number(textDoc.fillColor[0]),
                                    Number(textDoc.fillColor[1]),
                                    Number(textDoc.fillColor[2])
                                ];
                            }
                        }

                        results.push({
                            id: propId,
                            type: "text",
                            layerName: layerDisplayName,
                            layerIndex: layer.index,
                            propertyName: "Source Text",
                            defaultValue: textContent,
                            font: fontName,
                            fontSize: fontSize,
                            justification: justification,
                            tracking: tracking,
                            fillColor: fillColor
                        });
                    }
                } catch (tErr) {}
            }
        }
    }

    /**
     * Discovers and extracts all editable text layers in a composition (including nested precomps)
     *
     * @param {number} compId Target composition ID
     * @returns {string} Serialized JSON response
     */
    ElementVault.inspectTextLayers = function(compId) {
        try {
            if (!app.project) {
                return ElementVault.formatError("No active project open in After Effects.");
            }

            var comp = findCompById(compId);
            if (!comp) {
                return ElementVault.formatError("Composition with ID " + compId + " not found.");
            }

            var visited = [];
            var textProps = [];
            scanCompTextLayers(comp, "", visited, textProps, comp.id);

            return ElementVault.formatSuccess({
                compId: comp.id,
                compName: comp.name,
                textCount: textProps.length,
                textProperties: textProps
            });
        } catch (e) {
            return ElementVault.formatError("Text layer inspection failed: " + e.toString());
        }
    };
})();
