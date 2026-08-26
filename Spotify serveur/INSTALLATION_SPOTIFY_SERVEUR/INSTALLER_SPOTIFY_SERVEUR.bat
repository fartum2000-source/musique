@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Installation automatique - Spotify Serveur
color 0A

echo ==============================================
echo     INSTALLATION AUTOMATIQUE DU SERVEUR
echo ==============================================
echo.

REM --- Verifie winget ---
where winget >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] winget n'est pas disponible sur ce PC.
    echo Installe ou mets a jour "App Installer" depuis le Microsoft Store,
    echo puis relance ce fichier.
    echo.
    pause
    exit /b 1
)

REM --- Installe Python si necessaire ---
echo [1/4] Verification de Python...
python --version >nul 2>&1
if errorlevel 1 (
    py --version >nul 2>&1
    if errorlevel 1 (
        echo Python n'est pas installe. Installation en cours...
        winget install --id Python.Python.3.13 -e --source winget --accept-package-agreements --accept-source-agreements
        if errorlevel 1 (
            echo [ERREUR] Impossible d'installer Python.
            pause
            exit /b 1
        )
    )
)

REM --- Recharge PATH pour la session ---
set "PATH=%LocalAppData%\Programs\Python\Python313;%LocalAppData%\Programs\Python\Python313\Scripts;%PATH%"
set "PATH=%ProgramFiles%\Python313;%ProgramFiles%\Python313\Scripts;%PATH%"

REM --- Choisit python ou py ---
set "PYTHON_CMD="
where python >nul 2>&1
if not errorlevel 1 set "PYTHON_CMD=python"

if not defined PYTHON_CMD (
    where py >nul 2>&1
    if not errorlevel 1 set "PYTHON_CMD=py"
)

if not defined PYTHON_CMD (
    echo [ERREUR] Python est installe mais n'est pas encore accessible.
    echo Ferme cette fenetre, redemarre Windows si necessaire, puis relance.
    pause
    exit /b 1
)

echo Python detecte avec : %PYTHON_CMD%
%PYTHON_CMD% --version
echo.

REM --- Met a jour pip ---
echo [2/4] Mise a jour de pip...
%PYTHON_CMD% -m pip install --upgrade pip
if errorlevel 1 (
    echo [AVERTISSEMENT] La mise a jour de pip a echoue, on continue...
)
echo.

REM --- Installe yt-dlp ---
echo [3/4] Installation de yt-dlp...
%PYTHON_CMD% -m pip install --upgrade yt-dlp
if errorlevel 1 (
    echo [ERREUR] Impossible d'installer yt-dlp.
    pause
    exit /b 1
)

REM --- Installe FFmpeg via winget (utile pour les conversions audio/video) ---
echo.
echo Installation/verifications de FFmpeg...
winget install --id Gyan.FFmpeg.Shared -e --source winget --accept-package-agreements --accept-source-agreements >nul 2>&1
if errorlevel 1 (
    echo FFmpeg n'a pas ete installe automatiquement ou est deja installe.
)

REM --- Installe les dependances du projet si requirements.txt existe ---
if exist "requirements.txt" (
    echo.
    echo [4/4] Installation des dependances de requirements.txt...
    %PYTHON_CMD% -m pip install -r requirements.txt
) else (
    echo.
    echo [4/4] Aucun requirements.txt trouve.
)

echo.
echo ==============================================
echo        INSTALLATION TERMINEE !
echo ==============================================
echo.
echo yt-dlp :
%PYTHON_CMD% -m yt_dlp --version
echo.

REM --- Lance automatiquement le serveur si un fichier courant existe ---
if exist "server.py" (
    echo Lancement de server.py...
    %PYTHON_CMD% server.py
    goto :end
)

if exist "app.py" (
    echo Lancement de app.py...
    %PYTHON_CMD% app.py
    goto :end
)

if exist "main.py" (
    echo Lancement de main.py...
    %PYTHON_CMD% main.py
    goto :end
)

echo Aucun server.py, app.py ou main.py trouve.
echo Les dependances sont installees.
echo Place ce fichier dans le dossier de ton projet puis relance-le.
echo.

:end
echo.
echo Appuie sur une touche pour fermer...
pause >nul
endlocal
