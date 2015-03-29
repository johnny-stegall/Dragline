/******************************************************************************
* jQuery Responsive Navigation Plugin
* Author: John Stegall
* Copyright: 2009-2015 John Stegall
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
    $("[data-nav]").click(function()
    {
      var self = $(this);

      $.Navigation.toggle(self.data("nav"));
    });
  });
})(jQuery, window, document);
