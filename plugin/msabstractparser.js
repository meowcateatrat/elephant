var msAbstractParser = (function()
{
    function MsAbstractParser()
    {
    }

    MsAbstractParser.prototype = {

        parse: function (obj, customArgs)
        {
            console.log("parsing...");

            var args = [];

            var proxyUrl = qtJsNetworkProxyMgr.proxyForUrl(obj.url).url();
            if (proxyUrl)
                args.push("--proxy", proxyUrl);

            args.push("-J", "--flat-playlist", "--no-warnings", "--compat-options", "no-youtube-unavailable-videos");
            args.push("--write-subs", "--write-auto-subs", "--sub-langs", "all");
            args.push("--geo-bypass");

            if (customArgs.length)
                args = args.concat(customArgs);

            var isSubOnly = false;
            var playlistIdx = "";
            
            if (obj.url.indexOf('dl_subtitle_only=1') !== -1) {
                isSubOnly = true;
                obj.url = obj.url.replace('&dl_subtitle_only=1', '').replace('?dl_subtitle_only=1', '');
            }
            
            var match = obj.url.match(/[?&]playlist_index=([0-9]+)/);
            if (match) {
                playlistIdx = match[1];
                obj.url = obj.url.replace('&playlist_index=' + playlistIdx, '').replace('?playlist_index=' + playlistIdx, '');
            }

            args.push(obj.url);

            return launchPythonScript(obj.requestId, obj.interactive, "yt-dlp/yt_dlp/__main__.py", args)
            .then(function(obj)
            {
                console.log("Python result: ", obj.output);

                return new Promise(function (resolve, reject)
                {
                    var output = obj.output.trim();
                    var startIndex = output.indexOf('{');
                    if (startIndex !== -1) {
                        output = output.substring(startIndex);
                    }
                    if (!output || output[0] !== '{')
                    {
                        var isUnsupportedUrl = /ERROR:\s*\[generic\]\s*Unsupported URL:/.test(output);
                        reject({
                                   error: isUnsupportedUrl ? "Unsupported URL" : "Parse error",
                                   isParseError: !isUnsupportedUrl
                               });
                    }
                    else
                    {
                        var parsed = JSON.parse(output);
                        
                        function filterSubs(subObj) {
                            if (!subObj) return subObj;
                            var filtered = {};
                            var keepAll = false; // "option" to keep all if needed, but we hardcode false for clean UI
                            
                            for (var lang in subObj) {
                                var l = lang.toLowerCase();
                                if (l.startsWith('ar') || l.startsWith('en')) {
                                    filtered[lang] = subObj[lang];
                                }
                            }
                            // If they really want all languages in the future, we can change keepAll to true here
                            return keepAll ? subObj : filtered;
                        }
                        
                        function injectSubsAsFormats(subsObj, isAuto) {
                            if (!subsObj || !parsed.formats) return;
                            for (var lang in subsObj) {
                                var subsArray = subsObj[lang];
                                if (subsArray && subsArray.length > 0) {
                                    var bestSub = null;
                                    for(var i=0; i<subsArray.length; i++){
                                        if(subsArray[i].ext === 'vtt' || subsArray[i].ext === 'srt'){
                                            bestSub = subsArray[i];
                                            break;
                                        }
                                    }
                                    if(!bestSub) bestSub = subsArray[0];
                                    
                                    var tag = isAuto ? "(Auto)" : "";
                                    parsed.formats.push({
                                        format_id: "sub_" + lang + (isAuto ? "_auto" : ""),
                                        ext: bestSub.ext,
                                        vcodec: "none",
                                        acodec: "aac", // Fake audio codec so FDM puts it in the Audio list
                                        resolution: "Subtitle " + lang.toUpperCase(), // Helps FDM identify it in dropdowns
                                        format_note: "SUBTITLE ONLY " + tag + " - " + lang.toUpperCase(),
                                        format: "SUBTITLE ONLY " + tag + " - " + lang.toUpperCase(),
                                        url: bestSub.url,
                                        protocol: "https"
                                    });
                                }
                            }
                        }

                        if (playlistIdx !== "") {
                            if (parsed.title) parsed.title = playlistIdx + " - " + parsed.title;
                            if (parsed._filename) parsed._filename = playlistIdx + " - " + parsed._filename;
                            if (parsed.filename) parsed.filename = playlistIdx + " - " + parsed.filename;
                        }
                        
                        if (parsed.subtitles) {
                            parsed.subtitles = filterSubs(parsed.subtitles);
                        }
                        if (parsed.automatic_captions) {
                            parsed.automatic_captions = filterSubs(parsed.automatic_captions);
                        }

                        if (isSubOnly) {
                            parsed.formats = [];
                            
                            function extractSubsToFormats(subsObj) {
                                if (!subsObj) return;
                                for (var lang in subsObj) {
                                    var subsArray = subsObj[lang];
                                    if (subsArray && subsArray.length > 0) {
                                        var bestSub = null;
                                        for(var i=0; i<subsArray.length; i++){
                                            if(subsArray[i].ext === 'vtt' || subsArray[i].ext === 'srt'){
                                                bestSub = subsArray[i];
                                                break;
                                            }
                                        }
                                        if(!bestSub) bestSub = subsArray[0];
                                        
                                        parsed.formats.push({
                                            format_id: "sub_" + lang,
                                            ext: bestSub.ext,
                                            vcodec: "avc1.4d401e", // Fake video codec to pass FDM batch filter
                                            acodec: "mp4a.40.2",
                                            width: 1920,
                                            height: 1080,
                                            resolution: "1080p",
                                            url: bestSub.url,
                                            protocol: "https"
                                        });
                                    }
                                }
                            }
                            extractSubsToFormats(parsed.subtitles);
                            extractSubsToFormats(parsed.automatic_captions);
                        } else {
                            // Inject them normally for single videos just in case
                            if (parsed.subtitles) injectSubsAsFormats(parsed.subtitles, false);
                            if (parsed.automatic_captions) injectSubsAsFormats(parsed.automatic_captions, true);
                        }
                        
                        resolve(parsed);
                    }
                });
            });
        },

        isSupportedSource: function(url)
        {
            return false;
        },

        supportedSourceCheckPriority: function()
        {
            return 0;
        },

        isPossiblySupportedSource: function(obj)
        {
            if (obj.contentType && !/^text\/html(;.*)?$/.test(obj.contentType))
                return false;
            if (obj.resourceSize !== -1 &&
                    (obj.resourceSize === 0 || obj.resourceSize > 3*1024*1024))
            {
                return false;
            }
            return /^https?:\/\//.test(obj.url);
        },

	overrideUrlPolicy: function(url)
	{
	    return true;
	}
    };

    return new MsAbstractParser();
}());
