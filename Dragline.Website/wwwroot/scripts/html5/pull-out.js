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

  // Create the badge based on HTMLElement
  let pulloutPrototype = Object.create(HTMLElement.prototype);

  /****************************************************************************
  * Invoked when created.
  ****************************************************************************/
  pulloutPrototype.createdCallback = function()
  {
    this.createShadowRoot();
    this.shadowRoot.innerHTML = "<style>@import url('/css/font-awesome.min.css')</style>";
  };

  /****************************************************************************
  * Invoked when attached to the DOM.
  ****************************************************************************/
  pulloutPrototype.attachedCallback = function()
  {
    if (!this.hasAttribute("location"))
      this.setAttribute("location", "top");

    buildControls.call(this);
    wireEvents.call(this);
  };

  // Register the custom element
  let PullOut = document.registerElement("dragline-pull-out", { prototype: pulloutPrototype });

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

    let content = document.createElement("content");
    contentDiv.appendChild(content);
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
