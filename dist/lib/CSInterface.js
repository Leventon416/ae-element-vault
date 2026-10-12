/**
 * CSInterface - v11.0.0
 * Adobe Common Extensibility Platform (CEP) Interface Library
 * Allows communication between the HTML/JavaScript CEP panel and Adobe host applications.
 */

var CSInterface = function() {
    this.hostEnvironment = null;
};

/**
 * User interface color constants.
 */
var ColorType = {
    RGB: "rgb",
    GRADIENT: "gradient"
};

var SystemPath = {
    USER_DATA: "userData",
    COMMON_FILES: "commonFiles",
    MY_DOCUMENTS: "myDocuments",
    APPLICATION: "application",
    EXTENSION: "extension",
    HOST_APPLICATION: "hostApplication"
};

var CSEvent = function(type, scope, appId, extensionId) {
    this.type = type;
    this.scope = scope || "APPLICATION";
    this.appId = appId || "";
    this.extensionId = extensionId || "";
    this.data = "";
};

CSInterface.prototype.getHostEnvironment = function() {
    if (!this.hostEnvironment) {
        var hostEnv = window.__adobe_cep__ ? window.__adobe_cep__.getHostEnvironment() : null;
        if (hostEnv) {
            this.hostEnvironment = JSON.parse(hostEnv);
        } else {
            this.hostEnvironment = {
                appName: "AEFT",
                appVersion: "25.0.0",
                appLocale: "en_US",
                appUILocale: "en_US",
                appId: "AEFT",
                isAppOnline: true,
                appSkinInfo: {
                    baseFontFamily: "Segoe UI",
                    baseFontSize: 11,
                    appBarBackgroundColor: { color: { red: 30, green: 30, blue: 30, alpha: 255 } },
                    panelBackgroundColor: { color: { red: 34, green: 34, blue: 34, alpha: 255 } },
                    systemHighlightColor: { color: { red: 20, green: 115, blue: 230, alpha: 255 } }
                }
            };
        }
    }
    return this.hostEnvironment;
};

CSInterface.prototype.closeExtension = function() {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.closeExtension();
    }
};

CSInterface.prototype.getSystemPath = function(pathType) {
    var path = "";
    if (window.__adobe_cep__) {
        path = decodeURI(window.__adobe_cep__.getSystemPath(pathType));
    }
    return path;
};

CSInterface.prototype.evalScript = function(script, callback) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.evalScript(script, callback);
    } else {
        if (callback) {
            callback("Mock EvalScript Response (Browser Dev Mode)");
        }
    }
};

CSInterface.prototype.getApplicationID = function() {
    var appId = "";
    if (window.__adobe_cep__) {
        appId = window.__adobe_cep__.getHostEnvironment();
        if (appId) {
            appId = JSON.parse(appId).appId;
        }
    }
    return appId || "AEFT";
};

CSInterface.prototype.addEventListener = function(type, listener, obj) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.addEventListener(type, listener, obj);
    } else {
        window.addEventListener(type, listener);
    }
};

CSInterface.prototype.removeEventListener = function(type, listener, obj) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.removeEventListener(type, listener, obj);
    } else {
        window.removeEventListener(type, listener);
    }
};

CSInterface.prototype.dispatchEvent = function(event) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.dispatchEvent(JSON.stringify(event));
    } else {
        var customEvt = new CustomEvent(event.type, { detail: event });
        window.dispatchEvent(customEvt);
    }
};

CSInterface.prototype.openURLInDefaultBrowser = function(url) {
    if (window.cep && window.cep.util && window.cep.util.openURLInDefaultBrowser) {
        window.cep.util.openURLInDefaultBrowser(url);
    } else if (typeof window.require !== "undefined") {
        try {
            var electron = window.require("electron");
            if (electron && electron.shell) {
                electron.shell.openExternal(url);
                return;
            }
        } catch (e) {}
        window.open(url, "_blank");
    } else {
        window.open(url, "_blank");
    }
};

CSInterface.prototype.resizeContent = function(width, height) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.resizeContent(width, height);
    }
};

CSInterface.prototype.registerKeyEventsInterest = function(keyEventsInterest) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.registerKeyEventsInterest(keyEventsInterest);
    }
};

CSInterface.prototype.setWindowTitle = function(title) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.invokeSync("setWindowTitle", title);
    }
};

CSInterface.prototype.getWindowTitle = function() {
    if (window.__adobe_cep__) {
        return window.__adobe_cep__.invokeSync("getWindowTitle", "");
    }
    return "AE Element Vault";
};

// Export to window
if (typeof window !== "undefined") {
    window.CSInterface = CSInterface;
    window.SystemPath = SystemPath;
    window.ColorType = ColorType;
    window.CSEvent = CSEvent;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { CSInterface: CSInterface, SystemPath: SystemPath, CSEvent: CSEvent };
}
