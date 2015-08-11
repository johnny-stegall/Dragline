/******************************************************************************
* jQuery Modal Plugin
* Author: John Stegall
* Copyright: 2008-2014 John Stegall
* License: MIT
*
* Displays the contents of an element in a modal dialog.
******************************************************************************/
;(function($, window, document, undefined)
{
  "use strict";

  /****************************************************************************
  * The Modal singleton object with static methods.
  ****************************************************************************/
  var Modal =
  {
    Backdrop: null,
    Dialog: null,

    /**************************************************************************
    * Builds the modal backdrop.
    **************************************************************************/
    buildBackdrop: function()
    {
      if (Modal.Backdrop)
        return;

      Modal.Backdrop = $("<div id=\"divBackdrop\" />");
      $("body").append(Modal.Backdrop);
    },

    /****************************************************************************
    * Builds the elements to make a modal dialog.
    ****************************************************************************/
    buildDialog: function()
    {
      if (Modal.Dialog)
        return;

      Modal.Dialog = $("<dialog />")
        .attr("id", "dlgModal")
        .attr("open", "")
        .attr("role", "dialog")
        .attr("aria-hidden", "true");

      var closeButton = $("<button />")
        .attr("type", "button")
        .text("×")
        .click($.Modal.hideDialog);

      var dialogHeader = $("<header />")
        .append(closeButton)
        .append("<span />");

      Modal.Dialog
        .append(dialogHeader)
        .append("<section />");

      $("body").append(Modal.Dialog);
    }
  };

  /****************************************************************************
  * The Modal plugin.
  ****************************************************************************/
  $.fn.Modal = function()
  {
    // This proves bondage is a good thing
    return this;
  };

  /****************************************************************************
  * Public method namespace.
  ****************************************************************************/
  $.Modal =
  {
    /****************************************************************************
    * Hides the modal dialog.
    ****************************************************************************/
    hideDialog: function()
    {
      $("body").off("click.widgets.modal");

      Modal.Dialog.removeClass("Visible");
      Modal.Dialog.children("section").empty();

      // Wait for the transitions to finish before removing all classes
      window.setTimeout(function()
      {
        Modal.Dialog.removeClass();
      }, parseFloat(Modal.Dialog.css("transition-duration")) * 1000);
    },

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
    prompt: function(title, message, buttons)
    {
      var modalDiv = $("<div />");

      var messageParagraph = $("<p />")
        .addClass("Text-Center")
        .text(message);

      var buttonDiv = $("<div />")
        .addClass("Text-Right");

      modalDiv
        .append(messageParagraph)
        .append(buttonDiv);

      for (var buttonIndex = 0; buttonIndex < buttons.length; buttonIndex++)
      {
        if (!buttons[buttonIndex].Text || buttons[buttonIndex].Text.trim().length < 1)
          throw new Error("There is no text for modal button #" + buttonIndex + ".");

        var newButton = $("<button />")
          .attr("type", "button")
          .text(buttons[buttonIndex].Text);

        if (buttons[buttonIndex].CssClasses)
          newButton.addClass(buttons[buttonIndex].CssClasses);

        if (buttons[buttonIndex].Callback)
          $("body").on("click.widgets.modal", "#dlgModal > section button:eq(" + buttonIndex + ")", buttons[buttonIndex].Callback);
        else
          $("body").on("click.widgets.modal", "#dlgModal > section button:eq(" + buttonIndex + ")", this.hideDialog);

        buttonDiv.append(newButton);
      }

      this.showDialog(modalDiv, title);
    },

    /****************************************************************************
    * Prompts the user confirm they want to delete something.
    *
    * @param message {string} Optional. The message to display to the user; if
    * not specified, the user will see a default message.
    * @param deleteCallback {function} A function to call if the user confirms
    * deletion.
    ****************************************************************************/
    promptToDelete: function(message, deleteCallback)
    {
      if (typeof (message) === "function")
      {
        deleteCallback = message;
        message = null;
      }

      this.prompt("Confirm Removal",
        message || "Are you sure you want to delete this?",
        [
          { Callback: deleteCallback, CssClasses: "Suggested", Text: "Delete" },
          { Text: "Cancel" }
        ]);
    },

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
    promptToSave: function(message, saveCallback, continueCallback, cancelCallback)
    {
      if (typeof (message) === "function")
      {
        cancelCallback = continueCallback;
        continueCallback = saveCallback;
        saveCallback = message;
        message = null;
      }

      this.prompt("Unsaved Changes",
        message || "There are unsaved changes. What would you like to do?",
        [
          { Callback: saveCallback, CssClasses: "Suggested", Text: "Save and Continue" },
          { Callback: continueCallback, Text: "Continue Without Saving" },
          { Callback: cancelCallback, Text: "Cancel" }
        ]);
    },

    /**************************************************************************
    * Shows the modal dialog.
    *
    * @param element {jQuery} The element that contains the modal content.
    * @param title {string} The title of the modal dialog.
    * @param options {object} Settings to apply to the modal.
    * @param callback {function} A function to call after the modal is
    * displayed.
    **************************************************************************/
    showDialog: function(element, title, options, callback)
    {
      if (!element)
        throw new Error("The content element is required.");
      else if (!title || typeof (title) !== "string")
        throw new Error("Modal dialog title is required.");

      if (typeof (element) === "string")
        element = $(element);

      if (typeof (options) === "function")
      {
        callback = options;
        options = null;
      }

      options = $.extend({ CloseButton: true, Effect: "Slide From Top" }, options);

      Modal.buildDialog();
      Modal.buildBackdrop();

      Modal.Dialog.addClass(options.Effect.replace(/ /g, ""));
      Modal.Dialog.find("header > span").text(title);
      Modal.Dialog.children("section").append(element.html());
      Modal.Dialog.find("header > button").css("display", (options.CloseButton ? "inline-block" : "none"));

      // Wait for the setup transitions to finish
      window.setTimeout(function()
      {
        Modal.Dialog.addClass("Visible");

        if (callback)
        {
          if (typeof (callback) === "string")
            eval(callback + "()");
          else
            callback();
        }
      }, 325);
    }
  };
})(jQuery, window, document);

// Allow declarative activation
$(document).on("click.widgets.modal", "[data-modal]", function()
{
  var self = $(this);
  var options = self.data("options");

  if (typeof (options) === "string")
    options = JSON.parse(options.replace(/'/g, "\""));

  $.Modal.showDialog(self.data("modal"), self.data("title"), options, self.data("callback"));
});