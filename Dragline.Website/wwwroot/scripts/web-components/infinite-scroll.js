/******************************************************************************
* Infinite Scrolling Custom Element
* Author: John Stegall
* Copyright: 2015 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-scrollable> custom element.
******************************************************************************/
;(function(window, document, undefined)
{
  "use strict";

  let infiniteScrollPrototype = Object.create(HTMLElement.prototype);
  let STORAGE_PREFIX = "Infinite Scroll: ";

  /****************************************************************************
  * Invoked when created.
  ****************************************************************************/
  infiniteScrollPrototype.createdCallback = function()
  {
    this.HasLoadedData = false;
    this.NoMoreData = false;
    this.PageIndex = 0;
    this.Rows = 0;

    this.createShadowRoot();
    this.shadowRoot.innerHTML = "<style>@import url('/css/font-awesome.min.css')</style><content></content>";
  };

  /****************************************************************************
  * Invoked when attached to the DOM.
  ****************************************************************************/
  infiniteScrollPrototype.attachedCallback = function()
  {
    if (!this.hasAttribute("page-size"))
      this.setAttribute("page-size", "25");

    if (!this.hasAttribute("threshold"))
      this.setAttribute("threshold", "0.67");

    if (!this.hasAttribute("use-window"))
      this.setAttribute("use-window", "");
    
    this.HeaderHeight = this.clientHeight;
    this.ItemHeight = this.ItemHeight || calculateItemHeight.call(this);

    buildSpacers.call(this);
    wireEvents.call(this);
  };

  /****************************************************************************
  * Invoked when attributes change.
  *
  * @param attributeName {string} The attribute name.
  * @param oldValue {string} The old value.
  * @param newValue {string} The new value.
  ****************************************************************************/
  infiniteScrollPrototype.attributeChangedCallback = function(attributeName, oldValue, newValue)
  {
    switch (attributeName)
    {
      case "use-window":
        wireEvents.call(this);
        break;
    }
  };

  /****************************************************************************
  * Caches the data.
  *
  * @param newData {array} The array of data retrieved from the server.
  ****************************************************************************/
  infiniteScrollPrototype.cacheData = function(newData)
  {
    if (!newData || !newData.length)
      this.NoMoreData = true;
    else if (this.id)
    {
      let cachedData = JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + document.location)) || { Instances: {} };
      let instanceCache = cachedData.Instances[this.id];
      if (!instanceCache)
      {
        instanceCache = { Data: [] };
        cachedData.Instances[this.id] = instanceCache;
      }

      if (instanceCache.Data.indexOf(newData) > -1)
        this.NoMoreData = true;
      else
      {
        instanceCache.Data = instanceCache.Data.concat(newData);
        sessionStorage.setItem(STORAGE_PREFIX + document.location, JSON.stringify(cachedData));
      }

      this.Rows = instanceCache.Data.length;
    }
    else
    {
      let cachedData = JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + document.location)) || [];

      if (cachedData.indexOf(newData) > -1)
        this.NoMoreData = true;
      else
      {
        cachedData = cachedData.concat(newData);
        sessionStorage.setItem(STORAGE_PREFIX + document.location, JSON.stringify(cachedData));
      }

      this.Rows = cachedData.length;
    }

    let thresholdReachedEvent = new CustomEvent("thresholdReached", { detail: { "data": loadData.call(this) } });
    this.dispatchEvent(thresholdReachedEvent);
  };

  let InfiniteScroller = document.registerElement("dragline-scrollable", { prototype: infiniteScrollPrototype });

  /**************************************************************************
  * Builds spacer elements above and below the target element to keep the
  * scrollbar accurate and reduce the memory footprint.
  *
  * @this The <dragline-scrollable> element.
  **************************************************************************/
  function buildSpacers()
  {
    this.TopSpacer = document.createElement("div");
    this.TopSpacer.className += "Top-Spacer";
    this.shadowRoot.insertBefore(this.TopSpacer, this.shadowRoot.querySelector("content"));

    this.BottomSpacer = document.createElement("div");
    this.BottomSpacer.className += "Bottom-Spacer";
    this.shadowRoot.appendChild(this.BottomSpacer);
  }

  /**************************************************************************
  * Calculates the height of items in the scrollable element. This is done
  * by adding an invisible child, performing the calculation, then removing
  * the invisible child.
  *
  * @this The <dragline-scrollable> element.
  * @returns The height of an item.
  **************************************************************************/
  function calculateItemHeight()
  {
    let itemHeight;

    if (this.ItemHeight)
      itemHeight = this.ItemHeight;
    else if (this.querySelector("tbody"))
    {
      let testCell = document.createElement("td");
      testCell.innerText = "You're not supposed to see this :p";

      let testRow = document.createElement("tr");
      testRow.style.visibility = "hidden";
      testRow.appendChild(testCell);
      this.querySelector("tbody").appendChild(testRow);

      itemHeight = parseInt(getComputedStyle(testRow).height);
      testRow.remove();
    }
    else if (this.querySelectorAll("ol, ul").length)
    {
      let testItem = document.createElement("li");
      testItem.style.visibility = "hidden";
      testItem.innerText = "You're not supposed to see this :p";
      this.querySelectorAll("ol, ul")[0].appendChild(testItem);

      itemHeight = parseInt(getComputedStyle(testItem).height);
      testItem.remove();
    }
    else
    {
      let itemElementType = this.firstElementChild.firstElementChild.tagName;
      let testItem = document.createElement(itemElementType);
      testItem.style.visibility = "hidden";
      testItem.innerText = "You're not supposed to see this :p";
      this.firstElementChild.appendChild(testItem);

      itemHeight = parseInt(getComputedStyle(testItem).height);
      testItem.remove();
    }

    return itemHeight;
  }

  /**************************************************************************
  * Calculates the positions of the scrollbar for the next time data needs
  * to be loaded.
  *
  * @this The <dragline-scrollable> element.
  **************************************************************************/
  function calculateScrollThresholds()
  {
    let pageSize = parseInt(this.getAttribute("page-size"));
    let pageHeight = pageSize * this.ItemHeight;
    let totalPages = this.Rows / pageSize;
    let pageThreshold = pageHeight * parseFloat(this.getAttribute("threshold"));

    if (this.hasAttribute("use-window"))
      pageThreshold -= window.innerHeight;
    else
      pageThreshold -= this.clientHeight;

    this.TopSpacer.style.height = (pageHeight * Math.max(this.PageIndex - 1, 0)) + "px";
    this.BottomSpacer.style.height = (pageHeight * Math.max((totalPages - 1) - (this.PageIndex + 1), 0)) + "px";

    if (this.PageIndex === 0 && !this.HasLoadedData)
    {
      this.Thresholds = { Down: pageThreshold, Up: -1 };
      this.HasLoadedData = true;
    }
    else
    {
      this.Thresholds =
      {
        Down: parseInt(((this.PageIndex + 1) * pageHeight) + pageThreshold),
        Up: parseInt(((this.PageIndex - 1) * pageHeight) + pageThreshold)
      };
    }
  }

  /**************************************************************************
  * Checks to see if the user has scrolled past either threshold of the
  * scrollable container.
  *
  * @this The <dragline-scrollable> element.
  * @param event {event} The event.
  **************************************************************************/
  function checkThresholds(event)
  {
    // Calculate what page the user is on based on their scroll position
    let pageSize = parseInt(this.getAttribute("page-size"));
    let pageHeight = pageSize * this.ItemHeight;
    let pageOffset;
    let scrollTop;
    
    if (this.hasAttribute("use-window"))
    {
      pageOffset = this.offsetTop;
      scrollTop = window.pageYOffset || scrollY;
      this.PageIndex = parseInt((scrollTop - this.HeaderHeight - pageOffset) / pageHeight);
    }
    else
    {
      pageOffset = 0;
      scrollTop = this.scrollTop;
      this.PageIndex = parseInt((scrollTop - this.HeaderHeight - pageOffset) / pageHeight);
    }

    if (scrollTop >= this.Thresholds.Down)
    {
      let totalPages = this.Rows / pageSize;

      if (this.PageIndex + 1 === totalPages && !this.NoMoreData)
      {
        let newPageEvent = new CustomEvent("newPage", { detail: { "pageIndex": this.PageIndex + 1, "pageSize": pageSize } });
        this.dispatchEvent(newPageEvent);
      }
      else
      {
        let thresholdReachedEvent = new CustomEvent("thresholdReached", { detail: { "data": loadData.call(this) } });
        this.dispatchEvent(thresholdReachedEvent);
      }
    }
    else if (scrollTop <= this.Thresholds.Up)
    {
      let thresholdReachedEvent = new CustomEvent("thresholdReached", { detail: { "data": loadData.call(this) } });
      this.dispatchEvent(thresholdReachedEvent);
    }
  }

  /**************************************************************************
  * Calculates what data to load for the previous, current, and next pages.
  *
  * @this The <dragline-scrollable> element.
  * @returns An array of data elements.
  **************************************************************************/
  function loadData()
  {
    let pageSize = parseInt(this.getAttribute("page-size"));
    let cachedData = JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + document.location));
    let data = [];

    if (cachedData)
    {
      if (this.id)
      {
        let instanceCache = cachedData.Instances[this.Id];
        if (instanceCache && instanceCache.Data.length)
        {
          this.Rows = instanceCache.Data.length;
          let totalPages = this.Rows / pageSize;
          let previousPage = Math.max(this.PageIndex - 1, 0) * pageSize;
          let nextPage = (Math.min(this.PageIndex + 1, totalPages) * pageSize);
          data = instanceCache.slice(previousPage, nextPage);
        }
      }
      else
      {
        this.Rows = cachedData.length;
        let totalPages = this.Rows / pageSize;
        let previousPage = Math.max(this.PageIndex - 1, 0) * pageSize;
        let nextPage = (Math.min(this.PageIndex + 1, totalPages) * pageSize);

        if ((nextPage - previousPage) / pageSize < totalPages)
          nextPage += pageSize;

        data = cachedData.slice(previousPage, nextPage);
      }
    }

    calculateScrollThresholds.call(this);
    return data;
  }

  /**************************************************************************
  * Wires event-handlers.
  *
  * @this The <dragline-scrollable> element.
  **************************************************************************/
  function wireEvents()
  {
    // Remove the event-handlers first to make sure they don't get duplicated
    window.removeEventListener("scroll", checkThresholds.bind(this));
    this.removeEventListener("scroll", checkThresholds.bind(this));

    if (this.hasAttribute("use-window"))
      window.addEventListener("scroll", checkThresholds.bind(this));
    else
      this.addEventListener("scroll", checkThresholds.bind(this));
  }
})(window, document);
