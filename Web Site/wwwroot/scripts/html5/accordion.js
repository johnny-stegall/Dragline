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
  var accordionPrototype = Object.create(HTMLElement.prototype);
  
  /****************************************************************************
  * Setup the accordion when it's first created.
  ****************************************************************************/
  accordionPrototype.createdCallback = function()
  {
    wireEvents.call(this);
  };

  /****************************************************************************
  * Make sure that when first attached, one and only one key is expanded.
  ****************************************************************************/
  accordionPrototype.attachedCallback = function()
  {
    var expandedKeys = this.querySelectorAll("header[expanded]");

    if (expandedKeys.length > 1)
      throw new Error("Only one key on an accordion can be expanded.");
    else if (expandedKeys.length === 0)
      this.firstElementChild.setAttribute("expanded", "");
  };

  /****************************************************************************
  * Update the accordion after attributes are changed.
  *
  * @param attributeName {string} The attribute name.
  * @param newValue {string} The new value.
  * @param oldValue {string} The old value.
  ****************************************************************************/
  accordionPrototype.attributeChangedCallback = function(attributeName, newValue, oldValue)
  {
    wireEvents.call(this);
  };

  var Accordion = document.registerElement("dragline-accordion", { prototype: accordionPrototype });

  /**************************************************************************
  * Expands/collapses the accordion.
  *
  * @this The <dragline-accordion> element.
  * @param event {event} The event.
  **************************************************************************/
  function toggleKey(event)
  {
    var clickedKey = event.target;

    if (clickedKey.tagName === "dragline-accordion")
      return;

    while (clickedKey.tagName !== "HEADER")
      clickedKey = clickedKey.parentNode();

    if (clickedKey.getAttribute("expanded"))
    {
      if (clickedKey.getAttribute("collapsible"))
        clickedKey.removeAttribute("expanded");
    }
    else
    {
      this.querySelector("header[expanded]").removeAttribute("expanded");
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
    var toggleEvent = this.getAttribute("toggle") || "click";
    this.addEventListener(toggleEvent, toggleKey);
  }
})(window, document);
