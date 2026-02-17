# Elephant
Add-on for [Free Download Manager](https://www.freedownloadmanager.org/). Provides support for downloading videos from various sites.

Powered by [YT-DLP](https://github.com/yt-dlp/yt-dlp).

Check [Free Download Manager forum](https://www.freedownloadmanager.org/board/viewtopic.php?f=1&t=18630) for more details.

Website: [free-addons.org](https://free-addons.org/).

# Dependencies
Free Download Manager 6.32 (or higher) is required.

Python 3.10 (or higher) and Deno 2.0 (or higher) are required. Both can be installed by Free Download Manager automatically when installing add-on.

# Building
> **_NOTE:_**  You don't have to build Elephant add-on on your own, if you don't want to. Just proceeed to the Installation section then.
1. Clone (download) repository.
2. Windows: Make sure you have 7-Zip installed. 
3. Windows: Launch build/build-windows.bat. Unix: Launch build/build-unix.sh.

# Installation
1. Build elephant.fda, or download a prebuilt one from GitHub Releases section.
2. Install elephant.fda addon into FDM using its menu (make sure you have the latest FDM installed).

# Troubleshooting
Can't download? Make sure that "Allow add-ons to use web browser cookies" option is enabled in FDM add-ons' settings. Beware that by enabling this option you run the risk of your account being banned (temporarily or permanently). Be mindful with the request rate and amount of downloads you make with an account.

One more thing to note is that Mozilla Firefox web browser is recommended, as it's well supported to get the cookies from.
