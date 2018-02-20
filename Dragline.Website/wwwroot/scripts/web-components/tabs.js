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

  let tabstripPrototype = Object.create(HTMLElement.prototype);
  let template = `
<style>
  @import "/css/font-awesome.min.css";
  @import "/css/dragline-components.css";
</style>
<slot></slot>`;

  /****************************************************************************
  * Invoked when created.
  ****************************************************************************/
  tabstripPrototype.createdCallback = function()
  {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = template;
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

    buildTabs.call(this);
    wireEvents.call(this);
  };

  let Tabstrip = document.registerElement("dragline-tabstrip", { prototype: tabstripPrototype });

  /**************************************************************************
  * Builds the internals needed to make a tab work.
  *
  * @this The <dragline-tabstrip> element.
  * @param event {event} The event.
  **************************************************************************/
  function activateTab(event)
  {
    let tab = event.target;

    while (tab && tab.tagName !== "DRAGLINE-TAB")
      tab = tab.parentNode;

    if (tab)
    {
      this.querySelector("[active]").removeAttribute("active");
      tab.setAttribute("active", "");
    }
  }

  /**************************************************************************
  * Builds the internals needed to make a tab work.
  *
  * @this The <dragline-tabstrip> element.
  **************************************************************************/
  function buildTabs()
  {
    let tabs = this.querySelectorAll("dragline-tab");
    for (let tabIndex = 0; tabIndex < tabs.length; tabIndex++)
    {
      let tab = tabs[tabIndex];
      let section = document.createElement("section");
      section.innerHTML = tab.innerHTML;
      tab.innerHTML = "";
      tab.appendChild(section);

      if (tab.hasAttribute("icon"))
      {
        let icon;

        if (tab.getAttribute("icon").endsWith(".gif") || tab.getAttribute("icon").endsWith(".jpg") || tab.getAttribute("icon").endsWith(".png"))
        {
          icon = document.createElement("img");
          icon.src = tab.getAttribute("icon");
          icon.style.height = "1em";
          icon.style.width = "1em";
        }
        else
        {
          icon = document.createElement("i");
          icon.className += "fa " + tab.getAttribute("icon");
        }

        tab.insertBefore(icon, section);
      }

      if (tab.hasAttribute("text"))
      {
        let titleSpan = document.createElement("span");
        titleSpan.innerText = tab.getAttribute("text");
        tab.insertBefore(titleSpan, section);
      }
    }
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
