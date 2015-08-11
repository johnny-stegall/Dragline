;(function()
{
  "use strict";

  if (!window.AdapTable)
    throw new Error("AdapTable core hasn't loaded.");

  var ONE_YEAR_EXPIRATION = 8760;

  /**************************************************************************
  * Caches the layout - including the query - in sessionStorage and the data
  * of the TABLE element.
  *
  * @param layout {object} The Layout to cache.
  **************************************************************************/
  AdapTable.cacheLayout = function(layout)
  {
    if (!layout)
      return;

    this.Element.data("Layout", layout);

    if (this.Options.Layout.Expiration < 0)
      return;
    else if (this.Options.Layout.Expiration === 0)
      this.Options.Layout.Expiration = ONE_YEAR_EXPIRATION;

    var adaptableIndex = $("div.AdapTable").index(this.Container);
    var cachedData = JSON.parse(sessionStorage.getItem(this.STORAGE_PREFIX + document.location)) || { Instances: [] };

    var adaptableCache = cachedData.Instances[adaptableIndex];
    if (!adaptableCache)
      cachedData.Instances[adaptableIndex] = adaptableCache = {};

    adaptableCache.Layout = layout;
    adaptableCache.Layout.Expiration = (+new Date()) + ((this.Options.Layout.Expiration || 24) * 1000 * 60 * 60);

    sessionStorage[this.STORAGE_PREFIX + document.location] = JSON.stringify(cachedData);
  }

  /************************************************************************
  * Checks sessionStorage for data, and if found and not expired, loads the
  * cached data. If no data is found or it is expired, a request to the
  * server is sent to get the data and update the table.
  *
  * @param checkCache {boolean} True to check the cache, false to skip it.
  ************************************************************************/
  AdapTable.getData = function(checkCache)
  {
    var usedCachedData = false;

    if (checkCache)
      usedCachedData = loadDataFromCache.call(this);

    if (!usedCachedData)
      loadDataFromServer.call(this);
  }

  /****************************************************************************
  * Checks sessionStorage for the layout, and if found and not expired, loads
  * the cached layout. If no layout is found or it's expired, a request is
  * sent to the server to get the layout and update the table. After the
  * layout is loaded, the data is then loaded.
  ****************************************************************************/
  AdapTable.initializeState = function()
  {
    if (this.Options.Layout)
    {
      var usedCachedLayout = loadLayoutFromCache.call(this);

      if (!usedCachedLayout)
      {
        var self = this;
        loadLayoutFromServer.call(this, function()
        {
          validateLayout.call(self);
        });

        return;
      }
    }

    validateLayout.call(this);
  }

  /****************************************************************************
  * Executes an AJAX request to the specified URL and persists the state to
  * the server.
  ****************************************************************************/
  AdapTable.saveLayout = function()
  {
    var self = this;

    $.ajax(this.Options.Layout.Url,
    {
      method: "POST",
      data: JSON.stringify(this.Element.data("Layout"))
    })
    .done(function(data, textStatus, jqXHR)
    {
      if (self.Options.Layout.Success)
        self.Options.Layout.Success.call(self, data, textStatus, jqXHR);
    })
    .fail(function(jqXHR, textStatus, errorThrown)
    {
      if (self.Options.Layout.Fail)
        self.Options.Layout.Fail.call(self, jqXHR, textStatus, errorThrown);
    });
  }

  /**************************************************************************
  * Caches data returned from the server in sessionStorage.
  *
  * @this An instance of AdapTable.
  * @param data {object} Data from the server.
  **************************************************************************/
  function cacheData(data)
  {
    var elementCache = this.Element.data("Data");

    // Add filter values and aggregates back to the element data cache; they're
    // not retrieved on subsequent page requests
    if (elementCache)
    {
      if (!data.FilterValues)
        data.FilterValues = elementCache.FilterValues;

      if (!data.Aggregates)
        data.Aggregates = elementCache.Aggregates;
    }

    var dataToCache = $.extend(true, {}, data);
    dataToCache.Pages = (elementCache && elementCache.Pages) ? elementCache.Pages : [];

    var layout = this.Element.data("Layout");
    dataToCache.Pages[layout.Query.PageIndex] = { Items: dataToCache.Items };

    this.Element.data("Data", dataToCache);

    if (this.Options.Data.Expiration < 0)
      return;
    else if (this.Options.Data.Expiration == 0)
      this.Options.Data.Expiration = ONE_YEAR_EXPIRATION;

    var cachedData = JSON.parse(sessionStorage.getItem(this.STORAGE_PREFIX + document.location)) || { Instances: [] };
    var adaptableIndex = $("div.AdapTable").index(this.Container);
    var adaptableCache = cachedData.Instances[adaptableIndex];

    if (!adaptableCache)
      cachedData.Instances[adaptableIndex] = adaptableCache = {};

    adaptableCache.Data = dataToCache;
    dataToCache.Expiration = (+new Date()) + ((this.Options.Data.Expiration || 24) * 1000 * 60 * 60);
    delete dataToCache.Items;

    sessionStorage[this.STORAGE_PREFIX + document.location] = JSON.stringify(cachedData);
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
    this.Element.find("thead > tr > th").each(function(index, element)
    {
      var header = $(this);
      var column = Lazy(self.Element.data("Layout").Columns).findWhere({ Name: header.data("column-name") });

      header.data("Column", column);
    });
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
    var requiresName = this.Options.CanChangeView || this.Options.CanFilter || this.Options.CanGroup || this.Options.CanMoveColumns || this.Options.CanSort;

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
})();
