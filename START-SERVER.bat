@echo off
echo ========================================
echo Enterprise Audit Dashboard - Server
echo ========================================
echo.
echo Starting local web server...
echo.
echo The dashboard will be available at:
echo   http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Try Python 3 first
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting Python HTTP Server...
    python -m http.server 8000
    goto :end
)

REM Try Python 2
python2 --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting Python 2 HTTP Server...
    python2 -m SimpleHTTPServer 8000
    goto :end
)

REM Try Node.js http-server
http-server --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting Node.js HTTP Server...
    http-server -p 8000
    goto :end
)

echo ERROR: No compatible server found!
echo.
echo Please install one of the following:
echo   - Python 3 (python.org/downloads)
echo   - Python 2 (python.org/downloads)
echo   - Node.js http-server (npm install -g http-server)
echo.
echo Or open demo.html for more options.
pause

:end