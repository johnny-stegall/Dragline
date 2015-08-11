/******************************************************************************
* Accordion Custom Element
* Author: John Stegall
* Copyright: 2014 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-accordion> custom element.
******************************************************************************/
;(function(window, document, undefined)
{
  "use strict";

  var _defaults =
  {
    Collapsible: false,
    HoverToggle: false,
    Orientation: "Vertical"
  };

  // Create the accordion based on HTMLElement
  var accordionPrototype = Object.create(HTMLElement.prototype);

  // Setup the element
  accordionPrototype.createdCallback = function()
  {
  };

  var Accordion = document.registerElement("dragline-accordion", { prototype: Accordion.prototype });

  /****************************************************************************
  * The Accordion constructor.
  *
  * @param element {jQuery} The DIV element to turn into an accordion.
  * @param options {object} Settings to apply to the accordion.
  ****************************************************************************/
  var Accordion = function(element, options)
{
    this.Element = element;
    this.Keys = element.children("header");
    this.Options = $.extend({}, _defaults, options);

    if (this.Options.Orientation.toLowerCase() === "horizontal")
{
      this.Element.addClass("Accordion-Horizontal");
      this.Element.children("header").wrapInner("<div />");
    }
    else
      this.Element.addClass("Accordion-Vertical");

    var expandedKey = element.children("header.Expanded");

    if (this.Keys.length < 1)
      throw new Error("No keys could be found.");
    else if (expandedKey.length > 1)
      throw new Error("Only one key on an accordion can be expanded.");
    else if (expandedKey.length < 1)
      element.children("header:first").addClass("Expanded");

    wireEvents.call(this);
  }

  Accordion.prototype =
  {
    /****************************************************************************
    * Frees resources used by the plugin and unbinds event-handlers.
    ****************************************************************************/
    destroy: function()
{
      this.Element
        .removeData("Accordion")
        .removeClass("Accordion-Vertical")
        .removeClass("Accordion-Horizontal")
        .off(".widgets.accordion");

      this.Element
        .children()
        .removeClass("Expanded");
    }
  };

  /**************************************************************************
  * Expands/collapses the accordion.
  *
  * @this An Accordion instance.
  * @param e {event} The event.
  **************************************************************************/
  function toggleKey(e)
{
    e.stopPropagation();

    var clickedKey = (e.target.tagName.toLowerCase() === "header") ? $(e.target) : $(e.target).parent("header");

    if (clickedKey.hasClass("Expanded"))
{
      if (this.Options.Collapsible)
        clickedKey.removeClass("Expanded");
      else
        return;
    }
    else
{
      this.Keys.removeClass("Expanded");
      clickedKey.addClass("Expanded");
    }
  }

  /****************************************************************************
  * Wires event-handlers.
  *
  * @this An Accordion instance.
  ****************************************************************************/
  function wireEvents()
{
    var toggleEvent = (!this.Options.HoverToggle) ? "click.widgets.accordion" : "mouseenter.widgets.accordion";
    this.Element.on(toggleEvent, "header, header *", $.proxy(toggleKey, this));
  }

  /****************************************************************************
  * The Accordion plugin.
  ****************************************************************************/
  $.fn.Accordion = function(options)
{
    var args = arguments;

    if (options === undefined || typeof (options) === "object")
{
      // This proves bondage is a good thing
      return this.each(function()
{
        // Allow the plugin to only be instantiated once
        if ($.data(this, "Accordion") === undefined)
          $.data(this, "Accordion", new Accordion($(this), options));
      });
    }
    else if (typeof (options) === "string")
{
      // Cache the method call to make it possible to return a value
      var result;

      this.each(function()
{
        var instance = $.data(this, "Accordion");

        // Call the method with any parameters also passed
        if (instance instanceof (Accordion) && typeof (instance[options]) === "function")
          result = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
      });

      // Return the method's return value; otherwise maintain chainability
      return result !== undefined ? result : this;
    }
  };
})(jQuery, window, document);
