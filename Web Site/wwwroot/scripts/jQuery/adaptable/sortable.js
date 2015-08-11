;(function()
{
  "use strict";

  if (!window.AdapTable)
    throw new Error("AdapTable core hasn't loaded.");
  else if (!jQuery.ui.sortable)
    throw new Error("jQuery UI isn't detected; grouping and column positioning require jQuery UI.");

  /****************************************************************************
  * Initialization.
  *
  * @param instance {object} An AdapTable instance.
  ****************************************************************************/
  AdapTable.Sortable = function(instance)
  {
    this.Instance = instance;
    this.Instance.Element.on("mousedown.widgets.adaptable", "th.AdapTable-Movable", $.proxy(this.buildSortable, this));
  }

  AdapTable.Sortable.prototype =
  {
    /**************************************************************************
    * Listens for the left mouse click and triggers the building of a jQuery
    * UI Sortable.
    *
    * @param e {event} The event.
    **************************************************************************/
    buildSortable: function(e)
    {
      if (e.which !== 1 || e.target.tagName.toUpperCase() === "A")
        return;

      e.stopPropagation();
      buildSortableList.call(this);

      this.DraggableList
        .sortable(
        {
          containment: this.Container,
          cursorAt: { left: 5, top: 5 },
          distance: 0,
          items: ".AdapTable-Sortable",
          stop: $.proxy(handleColumnDrop, this),
          tolerance: "pointer"
        })
        .disableSelection();

      if (this.Instance.Options.CanGroup)
        this.DraggableList.sortable("option", "connectWith", "div.Add-Group, div.Groups > ol");
      else
        this.DraggableList.sortable("option", "axis", "x");

      var self = this;

      this.StartIndex = $(e.target)
        .closest("th")
        .index() + 1;

      copyDragEvent.call(this, e);

      var placeholder = this.DraggableList.find(".ui-sortable-placeholder");
      if (placeholder.height() > 0)
      {
        placeholder.css("height", this.Instance.Element.height());
        placeholder.append("<div style=\"height: 100%;\" />");
      }
    },

    /**************************************************************************
    * Toggles a user's ability to select text with the mouse.
    **************************************************************************/
    toggleTextSelection: function()
    {
      var body = $(document.body);

      if (!body.attr("unselectable"))
      {
        body
          .removeAttr("unselectable")
          .removeClass("Disable-Text-Selection")
          .off("selectstart");
      }
      else
      {
        body
          .attr("unselectable", "on")
          .addClass("Disable-Text-Selection")
          .on("selectstart.widgets.adaptable", false);

        window.getSelection().removeAllRanges();
      }
    }
  };

  /**************************************************************************
  * Builds each column of the table within an LI element and copies the
  * attributes of each cell over so the mock table looks like the real
  * table.
  *
  * @this An instance of AdapTable.Sortable.
  * @param tableAttributes {object} The object (or associative array) that
  * has all of the attributes of the TABLE element.
  **************************************************************************/
  function buildMockTable(tableAttributes)
  {
    var self = this;
    this.Instance.Element.find("thead > tr > th").each(function(columnIndex, header)
    {
      var listItem = $("<li />");
      self.DraggableList.append(listItem);

      header = $(header);
      if (header.is(":visible"))
      {
        if (!self.Instance.Options.MovableColumns && header.text().trim().length > 0)
          listItem.addClass("AdapTable-Sortable");
        else if (self.Instance.Options.MovableColumns && header.is(self.Instance.Options.MovableColumns))
          listItem.addClass("AdapTable-Sortable");
      }
      else
        listItem.css("display", "none");

      var mockTable = $("<table />");
      listItem.append(mockTable);

      for (var attribute in tableAttributes.Attributes)
        mockTable.attr(attribute, tableAttributes.Attributes[attribute]);

      var thead = $("<thead />");
      mockTable.append(thead);

      var tbody = $("<tbody />");
      mockTable.append(tbody);

      // Cells with column spans > 1 get ignored, which includes group and
      // aggregate columns, which messes up the UI. To get around this, the
      // first column is used for building the structure
      self.Instance.Element
        .children(self.Instance.Options.ExcludeFooter ? ":not(tfoot)" : "")
        .children("tr:visible")
        .children(":first-child")
        .each(function(rowIndex, tableCell)
        {
          // Get a reference to the actual cell the contains the data
          var dataCell = $(tableCell).parent().children(":nth-child(" + (columnIndex + 1) + ")");
          var tableRow = $("<tr />");

          for (var attribute in tableAttributes.RowAttributes[rowIndex])
            tableRow.attr(attribute, tableAttributes.RowAttributes[rowIndex][attribute]);

          if (tableCell.tagName.toLowerCase() === "th")
            thead.append(tableRow);
          else
            tbody.append(tableRow);

          if (!dataCell.length)
            tableRow.append("<td>&nbsp;</td>");
          else if (dataCell.text().trim().length < 1)
            tableRow.append(dataCell.clone().html("&nbsp;"));
          else
            tableRow.append(dataCell.clone());
        });
    });
  }

  /**************************************************************************
  * Builds the UL element that becomes a jQuery UI sortable.
  *
  * @this An instance of AdapTable.Sortable.
  **************************************************************************/
  function buildSortableList()
  {
    var tableAttributes = getRelevantTableAttributes(this.Instance.Element, this.Instance.Options.ExcludeFooter);
    tableAttributes.Width += 2;

    this.DraggableList = $("<ol />")
      .attr("id", "olAdapTable")
      .attr("unselectable", "on")
      .css("position", "absolute")
      .css("width", tableAttributes.Width + "px");

    buildMockTable.call(this, tableAttributes);

    this.DraggableList
      .insertBefore(this.Instance.Element)
      .find("li > table")
      .each(function(tableIndex)
      {
        $(this).css("width", tableAttributes.HeaderWidths[tableIndex] + "px");
      });
  }

  /**************************************************************************
  * Copies the original left-click event the user made against the table to
  * the sortable UL element.
  *
  * @param e {event} The event.
  **************************************************************************/
  function copyDragEvent(e)
  {
    this.DraggedRow = this.DraggableList.children(":nth-child(" + this.StartIndex + ")");
    this.toggleTextSelection();

    // Clone the initial event and trigger the sortable with it
    this.DraggedRow.trigger($.extend($.Event(e.type),
    {
      which: 1,
      clientX: e.clientX,
      clientY: e.clientY,
      pageX: e.pageX,
      pageY: e.pageY,
      screenX: e.screenX,
      screenY: e.screenY
    }));
  }

  /**************************************************************************
  * Gets all relevant information from the table needed to make a copy to
  * display to the user as a sortable.
  *
  * @param element {jQuery} The TABLE element.
  * @param excludeFooter {boolean} Set to true to exclude the footer.
  * @returns An object containing all relevant attributes needed to
  * replicate the TABLE.
  **************************************************************************/
  function getRelevantTableAttributes(element, excludeFooter)
  {
    var table = {};
    table.Attributes = {};
    table.RowAttributes = [];
    table.Width = 0;

    $.map(element[0].attributes, function(attribute)
    {
      if (attribute.specified && attribute.name !== "id")
        table.Attributes[attribute.name] = attribute.value;
    });

    table.HeaderWidths = $.map(element.find("thead > tr > th"), function(header)
    {
      header = $(header);
      table.Width += header.outerWidth();
      return header.outerWidth();
    });

    element
      .children(excludeFooter ? ":not(tfoot)" : "")
      .children("tr:visible")
      .each(function(rowIndex)
      {
        table.RowAttributes[rowIndex] = {};

        $.map(this.attributes, function(attribute)
        {
          if (attribute.specified && attribute.name !== "id")
            table.RowAttributes[rowIndex][attribute.name] = attribute.value;
        });
      });

    return table;
  }

  /**************************************************************************
  * Handles the dropping of a sortable column.
  *
  * @this An instance of AdapTable.Sortable.
  * @param e {event} The event.
  * @param ui {jQuery} See the jQuery UI Sortable documentation.
  **************************************************************************/
  function handleColumnDrop(e, ui)
  {
    this.Instance.Sortable.DraggableList
      .addClass("AdapTable-Disabled")
      .sortable("disable");

    if (ui.item.parent()[0] === this.DraggableList[0])
    {
      this.EndIndex = this.DraggedRow.index() + 1;
      this.Instance.Positioning.rearrangeColumns();
    }
    else
    {
      this.EndIndex = this.DraggedRow.index();
      var column = Lazy(this.Instance.Element.data("Layout").Columns).findWhere({ Header: ui.item.find("th").text() });

      if (column.IsGroupable)
        this.Instance.Grouping.addGroup(column.Name, this.EndIndex);
      else
        ui.item.remove();
    }

    this.DraggableList.remove();
    this.DraggableList = null;
    this.DraggedRow = null;
    this.toggleTextSelection();
  }
})();
