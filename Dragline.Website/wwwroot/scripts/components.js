var Components =
{
  /**************************************************************************
  * Prompts the user to do not a damn thing.
  *
  * @param event {Event} The event.
  **************************************************************************/
  promptForNothing: function(event)
  {
    let modalDialog = document.getElementsByTagName("dragline-modal")[0];
    modalDialog.prompt("Derp", "Are you sure you want to do nothing?",
    [
      {
        Callback: modalDialog.hideDialog,
        CssClasses: "Suggested",
        Text: "Derp"
      },
      {
        Callback: modalDialog.hideDialog,
        CssClasses: "Risky",
        Text: "Herpaderp"
      }
    ]);
  },

  /**************************************************************************
  * Prompts the user to delete their hard disk.
  *
  * @param event {Event} The event.
  **************************************************************************/
  promptToDelete: function(event)
  {
    let modalDialog = document.getElementsByTagName("dragline-modal")[0];
    modalDialog.promptToDelete(function()
    {
      alert("Your hard disk has been purged!");
    });
  },

  /**************************************************************************
  * Prompts the user to encrypt their hard disk.
  *
  * @param event {Event} The event.
  **************************************************************************/
  promptToSave: function(event)
  {
    let modalDialog = document.getElementsByTagName("dragline-modal")[0];
    modalDialog.promptToSave(
      function()
      {
        alert("Encrypting your hard disk with a randomly generated password...");
        modalDialog.hideDialog();
      },
      function()
      {
        alert("Acknowledge desire to continue; encrypting your hard disk with a randomly generated password...");
        modalDialog.hideDialog();
      },
      function()
      {
        alert("Fine, if you won't encrypt, erasing hard disk...");
        modalDialog.hideDialog();
      });
  },

  /**************************************************************************
  * Changes an attribute value.
  *
  * @param event {Event} The event.
  * @param customElement {HTMLElement} The custom element.
  **************************************************************************/
  setAttribute: function(event, customElement)
  {
    let attribute = event.target.getAttribute("data-attribute");

    if (event.target.type && event.target.type === "checkbox" || event.target.type === "radio")
    {
      if (event.target.checked)
        customElement.setAttribute(attribute, "");
      else
        customElement.removeAttribute(attribute);
    }
    else
      customElement.setAttribute(attribute, event.target.value);
  },

  /**************************************************************************
  * Displays a toast.
  *
  * @param event {Event} The event.
  **************************************************************************/
  showToast: function(event)
  {
    let toasty = document.getElementsByTagName("dragline-toasty")[0];
    toasty.add(JSON.parse(event.target.getAttribute("data-toast").replace(/'/g, "\"")));
  },

  /**************************************************************************
  * Changes attribute values of the accordion.
  *
  * @param event {Event} The event.
  **************************************************************************/
  updateAccordion: function(event)
  {
    let accordion = document.getElementsByTagName("dragline-accordion")[0];
    Components.setAttribute(event, accordion);
  },

  /**************************************************************************
  * Changes attribute values of the card deck.
  *
  * @param event {Event} The event.
  **************************************************************************/
  updateCardDeck: function(event)
  {
    let deck = document.getElementsByTagName("dragline-deck")[0];
    Components.setAttribute(event, deck);
  },
  
  /**************************************************************************
  * Changes attribute values of the carousel.
  *
  * @param event {Event} The event.
  **************************************************************************/
  updateCarousel: function(event)
  {
    let carousel = document.getElementsByTagName("dragline-carousel")[0];
    Components.setAttribute(event, carousel);
  },

  /**************************************************************************
  * Changes attribute values of the pull-out.
  *
  * @param event {Event} The event.
  **************************************************************************/
  updatePullOut: function(event)
  {
    let pullout = document.getElementsByTagName("dragline-pull-out")[0];
    Components.setAttribute(event, pullout);
  },

  /**************************************************************************
  * Changes attribute values of the remaining characters component.
  *
  * @param event {Event} The event.
  **************************************************************************/
  updateRemaining: function(event)
  {
    let remainingCharacters = document.getElementsByTagName("dragline-remaining")[0];
    Components.setAttribute(event, remainingCharacters);
  },

  /**************************************************************************
  * Changes attribute values of the infinite scrolling component.
  *
  * @param event {Event} The event.
  **************************************************************************/
  updateScrollable: function(event)
  {
    let infiniteScroller = document.getElementsByTagName("dragline-scrollable")[0];
    Components.setAttribute(event, infiniteScroller);
  },

  /**************************************************************************
  * Changes attribute values of the tabstrip.
  *
  * @param event {Event} The event.
  **************************************************************************/
  updateTabstrip: function(event)
  {
    let tabstrip = document.getElementsByTagName("dragline-tabstrip")[0];
    Components.setAttribute(event, tabstrip);
  },

  /**************************************************************************
  * Changes attribute values of toasty.
  *
  * @param event {Event} The event.
  **************************************************************************/
  updateToasty: function(event)
  {
    let toasty = document.getElementsByTagName("dragline-toasty")[0];
    Components.setAttribute(event, toasty);
  },

  /**************************************************************************
  * Wires event-handlers.
  **************************************************************************/
  wireEvents: function()
  {
    document.getElementById("chkAccordion-Collapsible").addEventListener("change", Components.updateAccordion);
    document.getElementById("ddlAccordion-Orientation").addEventListener("change", Components.updateAccordion);
    document.getElementById("ddlAccordion-Toggle").addEventListener("change", Components.updateAccordion);
    document.getElementById("ddlCardDeck-Mode").addEventListener("change", Components.updateCardDeck);
    document.getElementById("ddlCarousel-Direction").addEventListener("change", Components.updateCarousel);
    document.getElementById("chkCarousel-Pause").addEventListener("change", Components.updateCarousel);
    document.getElementById("chkCarousel-Indicators").addEventListener("change", Components.updateCarousel);
    document.getElementById("txtCarousel-Interval").addEventListener("change", Components.updateCarousel);
    document.getElementById("chkCarousel-NextPrevious").addEventListener("change", Components.updateCarousel);
    document.getElementById("chkCarousel-Wrap").addEventListener("change", Components.updateCarousel);
    document.getElementById("btnPromptDelete").addEventListener("click", Components.promptToDelete);
    document.getElementById("btnPromptSave").addEventListener("click", Components.promptToSave);
    document.getElementById("btnPromptCustom").addEventListener("click", Components.promptForNothing);
    document.getElementById("ddlPullOut-Position").addEventListener("change", Components.updatePullOut);
    document.getElementById("txtRemaining-Good").addEventListener("change", Components.updateRemaining);
    document.getElementById("txtRemaining-Danger").addEventListener("change", Components.updateRemaining);
    document.getElementById("txtRemaining-Warning").addEventListener("change", Components.updateRemaining);
    document.getElementById("txtScrollable-PageSize").addEventListener("change", Components.updateTabstrip);
    document.getElementById("txtScrollable-Threshold").addEventListener("change", Components.updateTabstrip);
    document.getElementById("chkScrollable-UseWindow").addEventListener("change", Components.updateScrollable);
    document.getElementById("ddlTabstrip-Orientation").addEventListener("change", Components.updateTabstrip);
    document.getElementById("txtToasty-Max").addEventListener("change", Components.updateToasty);

    let toastButtons = document.querySelectorAll("#tblToastExamples button[data-toast]")

    for (var buttonIndex = 0; buttonIndex < toastButtons.length; buttonIndex++)
      toastButtons[buttonIndex].addEventListener("click", Components.showToast);

    document.getElementById("btnRemoveAll").addEventListener("click", function()
    {
      let toasty = document.getElementsByTagName("dragline-toasty")[0];
      toasty.removeAll();
    });
  }
};

document.addEventListener("DOMContentLoaded", Components.wireEvents);