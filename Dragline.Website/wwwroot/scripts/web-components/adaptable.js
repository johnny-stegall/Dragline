/******************************************************************************
* AdapTable Custom Element
* Author: John Stegall
* Copyright: 2008 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-adaptable> custom element. Adds
* various customizations to a TABLE element.
******************************************************************************/

// TODO: Finish unit tests
// ENHANCEMENT: Query - Add infinte scrolling
//       1 - Scrolling should be based on the scrolling of the container
//       2 - A table row should be inserted above and below the current page of rows, with its height set to mimic the height of PageSize * TR.Height
//       3 - Scroll to the current page

// import Filtering from "adaptable/filtering.js";
// import Grouping from "adaptable/grouping.js";
// import Paging from "adaptable/paging.js";
// import Positioning from "adaptable/positioning.js";
// import Sortable from "adaptable/sortable.js";
// import Sorting from "adaptable/sorting.js";
// import Views from "adaptable/views.js";

;(function(window, document, undefined)
{
  "use strict";

  const STORAGE_PREFIX = "AdapTable: ";

  let callbackTimer = null;
  let layoutChangedEvent = new CustomEvent("layout changed", { bubbles: false });
  let pageChangedEvent = new CustomEvent("page changed", { bubbles: false });
  let paintEvent = new CustomEvent("paint", { bubbles: false });
  let template = `
<style>
  @import "/css/font-awesome.min.css";
  @import "/css/dragline-components.css";
</style>
<form>
  <div role="Menu"></div>
  <section>
    <div class="Actions"></div>
  </section>
</form>
<table>
  <thead></thead>
  <tbody></tbody>
  <tfoot></tfoot>
</table>
<section></section>`;

  class AdapTable extends HTMLElement
  {
    // Must define observedAttributes() for attributeChangedCallback to work
    static get observedAttributes()
    {
      return [];
    }

    /****************************************************************************
    * Creates an instance of AdapTable.
    ****************************************************************************/
    constructor()
    {
      // Establish prototype chain and this
      super();

      this.Data =
      {
        Pages: []
      };
      this.ExportToExcelCallback = null;
      this.ExportToPdfCallback = null;
      this.GetDataCallback = null;
      this.GetLayoutCallback = null;
      this.Layout =
      {
        Columns: [],
        // TODO: Modules should add their required properties
        Query:
        {
          Filters: [],
          Groups: [],
          PageSize: 10,
          PageIndex: 0
        },
      };
      this.MovableColumns = null;
      this.Page = 1;
      this.SaveLayoutCallback = null;

      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = template;
    }

    /****************************************************************************
    * Invoked when moved to a new document.
    ****************************************************************************/
    adoptedCallback()
    {
    }

    /****************************************************************************
    * Invoked when any attribute specified in observedAttributes() is added,
    * removed, or changed.
    *
    * @param attributeName {string} The attribute name.
    * @param oldValue {string} The old value.
    * @param newValue {string} The new value.
    ****************************************************************************/
    attributeChangedCallback(attributeName, oldValue, newValue)
    {
      this.dispatchEvent(paintEvent);
    }

    /****************************************************************************
    * Invoked when first connected to the DOM.
    ****************************************************************************/
    connectedCallback()
    {
      if (document.querySelectorAll("dragline-adaptable").length > 1)
      {
        if (!this.id)
          throw new Error("The id attribute is required when multiple AdapTables exist on a page.");
      }

      this.Expiration = this.hasAttribute("expiration") ? this.getAttribute("expiration") : ONE_YEAR_EXPIRATION;

      this.addEventListener("page changed", loadData.bind(this));
      this.addEventListener("layout changed", cacheLayout.bind(this));
      //this.addEventListener("click", toggleMenu.bind(this));
      this.shadowRoot
        .querySelector("div[role=Menu]")
        .addEventListener("click", function (e) { e.stopPropagation(); });

      callbackTimer = window.setInterval(checkCallbacks.bind(this), 500);
    }

    /****************************************************************************
    * Invoked when disconnected from the DOM.
    ****************************************************************************/
    disconnectedCallback()
    {
    }
  }

  window.customElements.define("dragline-adaptable", AdapTable);

  /**************************************************************************
  * Caches the data and layout in sessionStorage.
  *
  * @this An instance of AdapTable.
  **************************************************************************/
  function cacheState()
  {
    let adaptableCache = JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + document.location)) || { Instances: [] };
    let adaptableId = this.id || "Default";
    let instanceCache = cachedData.Instances[adaptableId];

    if (!instanceCache)
      adaptableCache.Instances[adaptableId] = instanceCache = {};

    this.Data.Expiration = (+new Date()) + ((this.Expiration || 24) * 60 * 60 * 1000);
    this.Layout.Expiration = (+new Date()) + ((this.Expiration || 24) * 60 * 60 * 1000);

    instanceCache.Data = this.Data;
    instanceCache.Layout = this.Layout;
    sessionStorage[STORAGE_PREFIX + document.location] = JSON.stringify(instanceCache);
  }

  /**************************************************************************
  * Checks the callbacks and updates the UI.
  *
  * @this An instance of AdapTable.
  **************************************************************************/
  function checkCallbacks()
  {
    if (this.GetDataCallback)
    {
      window.clearInterval(callbackTimer);

      rehydrateStateFromCache.call(this);
      this.dispatchEvent(pageChangedEvent);
    }

    if (this.ExportToExcelCallback)
      this.addActionButton("fa-file-excel-o", "Export to Excel");

    if (this.ExportToPdfCallback)
      this.addActionButton("fa-file-pdf-o", "Export to PDF");
  }

  /************************************************************************
  * Checks sessionStorage for data, and if found and not expired, loads the
  * cached data. If no data is found or it's expired, getDataCallback is
  * invoked.
  *
  * @this An instance of AdapTable.
  ************************************************************************/
  function loadData()
  {
    if (!this.Data.Pages[this.Page - 1] || this.Data.Expiration > (+new Date()))
    {
      this.Data.Pages[this.Page - 1] = this.getDataCallback(this.Page);
      this.Data.Expiration = (+new Date()) + this.Expiration;
      cacheData();
    }

    identifyColumns.call(this);
    let bindableData =
    {
      Aggregates: this.Data.Aggregates,
      FilterValues: this.Data.FilterValues,
      Items: this.Data.Pages[this.Page - 1],
      TotalItems: this.Data.TotalItems
    };

    // TODO: Bind the table to this.Data.Pages[this.Page - 1]
  }

  /****************************************************************************
  * Checks sessionStorage for the layout, and if found and not expired, loads
  * the cached layout. If no layout is found or it's expired, a request is
  * sent to the server to get the layout and update the table.
  *
  * @this An instance of AdapTable.
  ****************************************************************************/
  function loadLayout()
  {
    if (this.Layout.Expiration > (+new Date()))
    {
      let layout = this.GetLayoutCallback();
      if (layout)
      {
        this.Layout = layout;
        cacheState.call(this);
      }
    }

    let requiresName = this.getAttribute("mutable")
      || this.getAttribute("filterable")
      || this.getAttribute("groupable")
      || this.getAttribute("movable")
      || this.getAttribute("sortable");

    if (requiresName && !this.Layout.Columns.length)
    {
      Lazy(this.Layout.Columns).each(function (column, index)
      {
        if (!column.Name || column.Name.trim() === "")
          throw new Error("All columns must have a name. Column at index: " + index + " isn't named.");
      });

      populateColumns.call(this, this.Layout);
    }
  }

  /**************************************************************************
  * Loads data and layout from sessionStorage.
  *
  * @this An instance of AdapTable.
  * @returns True if the layout was loaded from cache, false otherwise.
  **************************************************************************/
  function rehydrateStateFromCache()
  {
    let adaptableCache = JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + document.location)) || { Instances: [] };

    if (adaptableCache)
    {
      let instanceCache = cachedData.Instances[this.id || "Default"];

      if (instanceCache)
      {
        if (instanceCache.Data)
          this.Data = instanceCache.Data;

        if (instanceCache.Layout)
        {
          this.Layout = instanceCache.Layout;
          loadLayout.call(this);
        }
      }
    }
  }








  /**************************************************************************
  * Identifies all columns and matches TH and TD elements with a column in
  * the layout.
  *
  * @this An instance of AdapTable.
  **************************************************************************/
  function identifyColumns()
  {
    let self = this;

    this.querySelectorAll("table > thead > tr > th").forEach(function(element, index)
    {
      // TODO: Need to change from attribute to property
      let column = Lazy(self.Layout.Columns).findWhere({ Name: element.getAttribute("data-column-name") });
      element.setAttribute("data-column", column);
    });
  }

  /****************************************************************************
  * Populates the layout with the columns in the table. This is only used when
  * no layout is cached and nothing is pulled from a server.
  *
  * @this An instance of AdapTable.
  * @param layout {object} The layout.
  ****************************************************************************/
  function populateColumns(layout)
  {
    this.querySelectorAll("table > thead > th").forEach(this, header, index)
    {
      // TODO: These properties should be inserted by the modules
      var column =
      {
        IsFilterable: false,
        IsGroupable: false,
        IsHidable: false,
        IsMovable: false,
        IsSortable: false,
        IsVisible: true
      };

      if (header.innerText.trim().length > 0)
      {
        column.Header = header.innerText.trim();
        column.Name = header.Name;

        if (!self.Options.MovableColumns)
          column.IsHidable = header.classList.contains("Movable");
        else
          column.IsHidable = header.classList.contains("Movable");

        column.IsMovable = (header.innerText.trim().length < 1);
      }

      layout.Columns.push(column);
    }
  }
})(window, document);