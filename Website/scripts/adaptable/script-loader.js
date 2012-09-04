(function()
{
  if (!AdapTable)
    throw "AdapTable core is not loaded.";

  var ONE_YEAR_EXPIRATION = 8760;

  AdapTable.ScriptLoader =
  {
    /**************************************************************************
    * Downloads a JavaScript file asynchronously and caches it in localStorage
    * and injects it into the HEAD element.
    *
    * @param scriptFile {string} The JavaScript file to load.
    * @param expiration {int} The number of hours until the cached version of
    * the script expires.
    * @param shouldInject {boolean} True to inject the JavaScript into the HEAD
    * element, false to just cache it.
    * @param callback {function} A function to call after the script has
    * loaded.
    **************************************************************************/
    getScript: function(scriptFile, expiration, shouldInject, callback)
    {
      if (!scriptFile)
        return;
      else if (expiration == null)
        expiration = 24;
      else if (expiration == 0)
        expiration = ONE_YEAR_EXPIRATION;

      var cachedScript = JSON.parse(localStorage.getItem(AdapTable.STORAGE_PREFIX + scriptFile));
      if (cachedScript && (cachedScript.Expiration > (+new Date())))
      {
        if (shouldInject)
          injectScript(cachedScript, scriptFile);

        if (callback)
          callback();

        return;
      }

      $.ajax(AdapTable.BasePath + AdapTable.SUB_FOLDER + scriptFile,
      {
        type: "GET",
        dataType: "text",
        success: function(script)
        {
          var cachedScript =
          {
            Expiration: (+new Date()) + (expiration * 1000 * 60 * 60),
            Script: script
          };

          if (expiration > -1)
            localStorage.setItem(AdapTable.STORAGE_PREFIX + scriptFile, JSON.stringify(cachedScript));

          if (shouldInject)
            injectScript(cachedScript, scriptFile);

          if (callback)
            callback();
        },
        error: function(jqXHR, textStatus, errorThrown)
        {
          throw "Failed to retrieve: " + scriptFile + ".\n\n" + errorThrown;
        }
      });
    },

    /**************************************************************************
    * Downloads multiple JavaScript files asynchronously and caches them in
    * localStorage. Each file is then injected into the HEAD element in the same
    * order specified.
    *
    * @param scriptFile {array} An array of JavaScript files to load.
    * @param expiration {int} The number of hours until the cached version of
    * the scripts expires.
    * @param callback {function} A function to call after all scripts have
    * loaded.
    **************************************************************************/
    getScripts: function(scripts, expiration, callback)
    {
      if (!scripts || scripts.Length < 1)
        return;

      for (var scriptIndex = 0; scriptIndex < scripts.length; scriptIndex++)
        this.getScript(scripts[scriptIndex], expiration, false);

      waitForAllScripts(scripts, callback);
    }
  };

  /****************************************************************************
  * Injects a JavaScript into the HEAD element of the page.
  *
  * @param cachedScript {object} A cached script.
  * @param scriptFile {string} The JavaScript file to load.
  ****************************************************************************/
  function injectScript(cachedScript, scriptFile)
  {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.text = cachedScript.Script;

    document.getElementsByTagName("head")[0].appendChild(script);
  }

  /****************************************************************************
  * Waits for all scripts to be cached and then injects them onto the
  * page in order.
  *
  * @param scripts {array} A string array of JavaScript files.
  * @param callback {function} A function to call after all scripts have
  * loaded.
  ****************************************************************************/
  function waitForAllScripts(scripts, callback)
  {
    var missingScripts = scripts.slice(0);

    var scriptsLoaded = setInterval(function()
    {
      for (var scriptIndex = 0; scriptIndex < missingScripts.length; scriptIndex++)
      {
        if (localStorage.getItem(AdapTable.STORAGE_PREFIX + missingScripts[scriptIndex]))
        {
          missingScripts.splice(scriptIndex, 1);
          scriptIndex--;
        }
      }

      if (missingScripts.length > 0)
        return;

      clearInterval(scriptsLoaded);
      scripts.forEach(function(scriptFile)
      {
        var cachedScript = JSON.parse(localStorage.getItem(AdapTable.STORAGE_PREFIX + scriptFile));
        injectScript(cachedScript, scriptFile);
      });

      if (callback)
        callback();
    }, 250);
  }
})();
