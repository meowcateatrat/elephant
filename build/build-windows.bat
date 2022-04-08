@echo off
del elephant.fda
call "%ProgramFiles%\7-zip\7z.exe" a -mx9 elephant.zip %~dp0..\plugin\*
ren elephant.zip elephant.fda