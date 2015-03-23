(function()
{
  if (!window.AdapTable)
    throw "AdapTable core is not loaded.";

  /****************************************************************************
  * Initialization.
  *
  * @param instance {object} An AdapTable instance.
  ****************************************************************************/
  AdapTable.Grouping = function(instance)
  {
    this.Instance = instance;
    this.Instance.Element.on("repaint.widgets.adaptable", $.proxy(this.applyGrouping, this));
  }

  AdapTable.Grouping.prototype =
  {
    /**************************************************************************
    * Groups the data by the column.
    *
    * @this An instance of AdapTable.Grouping.
    * @param columnName {string} The column name.
    * @param index {int} The group index.
    **************************************************************************/
    addGroup: function(columnName, index)
    {
      if (!columnName || columnName.trim().length < 1)
        throw "Cannot create a group: no column was specified.";

      columnName = columnName.trim();

      var layout = this.Instance.Element.data("Layout");

      if (!index)
        index = layout.Query.Groups.length;

      if (layout.Query.Groups.indexOf(columnName) < 0)
      {
        layout.Query.Groups.splice(index, 0, columnName);
        this.Instance.findColumn("Name", columnName).IsVisible = false;

        this.Instance.cacheLayout(layout);
        this.Instance.getData();
      }
    },

    /**************************************************************************
    * Applies grouping to the rows.
    **************************************************************************/
    applyGrouping: function()
    {
      addGroupDropTargets.call(this);
      this.Instance.Container.find("div.Grouping > ol > li:not(.Add-Group)").remove();

      var layout = this.Instance.Element.data("Layout");
      for (var groupIndex = 0; groupIndex < layout.Query.Groups.length; groupIndex++)
        createGroup.call(this, layout.Query.Groups[groupIndex], groupIndex);

      buildGroupRows.call(this);
    },

    /**************************************************************************
    * Stops grouping the data by the specified column.
    *
    * @this An instance of AdapTable.Grouping.
    * @param columnName {string} The column name.
    **************************************************************************/
    removeGroup: function(columnName)
    {
      var column = this.Instance.findColumn("Name", columnName);
      if (!column)
        return;

      var layout = this.Instance.Element.data("Layout");
      layout.Query.Groups.splice(layout.Query.Groups.indexOf(column, 1));
      column.IsVisible = true;
      this.Instance.cacheLayout(layout);
      this.Instance.getData();
    }
  };

  /**************************************************************************
  * Adds a drop target for grouping columns.
  *
  * @this An instance of AdapTable.Grouping.
  **************************************************************************/
  function addGroupDropTargets()
  {
    if (this.Instance.Container.find("div.Grouping").length)
      return;

    var groupIcon = $("<i />")
      .addClass("fa fa-cubes")
      .attr("title", "Drag and drop a column here to group by that column");

    var groupListItem = $("<li />")
      .addClass("Add-Group")
      .append(groupIcon);

    var self = this;

    var olGroups = $("<ol />")
      .append(groupListItem)
      .sortable(
      {
        axis: "x",
        connectWith: ".Remove-Grouping",
        containment: this.Instance.Container,
        cursorAt: { left: 0, top: 0 },
        items: "li:not(.Add-Group)",
        out: restoreTableColumn,
        over: $.proxy(handleColumnGrouping, this),
        start: $.proxy(recordStartIndex, this),
        stop: $.proxy(handleColumnDrop, this),
        update: $.proxy(recordEndIndex, this)
      }).disableSelection();

    var removeGroupIcon = $("<i />")
      .addClass("fa fa-trash-o")
      .attr("title", "Drag and drop a grouped column here to stop grouping by that column");

    var divRemoveGrouping = $("<div />")
      .addClass("Remove-Grouping")
      .append(removeGroupIcon)
      .sortable(
      {
        containment: this.Instance.Container,
        update: $.proxy(deleteGroup, this)
      }).disableSelection();

    var divGrouping = $("<div />")
      .addClass("Grouping")
      .append(divRemoveGrouping)
      .append(olGroups);

    this.Instance.Container.children("section:first-child").prepend(divGrouping);
  }

  /**************************************************************************
  * Builds the row that displays the group aggregates.
  *
  * @this An instance of AdapTable.Grouping.
  * @param group {string} The group.
  * @param groupIndex {int} The group index.
  * @param groupKey {string} The group key.
  * @param columnCount {int} The number of columns in the table.
  * @param row {jQuery} The TR element that starts a new group.
  **************************************************************************/
  function buildAggregateRow(group, groupIndex, groupKey, columnCount, row)
  {
    var layout = this.Instance.Element.data("Layout");
    var newGroupRow = $("<tr />")
      .attr("role", "group")
      .attr("data-grouplevel", groupIndex + 1)
      .addClass("Aggregates");

    var aggregates = this.Instance.Element.data("Data").Aggregates[groupKey];
    if (!aggregates)
      return;

    for (var columnIndex = 0; columnIndex < columnCount; columnIndex++)
    {
      if (!aggregates[layout.Columns[columnIndex].Name])
        newGroupRow.append("<td />");
      else
      {
        var aggregateLink = $("<a />")
          .attr("title", "Show the group name.")
          .text(aggregates[layout.Columns[columnIndex].Name])
          .on("click.widgets.adaptable", toggleAggregates);

        var tableCell = $("<td />")
          .append(aggregateLink);

        newGroupRow.append(tableCell);
      }

      if (!this.Instance.Element.find("th:eq(" + columnIndex + ")").is(":visible"))
        newGroupRow.children(":last").hide();
    }

    newGroupRow.insertBefore(row);
  }

  /**************************************************************************
  * Builds rows for display and collapsing of grouped data.
  *
  * @this An instance of AdapTable.Grouping.
  **************************************************************************/
  function buildGroupRows()
  {
    var layout = this.Instance.Element.data("Layout");
    if (!layout.Query.Groups.length)
      return;

    var data = this.Instance.Element.data("Data");
    var tbody = this.Instance.Element.children("tbody");
    var columnCount = layout.Columns.length;

    var groups = [];

    for (var groupIndex = 0; groupIndex < layout.Query.Groups.length; groupIndex++)
    {
      groups.push(
      {
        ColumnIndex: layout.Columns.indexOf(this.Instance.findColumn("Name", layout.Query.Groups[groupIndex])),
        Name: layout.Query.Groups[groupIndex],
        Current: null
      });
    }

    var self = this;
    tbody.children("tr").each(function(rowIndex, row)
    {
      row = $(row);

      for (var groupIndex = 0; groupIndex < groups.length; groupIndex++)
      {
        var group = groups[groupIndex];
        var groupCellText = row.children(":eq(" + group.ColumnIndex + ")").text().trim();

        if (group.Current !== groupCellText)
        {
          group.Current = groupCellText;

          var groupKey = "";
          for (var groupNameIndex = 0; groupNameIndex < groups.length; groupNameIndex++)
            groupKey += groups[groupNameIndex].Current + "|";

          groupKey = groupKey.substr(0, groupKey.length - 1);

          buildToggleRow.call(self, group.Current, groupIndex, groupKey, columnCount, row);
          buildAggregateRow.call(self, group.Current, groupIndex, groupKey, columnCount, row);
        }
      }
    });
  }
  
  /**************************************************************************
  * Builds the row that displays the group name and allows the user to
  * toggle the group's detail records and aggregates.
  *
  * @this An instance of AdapTable.Grouping.
  * @param group {string} The group.
  * @param groupIndex {int} The group index.
  * @param groupKey {string} The group key.
  * @param columnCount {int} The number of columns in the table.
  * @param row {jQuery} The TR element that starts a new group.
  **************************************************************************/
  function buildToggleRow(group, groupIndex, groupKey, columnCount, row)
  {
    var toggleIcon = $("<i />")
      .addClass("fa fa-chevron-up")
      .on("click.widgets.adaptable", toggleGroup);

    var newGroupCell = $("<td />")
      .attr("colspan", columnCount)
      .css("padding-left", (groupIndex * 14) + "px")
      .append(toggleIcon)
      .append(group);

    if (this.Instance.Element.data("Data").Aggregates[groupKey])
    {
      var aggregateIcon = $("<i />")
        .addClass("fa fa-calculator")
        .attr("title", "Show aggregates.")
        .on("click.widgets.adaptable", toggleAggregates);

      newGroupCell.append(aggregateIcon);
    }

    var newGroupRow = $("<tr />")
      .attr("role", "group")
      .attr("data-grouplevel", groupIndex + 1)
      .append(newGroupCell);

    newGroupRow.insertBefore(row);
  }

  /**************************************************************************
  * Adds a new group to the table.
  *
  * @this An instance of AdapTable.Grouping.
  * @param columnName {string} The column name.
  * @param index {int} The group index.
  **************************************************************************/
  function createGroup(columnName, index)
  {
    this.addGroup(columnName, index);

    var column = this.Instance.findColumn("Name", columnName);
    var groupList = this.Instance.Container.find("div.Grouping > ol");
    
    if (!groupList.children().length)
      groupList.append("<li>" + column.Header + "</li>");
    else
    {
      groupList.children(":eq(" + index + ")")
        .before("<li>" + column.Header + "</li>");
    }

    this.Instance.Container.find("li.Add-Group").hide();
    this.Instance.Container.find("div.Remove-Grouping").show();
  }

  /**************************************************************************
  * Removes a group and the associated UI elements.
  *
  * @this An instance of AdapTable.Grouping
  * @param e {event} The event.
  * @param ui {jQuery} See the jQuery UI Sortable documentation.
  **************************************************************************/
  function deleteGroup(e, ui)
  {
    ui.item.remove();

    var layout = this.Instance.Element.data("Layout");
    if (!layout.Query.Groups.length)
    {
      this.Instance.Container.find("div.Remove-Grouping").hide();
      this.Instance.Container.find("div.Grouping > i").show();
    }

    this.removeGroup(ui.item.text());
  }

  /**************************************************************************
  * Handles the dropping of a grouped column.
  *
  * @this An instance of AdapTable.Grouping
  * @param e {event} The event.
  * @param ui {jQuery} See the jQuery UI Sortable documentation.
  **************************************************************************/
  function handleColumnDrop(e, ui)
  {
    if (!ui.item.parent().length)
      deleteGroup(e, ui);
    else if(this.Instance.Sortable.EndIndex && this.Instance.Sortable.StartIndex != this.Instance.Sortable.EndIndex)
    {
      var layout = this.Instance.Element.data("Layout");

      this.Instance.bubbleArrayElements(layout.Query.Groups, this.Instance.Sortable.StartIndex, this.Instance.Sortable.EndIndex);
      this.Instance.cacheLayout(layout);
      this.Instance.getData();
    }

    ui.item.remove();
  }

  /**************************************************************************
  * Hides the copy of the table created when a user drags a column header
  * and instead shows only the column header.
  *
  * @this An instance of AdapTable.Grouping
  * @param e {event} The event.
  * @param ui {jQuery} See the jQuery UI Sortable documentation.
  **************************************************************************/
  function handleColumnGrouping(e, ui)
  {
    if (!ui.item.children("table").length)
      return;

    var column = this.Instance.findColumn("Header", ui.item.find("th").text().trim());
    var background = column.IsGroupable ? "inherit" : "#F2DEDE";
    var border = column.IsGroupable ? "1px solid #CCC" : "1px solid #FF8888";
    var color = column.IsGroupable ? "inherit" : "#AA0000";

    ui.item.children().hide();
    ui.item
      .data("CSS",
      {
        background: ui.item.css("background"),
        border: ui.item.css("border"),
        borderRadius: ui.item.css("borderRadius"),
        color: ui.item.css("color"),
        display: ui.item.css("display"),
        height: ui.item.css("height"),
        margin: ui.item.css("margin"),
        padding: ui.item.css("padding"),
        width: ui.item.css("width")
      })
      .css(
      {
        background: background,
        border: border,
        borderRadius: "5px",
        color: color,
        display: "inline-block",
        height: "auto",
        margin: "5px 3px 0 3px",
        padding: "5px",
        width: "auto"
      })
      .append("<span>" + ui.item.find("th").text().trim() + "</span>");
  }

  /**************************************************************************
  * Records the end index of the dragged item.
  *
  * @this An instance of AdapTable.Grouping
  * @param e {event} The event.
  * @param ui {jQuery} See the jQuery UI Sortable documentation.
  **************************************************************************/
  function recordEndIndex(e, ui)
  {
    if (!ui.sender)
      this.Instance.Sortable.EndIndex = ui.item.index();
  }

  /**************************************************************************
  * Records the start index of the dragged item.
  *
  * @this An instance of AdapTable.Grouping
  * @param e {event} The event.
  * @param ui {jQuery} See the jQuery UI Sortable documentation.
  **************************************************************************/
  function recordStartIndex(e, ui)
  {
    this.Instance.Sortable.StartIndex = ui.item.index();
  }

  /**************************************************************************
  * Restores the table column if the user moves the dragged column header
  * back out of the column grouping area.
  *
  * @param e {event} The event.
  * @param ui {jQuery} See the jQuery UI Sortable documentation.
  **************************************************************************/
  function restoreTableColumn(e, ui)
  {
    if (ui.item.children("table").length)
    {
      ui.item
        .css(ui.item.data("CSS"))
        .data("CSS", null);

      ui.item.children("span").hide();
      ui.item.children("table").show();
      ui.item.children("div").show();
    }
  }

  /**************************************************************************
  * Toggles display aggregates for the group.
  *
  * @param e {event} The event.
  **************************************************************************/
  function toggleAggregates(e)
  {
    var clickedElement = $(this);
    var parentRow = clickedElement.parents("tr");

    parentRow.hide();

    if (clickedElement.hasClass("fa-calculator"))
      parentRow.next().show();
    else
      parentRow.prev().show();
  }

  /**************************************************************************
  * Toggles display of all rows within a group.
  *
  * @param e {event} The event.
  **************************************************************************/
  function toggleGroup(e)
  {
    var groupIcon = $(this);
    var groupRow = groupIcon.parents("tr");
    var isVisible;
      
    if (groupIcon.hasClass("fa-chevron-up"))
    {
      isVisible = true;
      groupIcon
        .removeClass("fa-chevron-up")
        .addClass("fa-chevron-down");
    }
    else
    {
      isVisible = false;
      groupIcon
        .removeClass("fa-chevron-down")
        .addClass("fa-chevron-up");
    }

    var nextRow = groupRow.next();
    while (nextRow.length && (nextRow.hasClass("Aggregates") || parseInt(nextRow.attr("data-grouplevel") || 99) > parseInt(groupRow.attr("data-grouplevel"))))
    {
      if (nextRow.hasClass("Aggregates"))
        nextRow.hide();
      else
      {
        if (nextRow.attr("data-grouplevel"))
        {
          var groupIcon = nextRow.find("td > i");
          if (groupIcon.hasClass("fa-chevron-down"))
            groupIcon
              .removeClass("fa-chevron-down")
              .addClass("fa-chevron-up");
        }

        if (isVisible)
          nextRow.hide();
        else
          nextRow.show();
      }

      nextRow = nextRow.next();
    }
  }
})();
