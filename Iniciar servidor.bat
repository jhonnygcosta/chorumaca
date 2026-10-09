@echo off
chcp 65001 >nul
title Chorumaçã O Jogo! - servidor
cd /d "%~dp0"
node servidor.mjs 8080
pause
