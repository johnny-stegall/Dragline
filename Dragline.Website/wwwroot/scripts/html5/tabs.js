/******************************************************************************
* Tabstrip and Tab Custom Elements
* Author: John Stegall
* Copyright: 2016 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-tabstrip> and <dragline-tab> custom
* elements.
******************************************************************************/
;(function(window, document, undefined)
{
  "use strict";

  // Create the tabstrip based on the <ol> element
  let tabstripPrototype = Object.create(HTMLOListElement.prototype);

  /****************************************************************************
  * Invoked when created.
  ****************************************************************************/
  tabstripPrototype.createdCallback = function()
  {
    this.createShadowRoot();
    this.shadowRoot.innerHTML = "<style>@import url('/css/font-awesome.min.css')</style><content select=\"dragline-tab\"></content>";
  };

  /****************************************************************************
  * Invoked when attached to the DOM.
  ****************************************************************************/
  tabstripPrototype.attachedCallback = function()
  {
    if (!this.hasAttribute("orientation"))
      this.setAttribute("orientation", "horizontal");

    let activeTabs = this.querySelectorAll("dragline-tab[active]");

    if (!activeTabs.length)
      this.firstElementChild.setAttribute("active", "");
    else if (activeTabs.length > 1)
      throw new Error("Only one tab can be active at a time.");

    wireEvents.call(this);
  };

  let Tabstrip = document.registerElement("dragline-tabstrip", { prototype: tabstripPrototype });

  // Create the tab based on the <li> element
  let tabPrototype = Object.create(HTMLLIElement.prototype);

  /****************************************************************************
  * Invoked when created.
  ****************************************************************************/
  tabPrototype.createdCallback = function()
  {
    this.createShadowRoot();
    this.shadowRoot.innerHTML = "<style>@import url('/css/font-awesome.min.css')</style>";
  };

  /****************************************************************************
  * Invoked when attached to the DOM.
  ****************************************************************************/
  tabPrototype.attachedCallback = function()
  {
    if (this.parentElement.tagName !== "DRAGLINE-TABSTRIP")
      throw new Error("Tabs must be contained within tabstrips.");

    buildTab.call(this);
  };

  let Tab = document.registerElement("dragline-tab", { prototype: tabPrototype });

  /**************************************************************************
  * Builds the internals needed to make a tab work.
  *
  * @this The <dragline-tabstrip> element.
  * @param event {event} The event.
  **************************************************************************/
  function activateTab(event)
  {
    if (event.target.tagName === "DRAGLINE-TAB")
    {
      this.querySelector("[active]").removeAttribute("active");
      event.target.setAttribute("active", "");
    }
  }

  /**************************************************************************
  * Builds the internals needed to make a tab work.
  *
  * @this The <dragline-tab> element.
  **************************************************************************/
  function buildTab()
  {
    if (this.hasAttribute("icon"))
    {
      let icon;

      if (this.getAttribute("icon").endsWith(".gif") || this.getAttribute("icon").endsWith(".jpg") || this.getAttribute("icon").endsWith(".png"))
      {
        icon = document.createElement("img");
        icon.src = this.getAttribute("icon");
        icon.style.height = "1em";
        icon.style.width = "1em";
      }
      else
      {
        icon = document.createElement("i");
        icon.className += this.getAttribute("icon");
      }

      this.shadowRoot.appendChild(icon);
    }

    let titleSpan = document.createElement("span");
    this.shadowRoot.appendChild(titleSpan);

    if (this.hasAttribute("text"))
      titleSpan.innerText = this.getAttribute("text");

    let section = document.createElement("section");
    this.shadowRoot.appendChild(section);

    let content = document.createElement("content");
    section.appendChild(content);
    
    let clearDiv = document.createElement("div");
    clearDiv.className += "Clear";
    section.appendChild(clearDiv);
  }

  /**************************************************************************
  * Wires event-handlers.
  *
  * @this The <dragline-tabstrip> element.
  **************************************************************************/
  function wireEvents()
  {
    this.addEventListener("click", activateTab.bind(this));
  }
})(window, document);
