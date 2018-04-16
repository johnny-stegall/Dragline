/******************************************************************************
* Toast Alert Custom Element
* Author: John Stegall
* Copyright: 2014 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-toasty> custom element.
******************************************************************************/
;(function(window, document, undefined)
{
  "use strict";

  // Create toasty based on HTMLElement
  var toastyPrototype = Object.create(HTMLElement.prototype);

  /****************************************************************************
  * Setup toasty when it's first created.
  ****************************************************************************/
  toastyPrototype.createdCallback = function()
  {
    this.Messages = 0;
    this.Visible = 0;
    this.createShadowRoot();
  };

  /**************************************************************************
  * Creates a toast alert.
  *
  * @param parameters {object} The toast alert parameters.
  **************************************************************************/
  toastyPrototype.add = function(parameters)
  {
    if (!parameters)
      throw new Error("No message parameters supplied.");
    else if (typeof (parameters) === "string")
      parameters = { Text: parameters };
    else if (this.getAttribute("max") && this.Visible >= parseInt(this.getAttribute("max")))
      return;

    var alertId = this.Messages;
    var toast = document.createElement("div");
    toast.id = "Toasty-" + alertId;

    if (parameters.Role)
      toast.setAttribute("role", parameters.Role.toLowerCase());

    if (parameters.Sticky)
      toast.setAttribute("sticky", "");
    else
      toast.addEventListener("transitionend", addHangTime);
      
    this.Messages++;
      
    if (parameters.Dismissable)
      addDismissButton(toast, alertId);
      
    if (parameters.Title)
    {
      var header = document.createElement("header");
      header.innerText = parameters.Title;
      toast.appendChild(header);
    }

    if (parameters.ImageUrl)
      addImage(toast, parameters.ImageUrl);

    var message = document.createElement("span");
    message.innerText = parameters.Text;
    toast.appendChild(message);

    Toasty.Visible++;
    this.shadowRoot.appendChild(toast);

    window.setTimeout(function()
    {
      toast.setAttribute("active", "");
    }, 500);

    return alertId;
  },

  /**************************************************************************
  * Removes a specific alert. The first step is to slowly fade it out by
  * making the opacity gradually 0, then reducing the height to 0, which
  * gives it a "scrolling up" effect. Once completely invisible, it's
  * removed.
  *
  * @param alertId {int} The alert ID.
  **************************************************************************/
  toastyPrototype.remove = function(alertId)
  {
    this.shadowRoot.getElementById("#Toasty-" + alertId).remove();
    this.Visible--;
  },
    
  /**************************************************************************
  * Removes all alerts.
  **************************************************************************/
  toastyPrototype.removeAll = function()
  {
    for (var toastIndex = 0; toastIndex < this.shadowRoot.children.length; toastIndex++)
    {
      this.shadowRoot.children[toastIndex].style.opacity = 0;
      this.shadowRoot.children[toastIndex].addEventListener("transitionend", function()
      {
        this.shadowRoot.children[toastIndex].remove();
      });
    }

    this.Visible = 0;
  }

  var Toasty = document.registerElement("dragline-toasty", { prototype: toastyPrototype });

  /****************************************************************************
  * Adds a button that allows the user to dismiss the alert.
  *
  * @param toast {element} The <div> element containing the alert.
  * @param alertId {int} The alert ID.
  ****************************************************************************/
  function addDismissButton(toast, alertId)
  {
    var dismissButton = document.createElement("button");
    dismissButton.type = "button";
    dismissButton.addEventListener("click", function()
    {
      toast.setAttribute("acknowledged", "");
    });

    var icon = document.createElement("i");
    icon.className += "fa fa-ties";
    dismissButton.appendChild(icon);
      
    toast.appendChild(dismissButton);
  }

  /****************************************************************************
  * At the end of the transition to make the toast visible, add the CSS class
  * that will make it invisible and then remove the toast from the DOM.
  *
  * @param event {event} The event.
  ****************************************************************************/
  function addHangTime(event)
  {
    var toast = event.target;
    toast.setAttribute("disabled", "");
    toast.addEventListener("transitionend", function(event)
    {
      toast.remove();
    });
  }
    
  /****************************************************************************
  * Adds an image to the alert.
  *
  * @param toast {element} The <div> element containing the alert.
  * @param imageUrl {string} The image URL.
  ****************************************************************************/
  function addImage(toast, imageUrl)
  {
    var alertImage = document.createElement("img");
    alertImage.src = imageUrl;
    toast.appendChild(alertImage);
  }
})(window, document);