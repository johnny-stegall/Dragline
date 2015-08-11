;(function()
{
  "use strict";

  if (!window.AdapTable)
    throw new Error("AdapTable core hasn't loaded.");

  /****************************************************************************
  * Initialization.
  *
  * @param instance {object} An AdapTable instance.
  ****************************************************************************/
  AdapTable.Filtering = function(instance)
  {
    this.Instance = instance;
    this.Instance.Element.on("repaint.widgets.adaptable columns-moved.widgets.adaptable", $.proxy(this.reflectFilters, this));
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
    * @param getData {boolean} True to get data, otherwise just delete the
    * filter.
    **************************************************************************/
    addFilter: function(columnName, operator, operand, getData)
    {
      if (operator.toUpperCase() !== "LIKE" && (!columnName || columnName.trim().length < 1))
        throw new Error("Cannot create a filter: no column was specified.");
      else if (!operator || operator.trim().length < 1)
        throw new Error("Cannot create a filter: no operator was specified.");
      else if (!operand || operand.trim().length < 1)
        throw new Error("Cannot create a filter: no operand was specified.");

      var layout = this.Instance.Element.data("Layout");

      if (!layout.Query.Filters)
        layout.Query.Filters = [];

      var existingFilter = Lazy(layout.Query.Filters).findWhere({ Column: columnName });
      var column = Lazy(layout.Columns).findWhere({ Name: columnName });

      if (existingFilter && column.DataType !== "Date")
      {
        existingFilter.Operator = operator;
        existingFilter.Operand = operand;
      }
      else
      {
        layout.Query.Filters.push(
        {
          Column: columnName,
          Operator: operator,
          Operand: operand
        });
      }

      this.Instance.cacheLayout(layout);

      if (getData)
        this.Instance.getData();
    },

    /**************************************************************************
    * Updates the column filters to reflect how the data is filtered. Also
    * adds an event-handler to update the filter buttons whenever a column is
    * moved.
    **************************************************************************/
    reflectFilters: function()
    {
      var topSection = this.Instance.Container.children("section:first-child");
      var divFilters = topSection.children("div.Filters");

      if (!divFilters.length)
      {
        divFilters = $("<div />")
          .addClass("Filters");

        topSection.prepend(divFilters);
      }
      else
        divFilters.empty();

      buildFilteringInterface.call(this, divFilters);
      buildMoreButton.call(this, divFilters);
      buildSearchBox.call(this, divFilters);

      var divAdditionalFilters = $("<div />")
        .addClass("Additional-Filters");

      divFilters.append(divAdditionalFilters);
    },

    /**************************************************************************
    * Removes a filter from the underlying query.
    *
    * @this An instance of AdapTable.Filters.
    * @param columnName {string} The column name.
    * @param getData {boolean} True to get data, otherwise just delete the
    * filter.
    **************************************************************************/
    removeFilter: function(columnName, getData)
    {
      var layout = this.Instance.Element.data("Layout");

      layout.Query.Filters = Lazy(layout.Query.Filters)
        .reject(function(filter, index)
        {
          return filter.Column === columnName;
        })
        .toArray();

      this.Instance.cacheLayout(layout);

      if (getData)
        this.Instance.getData();
    }
  }

  /**************************************************************************
  * Builds the menu with options for filtering a column of dates.
  *
  * @param formFilter {jQuery} The FORM element that contains the filters.
  * @param column {object} The column metadata.
  * @param filters {array} The filters for the column.
  **************************************************************************/
  function buildDateFilters(formFilter, column, filters)
  {
    var startDateInput = $("<input />")
      .attr("type", "date")
      .attr("id", "dteStart");

    var spanAnd = $("<span>and</span>")
      .addClass("Hidden");

    var endDateInput = $("<input />")
      .attr("type", "date")
      .attr("id", "dteEnd")
      .addClass("Hidden");

    if (filters.length)
    {
      startDateInput.val(filters[0].Operand);

      if (filters.length === 2)
      {
        spanAnd.removeClass("Hidden");
        endDateInput
          .val(filters[1].Operand)
          .removeClass("Hidden");
      }
    }

    formFilter
      .append(startDateInput)
      .append(spanAnd)
      .append(endDateInput);
  }

  /**************************************************************************
  * Builds a filter button and appends it to the container.
  *
  * @this An instance of AdapTable.Filtering.
  * @param container {jQuery} The element that contains the button.
  * @param column {object} The column metadata.
  **************************************************************************/
  function buildFilterButton(container, column)
  {
    var self = this;

    var spanOperator = $("<span />")
      .text(": ")
      .addClass("Operator");

    var spanOperand = $("<span />")
      .text("All")
      .addClass("Operand");

    var filterButton = $("<button />")
      .attr("type", "button")
      .addClass("Filter")
      .data("Column", column)
      .text(column.Header)
      .append(spanOperator)
      .append(spanOperand)
      .on("click.widgets.adaptable", function(e)
      {
        showFilterOptions.call(self, e, column);
      });

    container.append(filterButton);
  }

  /**************************************************************************
  * Builds the buttons and menu items for filters and columns.
  *
  * @this An instance of AdapTable.Filtering.
  * @param divFilters {jQuery} The DIV element contains the filter
  * buttons.
  **************************************************************************/
  function buildFilteringInterface(divFilters)
  {
    var self = this;
    var filterButtonCount = 0;
    var olMoreFilters = $("<ol class=\"More-Filters\" />");
    var filteredColumns = [];
    var layout = this.Instance.Element.data("Layout");
    var lazyColumns = Lazy(layout.Columns);

    if (layout.Query.Filters)
    {
      Lazy(layout.Query.Filters).each(function(filter, filterIndex)
      {
        if (filter.Column === "")
          return;

        if (filteredColumns.indexOf(filter.Column) < 0)
          filteredColumns.push(filter.Column);

        var column = lazyColumns.findWhere({ Name: filter.Column });
        var filterButton = divFilters
          .find("button.Filter")
          .filter(function(index, button)
          {
            button = $(button);
            return button.data("Column") === column;
          })
          .first();

        if (!filterButton.length)
        {
          buildFilterButton.call(self, divFilters, column);
          filterButton = divFilters.children("button.Filter:last");
        }

        populateFilterButtonText(filterButton, filter, column);

        // When a query has filters, buttons are created for filtered columns
        // only; don't create buttons for other columns
        filterButtonCount = 3;
      });
    }

    // If the query has no filters defined, create a button for the first 3
    // filterable columns
    lazyColumns
      .where({ IsFilterable: true })
      .each(function(column, index)
      {
        if (filterButtonCount < 3)
        {
          buildFilterButton.call(self, divFilters, column);
          filterButtonCount++;
        }
        else if (filteredColumns.indexOf(column.Name) < 0)
          buildMoreFiltersMenuItem.call(self, olMoreFilters, column, divFilters);
      });

    divFilters.append(olMoreFilters);
  }

  /**************************************************************************
  * Builds the "Update" and "Close" buttons in the menus that drop down from
  * the filter buttons.
  *
  * @this An instance of AdapTable.Filtering.
  * @param formFilter {jQuery} The FORM element that contains the filters.
  * @param column {object} The column being filtered.
  **************************************************************************/
  function buildFilterMenuButtons(formFilter, column)
  {
    var self = this;

    var btnUpdate = $("<button />")
      .attr("type", "submit")
      .addClass("Suggested")
      .text("Update");

    var btnClear = $("<button />")
      .attr("type", "button")
      .addClass("Risky")
      .text("Clear")
      .on("click.widgets.adaptable", function(e)
      {
        self.removeFilter(column.Name, true);
        self.Instance.toggleMenu(e);
      });

    var btnClose = $("<button />")
      .attr("type", "button")
      .text("Close")
      .on("click.widgets.adaptable", $.proxy(this.Instance.toggleMenu, this.Instance));

    var divButtons = $("<div />")
      .append(btnUpdate)
      .append(btnClear)
      .append(btnClose);

    formFilter
      .append(divButtons)
      .on("submit.widgets.adaptable", $.proxy(createFilter, this, column));
  }

  /**************************************************************************
  * Builds the lookup values and menu displayed when a user clicks a filter
  * button for a column that can use lookup values.
  *
  * @this An instance of AdapTable.Filtering.
  * @param formFilter {jQuery} The FORM element that contains the filters.
  * @param column {object} The column being filtered.
  **************************************************************************/
  function buildLookupFilters(formFilter, column)
  {
    var cachedData = JSON.parse(localStorage.getItem(this.Instance.STORAGE_PREFIX + document.location));
    var adaptableInstance = cachedData.Instances[$("div.AdapTable").index(this.Instance.Container)];
    var filterValues = this.Instance.Element.data("Data").FilterValues[column.Name];
    var filter = Lazy(this.Instance.Element.data("Layout").Query.Filters).findWhere({ Column: column.Name });
    var lookupList = $("<ul />");
    var self = this;

    Lazy(filterValues).each(function(filterValue, index)
    {
      var columnCheckbox = $("<input />")
        .attr("type", "checkbox")
        .prop("checked", (filter && filter.Operand.indexOf(filterValue) > -1))
        .on("change.widgets.adaptable", $.proxy(toggleLookupFilter, self, column));

      var columnLabel = $("<label />")
        .append(columnCheckbox)
        .append(filterValue);

      var listItem = $("<li />")
        .append(columnLabel);

      lookupList.append(listItem);
    });

    formFilter.append(lookupList);
  }

  /**************************************************************************
  * Builds the "More" button.
  *
  * @this An instance of AdapTable.Filtering.
  * @param divFilters {jQuery} The DIV element that contains the filter
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
  * @param olMoreFilters {jQuery} The OL element that contain the menu
  * items.
  * @param column {object} The column metadata.
  * @param divFilters {jQuery} The DIV element that contain the filter
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
  * Adds an INPUT element based on the data type.
  *
  * @param formFilter {jQuery} The FORM element that contains the filters.
  * @param dataType {string} The data type of the column being filtered.
  * @param filters {array} The filters for the column.
  **************************************************************************/
  function buildNumericOrTextFilters(formFilter, dataType, filters)
  {
    var txtStart = $("<input />")
      .attr("type", (dataType === "Numeric") ? "number" : "text")
      .attr("id", "txtStart");

    var spanAnd = $("<span>and</span>")
      .addClass("Hidden");

    var txtEnd = $("<input />")
      .attr("type", (dataType === "Numeric") ? "number" : "text")
      .attr("id", "txtEnd")
      .addClass("Hidden");

    if (filters.length)
    {
      txtStart.val(filters[0].Operand);

      if (filters.length === 2)
      {
        spanAnd.removeClass("Hidden");
        txtEnd
          .val(filters[1].Operand)
          .removeClass("Hidden");
      }
    }

    formFilter
      .append(txtStart)
      .append(spanAnd)
      .append(txtEnd);
  }

  /**************************************************************************
  * Builds the search box inside the filter section.
  *
  * @this An instance of AdapTable.Filtering.
  * @param divFilters {jQuery} The DIV element that contain the filter
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

    var filter = Lazy(this.Instance.Element.data("Layout").Query.Filters).findWhere( { Column: "" });
    if (filter)
      searchBox.attr("value", filter.Operand);

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
  * Adds a SELECT element with the supported operators.
  *
  * @param formFilter {jQuery} The FORM element that contains the filters.
  * @param dataType {string} The data type of the column being filtered.
  * @param filters {array} The filters for the column.
  **************************************************************************/
  function buildSupportedOperators(formFilter, dataType, filters)
  {
    var ddlOperators = $("<select />");
    var operators =
    {
      "Is greater than": ">",
      "Is greater than or equal to": ">=",
      "Is less than": "<",
      "Is less than or equal to": "<=",
      "Is": "=",
      "Is not": "!="
    };

    if (dataType !== "Text")
      operators["Is between"] = "BETWEEN";

    Lazy(operators).each(function(operatorValue, operatorText)
    {
      var newOption = $("<option />")
        .text(operatorText)
        .val(operatorValue);

      ddlOperators.append(newOption);
    });

    if (filters.length === 2)
      ddlOperators.children("option[value='BETWEEN']").attr("selected", true);
    else if (filters.length)
      ddlOperators.children("option[value='" + filters[0].Operator + "']").attr("selected", true);

    ddlOperators.on("change.widgets.adaptable", function(e)
    {
      var element = $(e.target);

      if (element.val() === "BETWEEN")
        element.parent().children("span, input:last-of-type").removeClass("Hidden");
      else
        element.parent().children("span, input:last-of-type").addClass("Hidden");
    })

    formFilter.append(ddlOperators);
  }

  /****************************************************************************
  * Adds the filter to the query.
  *
  * @this An instance of AdapTable.Filtering.
  * @param column {object} The column being filtered.
  * @param e {event} The event.
  ****************************************************************************/
  function createFilter(column, e)
  {
    e.preventDefault();

    var formFilter = $(e.target);
    var operator = formFilter.children("select").val();

    if (operator !== "BETWEEN")
      this.addFilter(column.Name, operator, formFilter.children("input:first").val(), true);
    else
    {
      this.addFilter(column.Name, ">=", formFilter.children("input:first").val(), false);
      this.addFilter(column.Name, "<=", formFilter.children("input:last").val(), true);
    }

    this.Instance.toggleMenu(e);
  }

  /**************************************************************************
  * Populates the text of a filter button.
  *
  * @param filterButton {jQuery} The BUTTON element.
  * @param filter {object} The filter.
  * @param column {object} The column being filtered against.
  **************************************************************************/
  function populateFilterButtonText(filterButton, filter, column)
  {
    var spanOperator = filterButton.children("span.Operator");
    var spanOperand = filterButton.children("span.Operand");

    if (filter.Operator === "<=" && spanOperator.text() === " >= ")
      spanOperator.text(" between ");
    else if (filter.Operator === "IN")
      spanOperator.text(" is ");
    else if (filter.Operator === "NOT IN")
      spanOperator.text(" is not ");
    else
      spanOperator.text(" " + filter.Operator + " ");

    if (column.DataType === "Date")
    {
      // Break the date into individual parts and use that Date constructor,
      // otherwise the date is UTC and the offset has to be calculated
      var dateParts = filter.Operand.split("-");
      var date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      var formattedDate = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();

      if (spanOperator.text() !== " between ")
        spanOperand.text(formattedDate);
      else
      {
        var existingFilter = filterButton.children("span").text().split(" ");
        spanOperand.text(spanOperand.text() + " and " + formattedDate);
      }
    }
    else if (column.DataType === "Numeric")
      spanOperand.text(filter.Operand);
    else
    {
      if (filter.Operand.length > 20)
        spanOperand.text(filter.Operand.substr(0, 20) + "...");
      else
        spanOperand.text(filter.Operand);
    }
  }

  /**************************************************************************
  * Sets the wildcard filter.
  *
  * @this An instance of AdapTable.Filtering.
  * @param e {event} The event.
  **************************************************************************/
  function setWildcardFilter(e)
  {
    if (e.type === "keypress" && e.keyCode !== 13)
      return;

    var searchBox = $(e.target).parents("div.Filters").children("input[type='search']");
    if (searchBox.val().trim().length < 1)
      this.removeFilter("", true);
    else
      this.addFilter("", "LIKE", searchBox.val(), true);
  }

  /****************************************************************************
  * Displays the menu that shows filter options for a column.
  *
  * @this An instance of AdapTable.Filtering.
  * @param e {event} The event.
  * @param column {object} The column being filtered.
  ****************************************************************************/
  function showFilterOptions(e, column)
  {
    if (e.target.tagName.toUpperCase() !== "BUTTON")
      e.target = e.target.parentElement;

    var btnFilter = $(e.target);
    var divFilters = btnFilter.parents("div.Filters");
    var formFilter = $("<form action=\"#\" />");
    var layout = this.Instance.Element.data("Layout");
    var filters = Lazy(this.Instance.Element.data("Layout").Query.Filters)
      .where({ Column: column.Name })
      .toArray();

    switch (column.DataType)
    {
      case "Numeric":
      case "Text":
        buildSupportedOperators(formFilter, column.DataType, filters);
        buildNumericOrTextFilters(formFilter, column.DataType, filters);
        buildFilterMenuButtons.call(this, formFilter, column);
        break;
      case "Lookup":
        buildLookupFilters.call(this, formFilter, column);
        break;
      case "Date":
        buildSupportedOperators(formFilter, column.DataType, filters);
        buildDateFilters(formFilter, column, filters);
        buildFilterMenuButtons.call(this, formFilter, column);
        break;
      default:
        throw new Error("Unsupported data type for column: " + column.Name + ".");
    }

    this.Instance.toggleMenu(e, formFilter);
  }

  /****************************************************************************
  * Toggles display of a column filter.
  *
  * @this An instance of AdapTable.Filtering.
  * @param divFilters {jQuery} The DIV element that contains the filter
  * buttons.
  * @param e {event} The event.
  ****************************************************************************/
  function toggleExtraFilter(divFilters, e)
  {
    var chkFilter = $(e.target);
    if (chkFilter.prop("tagName").toUpperCase() !== "INPUT")
      chkFilter = chkFilter.children().first();

    var filterIndex = chkFilter.parents("li").index();
    var divExtraFilters = divFilters.children("div");

    // Check the persisted checkbox (that gets copied into the dropdown menu)
    divFilters
      .children("ol.More-Filters")
      .children("li:nth-child(" + (filterIndex + 1) + ")")
      .find("input")
      .prop("checked", chkFilter.prop("checked"));

    if (chkFilter.is(":checked"))
      buildFilterButton.call(this, divExtraFilters, chkFilter.data("Column"));
    else
    {
      divExtraFilters
        .children("button")
        .filter(function(index, button)
        {
          return $(button).data("Column") === chkFilter.data("Column");
        })
        .remove();
    }
  }

  /**************************************************************************
  * Toggles the display of a filter button when the user clicks a filter in
  * the "More" menu.
  *
  * @this An instance of AdapTable.Filtering.
  * @param column {object} The column being filtered.
  * @param e {event} The event.
  **************************************************************************/
  function toggleLookupFilter(column, e)
  {
    var checkedBoxes = $(e.target).parents("form").find("input:checked");

    if (!checkedBoxes.length)
      this.removeFilter(column.Name, false);
    else
    {
      var filterValues = [];
      checkedBoxes.parent().each(function(index, label)
      {
        filterValues.push($(label).text().trim());
      });

      this.addFilter.call(this, column.Name, "IN", filterValues.join(), false);
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
})();
