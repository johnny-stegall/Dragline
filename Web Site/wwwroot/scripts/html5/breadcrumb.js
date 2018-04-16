/******************************************************************************
* Breadcrumb Custom Element
* Author: John Stegall
* Copyright: 2014 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-breadcrumb> custom element.
******************************************************************************/
;(function(window, document, undefined)
{
  "use strict";

  // Create the breadcrumb based on <ol>
  var breadcrumbPrototype = Object.create(HTMLOListElement.prototype);

  // Register the custom element
  var Breadcrumb = document.registerElement("dragline-breadcrumb",
  {
    prototype: breadcrumbPrototype
  });
})(window, document);
