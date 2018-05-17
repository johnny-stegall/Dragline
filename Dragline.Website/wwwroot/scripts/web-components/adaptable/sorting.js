;(function()
{
  "use strict";

  class Sorting
  {
    /****************************************************************************
    * Creates an instance of Sorting.
    *
    * @param instance {object} A reference to an instance of AdapTable.
    ****************************************************************************/
    constructor(instance)
    {
      this.Instance = instance;
      instance.addEventListener("paint", reflectSorting.bind(this));
      instance.querySelectorAll("th > a").addEventListener("paint", sortData.bind(this));
    }
  }

  AdapTable.Sorting.prototype =
  {
    /**************************************************************************
    * Updates the column headers to reflect how the data is sorted.
    **************************************************************************/
    reflectSorting: function()
    {
      var layout = this.Instance.Element.data("Layout");
      if (!layout)
        return;

      var self = this;
      var lazyColumns = Lazy(layout.Columns);

      lazyColumns
        .where({ IsSortable: true })
        .each(function(column, index)
        {
          if (column.Name)
          {
            var header = self.Instance.Element.find("th[data-column-name='" + column.Name + "']");
            buildSortableHeader(layout, header, lazyColumns.indexOf(column), column);
          }
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
      this.Instance.getData();
      this.Instance.cacheLayout(layout);
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
