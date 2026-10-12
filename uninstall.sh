#!/usr/bin/env bash
# ========================================================================
#       AE ELEMENT VAULT - CEP EXTENSION UNINSTALLER (macOS)
# ========================================================================

set -e

CEP_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions"
TARGET_LINK="$CEP_DIR/ae-element-vault"

echo "========================================================================"
echo "       AE ELEMENT VAULT - CEP EXTENSION UNINSTALLER"
echo "========================================================================"
echo ""

if [ -L "$TARGET_LINK" ] || [ -d "$TARGET_LINK" ]; then
    echo "Removing extension link from: $TARGET_LINK..."
    rm -rf "$TARGET_LINK"
    echo ""
    echo "[OK] Element Vault extension successfully uninstalled from After Effects."
else
    echo "[INFO] No installed extension link found at $TARGET_LINK."
fi

echo ""
echo "========================================================================"
echo "  Uninstallation complete. Your project files were not modified."
echo "========================================================================"
echo ""
