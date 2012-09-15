(function()
{
  if (!window.AdapTable)
    throw "AdapTable core is not loaded.";

  /****************************************************************************
  * Initialization.
  *
  * @param instance {object} An AdapTable instance.
  ****************************************************************************/
  AdapTable.Sorting = function(instance)
  {
    this.Instance = instance;

    this.Instance.Element
      .on("repaint.widgets.adaptable", $.proxy(this.reflectSorting, this))
      .on("click.widgets.adaptable", "th > a", $.proxy(this.sortData, this));
  }

  AdapTable.Sorting.prototype =
  {
    /**************************************************************************
    * Updates the column headers to reflect how the data is sorted.
    **************************************************************************/
    reflectSorting: function()
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

        if (column.IsSortable && column.Name)
          buildSortableHeader(layout, header, columnIndex, column);
      });
    },

    /**************************************************************************
    * Changes the column and direction of the sort order.
    *
    * @param e {event} The event.
    **************************************************************************/
    sortData: function(e)
    {
      e.stopPropagation();

      var clickedLink = $(e.target);
      var layout = this.Instance.Element.data("Layout");

      if (layout.Query.Sort === clickedLink.parent().data("Column").Name)
      {
        if (layout.Query.SortDirection === "DESC")
          layout.Query.SortDirection = "ASC";
        else
          layout.Query.SortDirection = "DESC";
      }
      else
        layout.Query.SortDirection = "ASC";

      layout.Query.Sort = clickedLink.parent().data("Column").Name;
      this.Instance.cacheLayout(layout);
      this.Instance.getData();
    }
  };

  /****************************************************************************
  * Restores which columns can be sorted and which column is sorted.
  *
  * @param state {object} The restored state.
  * @param header {jQuery} The column header.
  * @param columnIndex {int} The zero-based index of the column.
  * @param column {object} The column state.
  ****************************************************************************/
  function buildSortableHeader(state, header, columnIndex, column)
  {
    var sortLink = header.children("a");

    if (!sortLink.length)
    {
      sortLink = $("<a />")
        .attr("href", "javascript:void(0);")
        .text(header.text().trim());

      header
        .empty()
        .append(sortLink);
    }
    else
      sortLink.children("i").remove();

    if (state.Query.Sort && state.Query.Sort.substr(0, column.Name.length) === column.Name)
    {
      if (state.Query.SortDirection && state.Query.SortDirection.toUpperCase() === "DESC")
        sortLink.append("<i class=\"fa fa-sort-alpha-desc\" />");
      else
        sortLink.append("<i class=\"fa fa-sort-alpha-asc\" />");
    }
  }
})();
