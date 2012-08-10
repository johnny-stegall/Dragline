/******************************************************************************
* jQuery AdapTable Plugin
* Author: John Stegall
*
* Adds various customizations to a TABLE element.
*
* This plugin is adapted from my AdapTable plugin on GitHub as part of the
* Dragline web framework.
******************************************************************************/
// TODO: Finish unit tests
// BUG: Removing the last group throws a server-side error
// BUG: Sorting messes up the UI?
// BUG: Filtering is broken with the modal
// ENHANCEMENT: Lookups to server/client-side filtering with DataType: "Lookup" (remove "Text" and change to "String" DataType)
// ENHANCEMENT: Add filters operators to "Text" and "Numeric" DataTypes
// ENHANCEMENT: Query - Add infinte scrolling
//       1 - Scrolling should be based on the scrolling of the container
//       2 - A table row should be inserted above and below the current page of rows, with its height set to mimic the height of PageSize * TR.Height
//       3 - Scroll to the current page

;(function($)
{
  "use strict";

  window.AdapTable = (function()
  {
    var basePathRegex = /(^|.*[\\\/])adaptable\.js(?:\?.*|;.*)?$/i;

    /**************************************************************************
    * The AdapTable object, which is a "static" object definition.
    **************************************************************************/
    var AdapTable =
    {
      BasePath: getBasePath(),
      Container: null,
      Element: null,
      Options: null,
      STORAGE_PREFIX: "AdapTable: ",
      SUB_FOLDER: "adaptable/",

      /************************************************************************
      * Initialization.
      *
      * @param element {jQuery} The TABLE element.
      * @param options {object} Settings to apply to the AdapTable instance.
      ************************************************************************/
      _init: function(element, options)
      {
        this.Element = element;
        this.Options = options;

        loadScriptLoader(this.Options.ScriptExpiration);

        var self = this;
        loadDependencies(this.Options.ScriptExpiration, function()
        {
          var modules = getUnloadedModules(self.Options);
          AdapTable.ScriptLoader.getScripts(modules, self.Options.ScriptExpiration, function()
          {
            initializeModules.call(self);
            self.setupDom();
            self.getLayout();
          });
        });
      },

      /************************************************************************
      * Keep references to DOM elements and injects additional elements as
      * necessary.
      ************************************************************************/
      setupDom: function()
      {
        if (!this.Element.children("thead").length)
          throw "Table headers are required; no THEAD element found.";
        else if (!this.Element.find("thead > tr > th").length)
          throw "Table headers are required; no TH elements found.";

        this.Element
          .wrap("<div class=\"AdapTable\" />")
          .before("<section />")
          .after("<section />");

        this.Container = this.Element.parent("div.AdapTable");
        this.Container.children("section:first-child")
          .append("<div class=\"Actions\" />")
          .append("<div style=\"clear: both;\" />");

        this.Menu = $("<div />")
          .attr("role", "menu")
          .on("click", function(e) { e.stopPropagation(); });

        this.Container.append(this.Menu);

        $(document).on("click.widgets.adaptable", $.proxy(this.toggleMenu, this));

        if (this.Options.ExportToExcelUrl)
        {
          this.addActionButton("fa-file-excel-o", "Export to Excel", function()
          {
            $.get(this.Options.ExportToExcelUrl);
          });
        }

        if (this.Options.ExportToPdfUrl)
        {
          this.addActionButton("fa-file-pdf-o", "Export to PDF", function()
          {
            $.get(this.Options.ExportToPdfUrl);
          });
        }
      },
    };

    /**************************************************************************
    * Gets the base path of the AdapTable.js JavaScript file.
    *
    * @returns The base path of the adaptable.js file.
    **************************************************************************/
    function getBasePath()
    {
      var basePath = window.ADAPTABLE_BASE_PATH || "";

      if (!basePath)
      {
        var scripts = $("script");

        for (var scriptIndex = 0; scriptIndex < scripts.length; scriptIndex++)
        {
          var matches = scripts[scriptIndex].src.match(basePathRegex);
          if (matches)
          {
            basePath = matches[1];
            break;
          }
        }
      }

      // In IE the script.src string is the raw value entered in the HTML
      if (basePath.indexOf(":/") == -1 && basePath.slice(0, 2) != "//")
      {
        // Absolute or relative path?
        if (basePath.indexOf("/") === 0)
          basePath = location.href.match(/^.*?:\/\/[^\/]*/)[0] + basePath;
        else
          basePath = location.href.match(/^[^\?]*\/(?:)/)[0] + basePath;
      }

      if (!basePath)
        throw "Couldn't detect the path to the AdapTable scripts. You'll need to set the global variable 'ADAPTABLE_BASE_PATH' before creating AdapTable instances.";

      return basePath;
    }

    /**************************************************************************
    * Gets unloaded modules.
    *
    * @param options {object} Settings to apply to the AdapTable instance.
    * @returns An array of JavaScript files that are AdapTable modules.
    **************************************************************************/
    function getUnloadedModules(options)
    {
      var dependencies = [];

      if ((options.CanMoveColumns || options.CanGroup) && !AdapTable.Sortable)
        dependencies.push("sortable.js");

      if (options.CanMoveColumns && !AdapTable.Positioning)
        dependencies.push("positioning.js");

      if (options.CanGroup && !AdapTable.Grouping)
        dependencies.push("grouping.js");

      if (options.Paging && !AdapTable.Paging)
        dependencies.push("paging.js");

      if (options.CanSort && !AdapTable.Sorting)
        dependencies.push("sorting.js");

      if (options.CanChangeView && !AdapTable.Views)
        dependencies.push("views.js");

      if (options.CanFilter && !AdapTable.Filtering)
        dependencies.push("filtering.js");

      return dependencies;
    }

    /**************************************************************************
    * Initializes all dependent modules; the order the modules are loaded in
    * is important!
    *
    * @this An instance of AdapTable.
    **************************************************************************/
    function initializeModules()
    {
      if (this.Options.CanGroup || this.Options.CanMoveColumns)
      {
        if (!AdapTable.Sortable)
          throw "Sortable module is not loaded.";
        else
          this.Sortable = new AdapTable.Sortable(this);
      }

      if (this.Options.CanMoveColumns)
      {
        if (!AdapTable.Positioning)
          throw "Positioning module is not loaded.";
        else
          this.Positioning = new AdapTable.Positioning(this);
      }

      if (this.Options.CanGroup)
      {
        if (!AdapTable.Grouping)
          throw "Grouping module is not loaded.";
        else
          this.Grouping = new AdapTable.Grouping(this);
      }

      if (this.Options.Paging)
      {
        if (!AdapTable.Paging)
          throw "Paging module is not loaded.";
        else
          this.Paging = new AdapTable.Paging(this);
      }

      if (this.Options.CanSort)
      {
        if (!AdapTable.Sorting)
          throw "Sorting module is not loaded.";
        else
          this.Sorting = new AdapTable.Sorting(this);
      }

      if (this.Options.CanChangeView)
      {
        if (!AdapTable.Views)
          throw "Views module is not loaded.";
        else
          this.Views = new AdapTable.Views(this);
      }

      if (this.Options.CanFilter)
      {
        if (!AdapTable.Filtering)
          throw "Filtering module is not loaded.";
        else
          this.Filtering = new AdapTable.Filtering(this);
      }
    }

    /**************************************************************************
    * Loads required dependencies.
    *
    * @param expiration {int} The number of hours until the cached version of
    * the scripts expires.
    * @param callback {function} A function to call after all scripts have
    * loaded.
    **************************************************************************/
    function loadDependencies(expiration, callback)
    {
      var dependencies = [];

      if (!AdapTable.toggleMenu)
        dependencies.push("helpers.js");

      if (!AdapTable.saveLayout)
        dependencies.push("state.js");

      AdapTable.ScriptLoader.getScripts(dependencies, expiration, callback);
    }

    /**************************************************************************
    * Loads the script loader.
    **************************************************************************/
    function loadScriptLoader(expiration)
    {
      if (AdapTable.ScriptLoader)
        return;

      var scriptFile = "script-loader.js";
      var cachedScript = JSON.parse(localStorage.getItem(AdapTable.STORAGE_PREFIX + scriptFile));
      if (!cachedScript || (cachedScript.Expiration < (+new Date())))
      {
        $.ajax(AdapTable.BasePath + AdapTable.SUB_FOLDER + scriptFile,
        {
          async: false,
          type: "GET",
          success: function(script)
          {
            cachedScript =
            {
              Expiration: (+new Date()) + (expiration * 1000 * 60 * 60),
              Script: script
            };

            localStorage.setItem(AdapTable.STORAGE_PREFIX + scriptFile, JSON.stringify(cachedScript));
          },
          error: function(jqXHR, textStatus, errorThrown)
          {
            throw "Failed to retrieve: " + scriptFile + ".\n\n" + errorThrown;
          }
        });
      }

      var script = document.createElement("script");
      script.type = "text/javascript";
      script.text = cachedScript.Script;
      document.getElementsByTagName("head")[0].appendChild(script);
    }

    return AdapTable;
  })();

  /****************************************************************************
  * The AdapTable plugin.
  ****************************************************************************/
  $.fn.AdapTable = function(options)
  {
    var settings = $.extend(
    {
      CanChangeView: true,
      CanFilter: true,
      CanGroup: true,
      CanMoveColumns: true,
      CanSearch: true,
      CanSort: true,
      Data: {},
      EnableAdvancedFiltering: true,
      ExcludeFooter: false,
      MovableColumns: null,
      Layout: {},
      ScriptExpiration: 24,
      UnitTest: false
    }, options);

    if (settings.UnitTest)
    {
      var adaptable = Object.create(AdapTable);
      adaptable._init($(this), settings);
      return adaptable;
    }

    // This proves bondage is a good thing
    return this.each(function()
    {
      var adaptable = Object.create(AdapTable);
      adaptable._init($(this), settings);
    });
  };
})(jQuery);

// Object.create polyfill (required for IE 9)
if (typeof (Object.create) !== "function")
{
  Object.create = (function()
  {
    var child = function() { };

    return function(prototype)
    {
      if (typeof (prototype) !== "object")
        throw "Argument must be an object.";

      child.prototype = prototype;

      var result = new child();
      child.prototype = null;
      return result;
    };
  })();
}
