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
  let toastyPrototype = Object.create(HTMLElement.prototype);

  /****************************************************************************
  * Invoked when created.
  ****************************************************************************/
  toastyPrototype.createdCallback = function()
  {
    this.Messages = 0;
    this.createShadowRoot();
    this.shadowRoot.innerHTML = "<style>@import url('/css/font-awesome.min.css')</style>";
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
    else if (this.hasAttribute("max"))
    {
      if (this.shadowRoot.querySelectorAll("div").length >= parseInt(this.getAttribute("max")))
        return;
    }

    let alertId = this.Messages;
    let toast = document.createElement("div");
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
      let header = document.createElement("header");
      header.innerText = parameters.Title;
      toast.appendChild(header);
    }

    if (parameters.ImageUrl)
      addImage(toast, parameters.ImageUrl);

    let message = document.createElement("span");
    message.innerText = parameters.Text;
    toast.appendChild(message);
    this.shadowRoot.appendChild(toast);

    // Add a delay before setting the attribute or the transition won't happen
    setTimeout(function()
    {
      toast.setAttribute("active", "");
    }, 250);

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
  },
    
  /**************************************************************************
  * Removes all alerts.
  **************************************************************************/
  toastyPrototype.removeAll = function()
  {
    while (this.shadowRoot.hasChildNodes())
      this.shadowRoot.firstChild.remove();

    this.shadowRoot.innerHTML = "<style>@import url('/css/font-awesome.min.css')</style>";
  }

  let Toasty = document.registerElement("dragline-toasty", { prototype: toastyPrototype });

  /****************************************************************************
  * Adds a button that allows the user to dismiss the alert.
  *
  * @param toast {HTMLElement} The <div> element containing the alert.
  * @param alertId {int} The alert ID.
  ****************************************************************************/
  function addDismissButton(toast, alertId)
  {
    let dismissButton = document.createElement("button");
    dismissButton.type = "button";
    dismissButton.addEventListener("click", function()
    {
      toast.setAttribute("acknowledged", "");
    });

    let icon = document.createElement("i");
    icon.className += "fa fa-times";
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
    let toast = event.target;
    toast.setAttribute("disabled", "");
    toast.addEventListener("transitionend", function(event)
    {
      toast.remove();
    });
  }
    
  /****************************************************************************
  * Adds an image to the alert.
  *
  * @param toast {HTMLElement} The <div> element containing the alert.
  * @param imageUrl {string} The image URL.
  ****************************************************************************/
  function addImage(toast, imageUrl)
  {
    let alertImage = document.createElement("img");
    alertImage.src = imageUrl;
    toast.appendChild(alertImage);
  }
})(window, document);