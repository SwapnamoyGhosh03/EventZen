@echo off
title EventZen - Start All Services
echo ============================================
echo   EventZen - Starting All Backend Services
echo ============================================
echo.

set ROOT=%~dp0
set EVENTZEN_ROOT=%ROOT%eventzen
set SERVICES_DIR=%EVENTZEN_ROOT%\services

set VAULT_MODE=dev
for /f "tokens=1,* delims==" %%A in ('findstr /b /i "VAULT_MODE=" "%EVENTZEN_ROOT%\.env"') do set VAULT_MODE=%%B

if /I "%VAULT_MODE%"=="dev" (
	echo [0/8] Starting Vault dev services...
	cd /d "%EVENTZEN_ROOT%"
	docker compose --profile vault-dev up -d vault vault-init
	if errorlevel 1 (
		echo Failed to start Vault dev services. Aborting startup.
		exit /b 1
	)
	cd /d "%ROOT%"
)

echo [0/8] Rendering Vault-backed environment variables...
powershell -NoProfile -ExecutionPolicy Bypass -File "%EVENTZEN_ROOT%\scripts\vault\Render-VaultEnv.ps1" -Target local -EnvFilePath ".env"
if errorlevel 1 (
	echo Failed to render Vault secrets. Aborting startup.
	exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%A in ("%EVENTZEN_ROOT%\.vault\generated\local.env") do (
	if not "%%A"=="" if /I not "%%A:~0,1%"=="#" set "%%A=%%B"
)

:: ---- Infrastructure ----

echo [1/8] Starting MongoDB...
start "MongoDB" cmd /c "d:\MongoDB\bin\mongod --dbpath d:\MongoDB\data\db"
timeout /t 3 /nobreak >nul

echo [2/8] Starting Kafka...
start "Kafka" cmd /c "d:\Kafka\kafka_2.13-3.7.2\bin\windows\kafka-server-start.bat d:\Kafka\kafka_2.13-3.7.2\config\kraft\server.properties"
timeout /t 5 /nobreak >nul

:: ---- Node.js Services ----

echo [3/8] Starting auth-service (port 8081)...
start "auth-service" cmd /c "cd /d %SERVICES_DIR%\auth-service && npm run dev"

echo [4/8] Starting venue-vendor-service (port 8083)...
start "venue-vendor-service" cmd /c "cd /d %SERVICES_DIR%\venue-vendor-service && npm run dev"

echo [5/8] Starting notification-service (port 8086)...
start "notification-service" cmd /c "cd /d %SERVICES_DIR%\notification-service && npm run dev"

:: ---- Spring Boot Service ----

echo [6/8] Starting event-service (port 8082)...
start "event-service" cmd /c "cd /d %SERVICES_DIR%\event-service && mvn spring-boot:run -q"

:: ---- .NET Services ----

echo [7/8] Starting ticketing-service (port 8084)...
start "ticketing-service" cmd /c "cd /d %SERVICES_DIR%\ticketing-service && set DOTNET_ROLL_FORWARD=LatestMajor && dotnet run"

echo [8/8] Starting finance-service (port 8085)...
start "finance-service" cmd /c "cd /d %SERVICES_DIR%\finance-service && set DOTNET_ROLL_FORWARD=LatestMajor && dotnet run"

echo.
echo ============================================
echo   All services launched!
echo ============================================
echo.
echo   MongoDB         :  27017
echo   Kafka           :  9092
echo   auth-service    :  8081
echo   event-service   :  8082
echo   venue-vendor    :  8083
echo   ticketing       :  8084
echo   finance         :  8085
echo   notification    :  8086
echo.
echo   Each service runs in its own window.
echo   Close this window or press any key to exit.
echo ============================================
pause >nul
