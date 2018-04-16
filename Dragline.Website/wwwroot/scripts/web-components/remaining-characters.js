/******************************************************************************
* Remaining Characters Custom Element
* Author: John Stegall
* Copyright: 2016 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-remaining> custom element.
******************************************************************************/
;(function(window, document, undefined)
{
  "use strict";

  let remainingPrototype = Object.create(HTMLElement.prototype);
  
  /****************************************************************************
  * Invoked when created.
  ****************************************************************************/
  remainingPrototype.createdCallback = function()
  {
    this.createShadowRoot();
  };

  /****************************************************************************
  * Invoked when attached to the DOM.
  ****************************************************************************/
  remainingPrototype.attachedCallback = function()
  {
    if (!this.hasAttribute("for"))
      throw new Error("The for attribute is required.");

    let targetInput = document.getElementById(this.getAttribute("for"));

    if (targetInput.tagName !== "TEXTAREA")
      throw new Error("Only <textarea> elements are supported for counting remaining characters.");

    if (!this.hasAttribute("good-color"))
      this.setAttribute("good-color", "#00AA00");

    if (!this.hasAttribute("warning-color"))
      this.setAttribute("warning-color", "#CFD100");

    if (!this.hasAttribute("danger-color"))
      this.setAttribute("danger-color", "#AA0000");

    this.update();
    wireEvents.call(this);
  };

  /****************************************************************************
  * Invoked when attributes change.
  *
  * @param attributeName {string} The attribute name.
  * @param oldValue {string} The old value.
  * @param newValue {string} The new value.
  ****************************************************************************/
  remainingPrototype.attributeChangedCallback = function(attributeName, oldValue, newValue)
  {
    switch (attributeName)
    {
      case "for":
        if (!this.hasAttribute("for"))
          throw new Error("The for attribute is required.");

        let targetInput = document.getElementById(this.getAttribute("for"));

        if (targetInput.tagName !== "TEXTAREA")
          throw new Error("Only <textarea> elements are supported for counting remaining characters.");

        wireEvents.call(this, oldValue);
        break;
      case "good-color":
      case "warning-color":
      case "danger-color":
        if (newValue == null || newValue.trim() === "")
        {
          if (attributeName === "good-color")
            this.setAttribute("good-color", "#00AA00");

          if (attributeName === "warning-color")
            this.setAttribute("warning-color", "#CFD100");

          if (attributeName === "danger-color")
            this.setAttribute("danger-color", "#AA0000");
        }

        break;
    }
  };

  /**************************************************************************
  * Updates the number of characters remaining.
  *
  * @this The <dragline-remaining> element.
  * @param event {event} The event.
  **************************************************************************/
  remainingPrototype.update = function(event)
  {
    let targetInput = document.getElementById(this.getAttribute("for"));
    let characterCount = targetInput.value.length;
    let maxLength = targetInput.getAttribute("maxlength") || 524288;
    this.shadowRoot.textContent = "Characters Remaining: " + (maxLength - characterCount);
      
    let percentUsed = characterCount / maxLength * 100;
        
    if (percentUsed < 50)
      this.style.color = this.getAttribute("good-color");
    else if (percentUsed < 75)
      this.style.color = this.getAttribute("warning-color");
    else
      this.style.color = this.getAttribute("danger-color");
  }

  let CharacterCounter = document.registerElement("dragline-remaining", { prototype: remainingPrototype });
  
  /**************************************************************************
  * Toggles display of the counter.
  *
  * @this The <dragline-remaining> element.
  * @param event {event} The event.
  **************************************************************************/
  function toggleCounter(event)
  {
    if (event.type === "blur")
      this.removeAttribute("active");
    else if (event.type === "focus")
      this.setAttribute("active", "");
  }

  /**************************************************************************
  * Wires event-handlers.
  *
  * @this The <dragline-remaining> element.
  * @param oldElement {string} The ID of the previous element being watched.
  **************************************************************************/
  function wireEvents(oldElement)
  {
    if (oldElement)
    {
      let oldInput = document.getElementById(oldElement);
      oldInput.removeEventListener("blur", toggleCounter.bind(this));
      oldInput.removeEventListener("focus", toggleCounter.bind(this));
      oldInput.removeEventListener("keyup", this.update.bind(this));
      oldInput.removeEventListener("paste", this.update.bind(this));
    }

    let targetInput = document.getElementById(this.getAttribute("for"));
    targetInput.addEventListener("blur", toggleCounter.bind(this));
    targetInput.addEventListener("focus", toggleCounter.bind(this));
    targetInput.addEventListener("keyup", this.update.bind(this));
    targetInput.addEventListener("paste", this.update.bind(this));
  }
})(window, document);
