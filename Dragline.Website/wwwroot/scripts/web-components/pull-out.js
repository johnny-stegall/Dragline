/******************************************************************************
* Pull-Out Custom Element
* Author: John Stegall
* Copyright: 2016 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-pull-out> custom element.
******************************************************************************/
;(function(window, document, undefined)
{
  "use strict";

  let template = `
<style>
  @import "/css/font-awesome.min.css";
  @import "/css/dragline-components.css";
</style>`;

  class PullOut extends HTMLElement
  {
    // Must define observedAttributes() for attributeChangedCallback to work
    static get observedAttributes()
    {
      return [""];
    }

    /****************************************************************************
    * Creates an instance of Accordion.
    ****************************************************************************/
    constructor()
    {
      // Establish prototype chain and this
      super();

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
    }

    /****************************************************************************
    * Invoked when first connected to the DOM.
    ****************************************************************************/
    connectedCallback()
    {
      if (!this.hasAttribute("location"))
        this.setAttribute("location", "top");

      buildControls.call(this);
      wireEvents.call(this);
    }

    /****************************************************************************
    * Invoked when disconnected from the DOM.
    ****************************************************************************/
    disconnectedCallback()
    {
    }
  }

  window.customElements.define("dragline-pull-out", PullOut);

  /**************************************************************************
  * Builds the pull-out controls.
  *
  * @this The <dragline-pull-out> element.
  **************************************************************************/
  function buildControls()
  {
    let section = document.createElement("section");
    this.shadowRoot.appendChild(section);

    let pullIcon = document.createElement("i");
    pullIcon.className += "fa";
    section.appendChild(pullIcon);

    let contentDiv = document.createElement("div");
    section.appendChild(contentDiv);

    let slot = document.createElement("slot");
    contentDiv.appendChild(slot);
  }

  /**************************************************************************
  * Toggles the visibility of the pull-out.
  *
  * @this The <dragline-pull-out> element.
  **************************************************************************/
  function toggleVisibility()
  {
    if (this.hasAttribute("active"))
      this.removeAttribute("active");
    else
      this.setAttribute("active", "");
  }

  /**************************************************************************
  * Wires event-handlers.
  *
  * @this The <dragline-pull-out> element.
  **************************************************************************/
  function wireEvents()
  {
    this.shadowRoot.querySelector("i").addEventListener("click", toggleVisibility.bind(this));
  }
})(window, document);
