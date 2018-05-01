/******************************************************************************
* Password Strength Custom Element
* Author: John Stegall
* Copyright: 2016 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-password-strength> custom element.
******************************************************************************/
;(function(window, document, undefined)
{
  "use strict";

  // Create the password strength based on HTMLElement
  let passwordStrengthPrototype = Object.create(HTMLElement.prototype);
  let template = `
<style>
  @import "/css/dragline-components.css";
</style>`;

  class PasswordStrength extends HTMLElement
  {
    // Must define observedAttributes() for attributeChangedCallback to work
    static get observedAttributes()
    {
      return ["fair", "for", "good", "strong"];
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
      switch (attributeName)
      {
        case "for":
          if (!this.hasAttribute("for"))
            throw new Error("The for attribute is required.");

          let targetInput = document.getElementById(this.getAttribute("for"));

          if (targetInput.tagName !== "INPUT")
            throw new Error("Only <input> elements are supported for checking password strength.");

          wireEvents.call(this, oldValue);
          break;
        case "fair":
        case "good":
        case "strong":
          if (newValue == null || newValue.trim() === "")
          {
            if (attributeName === "fair")
              this.setAttribute("fair", "^(?=.*[A-Za-z]+)(?=.*[0-9]+).{6,}$");

            if (attributeName === "good")
              this.setAttribute("good", "^(?=.*[A-Z]+)(?=.*[a-z]+)(?=.*[0-9]+).{8,}$");

            if (attributeName === "strong")
              this.setAttribute("strong", "^(?=.*[A-Z]+)(?=.*[a-z]+)(?=.*[0-9]+)(?=.*[^A-Za-z0-9 ]+).{8,}$");
          }

          break;
      }
    }

    /****************************************************************************
    * Invoked when first connected to the DOM.
    ****************************************************************************/
    connectedCallback()
    {
      if (!this.hasAttribute("for"))
        throw new Error("The for attribute is required.");

      let targetInput = document.getElementById(this.getAttribute("for"));

      if (targetInput.tagName !== "INPUT")
        throw new Error("Only <input> elements are supported for checking password strength.");

      if (!this.hasAttribute("fair"))
        this.setAttribute("fair", "^(?=.*[A-Za-z]+)(?=.*[0-9]+).{6,}$");

      if (!this.hasAttribute("good"))
        this.setAttribute("good", "^(?=.*[A-Z]+)(?=.*[a-z]+)(?=.*[0-9]+).{8,}$");

      if (!this.hasAttribute("strong"))
        this.setAttribute("strong", "^(?=.*[A-Z]+)(?=.*[a-z]+)(?=.*[0-9]+)(?=.*[^A-Za-z0-9 ]+).{8,}$");

      buildStrength.call(this);
      wireEvents.call(this);
    }

    /****************************************************************************
    * Invoked when disconnected from the DOM.
    ****************************************************************************/
    disconnectedCallback()
    {
    }
  }

  window.customElements.define("dragline-password-strength", PasswordStrength);

  /**************************************************************************
  * Builds the UI that tells the user their password's stud muffin
  * potential.
  *
  * @this The <dragline-password-strength> element.
  **************************************************************************/
  function buildStrength()
  {
    let strengthDiv = document.createElement("div");
    strengthDiv.className += "Strength";
    strengthDiv.innerHTML = "<small><strong>Strength:</strong> <span>Weak</span></small>";
    this.shadowRoot.appendChild(strengthDiv);

    let meterDiv = document.createElement("div");
    meterDiv.className += "Meter";
    meterDiv.appendChild(document.createElement("span"));
    strengthDiv.appendChild(meterDiv);
  }

  /**************************************************************************
  * Updates the UI that tells the user their stud muffin potential.
  *
  * @this The <dragline-password-strength> element.
  **************************************************************************/
  function updateStrength()
  {
    let strength = "Weak";
    let targetInput = document.getElementById(this.getAttribute("for"));
    let strongRegex = new RegExp(this.getAttribute("strong"));
    let goodRegex = new RegExp(this.getAttribute("good"));
    let fairRegex = new RegExp(this.getAttribute("fair"));
    let strengthDiv = this.shadowRoot.querySelector("div.Strength");
    strengthDiv.classList.remove("Strong,Moderate,Fair,Weak");

    if (targetInput.value.length < 1 || document.activeElement != targetInput)
    {
      this.removeAttribute("active");
      return;
    }
    else if (strongRegex.test(targetInput.value))
      strength = "Strong";
    else if (goodRegex.test(targetInput.value))
      strength = "Moderate";
    else if (fairRegex.test(targetInput.value))
      strength = "Fair";

    strengthDiv.querySelector("small > span").innerText = strength;
    strengthDiv.classList.add(strength);
    this.setAttribute("active", "");
  }

  /**************************************************************************
  * Wires event-handlers.
  *
  * @this A PasswordStrength instance.
  * @param oldElement {string} The ID of the previous element being watched.
  **************************************************************************/
  function wireEvents(oldElement)
  {
    if (oldElement)
    {
      let oldInput = document.getElementById(oldElement);
      oldInput.removeEventListener("blur", updateStrength.bind(this));
      oldInput.removeEventListener("focus", updateStrength.bind(this));
      oldInput.removeEventListener("keyup", updateStrength.bind(this));
      oldInput.removeEventListener("paste", updateStrength.bind(this));
    }

    let targetInput = document.getElementById(this.getAttribute("for"));
    targetInput.addEventListener("blur", updateStrength.bind(this));
    targetInput.addEventListener("focus", updateStrength.bind(this));
    targetInput.addEventListener("keyup", updateStrength.bind(this));
    targetInput.addEventListener("paste", updateStrength.bind(this));
  }
})(window, document);