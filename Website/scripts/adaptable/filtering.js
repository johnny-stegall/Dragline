(function()
{
  if (!window.AdapTable)
    throw "AdapTable core is not loaded.";

  /****************************************************************************
  * Initialization.
  *
  * @param instance {object} An AdapTable instance.
  ****************************************************************************/
  AdapTable.Filtering = function(instance)
  {
    this.Instance = instance;
    this.Column = null;
    this.Instance.Element.on("repaint.widgets.adaptable", $.proxy(this.reflectFilters, this));
  }

  AdapTable.Filtering.prototype =
  {
    /**************************************************************************
    * Adds a filter to the underlying query.
    *
    * @this An instance of AdapTable.Filters.
    * @param columnName {string} The column name.
    * @param operator {string} The operator.
    * @param operand {string} The filter value.
    **************************************************************************/
    addFilter: function(columnName, operator, operand)
    {
      if (operator.toUpperCase() !== "LIKE" && (!columnName || columnName.trim().length < 1))
        throw "Cannot create a filter: no column was specified.";
      else if (!operator || operator.trim().length < 1)
        throw "Cannot create a filter: no operator was specified.";
      else if (!operand || operand.trim().length < 1)
        throw "Cannot create a filter: no operand was specified.";

      var layout = this.Instance.Element.data("Layout");

      if (!layout.Query.Filters)
        layout.Query.Filters = [];

      var filterExists = layout.Query.Filters.filter(function(filter, index)
      {
        if (filter.Column === columnName)
          return true;
      });

      if (filterExists.length)
      {
        filterExists[0].Operator = operator;
        filterExists[0].Operand = operand;
        return;
      }

      layout.Query.Filters.push(
      {
        Column: columnName,
        Operator: operator,
        Operand: operand
      });

      this.Instance.cacheLayout(layout);
    },

    /**************************************************************************
    * Updates the column filters to reflect how the data is filtered.
    **************************************************************************/
    reflectFilters: function()
    {
      var topSection = this.Instance.Container.children("section:first-child");

      if (!topSection.children("div.Filters").length)
      {
        var divFilters = $("<div />")
          .addClass("Filters");

        topSection.prepend(divFilters);

        buildFilterButtonsAndMoreMenu.call(this, divFilters);
        buildMoreButton.call(this, divFilters);
        buildSearchBox.call(this, divFilters);

        divFilters.append("<div />");
      }

      updateFilterDisplay.call(this);
    },

    /**************************************************************************
    * Removes a filter from the underlying query.
    *
    * @this An instance of AdapTable.Filters.
    * @param columnName {string} The column name.
    **************************************************************************/
    removeFilter: function(columnName)
    {
      if (!columnName || columnName.trim().length < 1)
        throw "Cannot remove a filter: no column name was specified.";

      var layout = this.Instance.Element.data("Layout");

      for (var filterIndex = 0; filterIndex < layout.Query.Filters.length; filterIndex++)
      {
        if (layout.Query.Filters[filterIndex].Column === columnName)
        {
          layout.Query.Filters.splice(filterIndex, 1);
          this.Instance.cacheLayout(layout);
          return;
        }
      }
    }
  }

  /**************************************************************************
  * Builds a filter button and appends it to the container.
  *
  * @this An instance of AdapTable.Filtering.
  * @param container {jQuery} The element that will contain the button.
  * @param column {object} The column metadata.
  **************************************************************************/
  function buildFilterButton(container, column)
  {
    var self = this;

    var filterButton = $("<button />")
      .attr("type", "button")
      .addClass("Filter")
      .text(column.Header + ": ")
      .data("Column", column)
      .append("<span>" + "All" + "</span>")
      .on("click.widgets.adaptable", function(e)
      {
        self.Column = column;
        showFilterMenu.call(self, e);
      });

    container.append(filterButton);
  }

  /**************************************************************************
  * Builds the buttons and menu items for filters and columns.
  *
  * @this An instance of AdapTable.Filtering.
  * @param divFilters {jQuery} The DIV element that will contain the filter
  * buttons.
  **************************************************************************/
  function buildFilterButtonsAndMoreMenu(divFilters)
  {
    var layout = this.Instance.Element.data("Layout");
    var filterCount = 0;
    var olMoreFilters = $("<ol class=\"More-Filters\" />");

    for (var columnIndex = 0; columnIndex < layout.Columns.length; columnIndex++)
    {
      if (!layout.Columns[columnIndex].IsFilterable)
        continue;

      if (layout.Query.Filters.length)
      {
        var filter = findFilter(layout.Query.Filters, layout.Columns[columnIndex].Name);
        if (filter)
        {
          buildFilterButton.call(this, divFilters, layout.Columns[columnIndex]);
          continue;
        }
      }
      else
      {
        if (filterCount < 3)
        {
          buildFilterButton.call(this, divFilters, layout.Columns[columnIndex]);
          filterCount++;
          continue;
        }
      }

      buildMoreFiltersMenuItem.call(this, olMoreFilters, layout.Columns[columnIndex], divFilters);
    }

    divFilters.append(olMoreFilters);
  }

  /**************************************************************************
  * Builds the "Update" and "Close" buttons in the menus that drop down from
  * the filter buttons.
  *
  * @this An instance of AdapTable.Filtering.
  * @param formFilterValues {jQuery} The FORM element that will contain the
  * menu.
  **************************************************************************/
  function buildFilterMenuButtons(formFilterValues)
  {
    var btnUpdate = $("<button />")
      .attr("type", "submit")
      .addClass("Suggested")
      .text("Update");

    var btnClose = $("<button />")
      .attr("type", "button")
      .text("Close")
      .on("click.widgets.adaptable", this.Instance.toggleMenu);

    var divButtons = $("<div />")
      .append(btnUpdate)
      .append(btnClose);

    formFilterValues
      .append(divButtons)
      .on("submit.widgets.adaptable", $.proxy(createFilter, this, true));
  }

  /**************************************************************************
  * Builds the lookup values and menu displayed when a user clicks a filter
  * button for a column that can use lookup values.
  *
  * @this An instance of AdapTable.Filtering.
  * @param formFilterValues {jQuery} The FORM element that will contain the
  * menu.
  **************************************************************************/
  function buildLookupFilters(formFilterValues)
  {
    var cachedData = JSON.parse(localStorage.getItem(this.Instance.STORAGE_PREFIX + document.location));
    var adaptableInstance = cachedData.Instances[$("div.AdapTable").index(this.Instance.Container)];
    var filterValues = this.Instance.Element.data("Data").FilterValues[this.Column.Name];
    var filter = findFilter(this.Instance.Element.data("Layout").Query.Filters, this.Column.Name);

    var lookupList = $("<ul />");
    var self = this;
    filterValues.forEach(function(filterValue)
    {
      var columnCheckbox = $("<input />")
        .attr("type", "checkbox")
        .prop("checked", (filter && filter.Operand.indexOf(filterValue) > -1))
        .on("change.widgets.adaptable", $.proxy(toggleFilter, self));

      var columnLabel = $("<label />")
        .append(columnCheckbox)
        .append(filterValue);

      var listItem = $("<li />")
        .append(columnLabel);

      lookupList.append(listItem);
    });

    formFilterValues.append(lookupList);
  }

  /**************************************************************************
  * Builds the "More" button.
  *
  * @this An instance of AdapTable.Filtering.
  * @param divFilters {jQuery} The DIV element that will contain the filter
  * buttons.
  **************************************************************************/
  function buildMoreButton(divFilters)
  {
    var btnMore = $("<button />")
      .attr("type", "button")
      .addClass("More")
      .text("More")
      .on("click.widgets.adaptable", $.proxy(toggleMoreMenu, this));

    divFilters.append(btnMore);
  }

  /**************************************************************************
  * Builds the menu displayed when the user clicks the "More" button.
  *
  * @this An instance of AdapTable.Filtering.
  * @param olMoreFilters {jQuery} The OL element that will contain the
  * menu items
  * @param column {object} The column metadata.
  * @param divFilters {jQuery} The DIV element that will contain the filter
  * buttons.
  **************************************************************************/
  function buildMoreFiltersMenuItem(olMoreFilters, column, divFilters)
  {
    var chkColumn = $("<input />")
      .attr("type", "checkbox")
      .data("Column", column)
      .on("change.widgets.adaptable", $.proxy(toggleExtraFilter, this, divFilters));

    var lblColumn = $("<label />")
      .append(chkColumn)
      .append(column.Header);

    var listItem = $("<li />")
      .append(lblColumn);

    olMoreFilters.append(listItem);
  }

  /**************************************************************************
  * Builds the search box inside the filter section.
  *
  * @this An instance of AdapTable.Filtering.
  * @param divFilters {jQuery} The DIV element that will contain the filter
  * buttons.
  **************************************************************************/
  function buildSearchBox(divFilters)
  {
    if (!this.Instance.Options.CanSearch)
      return;

    var searchBox = $("<input />")
      .attr("type", "search")
      .attr("placeholder", "Contains text")
      .on("keypress.widgets.adaptable", $.proxy(setWildcardFilter, this));

    var btnSearch = $("<button />")
      .attr("type", "button")
      .addClass("Search")
      .append("<i class=\"fa fa-search\"></i>")
      .on("click.widgets.adaptable", $.proxy(setWildcardFilter, this));

    divFilters
      .append(searchBox)
      .append(btnSearch);
  }

  /**************************************************************************
  * Builds the menu with options for filtering a column of dates.
  *
  * @this An instance of AdapTable.Filtering.
  * @param formFilterValues {jQuery} The FORM element that will contain the
  * menu.
  **************************************************************************/
  function buildTimestampMenu(formFilterValues)
  {
    var rdoFilter = $("<input />")
      .attr("type", "radio")
      .attr("name", "optTimestamp");

    var txtTimeUnit = $("<input />")
      .attr("type", "number")
      .attr("max", "999")
      .attr("min", "1")
      .attr("step", "1");

    var ddlTimeUnits = $("<select />")
      .append("<option value=\"Minutes\">minutes</option>")
      .append("<option value=\"Hours\">hours</option>")
      .append("<option value=\"Days\">days</option>")
      .append("<option value=\"Weeks\">weeks</option>");

    var lblWithinTime = $("<label />")
      .append(rdoFilter)
      .append("Within the last")
      .append(txtTimeUnit)
      .append(ddlTimeUnits);

    var divWithinTime = $("<div />")
      .append(lblWithinTime);

    var lblBetween = $("<label />")
      .append(rdoFilter.clone())
      .append("Between")
      .append("<input type=\"date\" />")
      .append("and")
      .append("<input type=\"date\" />");

    var divBetween = $("<div />")
      .append(lblBetween);

    formFilterValues
      .append(divWithinTime)
      .append(divBetween);
  }

  /****************************************************************************
  * Adds the filter to the query.
  *
  * @this An instance of AdapTable.Filtering.
  * @param getData {boolean} True to get the data after adding the filter,
  * false to just add the filter.
  * @param e {event} The event.
  ****************************************************************************/
  function createFilter(getData, e)
  {
    e.preventDefault();

    var formFilter = $(e.target);

    if (this.Column.DataType === "Numeric" || this.Column.DataType === "Text")
    {
      var inputElement = formFilter.children("input");
      this.addFilter(this.Column.Name, "=", inputElement.val());
    }
    else if (this.Column.DataType === "Timestamp")
    {
      var checkedOption = formFilter.find("label > input[type='radio']:checked");
      if (!checkedOption.length)
        throw "No options are checked.";

      var label = checkedOption.parent();

      if (label.children("input:not([type='radio']):first").attr("type") === "number")
      {
        var recentDate = new Date();
        var recentInput = label.children("input:not([type='radio'])");
        var timeUnits = label.children("select").val();

        switch (timeUnits)
        {
          case "Minutes":
            recentDate = new Date(recentDate.setMinutes(recentDate.getMinutes() - recentInput.val()));
            break;
          case "Hours":
            recentDate = new Date(recentDate.setHours(recentDate.getHours() - recentInput.val()));
            break;
          case "Days":
            recentDate = new Date(recentDate.setDays(recentDate.getDays() - recentInput.val()));
            break;
          case "Weeks":
            recentDate = new Date(recentDate.setWeeks(recentDate.getWeeks() - recentInput.val()));
            break;
        }

        this.addFilter(this.Column.Name, ">=", recentDate.toUTCString());
      }
      else if (label.children("input:first").attr("type") === "date")
      {
        this.addFilter(this.Column.Name, ">=", label.children("input:not([type='radio']):first").val());
        this.addFilter(this.Column.Name, "<=", label.children("input:not([type='radio']):last").val());
      }
    }

    this.Instance.toggleMenu(e);
    updateFilterDisplay.call(this);

    if (getData)
      this.Instance.getData();
  }

  /**************************************************************************
  * Finds a filter by column name.
  *
  * @param filters {array} The array of filters.
  * @param columnName {string} The column name.
  * @returns An object containing the filter data if found, null otherwise.
  **************************************************************************/
  function findFilter(filters, columnName)
  {
    for (var filterIndex = 0; filterIndex < filters.length; filterIndex++)
    {
      if (filters[filterIndex].Column === columnName)
        return filters[filterIndex];
    }

    return null;
  }

  /**************************************************************************
  * Sets the wildcard filter.
  *
  * @this An instance of AdapTable.Filtering.
  * @param e {event} The event.
  **************************************************************************/
  function setWildcardFilter(e)
  {
    if (e.keyCode !== 13)
      return;

    this.addFilter("", "LIKE", $(e.target).val());
    this.Instance.getData();
  }

  /****************************************************************************
  * Displays the menu that shows filter options for a column.
  *
  * @this An instance of AdapTable.Filtering.
  * @param e {event} The event.
  ****************************************************************************/
  function showFilterMenu(e)
  {
    if (e.target.tagName.toUpperCase() !== "BUTTON")
      e.target = e.target.parentElement;

    var btnFilter = $(e.target);
    var divFilters = btnFilter.parents("div.Filters");
    var formFilterValues = $("<form action=\"#\" />");

    switch (this.Column.DataType)
    {
      case "Numeric":
        formFilterValues.append("<input type=\"number\" />");
        buildFilterMenuButtons.call(this, formFilterValues, this.Column.Name);
        break;
      case "String":
        buildLookupFilters.call(this, formFilterValues, this.Column);
        break;
      case "Text":
        formFilterValues.append("<input type=\"text\" />");
        buildFilterMenuButtons.call(this, formFilterValues, this.Column.Name);
        break;
      case "Timestamp":
        buildTimestampMenu.call(this, formFilterValues);
        buildFilterMenuButtons.call(this, formFilterValues, this.Column.Name);
        break;
      default:
        break;
    }

    this.Instance.toggleMenu(e, formFilterValues);
  }

  /****************************************************************************
  * Toggles display of a column filter.
  *
  * @this An instance of AdapTable.Filtering.
  * @param divFilters {jQuery} The DIV element that will contain the filter
  * buttons.
  * @param e {event} The event.
  ****************************************************************************/
  function toggleExtraFilter(divFilters, e)
  {
    var chkFilter = $(e.target);
    var divExtraFilters = divFilters.children("div");

    if (chkFilter.is(":checked"))
      buildFilterButton.call(this, divExtraFilters, chkFilter.data("Column"));
    else
    {
      for (var buttonIndex = 0; buttonIndex < divExtraFilters.children("button").length; buttonIndex)
      {
        var filterButton = $(divExtraFilters.children("button")[buttonIndex]);
        if (filterButton.data("Column") === chkFilter.data("Column"))
        {
          filterButton.remove();
          break;
        }
      }
    }
  }

  /**************************************************************************
  * Toggles the menu displayed when the user clicks the "More" button.
  *
  * @this An instance of AdapTable.Filtering.
  * @param e {event} The event.
  **************************************************************************/
  function toggleFilter(e)
  {
    var checkedBoxes = $(e.target).parents("form").find("input:checked");

    if (!checkedBoxes.length)
      this.removeFilter(this.Column.Name);
    else
    {
      var filterValues = [];

      checkedBoxes.parent().each(function(index, label)
      {
        filterValues.push($(label).text().trim());
      });

      this.addFilter.call(this, this.Column.Name, "IN", filterValues.join());
    }

    this.Instance.getData();
  }

  /**************************************************************************
  * Toggles the menu displayed when the user clicks the "More" button.
  *
  * @this An instance of AdapTable.Filtering.
  * @param e {event} The event.
  **************************************************************************/
  function toggleMoreMenu(e)
  {
    this.Instance.toggleMenu(e, $(e.target).parent().children("ol.More-Filters"));
  }

  /**************************************************************************
  * Updates the UI to reflect what the data is filtered by.
  *
  * @this An instance of AdapTable.Filtering.
  **************************************************************************/
  function updateFilterDisplay()
  {
    var divFilters = this.Instance.Container.find("div.Filters");
    var layout = this.Instance.Element.data("Layout");
    var filterButtons = divFilters.find("button.Filter");

    if (!layout.Query.Filters.length)
      return;

    layout.Query.Filters.forEach(function(filter)
    {
      var column;
      for (var columnIndex = 0; columnIndex < layout.Columns.length; columnIndex++)
      {
        if (layout.Columns[columnIndex].Name === filter.Column)
        {
          column = layout.Columns[columnIndex];
          break;
        }
      }

      var filterButton;
      for (var buttonIndex = 0; buttonIndex < filterButtons.length; buttonIndex++)
      {
        var button = $(filterButtons[buttonIndex]);
        if (button.data("Column") === column)
        {
          filterButton = button;
          break;
        }
      }

      if (filterButton)
      {
        // ENHANCEMENT: Test for dates and convert them to MM/dd/yyyy
        if (filter.Operand.length > 10)
          filterButton.children("span").text(filter.Operand.substr(0, 9) + "...");
        else
          filterButton.children("span").text(filter.Operand);
      }
    });
  }
})();
