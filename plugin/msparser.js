var msParser = (function()
{
    function MsParser()
    {
    }

    MsParser.prototype = {

        parse: function (obj)
        {
            return msAbstractParser.parse(obj, ["--no-playlist"]);
        },

        isSupportedSource: msAbstractParser.isSupportedSource,

        supportedSourceCheckPriority: msAbstractParser.supportedSourceCheckPriority,

        isPossiblySupportedSource: msAbstractParser.isPossiblySupportedSource,

	overrideUrlPolicy: msAbstractParser.overrideUrlPolicy
    };

    return new MsParser();
}());
