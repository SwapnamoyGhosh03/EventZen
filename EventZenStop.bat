@echo off
setlocal EnableExtensions

title EventZen - Stop All Services

echo ============================================
echo   EventZen - Shutdown Script
echo ============================================
echo.

set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR%eventzen"

if not exist "%APP_DIR%\docker-compose.yml" (
  set "APP_DIR=%SCRIPT_DIR%"
)

if not exist "%APP_DIR%\docker-compose.yml" (
  echo [ERROR] Could not find docker-compose.yml.
  echo Place this script in repository root or run it from that location.
  exit /b 1
)

echo [1/3] Checking Docker CLI...
where docker >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker CLI is not installed or not in PATH.
  exit /b 1
)

echo [2/3] Checking Docker engine...
docker info >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker engine is not running.
  echo Start Docker Desktop to manage containers.
  exit /b 1
)

echo [3/3] Stopping EventZen services...
pushd "%APP_DIR%"
docker compose down
if errorlevel 1 (
  echo [ERROR] Failed to stop one or more services.
  popd
  exit /b 1
)
popd

echo.
echo ============================================
echo   EventZen services stopped successfully
echo ============================================
echo.
echo To start again, run:
echo   EventZenStart.bat
echo ============================================

endlocal
exit /b 0
