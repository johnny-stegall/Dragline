/******************************************************************************
* Carousel Custom Element
* Author: John Stegall
* Copyright: 2015 John Stegall
* License: MIT
*
* Supporting behaviors for the <dragline-carousel> custom element.
******************************************************************************/
;(function(window, document, undefined)
{
  "use strict";

  // Create the accordion based on HTMLElement
  var carouselPrototype = Object.create(HTMLElement.prototype);

  /****************************************************************************
  * Setup the carousel when it's first created.
  ****************************************************************************/
  carouselPrototype.createdCallback = function()
  {
    this.Timer = null;
    this.Seats = null;
  };

  /****************************************************************************
  * Make sure that when first attached, one and only one key is expanded.
  ****************************************************************************/
  carouselPrototype.attachedCallback = function()
  {
    this.Direction = this.getAttribute("direction") || "right";
    this.Interval = parseInt(this.getAttribute("interval") || 5000);
    this.PauseOnHover = this.getAttribute("pause-on-hover") || true;
    this.ShowIndicators = this.getAttribute("show-indicators") || true;
    this.ShowNextPrevious = this.getAttribute("show-next-previous") || false;
    this.Wrap = this.getAttribute("wrap") || true;
  };

  /****************************************************************************
  * Update the accordion after attributes are changed.
  *
  * @param attributeName {string} The attribute name.
  * @param newValue {string} The new value.
  * @param oldValue {string} The old value.
  ****************************************************************************/
  carouselPrototype.attributeChangedCallback = function(attributeName, newValue, oldValue)
  {
    // TODO: Anything to put here?
    //wireEvents.call(this);
  };

  /**************************************************************************
  * Gets the index of the specified seat; if no seat is supplied, returns
  * the index of the active seat.
  *
  * @param seat {jQuery} A carousel seat.
  * @returns The index of the specified seat or the active seat if no seat
  * is specified.
  **************************************************************************/
  carouselPrototype.getSeatIndex = function(seat)
  {
    return this.Seats.indexOf(seat || this.Element.find(".Seat.Active"));
  }

  /**************************************************************************
  * Pauses carousel rotation when the mouse is moved over the carousel.
  **************************************************************************/
  carouselPrototype.pauseRotation = function()
  {
    if (this.Timer)
    {
      window.clearInterval(this.Timer);
      this.Timer = null;
    }
  }

  /**************************************************************************
  * Resumes carousel rotation when the mouse is moved away from the
  * carousel.
  **************************************************************************/
  carouselPrototype.resumeRotation = function()
  {
    // TODO: Remove jQuery dependencies
    if (!this.Options.Interval || this.Options.Interval < 1)
      return;

    if (this.Timer)
      this.pauseRotation();

    var self = this;
    this.Timer = setInterval(function()
    {
      self.Direction = self.Options.Direction;
      self.rotate(self.Direction)
    }, this.Options.Interval);

    return;
  }

  /**************************************************************************
  * Rotates the seats of the carousel.
  *
  * @param nextSeat {variant} A string or number that represents the
  * direction of the next seat to move to.
  * @param callback {function} A function to call after the rotation
  * completes.
  **************************************************************************/
  carouselPrototype.rotate = function(nextSeat, callback)
  {
    // TODO: Remove jQuery dependencies
    var activeSeat = this.Element.find(".Seat.Active");

    if (!this.Options.Wrap && wouldWrap.call(this, activeSeat, nextSeat))
    {
      if (callback)
        callback();

      return;
    }

    this.pauseRotation();

    var seatIndex = getNextSeat.call(this, nextSeat, activeSeat);

    var targetSeat;
    if (seatIndex < 0)
      targetSeat = $(this.Seats[(seatIndex % this.Seats.length) + this.Seats.length]);
    else
      targetSeat = $(this.Seats[seatIndex % this.Seats.length]);

    this.IsSliding = true;
    positionNextSeat.call(this, activeSeat, targetSeat, callback);
  }

  var Carousel = document.registerElement("dragline-carousel", { prototype: carouselPrototype });

  /****************************************************************************
  * The Carousel constructor.
  *
  * @param element {jQuery} The element to turn into a carousel.
  * @param options {object} Settings to apply to the carousel.
  ****************************************************************************/
  var Carousel = function(element, options)
  {
    this.Direction = this.Options.Direction;
    this.IsSliding = false;

    if (!element.attr("id") || element.attr("id").length < 1)
      throw new Error("Carousels require the ID attribute.");

    buildSeats.call(this);

    var self = this;
    $(document).ready(function()
    {
      self.Element.css("height", self.Seats.first().height() + "px");
      self.Element.css("width", self.Seats.first().width() + "px");
    });

    if (this.Options.ShowIndicators)
      buildIndicators.call(this);

    if (this.Options.ShowNextPrevious)
      buildNextPrevious.call(this);

    if (this.Options.Interval && this.Options.Interval > 0)
      this.resumeRotation();

    wireEvents.call(this);
  }

  /**************************************************************************
  * Builds indicators that match the number of images in a carousel.
  *
  * @this A Carousel instance.
  **************************************************************************/
  function buildIndicators()
  {
    // TODO: Remove jQuery dependencies
    var indicatorList = $("<ol />");
    this.Seats.each(function()
    {
      indicatorList.append($("<li />"));
    });

    indicatorList.children("li:first").addClass("Active");

    var self = this;
    this.Element
      .append(indicatorList)
      .on("click.widgets.carousel.indicator", "li", function()
      {
        self.rotate.call(self, $(this).index());
      });
  }

  /**************************************************************************
  * Builds next/previous indicators at the right/left edges of a carousel.
  *
  * @this A Carousel instance.
  **************************************************************************/
  function buildNextPrevious()
  {
    // TODO: Remove jQuery dependencies
    var leftLink = $("<a />")
      .addClass("Left")
      .attr("href", "javascript:void(0);" + this.Element.attr("id"))
      .append("<i class=\"fa fa-chevron-left\" />")
      .on("click.widgets.carousel", { nextSeat: "Left" }, $.proxy(nextOrPrevious, this));

    var rightLink = $("<a />")
      .addClass("Right")
      .attr("href", "javascript:void(0);" + this.Element.attr("id"))
      .append("<i class=\"fa fa-chevron-right\" />")
      .on("click.widgets.carousel", { nextSeat: "Right" }, $.proxy(nextOrPrevious, this));

    this.Element
      .append(leftLink)
      .append(rightLink);
  }

  /**************************************************************************
  * Builds the necessary HTML structure to make a carousel.
  *
  * @this A Carousel instance.
  **************************************************************************/
  function buildSeats()
  {
    // TODO: Remove jQuery dependencies
    this.Element.addClass("Carousel");

    this.Element
      .children()
      .addClass("Seat " + this.Options.Direction);

    this.Seats = this.Element.children(".Seat");
    this.Seats.first().addClass("Active");
  }

  /**************************************************************************
  * Verifies a seat argument is valid.
  *
  * @this A Carousel instance.
  * @param nextSeat {variant} A string or number that represents the
  * direction of the next seat to move to.
  * @param activeSeat {jQuery} The active carousel seat.
  * @returns The index of the next carousel seat.
  **************************************************************************/
  function getNextSeat(nextSeat, activeSeat)
  {
    // TODO: Remove jQuery dependencies
    if (!nextSeat)
      throw new Error("The next seat is required.");
    else if (!activeSeat)
      throw new Error("The active seat is required.");

    if (typeof (nextSeat) === "string")
    {
      switch (nextSeat.toLowerCase())
      {
        case "+1":
        case "next":
          return (this.Options.Direction === "Right") ? activeSeat.index() + 1 : activeSeat.index() - 1;
        case "-1":
        case "back":
        case "prev":
        case "previous":
          return (this.Options.Direction === "Right") ? activeSeat.index() - 1 : activeSeat.index() + 1;
        case "right":
          this.Direction = "Right";
          return activeSeat.index() + 1;
        case "left":
          this.Direction = "Left";
          return activeSeat.index() - 1;
        default:
          throw new Error("Invalid argument for nextSeat: " + nextSeat + ".");
      }
    }
    else if (typeof (nextSeat) === "number")
    {
      if (nextSeat > activeSeat.index())
        this.Direction = "Right";
      else
        this.Direction = "Left";

      return nextSeat;
    }
    else
      throw new Error("Invalid argument for nextSeat: " + nextSeat + ".");
  }

  /**************************************************************************
  * Moves the carousel left or right when the next/previous links are
  * clicked.
  *
  * @this A Carousel instance.
  * @param event {event} The event.
  **************************************************************************/
  function nextOrPrevious(e)
  {
    // TODO: Remove jQuery dependencies
    if (e.data.nextSeat.toLowerCase() === "right")
      this.rotate("Right");
    else if (e.data.nextSeat.toLowerCase() === "left")
      this.rotate("Left");
  }

  /**************************************************************************
  * Positions the next slide.
  *
  * @this A Carousel instance.
  * @param activeSeat {jQuery} The active carousel seat.
  * @param targetSeat {jQuery} The target carousel seat.
  * @param callback {function} A function to call after the rotation
  * completes.
  **************************************************************************/
  function positionNextSeat(activeSeat, targetSeat, callback)
  {
    // TODO: Remove jQuery dependencies
    if (this.Direction === "Right")
    {
      targetSeat
        .css("visibility", "hidden")
        .removeClass("Left")
        .addClass("Right");
    }
    else
    {
      targetSeat
        .css("visibility", "hidden")
        .removeClass("Right")
        .addClass("Left");
    }

    // Wait for the transition to finish before moving the carousel seats
    var self = this;
    setTimeout(function()
    {
      slideSeats.call(self, activeSeat, targetSeat, callback);
    }, parseFloat(targetSeat.css("transition-duration")) * 1000);
  }

  /**************************************************************************
  * Slides the seats into their new positions.
  *
  * @this A Carousel instance.
  * @param activeSeat {jQuery} The active carousel seat.
  * @param targetSeat {jQuery} The target carousel seat.
  * @param callback {function} A function to call after the rotation
  * completes.
  **************************************************************************/
  function slideSeats(activeSeat, targetSeat, callback)
  {
    // TODO: Remove jQuery dependencies
    if (this.Direction === "Right")
    {
      activeSeat
        .addClass("Left")
        .removeClass("Right Active");

      targetSeat
        .css("visibility", "")
        .addClass("Active");
    }
    else
    {
      activeSeat
        .addClass("Right")
        .removeClass("Left Active");

      targetSeat
        .css("visibility", "")
        .addClass("Active");
    }

    var self = this;
    if (this.Options.ShowIndicators)
    {
      var indicators = self.Element.find("ol > li");
      var activeIndicator = self.Element.find("li.Active");
      var targetIndicator = $(indicators[targetSeat.index()]);

      activeIndicator.removeClass("Active");
      targetIndicator.addClass("Active");
    }

    this.IsSliding = false;
    this.resumeRotation();

    if (callback !== undefined)
      callback();
  }

  /**************************************************************************
  * Wires event-handlers.
  *
  * @this A Carousel instance.
  **************************************************************************/
  function wireEvents()
  {
    // TODO: Remove jQuery dependencies
    if (this.Options.PauseOnHover)
    {
      this.Element
        .on("mouseenter.widgets.carousel", $.proxy(this.pauseRotation, this))
        .on("mouseleave.widgets.carousel", $.proxy(this.resumeRotation, this));
    }
  }

  /**************************************************************************
  * Returns true if the specified next seat would cause the carousel to wrap
  * false otherwise.
  *
  * @this A Carousel instance.
  * @param activeSeat {jQuery} The active carousel seat.
  * @param nextSeat {variant} A string or number that represents the
  * direction of the next seat to move to.
  **************************************************************************/
  function wouldWrap(activeSeat, nextSeat)
  {
    // TODO: Remove jQuery dependencies
    if (this.Direction === "Right")
    {
      if (activeSeat.index() === 0)
      {
        switch (nextSeat)
        {
          case "-1":
          case "back":
          case "prev":
          case "previous":
          case "left":
            return true;
        }
      }
      else if (activeSeat.index() === this.Seats.length - 1)
      {
        switch (nextSeat)
        {
          case "+1":
          case "next":
          case "right":
            return true;
        }
      }
    }
    else
    {
      if (activeSeat.index() === 0)
      {
        switch (nextSeat)
        {
          case "+1":
          case "next":
          case "right":
            return true;
        }
      }
      else if (activeSeat.index() === this.Seats.length - 1)
      {
        switch (nextSeat)
        {
          case "-1":
          case "back":
          case "prev":
          case "previous":
          case "left":
            return true;
        }
      }
    }

    return false;
  }
})(window, document);
