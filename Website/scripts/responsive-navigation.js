/******************************************************************************
* jQuery Responsive Navigation Plugin
* Author: John Stegall
* Copyright: 2009 John Stegall
* License: MIT
*
* This plugin toggles responsive navigation for mobile devices.
******************************************************************************/
;(function($, window, document, undefined)
{
  "use strict";

  /****************************************************************************
  * The Navigation plugin.
  ****************************************************************************/
  $.Navigation =
  {
    /****************************************************************************
    * Toggles visibility of the responsive navigation.
    * @param element {jQuery} The menu element.
    ****************************************************************************/
    toggle: function(element)
    {
      if (typeof (element) === "string")
        element = $(element);

      element.toggleClass("Display");
    }
  };

  $(document).ready(function()
  {
    // Allow declarative activation
    $("[data-nav]").on("click.widgets.responsive-navigation", function()
    {
      $.Navigation.toggle($(this).data("nav"));
    });

    $("body > #ulNav > li > a[href='javascript:void(0);']").on("click.widgets.responsive-navigation", function()
    {
      $(this).toggleClass("Active");
    })
  });
})(jQuery, window, document);
