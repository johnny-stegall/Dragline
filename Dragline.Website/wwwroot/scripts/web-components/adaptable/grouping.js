;(function()
{
  "use strict";

  export default class Grouping
  {
    /****************************************************************************
    * Creates an instance of Grouping.
    *
    * @param instance {object} A reference to an instance of AdapTable.
    ****************************************************************************/
    constructor(instance)
    {
      this.Instance = instance;
      instance.addEventListener("paint", applyGrouping.bind(this));
    }

    /**************************************************************************
    * Groups the data by the column.
    *
    * @this An instance of AdapTable.Grouping.
    * @param columnName {string} The column name.
    * @param index {int} The group index.
    **************************************************************************/
    addGroup(columnName, index)
    {
      if (!columnName || columnName.trim().length < 1)
        throw new Error("Cannot create a group: no column was specified.");

      columnName = columnName.trim();

      var layout = this.Instance.Element.data("Layout");

      if (index === null)
        index = layout.Query.Groups.length;

      if (layout.Query.Groups.indexOf(columnName) < 0)
      {
        layout.Query.Groups.splice(index, 0, columnName);
        var column = Lazy(layout.Columns).findWhere({ Name: columnName });
        column.IsVisible = false;

        this.Instance.getData();
        this.Instance.cacheLayout(layout);
      }

      this.Instance.Container.find("div.Grouping > div.Add-Group").sortable("disable");
    }


    /**************************************************************************
    * Stops grouping the data by the specified column.
    *
    * @this An instance of AdapTable.Grouping.
    * @param columnName {string} The column name.
    **************************************************************************/
    removeGroup(columnName)
    {
      var layout = this.Instance.Element.data("Layout");
      var column = Lazy(layout.Columns).findWhere({ Name: columnName });

      if (!column)
        return;

      layout.Query.Groups.splice(layout.Query.Groups.indexOf(columnName), 1);
      column.IsVisible = true;
      this.Instance.getData();
      this.Instance.cacheLayout(layout);

      if (!layout.Query.Groups.length)
        this.Instance.Container.find("div.Grouping > div.Add-Group").sortable("enable");
    }
  }

  /**************************************************************************
  * Applies grouping to the rows.
  **************************************************************************/
  function applyGrouping()
  {
    var layout = this.Instance.Element.data("Layout");
    if (!layout || !layout.Query || !layout.Query.Groups || !layout.Query.Groups.length)
      return;

    addGroupDropTargets.call(this);
    this.Instance.Container.find("div.Groups > ol > li").remove();

    var self = this;
    Lazy(layout.Query.Groups).each(function(group, index)
    {
      createGroup.call(self, group, index);
    });

    var data = this.Instance.Element.data("Data");
    if (data.Pages[layout.Query.PageIndex].Items.length)
      buildGroupRows.call(this);
  }

  /**************************************************************************
  * Adds a drop target for grouping columns.
  *
  * @this An instance of AdapTable.Grouping.
  **************************************************************************/
  function addGroupDropTargets()
  {
    if (this.Instance.Container.find("div.Groups").length)
      return;

    var olGroups = $("<ol />")
      .sortable(
      {
        axis: "x",
        connectWith: "div.Remove-Group",
        containment: this.Instance.Container,
        cursorAt: { left: 5, top: 5 },
        items: "li",
        out: restoreTableColumn,
        over: $.proxy(handleColumnGrouping, this),
        start: $.proxy(recordStartIndex, this),
        stop: $.proxy(handleColumnDrop, this),
        update: $.proxy(recordEndIndex, this)
      })
      .disableSelection();

    var addGroupIcon = $("<i />")
      .addClass("fa fa-cubes")
      .attr("title", "Drag and drop a column here to group by that column");

    var divAddGroup = $("<div />")
      .addClass("Add-Group")
      .append(addGroupIcon)
      .sortable(
      {
        out: restoreTableColumn,
        over: $.proxy(handleColumnGrouping, this),
        start: $.proxy(recordStartIndex, this),
        stop: $.proxy(handleColumnDrop, this),
        update: $.proxy(recordEndIndex, this)
      })
      .disableSelection();

    var removeGroupIcon = $("<i />")
      .addClass("fa fa-trash-o")
      .attr("title", "Drag and drop a grouped column here to stop grouping by that column");

    var divRemoveGroup = $("<div />")
      .addClass("Remove-Group")
      .append(removeGroupIcon)
      .sortable(
      {
        update: $.proxy(deleteGroup, this)
      })
      .disableSelection();

    var divGroups = $("<div />")
      .addClass("Groups")
      .append(olGroups)
      .append(divAddGroup)
      .append(divRemoveGroup);

    this.Instance.Container.children("section:first-child").prepend(divGroups);
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

      if (!this.Instance.Element.find("th:nth-child(" + (columnIndex + 1) + ")").is(":visible"))
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

    var tbody = this.Instance.Element.children("tbody");
    var columnCount = layout.Columns.length;
    var groups = [];

    Lazy(layout.Query.Groups).each(function(group, groupIndex)
    {
      var lazyColumns = Lazy(layout.Columns);

      groups.push(
      {
        ColumnIndex: lazyColumns.indexOf(lazyColumns.findWhere({ Name: layout.Query.Groups[groupIndex] })),
        Name: layout.Query.Groups[groupIndex],
        Current: null
      });
    });

    var self = this;
    tbody.children("tr").each(function(rowIndex, row)
    {
      row = $(row);

      var lazyGroups = Lazy(groups);
      var groupKey = lazyGroups.join("|");

      lazyGroups.each(function(group, groupIndex)
      {
        var groupCellText = row.children(":nth-child(" + (group.ColumnIndex + 1) + ")").text().trim();
        if (group.Current !== groupCellText)
        {
          group.Current = groupCellText;
          buildToggleRow.call(self, group.Current, groupIndex, groupKey, columnCount, row);
          buildAggregateRow.call(self, group.Current, groupIndex, groupKey, columnCount, row);
        }
      });
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

    var column = Lazy(this.Instance.Element.data("Layout").Columns).findWhere({ Name: columnName });
    var groupList = this.Instance.Container.find("div.Groups > ol");
    
    if (!groupList.children().length)
      groupList.append("<li>" + column.Header + "</li>");
    else
    {
      groupList.children(":nth-child(" + index + ")")
        .after("<li>" + column.Header + "</li>");
    }
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
      return;
    else if (this.Instance.Sortable.EndIndex !== null && this.Instance.Sortable.StartIndex !== this.Instance.Sortable.EndIndex)
    {
      var layout = this.Instance.Element.data("Layout");

      this.Instance.bubbleArrayItems(layout.Query.Groups, this.Instance.Sortable.StartIndex, this.Instance.Sortable.EndIndex);
      this.Instance.getData();
      this.Instance.cacheLayout(layout);
    }
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

    var column = Lazy(this.Instance.Element.data("Layout").Columns).findWhere({ Header: ui.item.find("th").text().trim() });

    ui.item.children().hide();
    ui.item
      .append("<span>" + ui.item.find("th").text().trim() + "</span>")
      .addClass(column.IsGroupable ? "Group" : "Cannot-Group");
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
    {
      this.Instance.Sortable.EndIndex = ui.item.index();
      this.Instance.Sortable.toggleTextSelection();
    }

    ui.item.remove();
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
    this.Instance.Sortable.toggleTextSelection();
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
      ui.item.removeClass("Group Cannot-Group");
      ui.item.children("span").hide();
      ui.item.children("table, div").show();
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
          groupIcon = nextRow.find("td > i");
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
