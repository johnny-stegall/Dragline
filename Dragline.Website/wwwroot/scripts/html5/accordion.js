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

  // Create the accordion based on HTMLElement
  let accordionPrototype = Object.create(HTMLElement.prototype);

  /****************************************************************************
  * Invoked when attached to the DOM.
  ****************************************************************************/
  accordionPrototype.attachedCallback = function()
  {
    if (!this.hasAttribute("orientation"))
      this.setAttribute("orientation", "vertical");

    let expandedKeys = this.querySelectorAll("header[expanded]");

    if (expandedKeys.length > 1)
      throw new Error("Only one key on an accordion can be expanded.");
    else if (expandedKeys.length === 0)
      this.firstElementChild.setAttribute("expanded", "");

    changeOrientation.call(this, "vertical");
    wireEvents.call(this);
  };

  /****************************************************************************
  * Invoked when attributes change.
  *
  * @param attributeName {string} The attribute name.
  * @param oldValue {string} The old value.
  * @param newValue {string} The new value.
  ****************************************************************************/
  accordionPrototype.attributeChangedCallback = function(attributeName, oldValue, newValue)
  {
    switch (attributeName)
    {
      case "orientation":
        changeOrientation.call(this, newValue);
        break;
      case "toggle":
        wireEvents.call(this);
        break;
    }
  };

  let Accordion = document.registerElement("dragline-accordion", { prototype: accordionPrototype });

  /**************************************************************************
  * Changes the orientation.
  *
  * @this The <dragline-accordion> element.
  **************************************************************************/
  function changeOrientation()
  {
    let headers = this.querySelectorAll("header");

    if (!this.hasAttribute("orientation") || this.getAttribute("orientation") === "")
    {
      this.setAttribute("orientation", "vertical");
      return;
    }

    if (this.getAttribute("orientation") === "vertical")
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
    else if (this.getAttribute("orientation") === "horizontal")
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
    else
      throw new Error("Unsupported orientation: " + orientation);
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
