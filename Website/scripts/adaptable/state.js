﻿(function()
{
  if (!window.AdapTable)
    throw "AdapTable core is not loaded.";

  var ONE_YEAR_EXPIRATION = 8760;

  /**************************************************************************
  * Caches the layout - including the query - in localStorage and the data
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
    else if (this.Options.Layout.Expiration == 0)
      this.Options.Layout.Expiration = ONE_YEAR_EXPIRATION;

    var adaptableIndex = $("div.AdapTable").index(this.Container);
    var cachedData = JSON.parse(localStorage.getItem(this.STORAGE_PREFIX + document.location)) || { Instances: [] };

    var adaptableCache = cachedData.Instances[adaptableIndex];
    if (!adaptableCache)
      cachedData.Instances[adaptableIndex] = adaptableCache = {};

    adaptableCache.Layout = layout;
    adaptableCache.Layout.Expiration = (+new Date()) + ((this.Options.Layout.Expiration || 24) * 1000 * 60 * 60);

    localStorage.setItem(this.STORAGE_PREFIX + document.location, JSON.stringify(cachedData));
  }

  /************************************************************************
  * Checks localStorage for data, and if found and not expired, loads the
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

    this.Element.trigger("repaint.widgets.adaptable");
  }
  
  /****************************************************************************
  * Checks localStorage for the layout, and if found and not expired, loads
  * the cached layout. If no layout is found or it is expired, a request to
  * the server is sent to get the layout and update the table.
  ****************************************************************************/
  AdapTable.getLayout = function()
  {
    var usedCachedLayout = loadLayoutFromCache.call(this);
    if (!usedCachedLayout)
      loadLayoutFromServer.call(this);

    var self = this;
    var checkLayout = setInterval(function()
    {
      var layout = self.Element.data("Layout");
      if (!layout)
        return;

      clearInterval(checkLayout);
      identifyColumns.call(self);

      if (layout.Query.Sort || layout.Query.Groups.length > 0 || layout.Query.Filters.length > 0)
        self.getData(true);
      else
        self.Element.trigger("repaint.widgets.adaptable");
    }, 50);
  }

  /****************************************************************************
  * Executes an AJAX request to the specified URL and persists the state to
  * the server.
  ****************************************************************************/
  AdapTable.saveLayout = function()
  {
    var self = this;
    $.post(this.Options.Layout.Url, this.Element.data("Layout"))
      .done(function()
      {
        if (self.Options.Layout.Success)
          self.Options.Layout.Success();
      })
      .fail(function()
      {
        if (self.Options.Layout.Fail)
          self.Options.Layout.Fail();
      });
  }

  /**************************************************************************
  * Caches data returned from the server in localStorage.
  *
  * @this An instance of AdapTable.
  * @param data {object} Data to cache.
  **************************************************************************/
  function cacheData(data)
  {
    var oldData = this.Element.data("Data");
    this.Element.data("Data", data);

    // Add filter values and aggregates back to the element data cache; they're
    // not retrieved on subsequent page requests
    if (oldData)
    {
      data.Pages = oldData.Pages;

      if (!data.FilterValues)
        data.FilterValues = oldData.FilterValues;

      if (!data.Aggregates)
        data.Aggregates = oldData.Aggregates;
    }
    else
      data.Pages = [];

    var layout = this.Element.data("Layout");
    data.Pages[layout.Query.PageIndex] = { Items: data.Items };

    if (this.Options.Data.Expiration < 0)
      return;
    else if (this.Options.Data.Expiration == 0)
      this.Options.Data.Expiration = ONE_YEAR_EXPIRATION;

    var cachedData = JSON.parse(localStorage.getItem(this.STORAGE_PREFIX + document.location)) || { Instances: [] };
    var adaptableIndex = $("div.AdapTable").index(this.Container);
    var adaptableCache = cachedData.Instances[adaptableIndex];

    if (!adaptableCache)
      cachedData.Instances[adaptableIndex] = adaptableCache = {};

    adaptableCache.Data = data;
    data.Expiration = (+new Date()) + ((this.Options.Data.Expiration || 24) * 1000 * 60 * 60);
    delete data.Items;

    localStorage.setItem(this.STORAGE_PREFIX + document.location, JSON.stringify(cachedData));
  }

  /**************************************************************************
  * Identifies all columns and matches each TH element with a column in the
  * layout. Additionally, each TH element is given an ID for easier DOM
  * handling.
  *
  * @this An instance of AdapTable.
  **************************************************************************/
  function identifyColumns()
  {
    var self = this;

    this.Element.find("thead > tr > th").each(function(index, element)
    {
      var header = $(this);
      var headerText = header.text().trim();

      if (headerText.length < 1)
        header.attr("id", "thUnnamed" + index);
      else
      {
        var column = self.findColumn("Header", headerText);
        if (!column)
          throw "No column with header \"" + headerText + "\" was found.";

        header.attr("id", "th" + column.Name);
        header.data("Column", column);
      }
    });
  }

  /**************************************************************************
  * Checks localStorage for cached data and if found and not expired, loads
  * the cached data.
  *
  * @this An instance of AdapTable.
  * @returns True if the data was loaded from cache, false otherwise.
  **************************************************************************/
  function loadDataFromCache()
  {
    var adaptableIndex = $("div.AdapTable").index(this.Container);
    var cachedData = JSON.parse(localStorage.getItem(this.STORAGE_PREFIX + document.location)) || { Instances: [] };

    if (cachedData.Instances.length)
    {
      var adaptableCache = cachedData.Instances[adaptableIndex];

      if (!adaptableCache || !adaptableCache.Data)
        return false;
      else if (adaptableCache.Data.Expiration < (+new Date()))
        return false;
      else if (!adaptableCache.Data.Pages[this.Element.data("Layout").Query.PageIndex])
        return false;

      if (this.Options.Data.Success)
      {
        var queryResult =
        {
          Aggregates: adaptableCache.Data.Aggregates,
          FilterValues: adaptableCache.Data.FilterValues,
          Items: adaptableCache.Data.Pages[this.Element.data("Layout").Query.PageIndex].Items,
          TotalItems: adaptableCache.Data.TotalItems
        };

        this.Options.Data.Success.call(this, queryResult);
      }

      this.Element.data("Data", queryResult);
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
      async: false,
      type: this.Options.Data.RequestType,
      contentType: "application/json",
      data: ko.mapping.toJSON(this.Element.data("Layout")),
      beforeSend: this.Options.Data.BeforeSend,
      success: function(data)
      {
        if (self.Options.Data.Success)
          self.Options.Data.Success.call(self, data);

        cacheData.call(self, data);
      },
      error: this.Options.Data.Fail,
      complete: this.Options.Data.Complete
    });
  }

  /**************************************************************************
  * Checks localStorage for the cached layout and if found and not expired,
  * loads the cached data.
  *
  * @this An instance of AdapTable.
  * @returns True if the layout was loaded from cache, false otherwise.
  **************************************************************************/
  function loadLayoutFromCache()
  {
    var adaptableIndex = $("div.AdapTable").index(this.Container);
    var cachedData = JSON.parse(localStorage.getItem(this.STORAGE_PREFIX + document.location)) || { Instances: [] };

    if (cachedData.Instances.length)
    {
      var adaptableCache = cachedData.Instances[adaptableIndex];

      if (!adaptableCache || !adaptableCache.Layout)
        return false;
      else if (adaptableCache.Layout.Expiration < (+new Date()))
        return false;

      this.Element.data("Layout", adaptableCache.Layout);
      return true;
    }

    return false;
  }

  /**************************************************************************
  * Makes a request to the server for the layout.
  *
  * @this An instance of AdapTable.
  **************************************************************************/
  function loadLayoutFromServer()
  {
    var self = this;

    if (!this.Options.Layout.Url || this.Options.Layout.Url.trim().length === 0)
      return;

    $.get(this.Options.Layout.Url)
      .done(function(layout)
      {
        if (!layout)
        {
          setInitialLayout.call(self);
          return;
        }

        if (!layout.Query)
          layout.Query = {};

        if (!layout.Query.Filters)
          layout.Query.Filters = [];

        if (!layout.Query.Groups)
          layout.Query.Groups = [];

        self.cacheLayout(layout);
      });
  }

  /****************************************************************************
  * Saves the initial layout; only used when no state layout is restored
  * from the cache/server.
  *
  * @this An instance of AdapTable.
  ****************************************************************************/
  function setInitialLayout()
  {
    var layout =
    {
      Columns: [],
      Query:
      {
        Filters: [],
        Groups: []
      }
    };

    var self = this;
    this.Element.find("thead th").each(function()
    {
      var header = $(this);

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
        column.Name = header.text().trim().replace(/[^a-z0-9]*/ig, "");

        if (!self.Options.MovableColumns)
          column.IsHidable = header.is(self.Options.MovableColumns);
        else
          column.IsHidable = header.is(self.Options.MovableColumns);

        column.IsMovable = (header.text().trim().length < 1);
        column.IsVisible = true;
      }

      layout.Columns.push(column);
    });

    this.Element.data("Layout", layout);
  }
})();