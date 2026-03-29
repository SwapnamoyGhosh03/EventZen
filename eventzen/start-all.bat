@echo off
title EventZen - Start All Services
echo ============================================
echo   EventZen - Starting All Services
echo ============================================
echo.

set ROOT=%~dp0
set SERVICES_DIR=%ROOT%services

:: ---- Infrastructure ----

echo [1/9] Starting MongoDB...
start "MongoDB" cmd /c "d:\MongoDB\bin\mongod --dbpath d:\MongoDB\data\db"
timeout /t 3 /nobreak >nul

echo [2/9] Starting Kafka...
start "Kafka" cmd /c "d:\Kafka\kafka_2.13-3.7.2\bin\windows\kafka-server-start.bat d:\Kafka\kafka_2.13-3.7.2\config\kraft\server.properties"
timeout /t 5 /nobreak >nul

:: ---- Node.js Services ----

echo [3/9] Starting auth-service (port 8081)...
start "auth-service" cmd /c "cd /d %SERVICES_DIR%\auth-service && npm run dev"

echo [4/9] Starting venue-vendor-service (port 8083)...
start "venue-vendor-service" cmd /c "cd /d %SERVICES_DIR%\venue-vendor-service && npm run dev"

echo [5/9] Starting notification-service (port 8086)...
start "notification-service" cmd /c "cd /d %SERVICES_DIR%\notification-service && npm run dev"

:: ---- Spring Boot Service ----

echo [6/9] Starting event-service (port 8082)...
start "event-service" cmd /c "cd /d %SERVICES_DIR%\event-service && mvn spring-boot:run -q"

:: ---- .NET Services ----

echo [7/9] Starting ticketing-service (port 8084)...
start "ticketing-service" cmd /c "cd /d %SERVICES_DIR%\ticketing-service && set DOTNET_ROLL_FORWARD=LatestMajor && dotnet run"

echo [8/9] Starting finance-service (port 8085)...
start "finance-service" cmd /c "cd /d %SERVICES_DIR%\finance-service && set DOTNET_ROLL_FORWARD=LatestMajor && dotnet run"

:: ---- Frontend ----

echo [9/9] Starting frontend (port 5173)...
start "frontend" cmd /c "cd /d %ROOT%frontend && npm run dev"

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
echo   frontend        :  5173
echo.
echo   Each service runs in its own window.
echo   Close this window or press any key to exit.
echo ============================================
pause >nul
