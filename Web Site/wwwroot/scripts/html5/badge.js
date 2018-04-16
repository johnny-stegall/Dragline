/******************************************************************************
* Badge Custom Element
* Author: John Stegall
* Copyright: 2014 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-badge> custom element.
******************************************************************************/
;(function(window, document, undefined)
{
  "use strict";
  // Create the badge based on <span>
  var badgePrototype = Object.create(HTMLSpanElement.prototype);

  // Register the custom element
  var Badge = document.registerElement("dragline-badge",
  {
    prototype: badgePrototype
  });
})(window, document);
