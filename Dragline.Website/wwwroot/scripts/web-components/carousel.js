/******************************************************************************
* Carousel Custom Element
* Author: John Stegall
* Copyright: 2015 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-carousel> custom element.
******************************************************************************/
;(function(window, document, undefined)
{
  "use strict";

  class Carousel extends HTMLElement
  {
    // Must define observedAttributes() for attributeChangedCallback to work
    static get observedAttributes()
    {
      return ["pause-on-hover", "show-navigation", "show-position"];
    }

    /****************************************************************************
    * Creates an instance of Carousel.
    ****************************************************************************/
    constructor()
    {
      // Establish prototype chain and this
      super();

      this.IsSliding = false;
      this.Timer = null;
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
        case "pause-on-hover":
          wireEvents.call(this);
          break;
        case "show-navigation":
          toggleNavigation.call(this);
          break;
        case "show-position":
          togglePositionIndicators.call(this);
          break;
      }
    }

    /****************************************************************************
    * Invoked when first connected to the DOM.
    ****************************************************************************/
    connectedCallback()
    {
      if (!this.hasAttribute("wrap"))
        this.setAttribute("wrap", "");

      if (!this.hasAttribute("direction"))
        this.setAttribute("direction", "right");

      if (!this.hasAttribute("interval"))
        this.setAttribute("interval", "5000");

      window.setTimeout(() =>
      {
        if (!this.querySelector("carousel-item[active]"))
          this.querySelector("carousel-item").setAttribute("active", "");

        if (this.hasAttribute("autosize"))
          setDimensions.call(this);
      }, 500);

      this.resumeRotation();
      wireEvents.call(this);
    }

    /****************************************************************************
    * Invoked when disconnected from the DOM.
    ****************************************************************************/
    disconnectedCallback()
    {
    }

    /**************************************************************************
    * Gets the index of the specified item; if no item is supplied, returns
    * the index of the active item.
    *
    * @param item {HTMLElement} A carousel item.
    * @returns The index of the specified item or the active item if no item
    * is specified.
    **************************************************************************/
    getItemIndex(item)
    {
      let items = this.querySelectorAll("carousel-item");
      return items.indexOf(item || this.querySelector("carousel-item[active]"));
    }

    /**************************************************************************
    * Pauses carousel rotation when the mouse is moved over the carousel.
    **************************************************************************/
    pauseRotation()
    {
      if (this.Timer)
      {
        clearInterval(this.Timer);
        this.Timer = null;
      }
    }

    /**************************************************************************
    * Resumes carousel rotation when the mouse is moved away from the
    * carousel.
    **************************************************************************/
    resumeRotation()
    {
      let interval = parseInt(this.getAttribute("interval"));

      if (interval > 0)
      {
        if (this.Timer)
          this.pauseRotation();

        let self = this;
        this.Timer = setInterval(function()
        {
          self.Direction = self.getAttribute("direction") || "right";
          self.rotate(self.Direction);
        }, interval);
      }

      return;
    }

    /**************************************************************************
    * Rotates the items of the carousel.
    *
    * @param nextItem {variant} A string or number that represents the
    * direction of the next item to move to.
    **************************************************************************/
    rotate(nextItem, callback)
    {
      let activeItem = this.querySelector("[active]");

      if (!this.hasAttribute("wrap") && wouldWrap.call(this, activeItem, nextItem))
      {
        let rotatedEvent = new CustomEvent("rotated");
        this.dispatchEvent(rotatedEvent);
        return;
      }

      this.pauseRotation();

      if (this.hasAttribute("reverse"))
      {
        this.setAttribute("paradox", "");
        this.removeAttribute("reverse");
        this.removeAttribute("paradox");
      }

      let itemIndex = getNextItem.call(this, nextItem, activeItem);
      let items = this.querySelectorAll("carousel-item");
      let targetItem;

      if (itemIndex < 0)
        targetItem = items[(itemIndex % items.length) + items.length];
      else
        targetItem = items[itemIndex % items.length];

      this.IsSliding = true;
      positionNextItem.call(this, activeItem, targetItem);
    }
  }

  window.customElements.define("dragline-carousel", Carousel);

  /**************************************************************************
  * Verifies a item argument is valid.
  *
  * @this The <dragline-carousel> element.
  * @param nextItem {variant} A string or number that represents the
  * direction of the next item to move to.
  * @param activeItem {HTMLElement} The active carousel item.
  * @returns The index of the next carousel item.
  **************************************************************************/
  function getNextItem(nextItem, activeItem)
  {
    if (nextItem == null)
      throw new Error("The next item is required.");
    else if (activeItem == null)
      throw new Error("The active item is required.");

    let activeItemIndex = Array.prototype.indexOf.call(this.querySelectorAll("carousel-item"), activeItem);
    let direction = this.getAttribute("direction");

    if (typeof (nextItem) === "string")
    {
      switch (nextItem.toLowerCase())
      {
        case "+1":
        case "next":
          return activeItemIndex + ((this.getAttribute("direction") === "right") ? 1 : -1);
        case "-1":
        case "back":
        case "prev":
        case "previous":
          return activeItemIndex + ((this.getAttribute("direction") === "right") ? -1 : 1);
        case "right":
          if (direction === "left")
            this.setAttribute("reverse", "");

          return activeItemIndex + 1;
        case "left":
          if (direction === "right")
            this.setAttribute("reverse", "");

          return activeItemIndex - 1;
        default:
          throw new Error("Invalid argument for nextItem: " + nextItem + ".");
      }
    }
    else if (typeof (nextItem) === "number")
    {
      if (nextItem > activeItemIndex && direction === "left")
        this.setAttribute("reverse", "");
      else if (nextItem < activeItemIndex && direction === "right")
        this.setAttribute("reverse", "");

      return nextItem;
    }
    else
      throw new Error("Invalid argument for nextItem: " + nextItem + ".");
  }

  /**************************************************************************
  * Moves to the item that is the same index as the indicator clicked.
  *
  * @this The <dragline-carousel> element.
  * @param event {event} The event.
  **************************************************************************/
  function moveToIndicatorItem(event)
  {
    if (event.target.tagName === "LI")
    {
      let indicatorList = event.target.parentElement;
      this.rotate(Array.prototype.indexOf.call(indicatorList.children, event.target));
    }
  }

  /**************************************************************************
  * Moves the carousel left or right when the next/previous links are
  * clicked.
  *
  * @this The <dragline-carousel> element.
  * @param event {event} The event.
  **************************************************************************/
  function nextOrPrevious(event)
  {
    let target = event.target.tagName === "A" ? event.target : event.target.parentElement;

    if (target.tagName === "A")
    {
      if (target.classList.contains("Right"))
        this.rotate("right");
      else if (target.classList.contains("Left"))
        this.rotate("left");
    }
  }

  /**************************************************************************
  * Positions the next slide.
  *
  * @this The <dragline-carousel> element.
  * @param activeItem {HTMLElement} The active carousel item.
  * @param targetItem {HTMLElement} The target carousel item.
  **************************************************************************/
  function positionNextItem(activeItem, targetItem)
  {
    let oldNextItem = this.querySelector("carousel-item[next]");

    if (oldNextItem)
      oldNextItem.removeAttribute("next");

    targetItem.removeAttribute("egress");
    targetItem.setAttribute("next", "");

    // Wait for the transition to finish before moving the carousel items
    let self = this;
    setTimeout(function()
    {
      slideItems.call(self, activeItem, targetItem);
    }, parseFloat(getComputedStyle(targetItem).transitionDuration) * 1000);
  }

  /**************************************************************************
  * Sets the dimensions of the carousel based on the first <carousel-item>.
  *
  * @this The <dragline-carousel> element.
  **************************************************************************/
  function setDimensions()
  {
    let firstItem = this.querySelector("carousel-item");
    this.style.height = firstItem.clientHeight + "px";
    this.style.width = firstItem.clientWidth + "px";
  }

  /**************************************************************************
  * Slides the items into their new positions.
  *
  * @this The <dragline-carousel> element.
  * @param activeItem {HTMLElement} The active carousel item.
  * @param targetItem {HTMLElement} The target carousel item.
  **************************************************************************/
  function slideItems(activeItem, targetItem)
  {
    let oldEgressItem = this.querySelector("carousel-item[egress]");

    if (oldEgressItem)
      oldEgressItem.removeAttribute("egress");

    activeItem.setAttribute("egress", "");
    activeItem.removeAttribute("active");
    targetItem.setAttribute("active", "");
    targetItem.removeAttribute("next");

    if (this.hasAttribute("show-position"))
    {
      let indicators = this.querySelectorAll("ol > li");
      let targetIndex = Array.prototype.indexOf.call(this.querySelectorAll("carousel-item"), targetItem);
      let activeIndicator = this.querySelector("li[active]");
      let targetIndicator = indicators[targetIndex];

      activeIndicator.removeAttribute("active");
      targetIndicator.setAttribute("active", "");
    }

    let rotatedEvent = new CustomEvent("rotated");
    this.dispatchEvent(rotatedEvent);

    this.IsSliding = false;
    this.resumeRotation();
  }

  /**************************************************************************
  * Builds next/previous indicators at the right/left edges of a carousel.
  *
  * @this The <dragline-carousel> element.
  **************************************************************************/
  function toggleNavigation()
  {
    if (this.hasAttribute("show-navigation"))
    {
      let leftLink = document.createElement("a");
      leftLink.className += "Left";
      leftLink.href = "javascript:void(0);";
      leftLink.addEventListener("click", nextOrPrevious.bind(this));

      let leftIcon = document.createElement("i");
      leftIcon.className += "fa fa-chevron-left";
      leftLink.appendChild(leftIcon);

      let rightLink = document.createElement("a");
      rightLink.className += "Right";
      rightLink.href = "javascript:void(0);";
      rightLink.addEventListener("click", nextOrPrevious.bind(this));

      let rightIcon = document.createElement("i");
      rightIcon.className += "fa fa-chevron-right";
      rightLink.appendChild(rightIcon);

      this.appendChild(leftLink);
      this.appendChild(rightLink);
    }
    else
    {
      let leftLink = this.querySelector("a.Left");
      let rightLink = this.querySelector("a.Right");
      this.removeChild(leftLink);
      this.removeChild(rightLink);
    }
  }

  /**************************************************************************
  * Builds indicators that match the number of images in a carousel.
  *
  * @this The <dragline-carousel> element.
  **************************************************************************/
  function togglePositionIndicators()
  {
    if (this.hasAttribute("show-position"))
    {
      let indicatorList = document.createElement("ol");

      for (let itemIndex = 0; itemIndex < this.children.length; itemIndex++)
        indicatorList.appendChild(document.createElement("li"));

      indicatorList.firstElementChild.setAttribute("active", "");
      indicatorList.addEventListener("click", moveToIndicatorItem.bind(this));
      this.appendChild(indicatorList);
    }
    else
    {
      let indicatorList = this.querySelector("ol");
      this.removeChild(indicatorList);
    }
  }

  /**************************************************************************
  * Wires event-handlers.
  *
  * @this The <dragline-carousel> element.
  **************************************************************************/
  function wireEvents()
  {
    if (this.hasAttribute("pause-on-hover"))
    {
      this.addEventListener("mouseenter", this.pauseRotation.bind(this));
      this.addEventListener("mouseleave", this.resumeRotation.bind(this));
    }
  }

  /**************************************************************************
  * Returns true if the specified next item would cause the carousel to wrap
  * false otherwise.
  *
  * @this The <dragline-carousel> element.
  * @param activeItem {HTMLElement} The active carousel item.
  * @param nextItem {variant} A string or number that represents the
  * direction of the next item to move to.
  **************************************************************************/
  function wouldWrap(activeItem, nextItem)
  {
    let items = this.querySelectorAll("carousel-item");
    let activeItemIndex = items.indexOf(activeItem);

    if (!this.hasAttribute("direction") || this.getAttribute("direction").toLowerCase() === "left")
    {
      if (activeItemIndex === 0)
      {
        switch (nextItem)
        {
          case "+1":
          case "next":
          case "right":
            return true;
        }
      }
      else if (activeItemIndex === items.length - 1)
      {
        switch (nextItem)
        {
          case "-1":
          case "back":
          case "prev":
          case "previous":
          case "left":
            return true;
        }
      }
    }
    else
    {
      if (activeItemIndex === 0)
      {
        switch (nextItem)
        {
          case "-1":
          case "back":
          case "prev":
          case "previous":
          case "left":
            return true;
        }
      }
      else if (activeItemIndex === items.length - 1)
      {
        switch (nextItem)
        {
          case "+1":
          case "next":
          case "right":
            return true;
        }
      }
    }

    return false;
  }
})(window, document);