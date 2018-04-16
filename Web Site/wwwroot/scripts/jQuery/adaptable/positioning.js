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
  AdapTable.Positioning = function(instance)
  {
    this.Instance = instance;
    this.Instance.Element.on("repaint.widgets.adaptable", $.proxy(restoreColumnPosition, this));
  }

  AdapTable.Positioning.prototype =
  {
    /**************************************************************************
    * Triggered by jQuery UI's sortable once the user has stopped dragging the
    * column they want to move.
    **************************************************************************/
    rearrangeColumns: function()
    {
      bubbleColumns.call(this, this.Instance.Sortable.StartIndex, this.Instance.Sortable.EndIndex);

      var layout = this.Instance.Element.data("Layout");
      this.Instance.Element.find("th").each(function(index, element)
      {
        var layoutIndex = layout.Columns.indexOf($(element).data("Column"));
        var swapColumn = layout.Columns[index];

        layout.Columns[index] = layout.Columns[layoutIndex];
        layout.Columns[layoutIndex] = swapColumn;
      });

      this.Instance.cacheLayout(layout);
      this.Instance.Element.trigger("columns-moved.widgets.adaptable");
    }
  };

  /****************************************************************************
  * Moves the dragged column into its new position by moving each column
  * between its original index and the new index to the left or right. TR
  * elements with the role attribute are ignored (so group/aggregate rows
  * don't break).
  *
  * @this An instance of AdapTable.Positioning.
  * @param startIndex {int} The index to start bubbling columns.
  * @param endIndex {int} The index to stop bubbling columns.
  ****************************************************************************/
  function bubbleColumns(startIndex, endIndex)
  {
    var cellIndex, columnIndex;

    if (startIndex < endIndex)
    {
      for (cellIndex = startIndex; cellIndex < endIndex; cellIndex++)
      {
        var leftColumn = this.Instance.Element
          .children(this.Instance.Options.ExcludeFooter ? ":not(tfoot)" : "")
          .children("tr:not([role])")
          .children(":nth-child(" + cellIndex + ")");

        var rightColumn = this.Instance.Element
          .children(this.Instance.Options.ExcludeFooter ? ":not(tfoot)" : "")
          .children("tr:not([role])")
          .children(":nth-child(" + (cellIndex + 1) + ")");

        for (columnIndex = 0; columnIndex < leftColumn.length; columnIndex++)
          swapCells(leftColumn[columnIndex], rightColumn[columnIndex]);
      }
    }
    else if (startIndex > endIndex)
    {
      for (cellIndex = startIndex; cellIndex > endIndex; cellIndex--)
      {
        rightColumn = this.Instance.Element
          .children(this.Instance.Options.ExcludeFooter ? ":not(tfoot)" : "")
          .children("tr:not([role])")
          .children(":nth-child(" + cellIndex + ")");

        leftColumn = this.Instance.Element
          .children(this.Instance.Options.ExcludeFooter ? ":not(tfoot)" : "")
          .children("tr:not([role])")
          .children(":nth-child(" + (cellIndex - 1) + ")");

        for (columnIndex = 0; columnIndex < rightColumn.length; columnIndex++)
          swapCells(rightColumn[columnIndex], leftColumn[columnIndex]);
      }
    }

    this.StartIndex = this.EndIndex = null;
  }

  /**************************************************************************
  * Restores the position column based on saved state.
  *
  * @this An instance of AdapTable.Positioning.
  * @param e {event} The event.
  **************************************************************************/
  function restoreColumnPosition(e)
  {
    var layout = this.Instance.Element.data("Layout");
    if (!layout)
      return;

    var self = this;
    Lazy(layout.Columns).each(function(column, columnIndex)
    {
      var header = self.Instance.Element.find("th[data-column-name='" + column.Name + "']");

      if (column.IsMovable)
        header.addClass("AdapTable-Movable");

      if (header.index() !== columnIndex)
        swapCells(header[0], self.Instance.Element.find("th:nth-child(" + (columnIndex + 1) + ")")[0]);

      self.Instance.Element.find("td[data-column-name='" + column.Name + "']").each(function(cellIndex, element)
      {
        element = $(element);
        if (element.index() !== columnIndex)
          swapCells(element[0], element.parent().children("td:nth-child(" + (columnIndex + 1) + ")")[0]);
      });
    });
  }

  /****************************************************************************
  * Swaps the positions of two table cells.
  *
  * @param first {jQuery} The first element.
  * @param second {jQuery} The second element.
  ****************************************************************************/
  function swapCells(first, second)
  {
    var firstParent = first.parentNode;
    var firstSibling = (first.nextSibling === second) ? first : first.nextSibling;

    second.parentNode.insertBefore(first, second);
    firstParent.insertBefore(second, firstSibling);
  }
})();
