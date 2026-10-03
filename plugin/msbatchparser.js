/* Parse playlists */

var msBatchVideoParser = (function()
{
    function MsBatchVideoParser()
    {
    }

    MsBatchVideoParser.prototype = {

        parse: function (obj)
        {
            return msAbstractParser.parse(obj, [])
            .then(function(res)
            {
                if (res.hasOwnProperty("entries"))
                {
                    var totalCount = res.entries.length;
                    for (let i = res.entries.length - 1; i >= 0; --i)
                    {
                        if (!res.entries[i].hasOwnProperty("title"))
                            continue;
                        if (res.entries[i].title === "[Deleted video]" ||
                                res.entries[i].title === "[Private video]")
                        {
                            res.entries.splice(i, 1);
                        } else {
                            var idx = (i + 1).toString().padStart(totalCount > 99 ? 3 : 2, '0');
                            var origTitle = res.entries[i].title;
                            
                            // Video Entry
                            res.entries[i].title = idx + " - " + origTitle;
                            var sep = res.entries[i].url.indexOf('?') === -1 ? '?' : '&';
                            res.entries[i].url += sep + "playlist_index=" + idx;
                            
                            // Subtitle Entry
                            var subEntry = JSON.parse(JSON.stringify(res.entries[i]));
                            subEntry.title = "[SUBTITLE] " + subEntry.title;
                            subEntry.id = subEntry.id + "_sub";
                            subEntry.url += "&dl_subtitle_only=1";
                            
                            res.entries.splice(i + 1, 0, subEntry);
                        }
                    }
                }
                return res;
            });
        },

        isSupportedSource: msAbstractParser.isSupportedSource,

        supportedSourceCheckPriority: function()
        {
            // we need to parse as a playlist at first
            return msAbstractParser.supportedSourceCheckPriority() + 1;
        },

        isPossiblySupportedSource: msAbstractParser.isPossiblySupportedSource,

        overrideUrlPolicy: msAbstractParser.overrideUrlPolicy
    };

    return new MsBatchVideoParser();
}());
