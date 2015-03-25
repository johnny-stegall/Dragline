/******************************************************************************
* jQuery Pull-Out Plugin
* Author: John Stegall
* Copyright: 2013-2015 John Stegall
* License: MIT
*
* Displays the contents of an element in a modal dialog.
******************************************************************************/
; (function($, window, document, undefined)
{
  "use strict";

  var _defaults =
  {
    Anchor: "Middle",
    Anchored: false,
    Location: "Top",
    Position: "Fixed"
  };

  /****************************************************************************
  * The Pull-Out constructor.
  *
  * @param element {jQuery} The element to turn into a pull-out.
  * @param options {object} Settings to apply to the pull-out.
  ****************************************************************************/
  var PullOut = function(element, options)
  {
    this.Element = element;
    this.Options = $.extend({}, _defaults, options);

    this.Element.addClass("Pull-Out");

    buildPullIcon.call(this);
  }

  PullOut.prototype =
  {
    /****************************************************************************
    * Frees resources used by the plugin and unbinds event-handlers.
    ****************************************************************************/
    destroy: function()
    {
      this.Element.removeClass("Pull-Out");
    }
  };

  /****************************************************************************
  * Builds the icon users can use to pull the element out.
  *
  * @this A Pull-Out instance.
  ****************************************************************************/
  function buildPullIcon()
  {
    var pullIcon = $("<i />")
      .addClass("fa");

    switch (this.Options.Location.toLowerCase())
    {
      case "top":
        pullIcon.addClass("fa-chevron-down");
        break;
      case "bottom":
        pullIcon.addClass("fa-chevron-up");
        break;
      case "left":
        pullIcon.addClass("fa-chevron-right");
        break;
      case "right":
        pullIcon.addClass("fa-chevron-left");
        break;
      default:
        throw "Unsupported value for Location option.";
    }
  }
})(jQuery, window, document);

// Allow declarative activation
$(document).on("click.widgets.pull-out", "[data-pull-out]", function()
{
  var self = $(this);
  var options = self.data("options");

  if (typeof (options) === "string")
    options = JSON.parse(options.replace(/'/g, "\""));

  $.Modal.showDialog(self.data("modal"), self.data("title"), options, self.data("callback"));
});