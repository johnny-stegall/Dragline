(function()
{
  if (!window.AdapTable)
    throw "AdapTable core is not loaded.";

  /****************************************************************************
  * Initialization.
  *
  * @param instance {object} An AdapTable instance.
  ****************************************************************************/
  AdapTable.Paging = function(instance)
  {
    this.Instance = instance;
    this.Instance.Element.on("repaint.widgets.adaptable", $.proxy(this.configurePaging, this));
  }

  AdapTable.Paging.prototype =
  {
    /**************************************************************************
    * Configures paging.
    **************************************************************************/
    configurePaging: function()
    {
      if (this.Instance.Options.Paging.toLowerCase() === "pager")
        buildPager.call(this);
    }
  };

  /****************************************************************************
  * Builds information about the page: the starting item number on the page,
  * the ending item number on the page, and the total number of items.
  *
  * @this An instance of AdapTable.Paging.
  * @param divPageInfo {jQuery} The DIV element that will contain the page
  * info.
  * @param layout {object} The layout.
  * @param totalItems {int} The total number of items in the result set.
  * @param totalPages {int} The total number of pages.
  ****************************************************************************/
  function buildPageInfo(divPageInfo, layout, totalItems, totalPages)
  {
    divPageInfo.empty();

    var pageStartIndex = (layout.Query.PageIndex * layout.Query.PageSize) + 1;

    var pageEndIndex;

    if (layout.Query.PageIndex === totalPages)
      pageEndIndex = totalItems;
    else
      pageEndIndex = ((layout.Query.PageIndex + 1) * layout.Query.PageSize);

    var spanPageStart = $("<span />")
      .addClass("Adaptable-Page-Start")
      .text(pageStartIndex);

    var spanPageEnd = $("<span />")
      .addClass("Adaptable-Page-End")
      .text(pageEndIndex);

    var spanTotalItems = $("<span />")
      .addClass("Adaptable-Total-Items")
      .text(totalItems);

    divPageInfo
      .append(spanPageStart)
      .append("-")
      .append(spanPageEnd)
      .append(" of ")
      .append(spanTotalItems);
  }

  /****************************************************************************
  * Builds the links to pages. Links are made for the previous two pages and
  * the next two pages from the current page, as well as the last page.
  *
  * @this An instance of AdapTable.Paging.
  * @param olPages {jQuery} The OL element that will contain the page number
  * links.
  * @param currentPage {int} The zero-based page index of the current page.
  * @param totalPages {int} The total number of pages.
  ****************************************************************************/
  function buildPageNumbers(olPages, currentPage, totalPages)
  {
    olPages.empty();

    var startPage = (currentPage < 3) ? 1 : currentPage;
    var endPage = (totalPages > currentPage + 3) ? currentPage + 3 : totalPages;

    for (var pageIndex = startPage; pageIndex <= endPage; pageIndex++)
    {
      if (pageIndex == (currentPage + 1))
        olPages.append("<li><strong>" + pageIndex + "</strong></li>");
      else
        olPages.append("<li><a href=\"javascript:void(0);\">" + pageIndex + "</a></li>");
    }

    if (startPage > 1)
    {
      olPages
        .prepend("<li>...</li>")
        .prepend("<li><a href=\"javascript:void(0);\">1</a></li>");
    }
    else if (endPage < totalPages)
    {
      olPages
        .append("<li>...</li>")
        .append("<li><a href=\"javascript:void(0);\">" + totalPages + "</a></li>");
    }

    olPages.find("a").on("click", $.proxy(changePage, this));
  }

  /****************************************************************************
  * Builds information about items per page and the total number of items and
  * the page links.
  *
  * @this An instance of AdapTable.Paging.
  ****************************************************************************/
  function buildPager()
  {
    var pagerSection = this.Instance.Container.children("section:last-of-type");

    if (!pagerSection.children("ol").length)
    {
      pagerSection
        .append("<div />")
        .append("<ol />");
    }

    var layout = this.Instance.Element.data("Layout");
    var totalItems = getTotalItems.call(this);
    var totalPages = Math.ceil(totalItems / layout.Query.PageSize);

    buildPageInfo.call(this, pagerSection.children("div"), layout, totalItems, totalPages);
    buildPageNumbers.call(this, pagerSection.children("ol"), layout.Query.PageIndex, totalPages);
  }

  /****************************************************************************
  * Moves to the next page.
  *
  * @this An instance of AdapTable.Paging.
  * @param e {event} The event.
  ****************************************************************************/
  function changePage(e)
  {
    e.preventDefault();

    var layout = this.Instance.Element.data("Layout");
    layout.Query.PageIndex = parseInt($(e.target).text()) - 1;
    this.Instance.cacheLayout(layout);
    this.Instance.getData(true);
  }

  /****************************************************************************
  * Gets the total number of items in the query result set.
  *
  * @this An instance of AdapTable.Paging.
  * @returns The number of total items in the query result set.
  ****************************************************************************/
  function getTotalItems()
  {
    return this.Instance.Element.data("Data").TotalItems;
  }
})();

