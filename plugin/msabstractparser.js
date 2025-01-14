var g_browsers = Object.create(null);

var msAbstractParser = (function()
{
    function MsAbstractParser()
    {
    }

    MsAbstractParser.prototype = {

        parse: function (obj, customArgs)
        {
            console.log("parsing...");

            let args = [];
            let tmpCookies;
            let systemUserAgent;
            let systemBrowser;
            
            try
            {
                systemUserAgent = qtJsSystem.defaultUserAgent;
                systemBrowser = qtJsSystem.defaultWebBrowser;
            }
            catch(e) {}

            let proxyUrl = qtJsNetworkProxyMgr.proxyForUrl(obj.url).url();
            if (proxyUrl)
            {
                proxyUrl = proxyUrl.replace(/^https:\/\//i, 'http://'); // FDM bug workaround
                args.push("--proxy", proxyUrl);
            }

            args.push("-J", "--flat-playlist", "--no-warnings", "--compat-options", "no-youtube-unavailable-videos");

            if (obj.cookies && obj.cookies.length)
            {
                tmpCookies = qtJsTools.createTmpFile("request_" + obj.requestId + "_cookies");
                if (tmpCookies && tmpCookies.writeText(cookiesToNetscapeText(obj.cookies)))
                    args.push("--cookies", tmpCookies.path);
            }
            else
            {
                let browser = obj.browser || systemBrowser;
                if (browser)
                {
                    if (!(browser in g_browsers))
                    {
                        return this.checkBrowser(obj.requestId, obj.interactive, browser)
                            .then(() => this.parse(obj, customArgs));
                    }
                    else if (g_browsers[browser])
                    {
                        args.push('--cookies-from-browser', browser);
                    }
                }
            }
            
            let userAgent = obj.userAgent || systemUserAgent;
            if (userAgent)
                args.push('--user-agent', userAgent);

            if (customArgs.length)
                args = args.concat(customArgs);

            args.push(obj.url);

            return launchPythonScript(obj.requestId, obj.interactive, "yt-dlp/yt_dlp/__main__.py", args)
            .then(function(obj)
            {
                console.log("Python result: ", obj.output);

                return new Promise(function (resolve, reject)
                {
                    var output = obj.output.trim();
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
                        resolve(JSON.parse(output));
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
        },
        
        checkBrowser: function(requestId, interactive, browser)
        {
            console.log("Checking browser support (", browser, ")...");
            
            return launchPythonScript(requestId, interactive, "yt-dlp/yt_dlp/__main__.py", ['--cookies-from-browser', browser, 'e692ec362191442c960a761ac6b84878://test.test'])
            .then(function(obj)
            {
                console.log("Python result: ", obj.output);

                return new Promise(function (resolve, reject)
                {
                    var output = obj.output.trim();
                    if (!output)
                    {
                        reject({
                                   error: "Parse error",
                                   isParseError: false
                               });
                    }
                    else
                    {
                        let isSupported = /"e692ec362191442c960a761ac6b84878"/.test(output);
                        
                        console.log(browser, " supported: ", isSupported);
                        
                        g_browsers[browser] = isSupported;
                        
                        resolve();
                    }
                });
            });
        }
    };

    return new MsAbstractParser();
}());
