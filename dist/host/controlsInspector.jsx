/**
 * AE Element Vault - Expression Controls Inspection Engine
 * Modular ExtendScript ES3 Module
 * Discovers master colors, numeric sliders, toggles, and angle controls in compositions and nested precomps.
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
     * Converts a single 0.0-1.0 float color channel into a two-character hex string
     * @param {number} c
     * @returns {string}
     */
    function componentToHex(c) {
        var n = Math.round(c * 255);
        if (isNaN(n) || n < 0) n = 0;
        if (n > 255) n = 255;
        var hex = n.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }

    /**
     * Converts RGB floats (0.0 to 1.0) to Hex string (#RRGGBB)
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @returns {string}
     */
    function rgbToHex(r, g, b) {
        return ("#" + componentToHex(r) + componentToHex(g) + componentToHex(b)).toUpperCase();
    }

    /**
     * Checks if a layer name corresponds to a dedicated controller layer
     * @param {string} layerName
     * @returns {boolean}
     */
    function isControllerLayer(layerName) {
        if (!layerName) return false;
        var lower = layerName.toLowerCase();
        return (
            lower.indexOf("control") !== -1 ||
            lower.indexOf("setting") !== -1 ||
            lower.indexOf("color") !== -1 ||
            lower.indexOf("global") !== -1 ||
            lower.indexOf("master") !== -1 ||
            lower.indexOf("null") !== -1
        );
    }

    /**
     * Recursively traverses composition layers to discover all expression controls
     *
     * @param {CompItem} comp Target composition
     * @param {string} prefix Hierarchical precomp prefix
     * @param {Array} visited Cycle prevention array
     * @param {Array} results Collected customizable control properties
     * @param {number} rootCompId ID of root comp
     */
    function scanCompControls(comp, prefix, visited, results, rootCompId) {
        if (!comp || !(comp instanceof CompItem)) return;

        // Check cycle prevention
        for (var v = 0; v < visited.length; v++) {
            if (visited[v] === comp.id) {
                return;
            }
        }
        visited.push(comp.id);

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (!layer) continue;

            // 1. Recurse into nested precomps
            if (layer.source && layer.source instanceof CompItem) {
                var nextPrefix = (prefix ? prefix + " / " : "") + "[" + layer.name + "]";
                scanCompControls(layer.source, nextPrefix, visited, results, rootCompId);
                continue;
            }

            // 2. Check if the layer contains an Effects group
            var effectsGroup = null;
            try {
                effectsGroup = layer.property("ADBE Effect Parade") || layer.property("Effects");
            } catch (eErr) {}

            if (!effectsGroup || effectsGroup.numProperties === 0) {
                continue;
            }

            var isPriority = isControllerLayer(layer.name);
            var layerDisplayName = (prefix ? prefix + " / " : "") + layer.name;
            var compPrefix = comp.id !== rootCompId ? comp.id + "_" : "";

            for (var e = 1; e <= effectsGroup.numProperties; e++) {
                var effect = effectsGroup.property(e);
                if (!effect) continue;

                var matchName = effect.matchName || "";
                var effectName = effect.name || "Effect";

                try {
                    // a. Color Control (ADBE Color Control)
                    if (matchName === "ADBE Color Control") {
                        var colorProp = effect.property("ADBE Color Control-0001") ||
                                        effect.property("Color") ||
                                        (effect.numProperties >= 1 ? effect.property(1) : null);

                        if (colorProp) {
                            var colorVal = colorProp.value;
                            if (colorVal && colorVal.length >= 3) {
                                var r = Number(colorVal[0]);
                                var g = Number(colorVal[1]);
                                var b = Number(colorVal[2]);
                                var a = colorVal.length > 3 ? Number(colorVal[3]) : 1.0;
                                var hexStr = rgbToHex(r, g, b);

                                results.push({
                                    id: "ctrl_color_" + compPrefix + layer.index + "_" + e,
                                    type: "color",
                                    layerName: layerDisplayName,
                                    layerIndex: layer.index,
                                    propertyName: effectName,
                                    defaultValue: hexStr,
                                    rawValue: [r, g, b, a],
                                    isMasterControl: isPriority
                                });
                            }
                        }
                        continue;
                    }

                    // b. Slider Control (ADBE Slider Control)
                    if (matchName === "ADBE Slider Control") {
                        var sliderProp = effect.property("ADBE Slider Control-0001") ||
                                         effect.property("Slider") ||
                                         (effect.numProperties >= 1 ? effect.property(1) : null);

                        if (sliderProp) {
                            var sVal = Number(sliderProp.value);
                            if (!isNaN(sVal)) {
                                var roundedVal = Math.round(sVal * 100) / 100;
                                var maxVal = Math.max(100, Math.ceil(Math.abs(sVal) * 2));
                                var minVal = sVal < 0 ? Math.floor(sVal * 1.5) : 0;

                                results.push({
                                    id: "ctrl_slider_" + compPrefix + layer.index + "_" + e,
                                    type: "slider",
                                    layerName: layerDisplayName,
                                    layerIndex: layer.index,
                                    propertyName: effectName,
                                    defaultValue: roundedVal,
                                    min: minVal,
                                    max: maxVal,
                                    isMasterControl: isPriority
                                });
                            }
                        }
                        continue;
                    }

                    // c. Checkbox Control (ADBE Checkbox Control)
                    if (matchName === "ADBE Checkbox Control") {
                        var checkProp = effect.property("ADBE Checkbox Control-0001") ||
                                        effect.property("Checkbox") ||
                                        (effect.numProperties >= 1 ? effect.property(1) : null);

                        if (checkProp) {
                            var cVal = checkProp.value;
                            var boolVal = (cVal === 1 || cVal === true || Number(cVal) > 0.5);

                            results.push({
                                id: "ctrl_check_" + compPrefix + layer.index + "_" + e,
                                type: "checkbox",
                                layerName: layerDisplayName,
                                layerIndex: layer.index,
                                propertyName: effectName,
                                defaultValue: boolVal,
                                isMasterControl: isPriority
                            });
                        }
                        continue;
                    }

                    // d. Angle Control (ADBE Angle Control)
                    if (matchName === "ADBE Angle Control") {
                        var angleProp = effect.property("ADBE Angle Control-0001") ||
                                        effect.property("Angle") ||
                                        (effect.numProperties >= 1 ? effect.property(1) : null);

                        if (angleProp) {
                            var aVal = Number(angleProp.value);
                            if (!isNaN(aVal)) {
                                var normalizedAngle = Math.round((aVal % 360 + 360) % 360);

                                results.push({
                                    id: "ctrl_angle_" + compPrefix + layer.index + "_" + e,
                                    type: "slider",
                                    layerName: layerDisplayName,
                                    layerIndex: layer.index,
                                    propertyName: effectName + " (Angle)",
                                    defaultValue: normalizedAngle,
                                    min: 0,
                                    max: 360,
                                    isMasterControl: isPriority
                                });
                            }
                        }
                        continue;
                    }
                } catch (propErr) {}
            }
        }
    }

    /**
     * Discovers and extracts all expression controls in a composition
     * Prioritizes controls on dedicated controller layers (Controls, Settings, Color, Global, Master).
     *
     * @param {number} compId Target composition ID
     * @returns {string} Serialized JSON response
     */
    ElementVault.inspectExpressionControls = function(compId) {
        try {
            if (!app.project) {
                return ElementVault.formatError("No active project open in After Effects.");
            }

            var comp = findCompById(compId);
            if (!comp) {
                return ElementVault.formatError("Composition with ID " + compId + " not found.");
            }

            var visited = [];
            var allControls = [];
            scanCompControls(comp, "", visited, allControls, comp.id);

            // Sort: Master/Dedicated controller layers first, then by layer and effect
            var prioritized = [];
            var standard = [];
            for (var k = 0; k < allControls.length; k++) {
                if (allControls[k].isMasterControl) {
                    prioritized.push(allControls[k]);
                } else {
                    standard.push(allControls[k]);
                }
            }

            var finalList = prioritized.concat(standard);

            return ElementVault.formatSuccess({
                compId: comp.id,
                compName: comp.name,
                controlsCount: finalList.length,
                controls: finalList
            });
        } catch (e) {
            return ElementVault.formatError("Expression controls inspection failed: " + e.toString());
        }
    };
})();
