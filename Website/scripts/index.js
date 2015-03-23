/******************************************************************************
* jQuery Index Plugin
* Author: John Stegall
* Copyright: 2007 John Stegall
* License: MIT
*
* This plugin turns an UL element into a table of contents. It will search
* through the page and find all heading elements (h1-h6) that have an id
* attribute set and build a hierarchical table of contents. It tracks the
* user's position as they scroll through the page and activates table of
* contents links based on the top-most visible heading.
******************************************************************************/
;(function($, window, document, undefined)
{
  "use strict";

  var _defaults =
  {
    Offset: 0,
    Target: null
  };

  /****************************************************************************
  * The Index constructor.
  *
  * @param element {jQuery} The UL element to turn into an index.
  * @param options {object} Settings to apply to the index.
  ****************************************************************************/
  var Index = function(element, options)
  {
    this.Element = element;
    this.Options = $.extend({}, _defaults, options);

    if (!this.Options.Target)
      this.Options.Target = $("body");

    this.Scroller = (this.Options.Target.is("body")) ? $(window) : $(element);
    this.Targets = [];
    this.ActiveTarget = null;
    this.ScrollHeight = 0;

    this.Element.addClass("Index");

    wireEvents.call(this);
    trackBookmarks.call(this);
  }

  Index.prototype =
  {
    /****************************************************************************
    * Frees resources used by the plugin and unbinds event-handlers.
    ****************************************************************************/
    destroy: function()
    {
      this.Element
        .removeClass("Index")
        .removeData("Index")
        .empty()
        .off(".widgets.index");

      this.Scroller.off(".widgets.index");
    }
  };

  /**************************************************************************
  * Applies styling to the active heading to denote to users where in the
  * page they're located.
  *
  * @this An Index instance.
  * @param targetElement {jQuery} The target element.
  * @param e {event} The event.
  **************************************************************************/
  function activateBookmark(targetElement, e)
  {
    if (e)
    {
      this.ActiveTarget = $.grep(this.Targets, function(target)
      {
        return target.Heading.attr("id") == $(e.target).attr("href").substr(1);
      })[0];

      e.preventDefault();

      var headingOffset = calculateOffset.call(this, this.ActiveTarget.Heading);

      if ($.isWindow(this.Scroller[0]))
        this.Scroller[0].scrollTo(0, headingOffset - this.Options.Offset);
      else
        this.Scroller.animate({ scrollTop: headingOffset - this.Options.Offset });
    }
    else if (targetElement)
      this.ActiveTarget = targetElement;

    this.Element
      .find("li.Active")
      .removeClass("Active");

    this.Element.find("[href='#" + this.ActiveTarget.Heading.attr("id") + "']")
      .parents("li")
      .addClass("Active");
  }

  /**************************************************************************
  * Builds a level-indented table of contents by all heading elements found
  * that have an id attribute.
  *
  * @this An Index instance.
  **************************************************************************/
  function buildIndex()
  {
    var headings = mapHeadings.call(this);
    if (!haveHeadingsChanged.call(this, headings))
      return;

    this.ScrollHeight = getScrollHeight.call(this);

    this.Element.empty();
    var targetList = this.Element;
    var listLevel = parseInt(headings[0].Heading.prop("tagName").substr(headings[0].Heading.prop("tagName").length - 1));
    var listItem;

    headings.forEach(function(heading)
    {
      var tagName = heading.Heading.prop("tagName");
      var headingLevel = parseInt(tagName.substr(tagName.length - 1));

      if (headingLevel > listLevel)
      {
        var newList = $("<ul class=\"Unstyled\" />");

        listItem.append(newList);
        targetList.append(listItem);

        targetList = newList;
        listLevel++;
      }

      while (headingLevel < listLevel)
      {
        targetList = $(targetList.parents("ul")[0]);
        listLevel--;
      }

      var headingLink = $("<a />")
        .text(heading.Heading.text())
        .attr("href", "#" + heading.Heading.attr("id"));

      listItem = $("<li/>")
        .append(headingLink);

      targetList.append(listItem);
    });

    this.Targets = headings;
  }

  /**************************************************************************
  * Calculates the offset position of the specified heading.
  *
  * @this An Index instance.
  * @param heading {jQuery} A heading element.
  * @returns The integer pixel offset.
  **************************************************************************/
  function calculateOffset(heading)
  {
    var baseOffset = 0;
    var offsetMethod = "offset";

    if (!$.isWindow(this.Scroller[0]))
    {
      offsetMethod = "position";
      baseOffset = this.Scroller.scrollTop();
    }

    return heading[offsetMethod]().top + baseOffset;
  }

  /**************************************************************************
  * Gets the scroll height of the scrollable element.
  *
  * @this An Index instance.
  * @returns The integer pixel scrollable height of the scrollable element.
  **************************************************************************/
  function getScrollHeight()
  {
    return this.Scroller[0].scrollHeight || Math.max($("body")[0].scrollHeight, document.documentElement.scrollHeight);
  }

  /**************************************************************************
  * Determines if any document headings have changed.
  *
  * @this An Index instance.
  * @param headings {jQuery} An array of heading elements.
  * @returns True if any heading has changed, false otherwise.
  **************************************************************************/
  function haveHeadingsChanged(headings)
  {
    if (!this.Targets || this.Targets.length === 0)
      return true;

    var self = this;
    var deltaHeadings = headings.filter(function(item, index)
    {
      if (item.Offset !== self.Targets[index].Offset)
        return true;
      else if (item.Heading[0] !== self.Targets[index].Heading[0])
        return true;
      else
        return false;
    });

    return deltaHeadings.length > 0;
  }

  /**************************************************************************
  * Finds all headings with an id attribute and maps them and their (top)
  * position within the document to an array.
  *
  * @this An Index instance.
  * @returns An object array containing the jQuery-wrapped heaidng elemnts
  * and their offsets.
  **************************************************************************/
  function mapHeadings()
  {
    var headings = [];
    for (var headIndex = 1; headIndex < 7; headIndex++)
      headings = headings.concat(this.Options.Target.find("h" + headIndex + "[id]").toArray());

    // Map the headings and their position in the page in an array
    var self = this;
    headings = headings.map(function(item, index)
    {
      var heading = $(item);
      var headingOffset = calculateOffset.call(self, heading);

      return { "Heading": heading, "Offset": headingOffset };
    })
    .sort(function(first, second)
    {
      return first.Offset - second.Offset;
    });

    return headings;
  }

  /**************************************************************************
  * Tracks the position of the page and the bookmark closest to the top of
  * the page, and marks it as active.
  *
  * @this An Index instance.
  * @returns A boolean value to continue or stop event propagation.
  **************************************************************************/
  function trackBookmarks()
  {
    var scrollTop = this.Scroller.scrollTop() + this.Options.Offset;
    var scrollHeight = getScrollHeight.call(this);
    var maxScroll = this.Options.Offset + scrollHeight - this.Scroller.height();
    var activeHeader;

    if (this.ScrollHeight != scrollHeight)
      buildIndex.call(this);

    if (scrollTop >= maxScroll)
    {
      activeHeader = this.Targets[this.Targets.length - 1];
      return this.ActiveTarget != activeHeader && activateBookmark.call(this, activeHeader);
    }

    if (this.ActiveTarget && scrollTop <= this.Targets[0].Offset)
    {
      activeHeader = this.Targets[0]
      return this.ActiveTarget != activeHeader && activateBookmark.call(this, activeHeader);
    }

    for (var headerIndex = this.Targets.length; headerIndex--;)
    {
      if (scrollTop >= this.Targets[headerIndex].Offset && (!this.Targets[headerIndex + 1] || scrollTop <= this.Targets[headerIndex + 1].Offset))
      {
        activateBookmark.call(this, this.Targets[headerIndex]);
        break;
      }
    }
  }

  /**************************************************************************
  * Wires event-handlers.
  *
  * @this An Index instance.
  **************************************************************************/
  function wireEvents()
  {
    this.Scroller.on("scroll.widgets.index", $.proxy(trackBookmarks, this));
    this.Element.on("click.widgets.index", "a", $.proxy(activateBookmark, this, null));
  }

  /****************************************************************************
  * The Index plugin.
  ****************************************************************************/
  $.fn.Index = function(options)
  {
    var args = arguments;

    if (options === undefined || typeof (options) === "object")
    {
      // This proves bondage is a good thing
      return this.each(function()
      {
        // Allow the plugin to only be instantiated once
        if ($.data(this, "Index") === undefined)
          $.data(this, "Index", new Index($(this), options));
      });
    }
    else if (typeof (options) === "string")
    {
      // Cache the method call to make it possible to return a value
      var result;

      this.each(function()
      {
        var instance = $.data(this, "Index");

        // Call the method with any parameters also passed
        if (instance instanceof (Index) && typeof (instance[options]) === "function")
          result = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
      });

      // Return the method's return value; otherwise maintain chainability
      return result !== undefined ? result : this;
    }
  };
})(jQuery, window, document);
