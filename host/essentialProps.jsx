/**
 * AE Element Vault - Essential Graphics Inspection Engine
 * Modular ExtendScript ES3 Module
 * Extracts curated Master Properties from compositions via non-destructive scratch precomps
 * and prioritizes them over generic layer properties.
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
     * Checks if a property name suggests a boolean toggle/checkbox
     * @param {string} name
     * @returns {boolean}
     */
    function isCheckboxName(name) {
        if (!name) return false;
        var lower = name.toLowerCase();
        return (
            lower.indexOf("check") !== -1 ||
            lower.indexOf("toggle") !== -1 ||
            lower.indexOf("enable") !== -1 ||
            lower.indexOf("show") !== -1 ||
            lower.indexOf("hide") !== -1 ||
            lower.indexOf("switch") !== -1 ||
            lower.indexOf("on/off") !== -1 ||
            lower.indexOf("active") !== -1
        );
    }

    /**
     * Inspects Essential Properties / Master Properties of a target composition
     * Uses a temporary non-destructive scratch precomp that is immediately removed.
     *
     * @param {number} compId Composition ID to inspect
     * @returns {string} Serialized JSON response
     */
    ElementVault.inspectEssentialProperties = function(compId) {
        var scratchComp = null;
        try {
            if (!app.project) {
                return ElementVault.formatError("No active project open in After Effects.");
            }

            var targetComp = findCompById(compId);
            if (!targetComp) {
                return ElementVault.formatError("Composition with ID " + compId + " not found.");
            }

            var egTemplateName = "";
            try {
                if (targetComp.motionGraphicsTemplateName) {
                    egTemplateName = targetComp.motionGraphicsTemplateName;
                }
            } catch (tNameErr) {}

            var essentialPropsList = [];

            // Wrap in undo group to guarantee zero residual project state
            app.beginUndoGroup("Vault: Inspect Essential Properties");

            try {
                // Non-destructive inspection pattern:
                // Add temporary scratch comp, insert targetComp as a layer, and inspect its Essential Properties group
                var tempTimestamp = (new Date()).getTime();
                scratchComp = app.project.items.addComp(
                    "__temp_eg_inspect_" + tempTimestamp,
                    Math.max(100, targetComp.width),
                    Math.max(100, targetComp.height),
                    1.0,
                    1.0,
                    30.0
                );

                var testLayer = scratchComp.layers.add(targetComp);
                var egGroup = null;

                try {
                    egGroup = testLayer.property("ADBE Essential Properties") ||
                              testLayer.property("Essential Properties") ||
                              testLayer.property("Master Properties");
                } catch (egErr) {}

                if (egGroup && egGroup.numProperties > 0) {
                    for (var p = 1; p <= egGroup.numProperties; p++) {
                        var prop = egGroup.property(p);
                        if (!prop) continue;

                        var propName = prop.name || ("Master Property " + p);
                        var propId = "eg_prop_" + targetComp.id + "_" + p;
                        var propType = "slider";
                        var defaultVal = 0;
                        var rawVal = null;
                        var minBound = 0;
                        var maxBound = 100;
                        var fontName = "";
                        var fontSize = 48;
                        var justification = "LEFT";

                        // Determine property type via PropertyValueType enum or value inspection
                        var valType = null;
                        try {
                            valType = prop.propertyValueType;
                        } catch (vtErr) {}

                        // 1. Color Property
                        var isColor = false;
                        if (typeof PropertyValueType !== "undefined" && valType === PropertyValueType.COLOR) {
                            isColor = true;
                        } else {
                            try {
                                var testVal = prop.value;
                                if (testVal && testVal.length >= 3 && typeof testVal[0] === "number") {
                                    isColor = true;
                                }
                            } catch (cErr) {}
                        }

                        if (isColor) {
                            try {
                                var colorArr = prop.value;
                                var r = Number(colorArr[0]);
                                var g = Number(colorArr[1]);
                                var b = Number(colorArr[2]);
                                var a = colorArr.length > 3 ? Number(colorArr[3]) : 1.0;
                                propType = "color";
                                defaultVal = rgbToHex(r, g, b);
                                rawVal = [r, g, b, a];
                            } catch (cValErr) {
                                defaultVal = "#3B82F6";
                            }

                            essentialPropsList.push({
                                id: propId,
                                type: "color",
                                layerName: targetComp.name + " (Master Property)",
                                layerIndex: 0,
                                propertyName: propName,
                                defaultValue: defaultVal,
                                rawValue: rawVal,
                                isEssentialProperty: true,
                                isMasterControl: true,
                                egTemplateName: egTemplateName
                            });
                            continue;
                        }

                        // 2. Text Property (TextDocument)
                        var isText = false;
                        if (typeof PropertyValueType !== "undefined" && valType === PropertyValueType.TEXT_DOCUMENT) {
                            isText = true;
                        } else {
                            try {
                                if (prop.value && typeof prop.value.text === "string") {
                                    isText = true;
                                }
                            } catch (tErr) {}
                        }

                        if (isText) {
                            try {
                                var doc = prop.value;
                                defaultVal = doc.text || "";
                                fontName = doc.font || "Montserrat-Bold";
                                fontSize = doc.fontSize || 48;
                                try {
                                    if (typeof ParagraphJustification !== "undefined" && doc.justification) {
                                        if (doc.justification === ParagraphJustification.CENTER_JUSTIFY) justification = "CENTER";
                                        else if (doc.justification === ParagraphJustification.RIGHT_JUSTIFY) justification = "RIGHT";
                                    }
                                } catch (jErr) {}
                            } catch (tdErr) {
                                defaultVal = "Essential Text";
                            }

                            essentialPropsList.push({
                                id: propId,
                                type: "text",
                                layerName: targetComp.name + " (Master Property)",
                                layerIndex: 0,
                                propertyName: propName,
                                defaultValue: defaultVal,
                                font: fontName,
                                fontSize: fontSize,
                                justification: justification,
                                isEssentialProperty: true,
                                isMasterControl: true,
                                egTemplateName: egTemplateName
                            });
                            continue;
                        }

                        // 3. Checkbox Property
                        var isCheckbox = false;
                        if (isCheckboxName(propName)) {
                            isCheckbox = true;
                        } else {
                            try {
                                var curVal = prop.value;
                                if (curVal === true || curVal === false || (curVal === 0 && prop.minValue === 0 && prop.maxValue === 1)) {
                                    isCheckbox = true;
                                }
                            } catch (cbErr) {}
                        }

                        if (isCheckbox) {
                            var boolVal = false;
                            try {
                                var chkVal = prop.value;
                                boolVal = (chkVal === 1 || chkVal === true || Number(chkVal) > 0.5);
                            } catch (cbValErr) {}

                            essentialPropsList.push({
                                id: propId,
                                type: "checkbox",
                                layerName: targetComp.name + " (Master Property)",
                                layerIndex: 0,
                                propertyName: propName,
                                defaultValue: boolVal,
                                isEssentialProperty: true,
                                isMasterControl: true,
                                egTemplateName: egTemplateName
                            });
                            continue;
                        }

                        // 4. Numeric Slider Property (1D Float or Angle)
                        try {
                            var numVal = Number(prop.value);
                            if (isNaN(numVal)) numVal = 0;
                            defaultVal = Math.round(numVal * 100) / 100;
                            maxBound = Math.max(100, Math.ceil(Math.abs(numVal) * 2));
                            minBound = numVal < 0 ? Math.floor(numVal * 1.5) : 0;
                        } catch (numErr) {
                            defaultVal = 0;
                        }

                        essentialPropsList.push({
                            id: propId,
                            type: "slider",
                            layerName: targetComp.name + " (Master Property)",
                            layerIndex: 0,
                            propertyName: propName,
                            defaultValue: defaultVal,
                            min: minBound,
                            max: maxBound,
                            isEssentialProperty: true,
                            isMasterControl: true,
                            egTemplateName: egTemplateName
                        });
                    }
                }
            } finally {
                // Ensure scratchComp is always removed
                if (scratchComp) {
                    try {
                        scratchComp.remove();
                    } catch (rmScratchErr) {}
                }
                app.endUndoGroup();
            }

            return ElementVault.formatSuccess({
                compId: targetComp.id,
                compName: targetComp.name,
                egTemplateName: egTemplateName,
                essentialCount: essentialPropsList.length,
                essentialProperties: essentialPropsList
            });
        } catch (e) {
            if (scratchComp) {
                try {
                    scratchComp.remove();
                } catch (rmErr2) {}
            }
            return ElementVault.formatError("Essential Properties inspection failed: " + e.toString());
        }
    };
})();
