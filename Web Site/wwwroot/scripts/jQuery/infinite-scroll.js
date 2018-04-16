/******************************************************************************
* jQuery Infinite Scrolling Plugin
* Author: John Stegall
* Copyright: 2013 John Stegall
* License: MIT
*
* This plugin sets up an element to be infinitely scrollable using intelligent
* infinite scrolling techniques to reduce resource consumption.
******************************************************************************/
;(function($, window, document, undefined)
{
  "use strict";

  var STORAGE_PREFIX = "Infinite Scroll: ";
  var _defaults =
  {
    ChildHeight: 0,
    DataCallback: null,
    PageSize: 25,
    PagingCallback: null,
    Threshold: 0.67,
    UseWindow: true
  };

  /****************************************************************************
  * The InfiniteScroll constructor.
  *
  * @param element {jQuery} The element to turn into a carousel.
  * @param options {object} Settings to apply to the carousel.
  ****************************************************************************/
  var InfiniteScroll = function(element, options)
  {
    this.Direction = "Down";
    this.Element = element;
    this.HeaderHeight = element.outerHeight();
    this.ItemHeight = null;
    this.NoMoreData = false;
    this.Options = $.extend({}, _defaults, options);
    this.PageIndex = 0;
    this.PreviousDirection = "Down";
    this.Rows = 0;

    if (!this.Options.DataCallback || typeof (this.Options.DataCallback) !== "function")
      throw new Error("No data callback function specified or the data callback isn't a function.");
    else if (!this.Options.PagingCallback || typeof (this.Options.PagingCallback) !== "function")
      throw new Error("No paging callback function specified or the paging callback isn't a function.");

    setupDom.call(this);

    // Load any cached data
    loadData.call(this);

    if (!this.Thresholds)
      calculateScrollThresholds.call(this);

    var self = this;
    this.Viewport.on("scroll.widgets.infinite-scroll", function(e)
    {
      handleScroll.call(self, e);
    });
  }

  InfiniteScroll.prototype =
  {
    /****************************************************************************
    * Caches the data.
    *
    * @param data {array} The array of data retrieved from the server.
    ****************************************************************************/
    cacheData: function(data)
    {
      if (!data || !data.length)
        this.NoMoreData = true;
      else
      {
        var cachedData = JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + document.location)) || { Instances: [] };
        var instanceCache = cachedData.Instances[this.Index];
        if (!instanceCache)
        {
          instanceCache = { Data: [] };
          cachedData.Instances[this.Index] = instanceCache;
        }

        if (instanceCache.Data.indexOf(data) > -1)
          this.NoMoreData = true;
        else
        {
          instanceCache.Data = instanceCache.Data.concat(data);
          sessionStorage.setItem(STORAGE_PREFIX + document.location, JSON.stringify(cachedData));
        }

        this.Rows = instanceCache.Data.length;
      }
    },

    /****************************************************************************
    * Frees resources used by the plugin and unbinds event-handlers.
    ****************************************************************************/
    destroy: function()
    {
      this.BottomSpacer.remove();
      this.TopSpacer.remove();
      this.Viewport.off(".widgets.infinite-scroll");
      this.Element.unwrap(this.Container);
    }
  };

  /**************************************************************************
  * Builds spacer elements above and below the target element to keep the
  * scrollbar accurate.
  *
  * @this An InfiniteScroll instance.
  **************************************************************************/
  function buildSpacers()
  {
    this.BottomSpacer = $("<div />")
      .addClass("Bottom-Spacer");

    this.TopSpacer = $("<div />")
      .addClass("Top-Spacer");

    this.Container
      .prepend(this.TopSpacer)
      .append(this.BottomSpacer);
  }

  /**************************************************************************
  * Calculates the height of items in the scrollable element. This is done
  * by adding an invisible child, performing the calculation, and removing
  * the invisible child.
  *
  * @this An InfiniteScroll instance.
  **************************************************************************/
  function calculateItemHeight()
  {
    if (this.Options.ChildHeight)
      return this.Options.ChildHeight;

    var childHeight;

    if (this.Element.find("tbody").length)
    {
      this.Element.find("tbody").append("<tr style=\"visibility: hidden\"><td>You're not supposed to see this :p</td></tr>");
      childHeight = this.Element.find("tbody > tr:last").outerHeight();
      this.Element.find("tbody > tr:last").remove();
    }
    else if (this.Element.prop("tagName") == "OL" || this.Element.prop("tagName") == "UL")
    {
      this.Element.append("<li style=\"visibility: hidden\">You're not supposed to see this :p</li>");
      childHeight = this.Element.children(":last").outerHeight();
      this.Element.children(":last").remove();
    }

    return childHeight;
  }

  /**************************************************************************
  * Calculates the positions of the scrollbar for the next time data needs
  * to be loaded.
  *
  * @this An InfiniteScroll instance.
  **************************************************************************/
  function calculateScrollThresholds()
  {
    var pageHeight = this.Options.PageSize * this.ItemHeight;
    var totalPages = this.Rows / this.Options.PageSize;
    var pageThreshold = (pageHeight - this.Viewport.height()) * this.Options.Threshold;

    this.TopSpacer.height(pageHeight * Math.max(this.PageIndex - 1, 0));
    this.BottomSpacer.height(pageHeight * Math.max((totalPages - 1) - (this.PageIndex + 1), 0));

    // TODO: Scroll thresholds still wrong?
    //$(window).scrollTop() > parseInt(($(document).height() - $(window).height()) * .67)
    //this.Viewport.scrollTop() > parseInt((this.Container.height() - this.Viewport.height()) * this.Options.Threshold)
    if (this.PageIndex >= totalPages - 1)
    {
      this.Thresholds =
      {
        Down: parseInt((this.PageIndex * pageHeight) + pageThreshold),
        Up: parseInt(((this.PageIndex - 1) * pageHeight) - pageThreshold)
      };
    }
    else
    {
      this.Thresholds =
      {
        Down: parseInt(((this.PageIndex + 1) * pageHeight) + pageThreshold),
        Up: parseInt((this.PageIndex * pageHeight) - pageThreshold)
      };
    }
  }

  /**************************************************************************
  * Handles the scroll event when the user scrolls inside the container.
  *
  * @this An InfiniteScroll instance instance.
  * @param e {event} The event.
  **************************************************************************/
  function handleScroll(e)
  {
    // Stop listening to the voices or risk insanity
    this.Viewport.off("scroll.widgets.infinite-scroll");

    // Calculate what page the user is on based on their scroll position
    // TODO: PageIndex calculation is off
    var pageHeight = this.Options.PageSize * this.ItemHeight;
    var pageOffset = (this.Viewport[0] === window) ? this.Container.offset().top : 0;
    this.PageIndex = parseInt((this.Viewport.scrollTop() - this.HeaderHeight - pageOffset) / pageHeight);

    if (this.Viewport.scrollTop() >= this.Thresholds.Down)
    {
      this.Direction = "Down";
      var totalPages = this.Rows / this.Options.PageSize;

      if (this.PageIndex === (totalPages - 1) && !this.NoMoreData)
        this.Options.DataCallback(this.PageIndex + 1, this.Options.PageSize);

      loadData.call(this);
    }
    else if (this.Viewport.scrollTop() <= this.Thresholds.Up)
    {
      this.Direction = "Up";
      loadData.call(this);
    }

    this.PreviousDirection = this.Direction;

    // It's okay to listen again
    var self = this;
    this.Viewport.on("scroll.widgets.infinite-scroll", function(e)
    {
      handleScroll.call(self, e);
    });
  }

  /**************************************************************************
  * Calculates what data to load for the previous, current, and next pages.
  *
  * @this An InfiniteScroll instance.
  **************************************************************************/
  function loadData()
  {
    var cachedData = JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + document.location));
    if (cachedData)
    {
      var instanceCache = cachedData.Instances[this.Index];
      if (instanceCache && instanceCache.Data.length)
      {
        this.Rows = instanceCache.Data.length;
        var totalPages = this.Rows / this.Options.PageSize;
        var previousPage = Math.max(this.PageIndex - 1, 0) * this.Options.PageSize;
        var nextPage = (Math.max(this.PageIndex + 1, totalPages) * this.Options.PageSize);
        this.Options.PagingCallback(instanceCache.Data.slice(previousPage, nextPage));
      }

      calculateScrollThresholds.call(this);
    }
  }

  /**************************************************************************
  * Sets up the HTML DOM as needed for the plugin.
  *
  * @this An InfiniteScroll instance instance.
  **************************************************************************/
  function setupDom()
  {
    this.Element.wrap("<div class=\"Infinite-Scroll\" />");
    this.Container = this.Element.parent();
    this.ItemHeight = this.ItemHeight || calculateItemHeight.call(this);

    buildSpacers.call(this);

    if (this.Options.UseWindow)
      this.Viewport = $(window);
    else
      this.Viewport = this.Container;

    this.Index = $("div.Infinite-Scroll").index(this.Container);
  }

  /****************************************************************************
  * The InfiniteScroll plugin.
  ****************************************************************************/
  $.fn.InfiniteScroll = function(options)
  {
    var args = arguments;

    if (options === undefined || typeof (options) === "object")
    {
      // This proves bondage is a good thing
      return this.each(function()
      {
        // Allow the plugin to only be instantiated once
        if ($.data(this, "Infinite Scroll") === undefined)
          $.data(this, "Infinite Scroll", new InfiniteScroll($(this), options));
      });
    }
    else if (typeof (options) === "string")
    {
      // Cache the method call to make it possible to return a value
      var result;

      this.each(function()
      {
        var instance = $.data(this, "Infinite Scroll");

        // Call the method with any parameters also passed
        if (instance instanceof (InfiniteScroll) && typeof (instance[options]) === "function")
          result = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
      });

      // Return the method's return value; otherwise maintain chainability
      return result !== undefined ? result : this;
    }
  };
})(jQuery, window, document);
