/******************************************************************************
* AdapTable Custom Element
* Author: John Stegall
* Copyright: 2016 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-adaptable> custom element. Adds
* various customizations to a TABLE element.
******************************************************************************/

// import Filtering from "adaptable/filtering.js";
// import Grouping from "adaptable/grouping.js";
import Paging from "adaptable/paging.js";
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
<script type="text/javascript" src="../lib/lazy-0.5.1.js"></script>
<script type="text/javascript" src="../lib/vue-2.5.13.js"></script>
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

    /**************************************************************************
    * Creates an instance of AdapTable.
    **************************************************************************/
    constructor()
    {
      // Establish prototype chain and this
      super();

      this.Data =
      {
        Items: []
      };
      this.ExportToExcelCallback = null;
      this.ExportToPdfCallback = null;
      this.GetDataCallback = null;
      this.GetLayoutCallback = null;
      this.Layout =
      {
        Columns: [],
        Query:
        {
          // TODO: Modules should add their required properties
          // Filters: [],
          // Groups: [],
        },
      };
      this.MovableColumns = null;
      this.Page = 1;
      this.SaveLayoutCallback = null;

      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = template;
    }

    /**************************************************************************
    * Invoked when moved to a new document.
    **************************************************************************/
    adoptedCallback()
    {
    }

    /**************************************************************************
    * Invoked when any attribute specified in observedAttributes() is added,
    * removed, or changed.
    *
    * @param attributeName {string} The attribute name.
    * @param oldValue {string} The old value.
    * @param newValue {string} The new value.
    **************************************************************************/
    attributeChangedCallback(attributeName, oldValue, newValue)
    {
      this.dispatchEvent(paintEvent);
    }

    /**************************************************************************
    * Invoked when first connected to the DOM.
    **************************************************************************/
    connectedCallback()
    {
      if (document.querySelectorAll("dragline-adaptable").length > 1)
      {
        if (!this.id)
          throw new Error("The id attribute is required when multiple AdapTables exist on a page.");
      }

      this.Expiration = this.hasAttribute("expiration") ? this.getAttribute("expiration") : 24;
      this.addEventListener("layout changed", loadLayout.bind(this));
      //this.addEventListener("click", toggleMenu.bind(this));
      this.shadowRoot
        .querySelector("div[role=Menu]")
        .addEventListener("click", function (e) { e.stopPropagation(); });

      callbackTimer = window.setInterval(checkCallbacks.bind(this), 500);
    }

    /**************************************************************************
    * Invoked when disconnected from the DOM.
    **************************************************************************/
    disconnectedCallback()
    {
    }
  }

  window.customElements.define("dragline-adaptable", AdapTable);

  /****************************************************************************
  * Caches the data and layout in sessionStorage.
  *
  * @this An instance of AdapTable.
  ****************************************************************************/
  function cacheState()
  {
    let adaptableCache = JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + document.location)) || { Instances: [] };
    let adaptableId = this.id || "Default";
    let instanceCache = adaptableCache.Instances[adaptableId];

    if (!instanceCache)
    {
      adaptableCache = { Instances: {} };
      instanceCache = adaptableCache.Instances[adaptableId] = {};
    }

    this.Data.Expiration = (+new Date()) + (this.Expiration * 60 * 60 * 1000);
    this.Layout.Expiration = (+new Date()) + (this.Expiration * 60 * 60 * 1000);

    instanceCache.Data = this.Data;
    instanceCache.Layout = this.Layout;
    sessionStorage[STORAGE_PREFIX + document.location] = JSON.stringify(adaptableCache);
  }

  /****************************************************************************
  * Checks the callbacks and updates the UI.
  *
  * @this An instance of AdapTable.
  ****************************************************************************/
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

  /****************************************************************************
  * Identifies all columns and matches TH and TD elements with a column in
  * the layout.
  *
  * @this An instance of AdapTable.
  ****************************************************************************/
  function identifyColumns()
  {
    let tableHeaders = this.querySelectorAll("table > thead > tr > th");

    for (let headerIndex = 0; headerIndex < tableHeaders.length; headerIndex++)
    {
      let tableHeader = tableHeaders[headerIndex]
      // TODO: Need to change from attribute to property
      //let column = Lazy(self.Layout.Columns).findWhere({ Name: element.getAttribute("data-column-name") });
      let column = tableHeaders.filter(element => element.Name == tableHeader.Name);
      tableHeader.DataColumn = column;
    }
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
    if (this.Layout.Expiration < (+new Date()))
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
      for (let columnIndex = 0; columnIndex < this.Layout.Columns.length; columnIndex++)
      {
        let column = this.Layout.Columns[columnIndex];

        if (!column.Name || column.Name.trim() === "")
          throw new Error("All columns must have a name. Column at index: " + columnIndex + " isn't named.");
      });

      populateColumns.call(this, this.Layout);
    }
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
    let tableHeaders = this.querySelectorAll("table > thead > th");

    for (let headerIndex = 0; headerIndex < tableHeaders.length; headerIndex++)
    {
      let tableHeader = tableHeaders[headerIndex];

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

      if (tableHeader.innerText.trim().length > 0)
      {
        column.Header = tableHeader.innerText.trim();
        column.Name = tableHeader.Name;

        if (!self.Options.MovableColumns)
          column.IsHidable = tableHeader.classList.contains("Movable");
        else
          column.IsHidable = tableHeader.classList.contains("Movable");

        column.IsMovable = (tableHeader.innerText.trim().length < 1);
      }

      layout.Columns.push(column);
    }
  }

  /****************************************************************************
  * Loads data and layout from sessionStorage.
  *
  * @this An instance of AdapTable.
  * @returns True if the layout was loaded from cache, false otherwise.
  ****************************************************************************/
  function rehydrateStateFromCache()
  {
    let adaptableCache = JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + document.location)) || { Instances: [] };

    if (adaptableCache)
    {
      let instanceCache = adaptableCache.Instances[(this.id || "Default")];

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
})(window, document);