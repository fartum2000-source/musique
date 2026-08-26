@echo off
setlocal
title Spotify - Lecteur musical + MP3
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 goto PYTHON
where python >nul 2>nul
if %errorlevel%==0 goto PYTHON

echo Python est introuvable.
echo Installe Python puis relance ce fichier.
pause
exit /b 1

:PYTHON
echo.
echo === Verification des dependances ===
py -c "import yt_dlp" >nul 2>nul
if %errorlevel% neq 0 (
    echo Installation de yt-dlp...
    py -m pip install -U yt-dlp
    if %errorlevel% neq 0 goto INSTALL_ERROR
)

py -c "import imageio_ffmpeg" >nul 2>nul
if %errorlevel% neq 0 (
    echo Installation automatique de FFmpeg ^(imageio-ffmpeg^)...
    py -m pip install -U imageio-ffmpeg
    if %errorlevel% neq 0 goto INSTALL_ERROR
)

echo.
echo Dependances OK.
echo Le lecteur audio YouTube utilise maintenant le serveur local.
echo.
start "" http://127.0.0.1:8000
py server.py
exit /b 0

:INSTALL_ERROR
echo.
echo Une dependance n'a pas pu etre installee.
echo Verifie ta connexion Internet puis relance LANCER.bat.
pause
exit /b 1
