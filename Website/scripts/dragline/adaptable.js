﻿/******************************************************************************
* jQuery AdapTable Plugin
* Author: John Stegall
*
* Adds various customizations to a TABLE element.
*
* This plugin is adapted from my AdapTable plugin on GitHub as part of the
* Dragline web framework.
******************************************************************************/
// TODO: Finish unit tests
// ENHANCEMENT: Query - Add infinte scrolling
//       1 - Scrolling should be based on the scrolling of the container
//       2 - A table row should be inserted above and below the current page of rows, with its height set to mimic the height of PageSize * TR.Height
//       3 - Scroll to the current page

;(function($)
{
  "use strict";

  if (!window.jQuery)
    throw new Error("jQuery is required by the AdapTable jQuery plugin.");
  else if (!window.Lazy)
    throw new Error("LazyJS is required by the AdapTable jQuery plugin.");

  window.AdapTable = (function()
  {
    var basePathRegex = /(^|.*[\\\/])adaptable\.js(?:\?.*|;.*)?$/i;
    var _defaults =
    {
      CanChangeView: true,
      CanFilter: true,
      CanGroup: true,
      CanMoveColumns: true,
      CanSearch: true,
      CanSort: true,
      Data: {},
      ExcludeFooter: false,
      MovableColumns: null,
      Layout: {},
      ScriptExpiration: 24
    };

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
        this.Options = $.extend({}, _defaults, options);

        var self = this;

        loadScriptLoader(this.Options.ScriptExpiration, function()
        {
          loadDependencies(self.Options.ScriptExpiration, function()
          {
            var modules = getUnloadedModules(self.Options);
            AdapTable.ScriptLoader.getScripts(modules, self.Options.ScriptExpiration, function()
            {
              initializeModules.call(self);
              setupDom.call(self);
              self.initializeState();
            });
          });
        });
      },

      /****************************************************************************
      * Frees resources used by the plugin and unbinds event-handlers.
      ****************************************************************************/
      destroy: function()
      {
        this.Element.prev().remove();
        this.Element.next().remove();
        this.Element.parent().children("div[role='menu']").remove();

        this.Element
          .removeData("AdapTable")
          .removeData("Layout")
          .removeData("Data")
          .unwrap("div.AdapTable")
          .off(".widgets.adaptable");
      }
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
        throw new Error("Couldn't detect the path to the AdapTable scripts. You'll need to set the global variable 'ADAPTABLE_BASE_PATH' before creating AdapTable instances.");

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
          throw new Error("Sortable module hasn't loaded.");
        else
          this.Sortable = new AdapTable.Sortable(this);
      }

      if (this.Options.CanMoveColumns)
      {
        if (!AdapTable.Positioning)
          throw new Error("Positioning module hasn't loaded.");
        else
          this.Positioning = new AdapTable.Positioning(this);
      }

      if (this.Options.CanGroup)
      {
        if (!AdapTable.Grouping)
          throw new Error("Grouping module hasn't loaded.");
        else
          this.Grouping = new AdapTable.Grouping(this);
      }

      if (this.Options.Paging)
      {
        if (!AdapTable.Paging)
          throw new Error("Paging module hasn't loaded.");
        else
          this.Paging = new AdapTable.Paging(this);
      }

      if (this.Options.CanSort)
      {
        if (!AdapTable.Sorting)
          throw new Error("Sorting module hasn't loaded.");
        else
          this.Sorting = new AdapTable.Sorting(this);
      }

      if (this.Options.CanChangeView)
      {
        if (!AdapTable.Views)
          throw new Error("Views module hasn't loaded.");
        else
          this.Views = new AdapTable.Views(this);
      }

      if (this.Options.CanFilter)
      {
        if (!AdapTable.Filtering)
          throw new Error("Filtering module hasn't loaded.");
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
    function loadScriptLoader(expiration, callback)
    {
      if (AdapTable.ScriptLoader)
      {
        if (callback)
          callback();

        return;
      }

      var scriptFile = "script-loader.js";
      var cachedScript = JSON.parse(localStorage.getItem(AdapTable.STORAGE_PREFIX + scriptFile));
      if (!cachedScript || (cachedScript.Expiration < (+new Date())))
      {
        $.ajax(AdapTable.BasePath + AdapTable.SUB_FOLDER + scriptFile,
        {
          method: "GET"
        })
        .done(function(script)
        {
          cachedScript =
          {
            Expiration: (+new Date()) + (expiration * 1000 * 60 * 60),
            Script: script
          };

          localStorage[AdapTable.STORAGE_PREFIX + scriptFile] = JSON.stringify(cachedScript);

          var script = document.createElement("script");
          script.type = "text/javascript";
          script.text = cachedScript.Script;
          document.getElementsByTagName("head")[0].appendChild(script);

          if (callback)
            callback();
        })
        .fail(function(jqXHR, textStatus, errorThrown)
        {
          throw new Error("Failed to retrieve: " + scriptFile + ".\n\n" + errorThrown);
        });
      }
      else if (callback)
      {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.text = cachedScript.Script;
        document.getElementsByTagName("head")[0].appendChild(script);

        if (callback)
          callback();
      }
    }

    /************************************************************************
    * Keep references to DOM elements and injects additional elements as
    * necessary.
    *
    * @this An instance of AdapTable.
    ************************************************************************/
    function setupDom()
    {
      if (!this.Element.children("thead").length)
        throw new Error("Table headers are required; no THEAD element found.");
      else if (!this.Element.find("thead > tr > th").length)
        throw new Error("Table headers are required; no TH elements found.");

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

      var self = this;
      if (this.Options.ExportToExcelUrl)
      {
        this.addActionButton("fa-file-excel-o", "Export to Excel", function()
        {
          $.get(self.Options.ExportToExcelUrl);
        });
      }

      if (this.Options.ExportToPdfUrl)
      {
        this.addActionButton("fa-file-pdf-o", "Export to PDF", function()
        {
          $.get(self.Options.ExportToPdfUrl);
        });
      }
    }

    return AdapTable;
  })();

  /****************************************************************************
  * The AdapTable plugin.
  ****************************************************************************/
  $.fn.AdapTable = function(options)
  {
    var args = arguments;

    if (options === undefined || typeof (options) === "object")
    {
      // This proves bondage is a good thing
      return this.each(function()
      {
        // Allow the plugin to only be instantiated once
        if ($.data(this, "AdapTable") === undefined)
        {
          var adaptable = Object.create(AdapTable);
          adaptable._init($(this), options);
          $.data(this, "AdapTable", adaptable);
        }
      });
    }
    else if (typeof (options) === "string")
    {
      // Cache the method call to make it possible to return a value
      var result;

      this.each(function()
      {
        var instance = $.data(this, "AdapTable");

        // Call the method with any parameters also passed
        if (AdapTable.isPrototypeOf(instance) && typeof (instance[options]) === "function")
          result = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
        else
        {
          for (var property in instance)
          {
            if (typeof (instance[property]) === "object" && typeof (instance[property][options]) === "function")
              result = instance[property][options].apply(instance[property], Array.prototype.slice.call(args, 1));
          }
        }
      });

      // Return the method's return value; otherwise maintain chainability
      return result !== undefined ? result : this;
    }

    // This proves bondage is a good thing
    return this.each(function()
    {
      var adaptable = Object.create(AdapTable);
      adaptable._init($(this), settings);
    });
  };
})(jQuery);
