(function()
{
  if (!window.AdapTable)
    throw "AdapTable core is not loaded.";

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

      var self = this;
      var layout = this.Instance.Element.data("Layout");

      layout.Columns.forEach(function(column, columnIndex)
      {
        var tableColumn;
        if (!column.Header || column.Header.trim().length < 1)
          tableColumn = self.Instance.Element.find("#thUnnamed" + columnIndex);
        else
          tableColumn = self.Instance.Element.find("#th" + column.Name);

        self.Instance.bubbleArrayElements(layout.Columns, tableColumn.index(), columnIndex);
        self.Instance.cacheLayout(layout);
      });
    }
  };

  /****************************************************************************
  * Moves the dragged column into its new position by moving each column
  * between its original index and the new index to the left or right. TR
  * elements with the role attribute are ignored, otherwise group/aggregate
  * rows break.
  *
  * @this An instance of AdapTable.Positioning.
  * @param startIndex {int} The index to start bubbling columns.
  * @param endIndex {int} The index to stop bubbling columns.
  ****************************************************************************/
  function bubbleColumns(startIndex, endIndex)
  {
    if (startIndex < endIndex)
    {
      for (var cellIndex = startIndex; cellIndex < endIndex; cellIndex++)
      {
        var leftColumn = this.Instance.Element
          .children(this.Instance.Options.ExcludeFooter ? ":not(tfoot)" : "")
          .children("tr:not([role])")
          .children(":nth-child(" + cellIndex + ")");

        var rightColumn = this.Instance.Element
          .children(this.Instance.Options.ExcludeFooter ? ":not(tfoot)" : "")
          .children("tr:not([role])")
          .children(":nth-child(" + (cellIndex + 1) + ")");

        for (var columnIndex = 0; columnIndex < leftColumn.length; columnIndex++)
          swapCells(leftColumn[columnIndex], rightColumn[columnIndex]);
      }
    }
    else if (startIndex > endIndex)
    {
      for (var cellIndex = startIndex; cellIndex > endIndex; cellIndex--)
      {
        rightColumn = this.Instance.Element
          .children(this.Instance.Options.ExcludeFooter ? ":not(tfoot)" : "")
          .children("tr:not([role])")
          .children(":nth-child(" + cellIndex + ")");

        leftColumn = this.Instance.Element
          .children(this.Instance.Options.ExcludeFooter ? ":not(tfoot)" : "")
          .children("tr:not([role])")
          .children(":nth-child(" + (cellIndex - 1) + ")");

        for (var columnIndex = 0; columnIndex < rightColumn.length; columnIndex++)
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
    var self = this;
    var layout = this.Instance.Element.data("Layout");

    layout.Columns.forEach(function(column, columnIndex)
    {
      var header;
      if (!column.Header || column.Header.trim().length < 1)
        header = self.Instance.Element.find("#thUnnamed" + columnIndex);
      else
        header = self.Instance.Element.find("#th" + column.Name);

      if (column.IsMovable)
        header.addClass("AdapTable-Movable");

      self.StartIndex = header.index() + 1;
      self.EndIndex = columnIndex + 1;
      bubbleColumns.call(self, self.StartIndex, self.EndIndex);
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
