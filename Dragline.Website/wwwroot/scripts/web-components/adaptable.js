/******************************************************************************
* AdapTable Custom Element
* Author: John Stegall
* Copyright: 2008 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-adaptable> custom element. Adds
* various customizations to a TABLE element.
******************************************************************************/

// TODO: Finish unit tests
// ENHANCEMENT: Query - Add infinte scrolling
//       1 - Scrolling should be based on the scrolling of the container
//       2 - A table row should be inserted above and below the current page of rows, with its height set to mimic the height of PageSize * TR.Height
//       3 - Scroll to the current page
;(function(window, document, undefined)
{
  "use strict";

  const ONE_YEAR_EXPIRATION = 8760;
  const STORAGE_PREFIX = "AdapTable: ";
  const SUBFOLDER = "adaptable/";

  let adaptablePrototype = Object.create(HTMLElement.prototype);
  let basePath;
  let basePathRegex = /(^|.*[\\\/])adaptable\.js(?:\?.*|;.*)?$/i;
  let template = `
<style>
  @import "/css/font-awesome.min.css";
  @import "/css/dragline-components.css";
</style>
<slot>
  <div role="menu"></div>
  <section>
    <div class="Actions"></div>
  </section>
  <table>
    <thead></thead>
    <tbody></tbody>
    <tfoot></tfoot>
  </table>
  <section></section>
</slot>`;

  /****************************************************************************
  * Invoked when created.
  ****************************************************************************/
  adaptablePrototype.createdCallback = function()
  {
    this.BasePath = this.getAttribute("base-path") || getBasePath.call(this);
    this.Data = {};
    this.Layout = {};
    this.MovableColumns = null;
    this.Expiration = this.hasAttribute("expiration") ? this.getAttribute("expiration") : ONE_YEAR_EXPIRATION;

    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = template;

    if (this.hasAttribute("export-excel"))
    {
      this.addActionButton("fa-file-excel-o", "Export to Excel", function()
      {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", this.getAttribute("export-excel"));
        xhr.send();
      });
    }

    if (this.hasAttribute("export-pdf"))
    {
      this.addActionButton("fa-file-pdf-o", "Export to PDF", function()
      {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", this.getAttribute("export-pdf"));
        xhr.send();
      });
    }

    getUnloadedModules.call(self);
    self.initializeState();
  }

  /****************************************************************************
  * Invoked when attached to the DOM.
  ****************************************************************************/
  adaptablePrototype.attachedCallback = function()
  {
    this.addEventListener("click", toggleMenu.bind(this));
    this.shadowRoot.querySelector("div[role=Menu]")
      .addEventListener("click", function(e) { e.stopPropagation(); });
  }

  /****************************************************************************
  * Invoked when attributes change.
  *
  * @param attributeName {string} The attribute name.
  * @param oldValue {string} The old value.
  * @param newValue {string} The new value.
  ****************************************************************************/
  adaptablePrototype.attributeChangedCallback = function(attributeName, oldValue, newValue)
  {
  }

  let AdapTable = document.registerElement("dragline-adaptable", { prototype: adaptablePrototype });

  /**************************************************************************
  * Caches data returned from the server in sessionStorage.
  *
  * @this An instance of AdapTable.
  * @param data {object} Data from the server.
  **************************************************************************/
  function cacheData(data)
  {
    let cache = this.Data;

    // Add filter values and aggregates back to the element data cache; they're
    // not retrieved on subsequent page requests
    if (cache)
    {
      if (!data.FilterValues)
        data.FilterValues = cache.FilterValues;

      if (!data.Aggregates)
        data.Aggregates = cache.Aggregates;
    }

    let dataToCache = JSON.parse(JSON.stringify(Object.assign({}, data)));
    dataToCache.Pages = (cache && cache.Pages) ? cache.Pages : [];

    dataToCache.Pages[this.Layout.Query.PageIndex] = { Items: dataToCache.Items };
    this.Data = dataToCache;

    if (this.Expiration < 0)
      return;
    else if (this.Expiration === 0)
      this.Expiration = ONE_YEAR_EXPIRATION;

    let cachedData = JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + document.location)) || { Instances: [] };
    let adaptableId = "Default";

    if (document.querySelectorAll("dragline-adaptable").length > 1)
    {
      if (!this.id)
        throw new Error("When multiple AdapTables exist on a page, the id attribute is required.");
      else
        adaptableId = this.id;
    }

    let adaptableCache = cachedData.Instances[adaptableId];

    if (!adaptableCache)
      cachedData.Instances[adaptableId] = adaptableCache = {};

    this.Data = dataToCache;
    dataToCache.Expiration = (+new Date()) + ((this.Expiration || 24) * 60 * 60 * 1000);
    delete dataToCache.Items;
    sessionStorage[STORAGE_PREFIX + document.location] = JSON.stringify(cachedData);
  }

  /**************************************************************************
  * Caches the layout - including the query - in sessionStorage.
  *
  * @this An instance of AdapTable.
  * @param layout {object} The Layout to cache.
  **************************************************************************/
  function cacheLayout(layout)
  {
    if (!layout)
      return;

    let adaptableId = "Default";
    this.Layout = layout;

    if (this.Expiration < 0)
      return;
    else if (this.Expiration === 0)
      this.Expiration = ONE_YEAR_EXPIRATION;

    if (document.querySelectorAll("dragline-adaptable").length > 1)
    {
      if (!this.id)
        throw new Error("When multiple AdapTables exist on a page, the id attribute is required.");
      else
        adaptableId = this.id;
    }

    let cachedData = JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + document.location)) || { Instances: [] };
    let adaptableCache = cachedData.Instances[adaptableId];

    if (!adaptableCache)
      cachedData.Instances[adaptableId] = adaptableCache = {};

    adaptableCache.Layout = layout;
    adaptableCache.Layout.Expiration = (+new Date()) + ((this.Expiration || 24) * 60 * 60 * 1000);
    sessionStorage[STORAGE_PREFIX + document.location] = JSON.stringify(cachedData);
  }

  /**************************************************************************
  * Gets the base path of the AdapTable.js JavaScript file.
  *
  * @this The <dragline-adaptable> element.
  * @returns The base path of the adaptable.js file.
  **************************************************************************/
  function getBasePath()
  {
    let scripts = document.head.querySelectorAll("script");

    for (let scriptIndex = 0; scriptIndex < scripts.length; scriptIndex++)
    {
      let matches = scripts[scriptIndex].src.match(basePathRegex);
      if (matches)
      {
        this.BasePath = matches[1];
        break;
      }
    }

    // In IE the script.src string is the raw value entered in the HTML
    if (this.BasePath.indexOf(":/") == -1 && basePath.slice(0, 2) != "//")
    {
      // Absolute or relative path?
      if (this.BasePath.indexOf("/") === 0)
        this.BasePath = location.href.match(/^.*?:\/\/[^\/]*/)[0] + basePath;
      else
        this.BasePath = location.href.match(/^[^\?]*\/(?:)/)[0] + basePath;
    }

    if (!this.BasePath)
      throw new Error("Couldn't detect the path to the AdapTable scripts. Set the attribute 'script-path'.");
  }

  /************************************************************************
  * Checks sessionStorage for data, and if found and not expired, loads the
  * cached data. If no data is found or it is expired, a request to the
  * server is sent to get the data and update the table.
  *
  * @this An instance of AdapTable.
  * @param checkCache {boolean} True to check the cache, false to skip it.
  ************************************************************************/
  function getData(checkCache)
  {
    let usedCachedData = false;

    if (checkCache)
      usedCachedData = loadDataFromCache.call(this);

    if (!usedCachedData)
      loadDataFromServer.call(this);
  }

  /**************************************************************************
  * Downloads one or more JavaScript files and injects them into the HEAD
  * element.
  *
  * @this The <dragline-adaptable> element.
  * @param scriptFile {string} The JavaScript file to load.
  * @param async {boolean} True to load the scripts asynchronously.
  * @param callback {function} A function to call all scripts have been
  * injected.
  **************************************************************************/
  function getScripts(scriptFiles, async, callback)
  {
    if (!scriptFile)
      return;

    if (!typeof (scriptFiles) === "array")
      scriptFiles = [scriptFiles];

    for (let scriptIndex = 0; scriptIndex < scriptFiles.length; scriptIndex++)
    {
      let script = document.createElement("script");
      script.type = "text/javascript";
      script.src = this.BasePath + AdapTable.SUB_FOLDER + scriptFile;
      script.async = async === undefined ? true : async;
      document.head.appendChild(script);
    }

    if (callback)
      callback();
  }

  /**************************************************************************
  * Identifies all columns and matches TH and TD elements with a column in
  * the layout.
  *
  * @this An instance of AdapTable.
  **************************************************************************/
  function identifyColumns()
  {
    var self = this;

    this.querySelectorAll("thead > tr > th").forEach(function(element, index)
    {
      var column = Lazy(self.Layout.Columns).findWhere({ Name: element.getAttribute("data-column-name") });
      element.setAttribute("data-column", column);
    });
  }

  /****************************************************************************
  * Checks sessionStorage for the layout, and if found and not expired, loads
  * the cached layout. If no layout is found or it's expired, a request is
  * sent to the server to get the layout and update the table. After the
  * layout is loaded, the data is then loaded.
  *
  * @this An instance of AdapTable.
  ****************************************************************************/
  function initializeState()
  {
    if (this.Layout)
    {
      let usedCachedLayout = loadLayoutFromCache.call(this);

      if (!usedCachedLayout)
      {
        loadLayoutFromServer.call(this, validateLayout.bind(self));
        return;
      }
    }

    validateLayout.call(this);
  }

  /**************************************************************************
  * Injects optional modules.
  *
  * @this The <dragline-adaptable> element.
  **************************************************************************/
  function injectModules()
  {
    var dependencies = [];

    if ((this.getAttribute("movable") || this.getAttribute("groupable")) && !AdapTable.Sortable)
      dependencies.push("sortable.js");

    if (this.getAttribute("movable") && !AdapTable.Positioning)
      dependencies.push("positioning.js");

    if (this.getAttribute("groupable") && !AdapTable.Grouping)
      dependencies.push("grouping.js");

    if (this.getAttribute("pageable") && !AdapTable.Paging)
      dependencies.push("paging.js");

    if (this.getAttribute("sortable") && !AdapTable.Sorting)
      dependencies.push("sorting.js");

    if (this.getAttribute("mutable") && !AdapTable.Views)
      dependencies.push("views.js");

    if (this.getAttribute("filterable") && !AdapTable.Filtering)
      dependencies.push("filtering.js");

    getScripts(dependencies, false, initializeModules.call(this));
  }

  /**************************************************************************
  * Initializes all dependent modules; the order the modules are loaded in
  * is important!
  *
  * @this An instance of AdapTable.
  **************************************************************************/
  function initializeModules()
  {
    if (this.getAttribute("groupable") || this.getAttribute("movable"))
    {
      if (!AdapTable.Sortable)
        throw new Error("Sortable module isn't loaded.");
      else
        this.Sortable = new AdapTable.Sortable(this);
    }

    if (this.getAttribute("movable"))
    {
      if (!AdapTable.Positioning)
        throw new Error("Positioning module isn't loaded.");
      else
        this.Positioning = new AdapTable.Positioning(this);
    }

    if (this.getAttribute("groupable"))
    {
      if (!AdapTable.Grouping)
        throw new Error("Grouping module isn't loaded.");
      else
        this.Grouping = new AdapTable.Grouping(this);
    }

    if (this.getAttribute("pageable"))
    {
      if (!AdapTable.Paging)
        throw new Error("Paging module isn't loaded.");
      else
        this.Paging = new AdapTable.Paging(this);
    }

    if (this.getAttribute("sortable"))
    {
      if (!AdapTable.Sorting)
        throw new Error("Sorting module isn't loaded.");
      else
        this.Sorting = new AdapTable.Sorting(this);
    }

    if (this.getAttribute("mutable"))
    {
      if (!AdapTable.Views)
        throw new Error("Views module isn't loaded.");
      else
        this.Views = new AdapTable.Views(this);
    }

    if (this.getAttribute("filterable"))
    {
      if (!AdapTable.Filtering)
        throw new Error("Filtering module isn't loaded.");
      else
        this.Filtering = new AdapTable.Filtering(this);
    }
  }

  /****************************************************************************
  * Executes an AJAX request to the specified URL and persists the state to
  * the server.
  *
  * @this An instance of AdapTable.
  ****************************************************************************/
  function saveLayout()
  {
    let self = this;
    let xhr = new XMLHttpRequest();
    xhr.open("POST", this.Layout.Url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function()
    {
      if (xhr.status === 200)
      {
        if (self.Layout.Success)
          self.Layout.Success.call(self, data, textStatus, xhr);
      }
      else
      {
        if (self.Layout.Fail)
          self.Layout.Fail.call(self, xhr, xhr.responseText, xhr.statusText);
      }
    };

    xhr.send(JSON.stringify(this.Layout));
  }




  /**************************************************************************
  * Checks sessionStorage for cached data and if found and not expired, loads
  * the cached data.
  *
  * @this An instance of AdapTable.
  * @returns True if the data was loaded from cache, false otherwise.
  **************************************************************************/
  function loadDataFromCache()
  {
    var adaptableIndex = $("div.AdapTable").index(this.Container);
    var cachedData = JSON.parse(sessionStorage.getItem(this.STORAGE_PREFIX + document.location)) || { Instances: [] };

    if (cachedData.Instances.length)
    {
      var adaptableCache = cachedData.Instances[adaptableIndex];

      if (!adaptableCache || !adaptableCache.Data)
        return false;
      else if (adaptableCache.Data.Expiration < (+new Date()))
        return false;
      else if (!adaptableCache.Data.Pages[this.Element.data("Layout").Query.PageIndex])
        return false;

      identifyColumns.call(this);
      this.Element.data("Data", adaptableCache.Data);

      var bindableData =
      {
        Aggregates: adaptableCache.Data.Aggregates,
        FilterValues: adaptableCache.Data.FilterValues,
        Items: adaptableCache.Data.Pages[this.Element.data("Layout").Query.PageIndex].Items,
        TotalItems: adaptableCache.Data.TotalItems
      };

      if (this.Options.Data.Success)
        this.Options.Data.Success.call(this, bindableData);

      this.Element.trigger("repaint.widgets.adaptable");
      return true;
    }

    return false;
  }

  /**************************************************************************
  * Makes a request to the server for data.
  *
  * @this An instance of AdapTable.
  **************************************************************************/
  function loadDataFromServer()
  {
    var self = this;

    if (!this.Options.Data.Url || this.Options.Data.Url.trim().length === 0)
      return;

    $.ajax(this.Options.Data.Url,
      {
        method: this.Options.Data.RequestType,
        contentType: "application/json",
        data: JSON.stringify(this.Element.data("Layout"))
      })
      .done(function(data)
      {
        cacheData.call(self, data);
        identifyColumns.call(self);

        if (self.Options.Data.Success)
          self.Options.Data.Success.call(self, data);

        self.Element.trigger("repaint.widgets.adaptable");
      })
      .fail(function(jqXHR, textStatus, errorThrown)
      {
        if (self.Options.Data.Fail)
          self.Options.Data.Fail.call(self, jqXHR, textStatus, errorThrown)
      });
  }

  /**************************************************************************
  * Checks sessionStorage for a cached layout and if found and not expired,
  * stores the cache in the TABLE element for quick access.
  *
  * @this An instance of AdapTable.
  * @returns True if the layout was loaded from cache, false otherwise.
  **************************************************************************/
  function loadLayoutFromCache()
  {
    var adaptableIndex = $("div.AdapTable").index(this.Container);
    var cachedData = JSON.parse(sessionStorage.getItem(this.STORAGE_PREFIX + document.location)) || { Instances: [] };

    if (cachedData.Instances.length)
    {
      var adaptableCache = cachedData.Instances[adaptableIndex];
      if (adaptableCache && adaptableCache.Layout && adaptableCache.Layout.Expiration > (+new Date()))
      {
        this.Element.data("Layout", adaptableCache.Layout);
        return true;
      }
    }

    return false;
  }

  /**************************************************************************
  * Makes a request to the server for the layout.
  *
  * @this An instance of AdapTable.
  * @param callback {function} A function to call after loading the data.
  **************************************************************************/
  function loadLayoutFromServer(callback)
  {
    var self = this;

    if (!this.Options.Layout.Url || this.Options.Layout.Url.trim().length === 0)
    {
      if (callback)
        callback();

      return;
    }

    $.ajax(this.Options.Layout.Url,
    {
      method: "GET"
    })
    .done(function(layout)
    {
      if (layout)
        self.cacheLayout(layout);

      if (callback)
        callback.call(self);
    });
  }

  /****************************************************************************
  * Populates the layout with the columns in the table. This is only used when
  * no layout is cached and nothing is pulled from a server.
  *
  * @this An instance of AdapTable.
  * @param layout {object} The layout.
  ****************************************************************************/
  function populateColumns(layout)
  {
    var self = this;
    this.Element.find("thead th").each(function(index, header)
    {
      header = $(header);

      var column =
        {
          IsFilterable: false,
          IsGroupable: false,
          IsHidable: false,
          IsMovable: false,
          IsSortable: false,
          IsVisible: true
        };

      if (header.text().trim().length > 0)
      {
        column.Header = header.text().trim();
        column.Name = header.data("name");

        if (!self.Options.MovableColumns)
          column.IsHidable = header.is(self.Options.MovableColumns);
        else
          column.IsHidable = header.is(self.Options.MovableColumns);

        column.IsMovable = (header.text().trim().length < 1);
      }

      layout.Columns.push(column);
    });
  }

  /**************************************************************************
  * Validates the layout and then gets the data or triggers the paint event.
  *
  * @this An instance of AdapTable.
  **************************************************************************/
  function validateLayout()
  {
    var emptyLayout =
      {
        Columns: [],
        Query:
        {
          Filters: [],
          Groups: [],
          PageSize: 10,
          PageIndex: 0
        },
      };

    var layout = $.extend(true, {}, emptyLayout, this.Options.Layout, this.Element.data("Layout"));
    var requiresName = this.getAttribute("mutable") || this.getAttribute("filterable") || this.getAttribute("groupable") || this.getAttribute("movable") || this.getAttribute("sortable");

    if (requiresName && !layout.Columns.length)
    {
      populateColumns.call(this, layout);

      Lazy(layout.Columns).each(function(column, index)
      {
        if (!column.Name || column.Name.trim() === "")
          throw new Error("All columns must have a name. Column at index: " + index + " has no name.");
      });
    }

    this.Element.data("Layout", layout);

    if (this.Options.Data.Url)
      this.getData(true);
    else
      this.Element.trigger("repaint.widgets.adaptable");
  }
})(window, document);