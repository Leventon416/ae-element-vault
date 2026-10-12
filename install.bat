@echo off
setlocal enabledelayedexpansion

echo ========================================================================
echo        AE ELEMENT VAULT - CEP EXTENSION AUTOMATED INSTALLER
echo ========================================================================
echo.

:: 1. Enable PlayerDebugMode in Windows Registry for CSXS 9 through 16
echo [1/3] Enabling CEP PlayerDebugMode in Windows Registry...
for %%v in (9 10 11 12 13 14 15 16) do (
    reg add "HKCU\Software\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
    if !errorlevel! equ 0 (
        echo   [OK] PlayerDebugMode enabled for CSXS.%%v
    ) else (
        echo   [WARN] Could not write registry key for CSXS.%%v
    )
)

:: 2. Ensure system CEP extensions directory exists
echo.
echo [2/3] Checking Adobe CEP extensions directory...
set "CEP_DIR=%APPDATA%\Adobe\CEP\extensions"
if not exist "%CEP_DIR%" (
    echo   Creating directory: "%CEP_DIR%"
    mkdir "%CEP_DIR%"
) else (
    echo   Directory exists: "%CEP_DIR%"
)

:: 3. Create directory junction to current repository
echo.
echo [3/3] Creating extension link in Adobe CEP directory...
set "TARGET_LINK=%CEP_DIR%\ae-element-vault"
set "SOURCE_DIR=%~dp0"

:: Strip trailing backslash from source path if present
if "%SOURCE_DIR:~-1%"=="\" set "SOURCE_DIR=%SOURCE_DIR:~0,-1%"

:: Remove existing link or directory if present
if exist "%TARGET_LINK%" (
    echo   Removing previous extension link...
    rmdir "%TARGET_LINK%" 2>nul || (
        echo   [NOTE] Cleaning existing directory...
        rd /s /q "%TARGET_LINK%" 2>nul
    )
)

:: Create directory junction
mklink /J "%TARGET_LINK%" "%SOURCE_DIR%" >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Extension directory junction created successfully!
) else (
    echo   [FALLBACK] mklink failed, copying extension directory...
    xcopy /E /I /Y "%SOURCE_DIR%" "%TARGET_LINK%" >nul
)

echo.
echo ========================================================================
echo   Element Vault successfully installed! Launch Adobe After Effects and open Window ^> Extensions ^> Element Vault
echo ========================================================================
echo.

pause
