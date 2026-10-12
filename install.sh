#!/usr/bin/env bash
# ========================================================================
#       AE ELEMENT VAULT - CEP EXTENSION AUTOMATED INSTALLER (macOS)
# ========================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CEP_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions"
TARGET_LINK="$CEP_DIR/ae-element-vault"

echo "========================================================================"
echo "       AE ELEMENT VAULT - CEP EXTENSION AUTOMATED INSTALLER"
echo "========================================================================"
echo ""

# 1. Enable PlayerDebugMode in macOS preferences for CSXS 9 through 16
echo "[1/3] Enabling CEP PlayerDebugMode in macOS preferences..."
for v in 9 10 11 12 13 14 15 16; do
    defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1 2>/dev/null || true
    echo "  [OK] PlayerDebugMode enabled for CSXS.$v"
done

# 2. Ensure system CEP extensions directory exists
echo ""
echo "[2/3] Checking Adobe CEP extensions directory..."
if [ ! -d "$CEP_DIR" ]; then
    echo "  Creating directory: $CEP_DIR"
    mkdir -p "$CEP_DIR"
else
    echo "  Directory exists: $CEP_DIR"
fi

# 3. Create symlink to current project folder
echo ""
echo "[3/3] Creating extension symlink in Adobe CEP directory..."
if [ -L "$TARGET_LINK" ] || [ -d "$TARGET_LINK" ]; then
    echo "  Removing previous extension link..."
    rm -rf "$TARGET_LINK"
fi

ln -s "$SCRIPT_DIR" "$TARGET_LINK"
echo "  [OK] Extension symlink created: $TARGET_LINK -> $SCRIPT_DIR"

echo ""
echo "========================================================================"
echo "  Element Vault successfully installed! Launch Adobe After Effects and open Window > Extensions > Element Vault"
echo "========================================================================"
echo ""
