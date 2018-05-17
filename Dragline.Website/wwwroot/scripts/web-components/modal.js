/******************************************************************************
* Modal Dialog Custom Element
* Author: John Stegall
* Copyright: 2015 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-modal> custom element.
******************************************************************************/
;(function(window, document, undefined)
{
  "use strict";

  class Modal extends HTMLElement
  {
    // Must define observedAttributes() for attributeChangedCallback to work
    static get observedAttributes()
    {
      return [""];
    }

    /****************************************************************************
    * Creates an instance of Modal.
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
    * Invoked when first connected to the DOM.
    ****************************************************************************/
    connectedCallback()
    {
      this.DialogCallback = null;
      wireEvents.call(this);
    }

    /****************************************************************************
    * Invoked when disconnected from the DOM.
    ****************************************************************************/
    disconnectedCallback()
    {
    }

    /****************************************************************************
    * Hides the modal dialog.
    ****************************************************************************/
    hideDialog()
    {
      let dialog = document.getElementById("modalDialog");

      if (dialog)
      {
        if (this.DialogCallback)
        {
          dialog.removeEventListener("transitionend", this.DialogCallback);
          this.DialogCallback = null;
        }

        dialog.addEventListener("transitionend", removeDialog);
        dialog.removeAttribute("active");
      }
    }

    /****************************************************************************
    * Prompts the user to take action.
    *
    * @param title {string} The title of the prompt dialog.
    * @param message {string} The message to display to the user.
    * @param buttons {array} An array of objects that contain button text and
    * callbacks for each button. The object must have the following properties:
    * - Callback {function} A function to call if the user clicks the button. If
    *   no callback is specified, the button will cause the modal dialog to
    *   close.
    * - CssClasses {string} One or more CSS classes (separated by spaces) to
    *   apply to the button.
    * - Text {string} The button text.
    ****************************************************************************/
    prompt(title, message, buttons)
    {
      let messageParagraph = document.createElement("p");
      messageParagraph.className += "Text-Center";
      messageParagraph.innerText = message;

      let modalDiv = document.createElement("div");
      modalDiv.appendChild(messageParagraph);

      let buttonElements = [];

      for (var buttonIndex = 0; buttonIndex < buttons.length; buttonIndex++)
      {
        if (!buttons[buttonIndex].Text || buttons[buttonIndex].Text.trim().length < 1)
          throw new Error("There is no text for modal button #" + buttonIndex + ".");

        let newButton = document.createElement("button");
        newButton.type = "button";
        newButton.innerText = buttons[buttonIndex].Text;

        if (buttons[buttonIndex].CssClasses)
          newButton.className += buttons[buttonIndex].CssClasses;

        if (buttons[buttonIndex].Callback)
          newButton.addEventListener("click", buttons[buttonIndex].Callback);
        else
          newButton.addEventListener("click", this.hideDialog.bind(this));

        buttonElements.push(newButton);
      }

      this.showDialog(modalDiv, title, null, null, buttonElements);
    }

    /****************************************************************************
    * Prompts the user confirm they want to delete something.
    *
    * @param message {string} Optional. The message to display to the user; if
    * not specified, the user will see a default message.
    * @param deleteCallback {function} A function to call if the user confirms
    * deletion.
    ****************************************************************************/
    promptToDelete(message, deleteCallback)
    {
      if (typeof (message) === "function")
      {
        deleteCallback = message;
        message = null;
      }

      if (!deleteCallback)
        throw new Error("The delete callback is required.");

      this.prompt("Confirm Removal",
        message || "Are you sure you want to delete this?",
        [
          { Callback: deleteCallback, CssClasses: "Suggested", Text: "Delete" },
          { Text: "Cancel" }
        ]);
    }

    /****************************************************************************
    * Prompts the user confirm they want to leave without saving changes to
    * something.
    *
    * @param message {string} Optional. The message to display to the user; if
    * not specified, the user will see a default message.
    * @param saveCallback {function} A function to call if the user wants to
    * save their changes.
    * @param continueCallback {function} A function to call if the user doesn't
    * want to save their changes.
    * @param cancelCallback {function} A function to call if the user wants to
    * cancel the action.
    ****************************************************************************/
    promptToSave(message, saveCallback, continueCallback, cancelCallback)
    {
      if (typeof (message) === "function")
      {
        cancelCallback = continueCallback;
        continueCallback = saveCallback;
        saveCallback = message;
        message = null;
      }
    
      if (!saveCallback)
        throw new Error("The save callback is required.");
      else if (!continueCallback)
        throw new Error("The continue callback is required.");
      else if (!cancelCallback)
        throw new Error("The cancel callback is required.");

      this.prompt("Unsaved Changes",
        message || "There are unsaved changes. What would you like to do?",
        [
          { Callback: saveCallback, CssClasses: "Suggested", Text: "Save and Continue" },
          { Callback: continueCallback, Text: "Continue Without Saving" },
          { Callback: cancelCallback, Text: "Cancel" }
        ]);
    }

    /**************************************************************************
    * Shows the modal dialog.
    *
    * @param element {HTMLElement} The element that contains the modal
    * content.
    * @param title {string} The title of the modal dialog.
    * @param options {object} Settings to apply to the modal.
    * @param callback {function} A function to call after the modal is
    * displayed.
    * @param buttons {array} An array of buttons to add to the footer.
    **************************************************************************/
    showDialog(element, title, options, callback, buttons)
    {
      if (!element)
        throw new Error("The element is required.");
      else if (!title || typeof (title) !== "string")
        throw new Error("The title is required.");

      if (typeof (element) === "string")
        element = document.getElementById(element);

      if (typeof (options) === "function")
      {
        callback = options;
        options = null;
      }

      if (!options)
        options = { CloseButton: true, Effect: "Slide From Top" };
      else
      {
        if (typeof (options.CloseButton) === "undefined")
          options.CloseButton = true;

        if (!options.Effect)
          options.Effect = "Slide From Top";
      }

      let backdropDiv = buildBackdrop();
      let dialog = buildDialog.call(this);

      dialog.className += options.Effect.replace(/ /g, "");
      dialog.querySelector("header > span").innerText = title;
      dialog.querySelector("section").innerHTML = element.innerHTML;
      dialog.querySelector("header > button").style.display = (options.CloseButton ? "inline-block" : "none");

      if (buttons)
      {
        let footer = dialog.querySelector("footer");

        for (var buttonIndex = 0; buttonIndex < buttons.length; buttonIndex++)
          footer.appendChild(buttons[buttonIndex]);
      }

      if (callback)
      {
        this.DialogCallback = callback;
        dialog.addEventListener("transitionend", this.DialogCallback);
      }

      document.body.appendChild(dialog);
      document.body.appendChild(backdropDiv);

      // Add a delay before setting the attribute or the transition won't happen
      setTimeout(function()
      {
        dialog.setAttribute("active", "");
      }, 250);
    }
  }

  window.customElements.define("dragline-modal", Modal);

  /**************************************************************************
  * Builds the modal backdrop. This is still required until ::backdrop is
  * supported in modern browsers.
  *
  * @returns The <div> element used for the modal dialog backdrop.
  **************************************************************************/
  function buildBackdrop()
  {
    if (document.querySelector("body > div[role='backdrop']"))
      return;

    let backdropDiv = document.createElement("div");
    backdropDiv.setAttribute("role", "backdrop");
    backdropDiv.setAttribute("aria-hidden", "true");
    return backdropDiv;
  }
  
  /****************************************************************************
  * Builds the elements to make a modal dialog.
  *
  * @this The <dragline-carousel> element.
  * @returns The <dialog> element created for the modal dialog.
  ****************************************************************************/
  function buildDialog()
  {
    let dialog = document.getElementById("modalDialog");

    if (dialog)
      return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "modalDialog";
    dialog.setAttribute("open", "");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-hidden", "true");

    let closeIcon = document.createElement("i");
    closeIcon.className += "fa fa-times";

    let closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.addEventListener("click", this.hideDialog.bind(this));
    closeButton.appendChild(closeIcon);

    let dialogHeader = document.createElement("header");
    dialogHeader.appendChild(closeButton);
    dialogHeader.appendChild(document.createElement("span"));

    let dialogFooter = document.createElement("footer");
    dialogFooter.className += "Text-Right";

    dialog.appendChild(dialogHeader);
    dialog.appendChild(document.createElement("section"));
    dialog.appendChild(dialogFooter);
    return dialog;
  }

  /****************************************************************************
  * Shows a modal dialog using data from an element with attributes that
  * declaratively setup a modal.
  *
  * @this The <dragline-carousel> element.
  * @param event {event} The event.
  ****************************************************************************/
  function declarativeActivation(event)
  {
    if (!event.target.hasAttribute("modal-template"))
      return;

    let modalTemplate = event.target.getAttribute("modal-template");
    let modalTitle = event.target.getAttribute("modal-title");
    let modalOptions = event.target.getAttribute("modal-options");

    if (modalOptions)
      modalOptions = JSON.parse(modalOptions.replace(/'/g, "\""));

    this.showDialog(modalTemplate, modalTitle, modalOptions);
  }

  /**************************************************************************
  * Removes the modal dialog and its backdrop from the DOM.
  *
  * @param event {event} The event.
  **************************************************************************/
  function removeDialog(event)
  {
    let dialog = document.getElementById("modalDialog");

    if (dialog)
      dialog.remove();

    let backdropDiv = document.querySelector("body > div[role='backdrop']");

    if (backdropDiv)
      backdropDiv.remove();
  }

  /**************************************************************************
  * Wires event-handlers.
  *
  * @this The <dragline-modal> element.
  **************************************************************************/
  function wireEvents()
  {
    document.addEventListener("click", declarativeActivation.bind(this));
  }
})(window, document);