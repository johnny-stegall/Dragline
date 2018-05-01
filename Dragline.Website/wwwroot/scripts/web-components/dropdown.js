/******************************************************************************
* DropDown Custom Element
* Author: John Stegall
* Copyright: 2016 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-dropdown> custom element.
******************************************************************************/
;(function(window, document, undefined)
{
  "use strict";

  class DropDown extends HTMLElement
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
    * Clears all menus.
    *
    * @param event {event} The event.
    ****************************************************************************/
    clearMenus(event)
    {
      if (event && event.which === 3)
        return;

      this.removeAttribute("active");
      let mobileBackdrop = document.getElementsByClassName("div.Dropdown-Backdrop")[0];

      if (mobileBackdrop)
        mobileBackdrop.remove();
    }

    /****************************************************************************
    * Invoked when first connected to the DOM.
    ****************************************************************************/
    connectedCallback()
    {
      verifyElements.call(this);
      wireEvents.call(this);
    }

    /****************************************************************************
    * Invoked when disconnected from the DOM.
    ****************************************************************************/
    disconnectedCallback()
    {
    }

    /**************************************************************************
    * Toggles the menu.
    *
    * @param event {event} The event.
    **************************************************************************/
    toggleMenu(event)
    {
      if (this.querySelector("button").hasAttribute("disabled"))
        return false;

      event.preventDefault();
      event.stopPropagation();

      if (!this.hasAttribute("active"))
      {
        // If mobile use a backdrop because click events don't delegate
        if ("ontouchstart" in document.documentElement)
        {
          let mobileBackdrop = document.createElement("div");
          mobileBackdrop.className += "DropDown-Backdrop";
          mobileBackdrop.addEventListener("click", clearMenus.bind(this));
        }

        this.setAttribute("active", "");
        this.querySelector("button").focus();
      }
      else
        this.removeAttribute("active");
    }
  }
  
  window.customElements.define("dragline-dropdown", DropDown);

  /**************************************************************************
  * Highlights menu items using the arrow keys.
  *
  * @this The <dragline-dropdown> element.
  * @param event {event} The event.
  **************************************************************************/
  function highlightMenu(event)
  {
    if (!/(38|40|27)/.test(event.keyCode))
      return;

    event.preventDefault();
    event.stopPropagation();

    let menu = this.querySelectorAll("ol, ul")[0];
    if (menu.hasAttribute("disabled"))
      return;

    if (!this.hasAttribute("active") || (this.hasAttribute("active") && event.keyCode == 27))
    {
      if (event.which == 27)
        menu.focus();

      return this.querySelector("button").click();
    }

    let menuItems = menu.querySelectorAll("li:not([divider]) a");

    if (!menuItems.length)
      return;

    let selectedIndex = Array.prototype.indexOf.call(menuItems, document.activeElement);

    if (event.keyCode == 38 && selectedIndex > 0)
      selectedIndex--;
    else if (event.keyCode == 40 && selectedIndex < menuItems.length - 1)
      selectedIndex++;
    else if (!~selectedIndex)
      selectedIndex = 0;

    menuItems[selectedIndex].focus();
  }

  /**************************************************************************
  * Verifies the required elements exist.
  *
  * @this The <dragline-dropdown> element.
  **************************************************************************/
  function verifyElements()
  {
    if (!this.querySelector("button"))
      throw new Error("A <button> element is required to initiate the drop down.");
      
    if (!this.querySelectorAll("ol, ul").length)
      throw new Error("A <ol> or <ul> element is required to display the drop down menu.");
  }

  /**************************************************************************
  * Wires event-handlers.
  *
  * @this The <dragline-dropdown> element.
  **************************************************************************/
  function wireEvents()
  {
    let button = this.querySelector("button");
    button.addEventListener("click", this.toggleMenu.bind(this));
    button.addEventListener("keydown", highlightMenu.bind(this));

    let menu = this.querySelectorAll("ol, ul")[0];
    menu.addEventListener("keydown", highlightMenu.bind(this));

    document.addEventListener("click", this.clearMenus.bind(this));
    document.addEventListener("keydown", this.clearMenus.bind(this));
  }
})(window, document);
