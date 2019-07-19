;(function()
{
  "use strict";

  export default class Paging
  {
    /****************************************************************************
    * Creates an instance of Paging.
    *
    * @param instance {object} A reference to an instance of AdapTable.
    ****************************************************************************/
    constructor(instance)
    {
      this.Instance = instance;

      instance.addEventListener("page changed", loadData.bind(this));
      instance.addEventListener("paint", configurePaging.bind(this));
    }

    /****************************************************************************
    * Adds structure and eventing to the AdapTable instance to allow for
    * infinite scrolling through data.
    ****************************************************************************/
    buildInfiniteScrolling()
    {
      // ENHANCEMENT: Query - Add infinte scrolling
      //       1 - Scrolling should be based on the scrolling of the container
      //       2 - A table row should be inserted above and below the current page of rows, with its height set to mimic the height of PageSize * TR.Height
      //       3 - Scroll to the current page
    }

    /****************************************************************************
    * Adds structure and eventing to the AdapTable instance to allow for
    * paging through data.
    ****************************************************************************/
    buildPager()
    {
      let pagerSection = this.Instance.querySelector("section:last-of-type");
      let pagerDiv = pagerSection.querySelector("div");
      let pagerList = pagerSection.querySelector("ol");
      let buffer = document.createDocumentFragment();

      if (!pagerList)
      {
        pagerDiv = document.createElement("div");
        buffer.appendChild(pagerDiv);

        pagerList = document.createElement("ol");
        buffer.appendChild(pagerList);
      }

      let totalItems = (this.Instance.Data != null) ? this.Instance.Data.TotalItems : 0;
      let totalPages = Math.ceil(totalItems / this.Instance.Layout.Query.PageSize);

      buildPagerInfo.call(this, pagerDiv, layout, totalItems, totalPages);
      buildPagerNumbers.call(this, pagerList, layout.Query.PageIndex, totalPages);
      pagerSection.appendChild(buffer);
    }

    /**************************************************************************
    * Configures paging.
    **************************************************************************/
    configurePaging()
    {
      if (!this.Instance.Layout.Query)
        this.Instance.Layout.Query = {};

      this.Instance.Layout.Query.PageSize = 10;
      this.Instance.Layout.Query.PageIndex = 0;

      if (this.Instance.getAttribute("paging") === "pager")
        buildPager();
      else if (this.Instance.getAttribute("paging") === "scroll")
        buildInfiniteScrolling();
    }
  }

  /****************************************************************************
  * Builds information about the page: the starting item number on the page,
  * the ending item number on the page, and the total number of items.
  *
  * @this An instance of AdapTable.Paging.
  * @param divPageInfo {jQuery} The DIV element that will contain the page
  * info.
  * @param totalItems {int} The total number of items in the result set.
  * @param totalPages {int} The total number of pages.
  ****************************************************************************/
  function buildPagerInfo(divPageInfo, totalItems, totalPages)
  {
    divPageInfo.innerHTML = "";

    let pageStartIndex = (this.Instance.Layout.Query.PageIndex * this.Instance.Layout.Query.PageSize) + 1;
    let pageEndIndex;

    if (this.Instance.Layout.Query.PageIndex === totalPages)
      pageEndIndex = totalItems;
    else
      pageEndIndex = ((this.Instance.Layout.Query.PageIndex + 1) * this.Instance.Layout.Query.PageSize);

    let spanPageStart = document.createElement("span");
    spanPageStart.classList.add("Adaptable-Page-Start");
    spanPageStart.innerText = pageStartIndex;

    let spanPageEnd = document.createElement("span");
    spanPageEnd.classList.add("Adaptable-Page-End");
    spanPageEnd.innerText = pageEndIndex;

    let spanTotalItems = document.createElement("span");
    spanTotalItems.classList.add("Adaptable-Total-Items");
    spanTotalItems.innerText = totalItems;

    divPageInfo.appendChild(spanPageStart);
    divPageInfo.appendChild("-");
    divPageInfo.appendChild(spanPageEnd);
    divPageInfo.appendChild(" of ");
    divPageInfo.appendChild(spanTotalItems);
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
  function buildPagerNumbers(olPages, currentPage, totalPages)
  {
    olPages.innerHTML = "";
    let startPage = (currentPage < 3) ? 1 : currentPage;
    let endPage = (totalPages > currentPage + 3) ? currentPage + 3 : totalPages;

    for (let pageIndex = startPage; pageIndex <= endPage; pageIndex++)
    {
      let pageItem = document.createElement("li");

      if (pageIndex == (currentPage + 1))
      {
        let pageNumber = document.createElement("strong");
        pageNumber.innerText = pageIndex;
        pageItem.appendChild(pageNumber);
      }
      else
      {
        let pageLink = document.createElement("a");
        pageLink.href = "javascript:void(0);";
        pageLink.innerText = pageIndex;
        pageLink.addEventListener("click", changePage.bind(this));
        pageItem.appendChild(pageLink);
      }
    }

    if (startPage > 1)
    {
      let ellipsesItem = document.createElement("li");
      ellipsesItem.innerText = "...";
      olPages.insertBefore(ellipsesItem);

      let noOpItem = document.createElement("li");
      let noOpLink = document.createElement("a");
      noOpLink.href = "javascript:void(0);";
      noOpLink.addEventListener("click", changePage.bind(this));
      noOpItem.appendChild(noOpLink);
      olPages.insertBefore(noOpItem);
    }
    else if (endPage < totalPages)
    {
      let ellipsesItem = document.createElement("li");
      ellipsesItem.innerText = "...";
      olPages.insertBefore(ellipsesItem);

      let noOpItem = document.createElement("li");
      let noOpLink = document.createElement("a");
      noOpLink.href = "javascript:void(0);";
      noOpLink.innerText = totalPages;
      noOpLink.addEventListener("click", changePage.bind(this));
      noOpItem.appendChild(noOpLink);
      olPages.insertBefore(noOpItem);
    }
  }

  /****************************************************************************
  * Checks sessionStorage for data, and if found and not expired, loads the
  * cached data. If no data is found or it's expired, GetDataCallback is
  * invoked.
  *
  * @this An instance of AdapTable.
  ****************************************************************************/
  function loadData()
  {
    if (this.Data.Items.length === 0 || this.Data.Expiration < (+new Date()))
    {
      this.Data.Items = this.GetDataCallback(this.Page);
      this.Data.Expiration = (+new Date()) + (this.Expiration * 60 * 60 * 1000);
      cacheState.call(this);
    }

    identifyColumns.call(this);
    //let bindableData =
    //{
    //  Aggregates: this.Data.Aggregates,
    //  FilterValues: this.Data.FilterValues,
    //  Items: this.Data.Pages[this.Page - 1],
    //  TotalItems: this.Data.TotalItems
    //};

    let startIndex = this.Layout.Query.PageIndex * this.Layout.Query.PageSize;
    let endIndex = startIndex + this.Layout.Query.PageSize;
    for (let rowIndex = startIndex; rowIndex < endIndex; rowIndex++)
    {
      // TODO: Bind the table to this.Data.Pages[this.Page - 1]
    }
  }
})();