/******************************************************************************
* Accordion Custom Element
* Author: John Stegall
* Copyright: 2014 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-accordion> custom element.
******************************************************************************/
;(function(window, document, undefined)
{
  "use strict";

  class Accordion extends HTMLElement
  {
    // Must define observedAttributes() for attributeChangedCallback to work
    static get observedAttributes()
    {
      return ["orientation", "toggle"];
    }

    /****************************************************************************
    * Creates an instance of Accordion.
    ****************************************************************************/
    constructor()
    {
      // Establish prototype chain and this
      super();
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
      switch (attributeName)
      {
        case "orientation":
          updateOrientation.call(this, newValue);
          break;
        case "toggle":
          wireEvents.call(this);
          break;
      }
    }

    /****************************************************************************
    * Invoked when first connected to the DOM.
    ****************************************************************************/
    connectedCallback()
    {
      let expandedKeys = this.querySelectorAll("header[expanded]");

      if (expandedKeys.length > 1)
        throw new Error("Only one key on an accordion can be expanded.");
      else if (expandedKeys.length === 0)
        this.firstElementChild.setAttribute("expanded", "");

      updateOrientation.call(this);
      wireEvents.call(this);
    }

    /****************************************************************************
    * Invoked when disconnected from the DOM.
    ****************************************************************************/
    disconnectedCallback()
    {
    }
  }

  window.customElements.define("dragline-accordion", Accordion);

  /**************************************************************************
  * Updates the orientation.
  *
  * @this The <dragline-accordion> element.
  **************************************************************************/
  function updateOrientation()
  {
    let headers = this.querySelectorAll("header");

    if (this.getAttribute("orientation") === "horizontal")
    {
      for (var headerIndex = 0; headerIndex < headers.length; headerIndex++)
      {
        let layoutDiv = headers[headerIndex].querySelector("div[role=layout]");
        if (!headers[headerIndex].firstElementChild || !layoutDiv)
        {
          let layoutDiv = document.createElement("div");
          layoutDiv.setAttribute("role", "layout");
          moveChildren(headers[headerIndex], layoutDiv);
          headers[headerIndex].appendChild(layoutDiv);
        }
      }
    }
    else if (this.getAttribute("orientation") === "vertical" || !this.hasAttribute("orientation"))
    {
      for (var headerIndex = 0; headerIndex < headers.length; headerIndex++)
      {
        if (headers[headerIndex].children.length === 1)
        {
          let layoutDiv = headers[headerIndex].querySelector("div[role=layout]");

          if (layoutDiv)
          {
            moveChildren(layoutDiv, headers[headerIndex]);
            layoutDiv.remove();
          }
        }
      }
    }
    else
      throw new Error("Unsupported orientation: " + this.getAttribute("orientation"));
  }

  /**************************************************************************
  * Moves all child nodes from one element to another.
  *
  * @param oldParent {HTMLElement} The old parent.
  * @param newParent {HTMLElement} The new parent.
  **************************************************************************/
  function moveChildren(oldParent, newParent)
  {
    while (oldParent.childNodes.length > 0)
      newParent.appendChild(oldParent.childNodes[0]);
  }

  /**************************************************************************
  * Expands/collapses the accordion.
  *
  * @this The <dragline-accordion> element.
  * @param event {event} The event.
  **************************************************************************/
  function toggleKey(event)
  {
    let clickedKey = event.target;

    while (clickedKey.tagName !== "HEADER")
    {
      clickedKey = clickedKey.parentElement;

      if (!clickedKey || clickedKey.tagName === "DRAGLINE-ACCORDION")
        return;
    }

    if (clickedKey.hasAttribute("expanded"))
    {
      if (this.hasAttribute("collapsible"))
        clickedKey.removeAttribute("expanded");
    }
    else
    {
      let expandedKey = this.querySelector("header[expanded]");

      if (expandedKey)
        expandedKey.removeAttribute("expanded");

      clickedKey.setAttribute("expanded", "");
    }
  }

  /****************************************************************************
  * Wires event-handlers.
  *
  * @this The <dragline-accordion> element.
  ****************************************************************************/
  function wireEvents()
  {
    this.removeEventListener("click", toggleKey);
    this.removeEventListener("mouseenter", toggleKey, true);

    if (this.getAttribute("toggle") === "hover")
      this.addEventListener("mouseenter", toggleKey, true);
    else
      this.addEventListener("click", toggleKey);
  }
})(window, document);
