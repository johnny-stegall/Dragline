/******************************************************************************
* jQuery Character Counter Plugin
* Author: John Stegall
* Copyright: 2008 John Stegall
* License: MIT
*
* Displays a counter for INPUT and TEXTAREA elements that displays the
* number of characters remaining and changes color. Expects a label with
* the for attribute.
******************************************************************************/
;(function($, window, document, undefined)
{
  "use strict";

  var _defaults =
  {
    Color: "#00AA00",
    Danger: "#AA0000",
    Warning: "#D38601"
  };

  /****************************************************************************
  * The Character Counter constructor.
  *
  * @param element {jQuery} The element to turn into a character counter.
  * @param options {object} Settings to apply to the character counter.
  ****************************************************************************/
  var CharacterCounter = function(element, options)
  {
    this.Element = element;
    this.Options = $.extend({}, _defaults, options);

    if (!element.prop("for") || element.prop("for") === "")
      throw "The for attribute is required.";

    element.addClass("Counter");

    this.Input = $("#" + element.prop("for"));

    if (!this.Input.length)
      throw "The target element for character counting wasn't found.";

    element.parent().css("overflow-x", "hidden");
      
    updateCount.call(this);
    wireEvents.call(this);
  }
  
  CharacterCounter.prototype =
  {
    /****************************************************************************
    * Frees resources used by the plugin and unbinds event-handlers.
    ****************************************************************************/
    destroy: function()
    {
      this.Element.parent().css("overflow-x", "");

      this.Element
        .removeData("Character Counter")
        .removeClass("Counter");

      this.Input.off(".widgets.counter");
    }
  };
  
  /**************************************************************************
  * Toggles display of the counter.
  *
  * @this A CharacterCounter instance.
  * @param e {event} The event.
  **************************************************************************/
  function toggleCounter(e)
  {
    if (e.type === "blur")
      this.Element.removeClass("Counting");
    else if (e.type === "focus")
      this.Element.addClass("Counting");
  }

  /**************************************************************************
  * Updates the count of characters remaining.
  *
  * @this A CharacterCounter instance.
  **************************************************************************/
  function updateCount()
  {
    var charCount = this.Input.val().length;
    var maxChars = parseInt(this.Input.prop("maxlength")) || 0;

    this.Element.text("Characters Remaining: " + (maxChars - charCount));
      
    if (parseInt(maxChars) > 0)
    {
      var percentUsed = charCount / maxChars * 100;
        
      if (percentUsed < 50)
        this.Element.css("color", this.Options.Color);
      else if (percentUsed < 75)
        this.Element.css("color", this.Options.Warning);
      else
        this.Element.css("color", this.Options.Danger);
    }
  }

  /**************************************************************************
  * Wires event-handlers.
  *
  * @this A CharacterCounter instance.
  **************************************************************************/
  function wireEvents()
  {
    this.Input
      .on("blur.widgets.counter focus.widgets.counter", $.proxy(toggleCounter, this))
      .on("keyup.widgets.counter paste.widgets.counter", $.proxy(updateCount, this));
  }

  /****************************************************************************
  * The Character Counter plugin.
  ****************************************************************************/
  $.fn.CharacterCounter = function(options)
  {
    var args = arguments;

    if (options === undefined || typeof (options) === "object")
    {
      // This proves bondage is a good thing
      return this.each(function()
      {
        // Allow the plugin to only be instantiated once
        if ($.data(this, "Character Counter") === undefined)
          $.data(this, "Character Counter", new CharacterCounter($(this), options));
      });
    }
    else if (typeof (options) === "string")
    {
      // Cache the method call to make it possible to return a value
      var result;

      this.each(function()
      {
        var instance = $.data(this, "Character Counter");

        // Call the method with any parameters also passed
        if (instance instanceof CharacterCounter && typeof instance[options] === "function")
          result = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
      });

      // Return the method's return value; otherwise maintain chainability
      return result !== undefined ? result : this;
    }
  };

  // Allow declarative activation
  $(document).ready(function()
  {
    return $("[data-counter]").each(function()
    {
      var self = $(this);
      var options = self.data("options");

      if (typeof (options) === "string")
        options = JSON.parse(options.replace(/'/g, "\""));

      self.CharacterCounter(options);
    });
  });
})(jQuery, window, document);
