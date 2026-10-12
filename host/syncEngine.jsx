/**
 * AE Element Vault - ExtendScript Property Synchronization Engine
 * Executed in Adobe After Effects ExtendScript engine (ECMAScript 3).
 * Applies customized text, brand colors, sliders, and Essential Properties directly to layers.
 */

(function() {
    if (typeof ElementVault === "undefined") {
        ElementVault = {};
    }

    /**
     * Converts a hex color string (#RGB, #RRGGBB) to a 4-float array [r, g, b, 1.0] (0.0 to 1.0)
     */
    function hexToRgbaArray(hex) {
        if (typeof hex !== "string") return null;
        var clean = hex.replace("#", "").replace(/\s+/g, "");
        if (clean.length === 3) {
            var r3 = parseInt(clean.charAt(0) + clean.charAt(0), 16) / 255;
            var g3 = parseInt(clean.charAt(1) + clean.charAt(1), 16) / 255;
            var b3 = parseInt(clean.charAt(2) + clean.charAt(2), 16) / 255;
            return [r3, g3, b3, 1.0];
        } else if (clean.length === 6) {
            var r6 = parseInt(clean.substring(0, 2), 16) / 255;
            var g6 = parseInt(clean.substring(2, 4), 16) / 255;
            var b6 = parseInt(clean.substring(4, 6), 16) / 255;
            return [r6, g6, b6, 1.0];
        }
        return null;
    }

    /**
     * Checks if target string matches reference key (case-insensitive or partial match)
     */
    function matchesParamKey(targetName, paramKey) {
        if (!targetName || !paramKey) return false;
        var t = String(targetName).toLowerCase();
        var k = String(paramKey).toLowerCase();
        if (t === k) return true;
        var strippedK = k.replace(/^prop-/, "");
        if (t === strippedK) return true;
        if (t.indexOf(strippedK) !== -1 || strippedK.indexOf(t) !== -1) return true;
        return false;
    }

    /**
     * Applies customized parameters to a target layer in After Effects.
     * Routes parameters across:
     * 1. Essential Properties (Master Properties)
     * 2. Expression Controls (Effects)
     * 3. Direct Text Layers (Source Text)
     *
     * @param {Layer} targetLayer Target layer (AVLayer, TextLayer, CompItem precomp layer)
     * @param {Object} customParams Map of parameter IDs/names to updated values
     * @param {boolean} [skipUndoGroup=false] If true, caller manages undo grouping
     * @returns {string|Object} JSON serialized response
     */
    ElementVault.applyCustomParameters = function(targetLayer, customParams, skipUndoGroup) {
        if (!targetLayer) {
            var noLayerMsg = "No target layer provided for parameter synchronization.";
            if (typeof ElementVault.formatError === "function") {
                return ElementVault.formatError(noLayerMsg);
            }
            return { success: false, error: noLayerMsg };
        }

        if (!customParams) customParams = {};
        if (typeof customParams === "string") {
            try {
                if (typeof JSON !== "undefined" && JSON.parse) {
                    customParams = JSON.parse(customParams);
                }
            } catch (pErr) {
                customParams = {};
            }
        }

        var undoStarted = false;
        if (!skipUndoGroup) {
            try {
                app.beginUndoGroup("Element Vault - Update Parameters");
                undoStarted = true;
            } catch (uErr) {}
        }

        try {
            var updatedPropsCount = 0;
            var updatedList = [];

            // 1. ROUTE 1: Essential Properties (Master Properties)
            var egGroup = null;
            try {
                egGroup = targetLayer.property("ADBE Essential Properties") || targetLayer.property("Essential Properties");
            } catch (eEg) {}

            var egMatchedKeys = {};

            if (egGroup && egGroup.numProperties > 0) {
                for (var paramKey in customParams) {
                    if (customParams.hasOwnProperty(paramKey)) {
                        var paramValue = customParams[paramKey];
                        for (var p = 1; p <= egGroup.numProperties; p++) {
                            var egProp = egGroup.property(p);
                            if (matchesParamKey(egProp.name, paramKey)) {
                                try {
                                    if (typeof paramValue === "string") {
                                        if (paramValue.indexOf("#") === 0) {
                                            var colArr = hexToRgbaArray(paramValue);
                                            if (colArr) {
                                                egProp.setValue(colArr);
                                            } else {
                                                egProp.setValue(paramValue);
                                            }
                                        } else {
                                            egProp.setValue(paramValue);
                                        }
                                    } else if (typeof paramValue === "number") {
                                        egProp.setValue(Number(paramValue));
                                    } else if (typeof paramValue === "boolean") {
                                        egProp.setValue(paramValue ? 1 : 0);
                                    } else if (paramValue instanceof Array) {
                                        egProp.setValue(paramValue);
                                    }

                                    updatedPropsCount++;
                                    updatedList.push(egProp.name);
                                    egMatchedKeys[paramKey] = true;
                                } catch (setEgErr) {}
                            }
                        }
                    }
                }
            }

            // 2. ROUTE 2: Expression Controls (Effects)
            // Check effects on targetLayer or on layers inside its source precomp
            function applyEffectsToLayer(layerObj, pKey, pVal) {
                var fxGroup = null;
                try {
                    fxGroup = layerObj.property("ADBE Effect Parade") || layerObj.property("Effects");
                } catch (eFx) {}
                if (!fxGroup || fxGroup.numProperties === 0) return false;

                var matched = false;
                for (var f = 1; f <= fxGroup.numProperties; f++) {
                    var effect = fxGroup.property(f);
                    if (matchesParamKey(effect.name, pKey)) {
                        try {
                            if (effect.numProperties >= 1) {
                                var valProp = effect.property(1); // Primary control value property
                                if (typeof pVal === "string" && pVal.indexOf("#") === 0) {
                                    var cArr = hexToRgbaArray(pVal);
                                    if (cArr) valProp.setValue(cArr);
                                } else if (typeof pVal === "number") {
                                    valProp.setValue(Number(pVal));
                                } else if (typeof pVal === "boolean") {
                                    valProp.setValue(pVal ? 1 : 0);
                                } else if (pVal instanceof Array) {
                                    valProp.setValue(pVal);
                                } else if (typeof pVal === "string") {
                                    valProp.setValue(pVal);
                                }
                                updatedPropsCount++;
                                updatedList.push(effect.name);
                                matched = true;
                            }
                        } catch (setFxErr) {}
                    }
                }
                return matched;
            }

            for (var pKey2 in customParams) {
                if (customParams.hasOwnProperty(pKey2) && !egMatchedKeys[pKey2]) {
                    var pVal2 = customParams[pKey2];
                    var fxMatched = applyEffectsToLayer(targetLayer, pKey2, pVal2);

                    // If not found directly, inspect layers inside precomp if targetLayer is a Comp
                    if (!fxMatched && targetLayer.source && targetLayer.source instanceof CompItem) {
                        var preComp = targetLayer.source;
                        for (var subl = 1; subl <= preComp.numLayers; subl++) {
                            if (applyEffectsToLayer(preComp.layer(subl), pKey2, pVal2)) {
                                fxMatched = true;
                                break;
                            }
                        }
                    }
                    if (fxMatched) {
                        egMatchedKeys[pKey2] = true;
                    }
                }
            }

            // 3. ROUTE 3: Direct Text Layer (Source Text)
            // Traverse targetLayer or layers in precomp for text layers
            function applyTextToLayer(layerObj, pKey, pVal) {
                if (!layerObj) return false;
                var textProp = null;
                try {
                    textProp = layerObj.property("Source Text");
                } catch (eTxt) {}
                if (!textProp) return false;

                if (matchesParamKey(layerObj.name, pKey) || matchesParamKey("text", pKey) || matchesParamKey("title", pKey)) {
                    try {
                        var textDoc = textProp.value;
                        textDoc.text = String(pVal);
                        textProp.setValue(textDoc);
                        updatedPropsCount++;
                        updatedList.push(layerObj.name + " (Source Text)");
                        return true;
                    } catch (eSetTxt) {}
                }
                return false;
            }

            for (var pKey3 in customParams) {
                if (customParams.hasOwnProperty(pKey3) && !egMatchedKeys[pKey3]) {
                    var pVal3 = customParams[pKey3];
                    // Skip if value is a color hex or numeric slider
                    if (typeof pVal3 === "string" && pVal3.indexOf("#") !== 0) {
                        var textMatched = applyTextToLayer(targetLayer, pKey3, pVal3);

                        if (!textMatched && targetLayer.source && targetLayer.source instanceof CompItem) {
                            var preComp2 = targetLayer.source;
                            for (var tl = 1; tl <= preComp2.numLayers; tl++) {
                                if (applyTextToLayer(preComp2.layer(tl), pKey3, pVal3)) {
                                    textMatched = true;
                                    break;
                                }
                            }
                        }
                        if (textMatched) {
                            egMatchedKeys[pKey3] = true;
                        }
                    }
                }
            }

            if (undoStarted) {
                try { app.endUndoGroup(); } catch (eEnd) {}
            }

            var resultPayload = {
                layerName: targetLayer.name,
                updatedCount: updatedPropsCount,
                updatedProperties: updatedList
            };

            if (typeof ElementVault.formatSuccess === "function") {
                return ElementVault.formatSuccess(resultPayload);
            }

            return {
                success: true,
                data: resultPayload
            };

        } catch (err) {
            if (undoStarted) {
                try { app.endUndoGroup(); } catch (eEndErr) {}
            }

            var errStr = err.toString();
            if (typeof ElementVault.formatError === "function") {
                return ElementVault.formatError("Failed to synchronize parameters: " + errStr);
            }
            return {
                success: false,
                error: errStr
            };
        }
    };

    /**
     * Synchronizes customized parameters to the layer currently selected in the timeline.
     *
     * @param {Object} customParams Map of parameter IDs/names to updated values
     * @returns {string|Object} JSON serialized response
     */
    ElementVault.syncToSelectedLayer = function(customParams) {
        try {
            var activeComp = app.project ? app.project.activeItem : null;
            if (!activeComp || !(activeComp instanceof CompItem)) {
                var noCompMsg = "Please open a composition in the timeline to sync.";
                if (typeof ElementVault.formatError === "function") {
                    return ElementVault.formatError(noCompMsg);
                }
                return { success: false, error: noCompMsg };
            }

            if (!activeComp.selectedLayers || activeComp.selectedLayers.length === 0) {
                var noLayerMsg = "Please select the target layer in your After Effects timeline to sync.";
                if (typeof ElementVault.formatError === "function") {
                    return ElementVault.formatError(noLayerMsg);
                }
                return { success: false, error: noLayerMsg };
            }

            var targetLayer = activeComp.selectedLayers[0];
            return ElementVault.applyCustomParameters(targetLayer, customParams, false);

        } catch (err) {
            var syncErrStr = err.toString();
            if (typeof ElementVault.formatError === "function") {
                return ElementVault.formatError("Error syncing to selected layer: " + syncErrStr);
            }
            return { success: false, error: syncErrStr };
        }
    };
})();
