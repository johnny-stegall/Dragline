/******************************************************************************
* jQuery DropDown Plugin
* Author: John Stegall
* Copyright: 2008-2015 John Stegall
* License: MIT
*
* Displays a dropdown menu when clicking a button.
******************************************************************************/
;(function($, window, document, undefined)
{
  "use strict";

  /****************************************************************************
  * The DropDown constructor.
  *
  * @param element {jQuery} The button element to turn into a dropdown.
  * @param options {object} settings to apply to the index.
  ****************************************************************************/
  var DropDown = function(element, options)
  {
    this.Element = element;
    this.Menu = options ? $(options.Menu) : $(element.data("dropdown"));

    if (!this.Menu.length)
      throw "The dropdown target could not be found.";

    this.Menu
      .addClass("DropDown")
      .attr("data-role", "DropDown");

    if (!this.Element.data("dropdown"))
    {
      this.Menu.data("DropDown Activator", this.Element);
      wireEvents.call(this);
    }
  };

  DropDown.prototype =
  {
    /****************************************************************************
    * Frees resources used by the plugin and unbinds event-handlers.
    ****************************************************************************/
    destroy: function()
    {
      this.Menu
        .removeClass("DropDown")
        .removeData("DropDown Activator")
        .hide();

      this.Element
        .removeClass("Active")
        .removeAttr("data-dropdown")
        .removeData("dropdown")
        .removeData("DropDown")
        .off(".widgets.dropdown")
        .trigger("blur");

      if ($("[data-dropdown]").length === 0)
        $(document).off(".widgets.dropdown");
    }
  };

  /****************************************************************************
  * Clears all menus.
  *
  * @param e {event} The event.
  ****************************************************************************/
  function clearMenus(e)
  {
    if (e && e.which === 3)
      return;

    $("DropDown-Backdrop").remove();
    $("[data-dropdown]").removeClass("Active");
    $("[data-role='DropDown']")
      .hide()
      .each(function()
      {
        if ($(this).data("DropDown Activator"))
          $(this).data("DropDown Activator").removeClass("Active");
      });
  }

  /**************************************************************************
  * Highlights menu items using the arrow keys.
  *
  * @param e {event} The event.
  **************************************************************************/
  function highlightMenu(e)
  {
    if (!/(38|40|27)/.test(e.keyCode))
      return;

    e.preventDefault();
    e.stopPropagation();

    var dropdown;
    if ($(this).attr("role") === "DropDown")
      dropdown = $(this).data("DropDown Activator");
    else
      dropdown = $(this).data("DropDown");

    if (dropdown.Element.is(":disabled"))
      return;

    var isActive = dropdown.Menu.is(":visible");
    if (!isActive || (isActive && e.keyCode == 27))
    {
      if (e.which == 27)
        dropdown.Menu.focus();

      return dropdown.Element.trigger("click.widgets.dropdown");
    }

    var menuItems = dropdown.Menu.find("li:not(.Divider):visible a");
    if (!menuItems.length)
      return;

    var selectedIndex = menuItems.index(menuItems.filter(":focus"));

    if (e.keyCode == 38 && selectedIndex > 0)
      selectedIndex--;
    else if (e.keyCode == 40 && selectedIndex < menuItems.length - 1)
      selectedIndex++;
    else if (!~selectedIndex)
      selectedIndex = 0;

    menuItems.eq(selectedIndex).focus();
  }

  /**************************************************************************
  * Toggles the menu.
  *
  * @param e {event} The event.
  **************************************************************************/
  function toggleMenu(e)
  {
    var dropdown = $(this).data("DropDown");

    if (dropdown.Element.is(":disabled"))
      return false;

    var isVisible = dropdown.Menu.is(":visible");

    clearMenus();

    if (!isVisible)
    {
      // If mobile use a backdrop because click events don't delegate
      if ("ontouchstart" in document.documentElement && !dropdown.Element.parent().closest("nav").length)
      {
        $("<div class=\"DropDown-Backdrop\"/>")
          .insertAfter(dropdown.Element)
          .on("click.widgets.dropdown", clearMenus);
      }

      dropdown.Menu.show();
      dropdown.Element.addClass("Active");

      if (e.isDefaultPrevented())
        return false;

      dropdown.Element.focus();
    }

    return false;
  }

  /**************************************************************************
  * Wires event-handlers.
  *
  * @this A DropDown instance.
  **************************************************************************/
  function wireEvents()
  {
    this.Element
      .on("click.widgets.dropdown", toggleMenu)
      .on("keydown.widgets.dropdown", highlightMenu);
  }

  /****************************************************************************
  * The dropdown plugin.
  ****************************************************************************/
  $.fn.DropDown = function(options)
  {
    var args = arguments;

    if (options === undefined || typeof (options) === "object")
    {
      // This proves bondage is a good thing
      return this.each(function()
      {
        // Allow the plugin to only be instantiated once
        if ($.data(this, "DropDown") === undefined)
          $.data(this, "DropDown", new DropDown($(this), options));
      });
    }
    else if (typeof (options) === "string")
    {
      // Cache the method call to make it possible to return a value
      var result;

      this.each(function()
      {
        var instance = $.data(this, "DropDown");

        // Call the method with any parameters also passed
        if (instance instanceof (DropDown) && typeof (instance[options]) === "function")
          result = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
      });

      // Return the method's return value; otherwise maintain chainability
      return result !== undefined ? result : this;
    }
  };

  // Allow declarative activation
  $(document).ready(function()
  {
    $("[data-dropdown]").each(function()
    {
      var self = $(this);
      var options = self.data("options");

      if (typeof (options) === "string")
        options = JSON.parse(options.replace(/'/g, "\""));

      self.DropDown(options);
    });

    $(document)
      .on("click.widgets.dropdown", clearMenus)
      .on("click.widgets.dropdown", "[data-dropdown]", toggleMenu)
      .on("keydown.widgets.dropdown", "[data-dropdown], [role='DropDown']", highlightMenu);
  });
})(jQuery, window, document);
