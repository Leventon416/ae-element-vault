/**
 * AE Element Vault - Dependency Isolation & Reduction Engine
 * Modular ExtendScript ES3 Module
 */

(function() {
    if (typeof ElementVault === "undefined") {
        ElementVault = {};
    }

    /**
     * Helper to find a composition by ID in the active project
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
     * Recursively collects direct and nested dependencies of a composition
     * @param {CompItem} comp
     * @param {Object} visited
     * @param {Object} result
     */
    function collectDependencies(comp, visited, result) {
        if (!comp || visited[comp.id]) {
            return;
        }
        visited[comp.id] = true;

        for (var i = 1; i <= comp.numLayers; i++) {
            var lyr = comp.layer(i);
            var src = lyr.source;
            if (src) {
                if (src instanceof CompItem) {
                    if (!visited[src.id]) {
                        result.comps.push(src.name);
                        collectDependencies(src, visited, result);
                    }
                } else if (src instanceof FootageItem) {
                    var isSolid = (src.mainSource && (src.mainSource instanceof SolidSource || (typeof src.mainSource.isSolid !== "undefined" && src.mainSource.isSolid)));
                    if (isSolid) {
                        if (!result.solidsMap[src.name]) {
                            result.solidsMap[src.name] = true;
                            result.solids.push(src.name);
                        }
                    } else {
                        if (!result.footagesMap[src.name]) {
                            result.footagesMap[src.name] = true;
                            result.footages.push(src.name);
                        }
                    }
                }
            }
        }
    }

    /**
     * Non-destructively inspects a composition and analyzes all direct dependencies
     * @param {number} compId
     * @returns {string} Serialized JSON response
     */
    ElementVault.analyzeDependencies = function(compId) {
        try {
            if (!app.project) {
                return ElementVault.formatError("No active project open in After Effects.");
            }

            var targetComp = findCompById(compId);
            if (!targetComp) {
                return ElementVault.formatError("Composition with ID " + compId + " not found.");
            }

            var visited = {};
            var result = {
                comps: [],
                footages: [],
                footagesMap: {},
                solids: [],
                solidsMap: {}
            };

            collectDependencies(targetComp, visited, result);

            var totalItems = app.project.numItems;
            var retainedDependencies = 1 + result.comps.length + result.footages.length + result.solids.length;
            var estimatedRemoved = Math.max(0, totalItems - retainedDependencies);

            var depSummary = {
                comps: result.comps,
                footages: result.footages,
                solids: result.solids
            };

            return ElementVault.formatSuccess({
                compName: targetComp.name,
                itemsRemoved: estimatedRemoved,
                remainingCount: retainedDependencies,
                directDependencies: depSummary,
                dependencies: depSummary
            });
        } catch (e) {
            return ElementVault.formatError("Error analyzing dependencies: " + e.toString());
        }
    };

    /**
     * Isolates target composition into a lean dependency tree using reduceProject
     * @param {number} compId Target composition ID
     * @param {Object} options Options object ({ dryRun: boolean })
     * @returns {string} Serialized JSON response
     */
    ElementVault.isolateComposition = function(compId, options) {
        try {
            if (!app.project) {
                return ElementVault.formatError("No active project open in After Effects.");
            }

            var targetComp = findCompById(compId);
            if (!targetComp) {
                return ElementVault.formatError("Composition with ID " + compId + " not found.");
            }

            var isDryRun = (options && options.dryRun === true);

            // If dryRun is requested, simulate reduction by returning analyzed dependency tree
            if (isDryRun) {
                return ElementVault.analyzeDependencies(compId);
            }

            // Safety Guard: verify that original project file path is known or save temporary duplicate
            if (!app.project.file) {
                var tempFolder = Folder.temp;
                var backupFile = new File(tempFolder.fsName + "/Vault_Backup_" + (new Date().getTime()) + ".aep");
                try {
                    app.project.save(backupFile);
                } catch (saveErr) {
                    // Ignore if cannot save temp duplicate, proceed with UndoGroup protection
                }
            }

            // Destructive reduction wrapped in an UndoGroup for editor safety
            app.beginUndoGroup("Vault: Isolate Composition " + targetComp.name);
            var itemsRemoved = app.project.reduceProject([targetComp]);

            var remainingComps = [];
            var remainingFootages = [];
            var remainingSolids = [];
            var folderCount = 0;

            for (var k = 1; k <= app.project.numItems; k++) {
                var itm = app.project.item(k);
                if (itm instanceof CompItem) {
                    if (itm.id != targetComp.id) {
                        remainingComps.push(itm.name);
                    }
                } else if (itm instanceof FootageItem) {
                    var isSolidItem = (itm.mainSource && (itm.mainSource instanceof SolidSource || (typeof itm.mainSource.isSolid !== "undefined" && itm.mainSource.isSolid)));
                    if (isSolidItem) {
                        remainingSolids.push(itm.name);
                    } else {
                        remainingFootages.push(itm.name);
                    }
                } else if (itm instanceof FolderItem) {
                    folderCount++;
                }
            }
            app.endUndoGroup();

            return ElementVault.formatSuccess({
                compName: targetComp.name,
                itemsRemoved: itemsRemoved,
                remainingCount: app.project.numItems,
                categorized: {
                    compositions: remainingComps.length,
                    footages: remainingFootages.length,
                    solids: remainingSolids.length,
                    folders: folderCount
                },
                dependencies: {
                    comps: remainingComps,
                    footages: remainingFootages,
                    solids: remainingSolids
                }
            });
        } catch (e) {
            return ElementVault.formatError("Failed to isolate composition: " + e.toString());
        }
    };
})();
