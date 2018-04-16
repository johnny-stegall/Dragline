/******************************************************************************
* Index Custom Element
* Author: John Stegall
* Copyright: 2015 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-index> custom element.
******************************************************************************/
;(function(window, document, undefined)
{
  "use strict";

  // Create toasty based on HTMLElement
  var indexPrototype = Object.create(HTMLElement.prototype);

  /****************************************************************************
  * Setup the index when it's first created.
  ****************************************************************************/
  indexPrototype.createdCallback = function()
  {
    this.Target = document.body;
    this.Scroller = document.getElementById(this.getAttribute("target")) || window;
    this.Headings = [];
    this.ActiveHeading = null;
    this.ScrollHeight = 0;
    this.createShadowRoot();
  };

  /****************************************************************************
  * Wire events and build/track the index.
  ****************************************************************************/
  indexPrototype.attachedCallback = function()
  {
    wireEvents.call(this);
    trackBookmarks.call(this);
  }

  var Index = document.registerElement("dragline-index", { prototype: indexPrototype });

  /**************************************************************************
  * Applies styling to the active heading to denote to users where in the
  * page they're located.
  *
  * @this The <dragline-index> element.
  * @param targetElement {element} The target element.
  * @param event {event} The event.
  **************************************************************************/
  function activateBookmark(targetElement, event)
  {
    this.ActiveHeading = this.Headings.filter(function(target, index)
    {
      var hashIndex = targetElement.href.indexOf("#") + 1;
      return target.Heading.id == targetElement.href.substr(hashIndex);
    })[0];

    if (event)
    {
      event.preventDefault();
      scrollToHeading.call(this);
    }

    var activeLinks = this.shadowRoot.querySelectorAll("li[active]");
    var headingListItem = targetElement.parentElement;

    for (var activeIndex = 0; activeIndex < activeLinks.length; activeIndex++)
      activeLinks[activeIndex].removeAttribute("active");

    while (headingListItem.tagName !== "LI")
      headingListItem = targetHeading.parentElement;

    headingListItem.setAttribute("active", "");
  }

  /**************************************************************************
  * Builds a level-indented table of contents by all heading elements found
  * that have an id attribute.
  *
  * @this The <dragline-index> element.
  **************************************************************************/
  function buildIndex()
  {
    var headings = mapHeadings.call(this);
    if (!haveHeadingsChanged.call(this, headings))
      return;

    this.ScrollHeight = getScrollHeight.call(this);

    while (this.shadowRoot.firstChild != null)
      this.shadowRoot.firstChild.remove();

    var targetList = document.createElement("ol");
    this.shadowRoot.appendChild(targetList);
    var listLevel = parseInt(headings[0].Heading.tagName.substr(headings[0].Heading.tagName.length - 1));
    var listItem;

    headings.forEach(function(heading)
    {
      var tagName = heading.Heading.tagName;
      var headingLevel = parseInt(tagName.substr(tagName.length - 1));

      if (headingLevel > listLevel)
      {
        var newList = document.createElement("ol");
        listItem.appendChild(newList);
        targetList.appendChild(listItem);
        targetList = newList;
        listLevel++;
      }

      while (headingLevel < listLevel)
      {
        targetList = targetList.parentElement;

        while (targetList.tagName !== "OL")
          targetList = targetList.parentElement;

        listLevel--;
      }

      var headingLink = document.createElement("a");
      headingLink.innerText = heading.Heading.innerText;
      headingLink.href = "#" + heading.Heading.id;
      listItem = document.createElement("li");
      listItem.appendChild(headingLink);
      targetList.appendChild(listItem);
    });

    this.Headings = headings;
  }

  /**************************************************************************
  * Calculates the offset position of the specified heading.
  *
  * @this The <dragline-index> element.
  * @param heading {element} A heading element.
  * @returns The integer pixel offset.
  **************************************************************************/
  function calculateOffset(heading)
  {
    var offset = heading.offsetTop;
    var parent = heading.offsetParent;
    
    while (parent != document.body)
    {
      offset += parent.offsetTop;
      parent = parent.offsetParent;
    }

    return offset;
  }

  /**************************************************************************
  * Gets the scroll height of the scrollable element.
  *
  * @this The <dragline-index> element.
  * @returns The integer pixel scrollable height of the scrollable element.
  **************************************************************************/
  function getScrollHeight()
  {
    return this.Scroller.scrollHeight || Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  }

  /**************************************************************************
  * Determines if any document headings have changed.
  *
  * @this The <dragline-index> element.
  * @param headings {jQuery} An array of heading elements.
  * @returns True if any heading has changed, false otherwise.
  **************************************************************************/
  function haveHeadingsChanged(headings)
  {
    if (!this.Headings || this.Headings.length === 0)
      return true;

    var self = this;
    var deltaHeadings = headings.filter(function(item, index)
    {
      if (item.Offset !== self.Headings[index].Offset)
        return true;
      else if (item.Heading[0] !== self.Headings[index].Heading[0])
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
  * @this The <dragline-index> element.
  * @returns An object array containing the jQuery-wrapped heaidng elemnts
  * and their offsets.
  **************************************************************************/
  function mapHeadings()
  {
    var headings = [];
    for (var headIndex = 1; headIndex < 7; headIndex++)
      headings = headings.concat(Array.prototype.slice.call(this.Target.querySelectorAll("h" + headIndex + "[id]")));

    // Map the headings and their position in the page in an array
    var self = this;
    headings = headings.map(function(heading, index)
    {
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
  * Scrolls the page so the active heading is at the top of the page.
  *
  * @this The <dragline-index> element.
  **************************************************************************/
  function scrollToHeading()
  {
    var headingOffset = calculateOffset.call(this, this.ActiveHeading.Heading);

    if (this.Scroller == window)
      this.Scroller.scrollTo(0, headingOffset - parseInt(this.getAttribute("offset")));
    else
      this.Scroller.scrollTop = headingOffset - parseInt(this.getAttribute("offset"));
  }

  /**************************************************************************
  * Tracks the position of the page and the bookmark closest to the top of
  * the page, and marks it as active.
  *
  * @this The <dragline-index> element.
  * @returns A boolean value to continue or stop event propagation.
  **************************************************************************/
  function trackBookmarks()
  {
    var scrollTop, maxScroll;
    var scrollHeight = getScrollHeight.call(this);
    var offset = parseInt(this.getAttribute("offset"));

    if (this.Scroller == window)
    {
      scrollTop = document.body.scrollTop + offset;
      maxScroll = offset + scrollHeight - window.innerHeight;
    }
    else
    {
      scrollTop = this.Scroller.scrollTop + offset;
      maxScroll = offset + scrollHeight - this.Scroller.clientHeight;
    }

    if (this.ScrollHeight != scrollHeight)
      buildIndex.call(this);

    var activeHeading, activeLink;
    if (scrollTop >= maxScroll)
    {
      activeHeading = this.Headings[this.Headings.length - 1];
      activeLink = this.shadowRoot.querySelector("[href='#" + activeHeading.Heading.id + "']");
      return this.ActiveHeading != activeHeading && activateBookmark.call(this, activeLink);
    }
    else if (this.ActiveHeading && scrollTop <= this.Headings[0].Offset)
    {
      activeHeading = this.Headings[0];
      activeLink = this.shadowRoot.querySelector("[href='#" + activeHeading.Heading.id + "']");
      return this.ActiveHeading != activeHeading && activateBookmark.call(this, activeLink);
    }

    for (var headerIndex = this.Headings.length; headerIndex--;)
    {
      if (scrollTop >= this.Headings[headerIndex].Offset && (!this.Headings[headerIndex + 1] || scrollTop <= this.Headings[headerIndex + 1].Offset))
      {
        activeLink = this.shadowRoot.querySelector("[href='#" + this.Headings[headerIndex].Heading.id + "']");
        activateBookmark.call(this, activeLink);
        break;
      }
    }
  }

  /**************************************************************************
  * Wires event-handlers.
  *
  * @this The <dragline-index> element.
  **************************************************************************/
  function wireEvents()
  {
    var self = this;
    this.Scroller.addEventListener("scroll", function(event)
    {
      trackBookmarks.call(self, event);
    });

    this.addEventListener("click", function(event)
    {
      if (event.path[0].tagName === "A")
        activateBookmark.call(self, event.path[0], event);
    });
  }
})(window, document);
