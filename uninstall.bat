@echo off
setlocal

echo ========================================================================
echo        AE ELEMENT VAULT - CEP EXTENSION UNINSTALLER
echo ========================================================================
echo.

set "CEP_DIR=%APPDATA%\Adobe\CEP\extensions"
set "TARGET_LINK=%CEP_DIR%\ae-element-vault"

if exist "%TARGET_LINK%" (
    echo Removing extension link from: "%TARGET_LINK%"...
    rmdir "%TARGET_LINK%" 2>nul || (
        rd /s /q "%TARGET_LINK%" 2>nul
    )
    echo.
    echo [OK] Element Vault extension successfully uninstalled from After Effects.
) else (
    echo [INFO] No installed extension link found at "%TARGET_LINK%".
)

echo.
echo ========================================================================
echo   Uninstallation complete. Your project files were not modified.
echo ========================================================================
echo.

pause
