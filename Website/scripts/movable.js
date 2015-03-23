/******************************************************************************
* jQuery Movable Plugin
* Author: John Stegall
* Copyright: 2010 John Stegall
* License: MIT
*
* This plugin allows DIV OR LI elements to be drag-and-dropped and if they're
* in a  specific order, they are sortable. It uses the native HTML 5
* drag-and-drop API. It emulates the jQuery UI Sortable plugin and mimics its
* API.
******************************************************************************/
"use strict";

(function($)
{
  var _draggedItem = null;
  var _dragHeight = 0;
  var _placeholders = $();
  var _usingHandles = false;

  /****************************************************************************
  * The Movable object.
  *
  * @param element {jQuery} The element to make movable.
  * @param options {object} Settings to apply to the movable.
  ****************************************************************************/
  var Movable = function(element, options)
  {
    this.Element = element;
    this.Options = options;
    this.Items = this.Element.children(this.Options.Items);

    if (/^UL|OL$/i.test(this.Element.prop("tagName").toUpperCase()))
      this.Placeholder = $("<li class=\"Movable-Placeholder\" />");
    else
      this.Placeholder = $("<div class=\"Movable-Placeholder\" />");

    if (this.Options.Placeholder)
      this.Placeholder.addClass(this.Options.Placeholder);

    _placeholders = _placeholders.add(this.Placeholder);

    this.Items
      .attr("role", "option")
      .attr("aria-grabbed", false)
      .attr("draggable", "true");

    this.wireEvents();
  }

  Movable.prototype =
  {
    /**************************************************************************
    * Tells the drag-and-drop system that handles are being used.
    *
    * @param e {event} The event.
    **************************************************************************/
    toggleHandle: function(e)
    {
      if (e.type === "mousedown")
        _usingHandles = true;
      else
        _usingHandles = false;
    },

    /**************************************************************************
    * Wires event-handlers.
    **************************************************************************/
    wireEvents: function()
    {
      if (this.Options.Handle)
      {
        this.Items.find(this.Options.Handle)
          .on("mousedown.widgets.movable", $.proxy(this.toggleHandle, this))
          .on("mouseup.widgets.movable", $.proxy(this.toggleHandle, this));
      }

      this.Items
        .on("dragstart.widgets.movable", this.Options, initializeMovable)
        .on("dragend.widgets.movable", this.Options, updateMovable)
        .end()
        .add([this, this.Placeholder])
        .on("dragenter.widgets.movable", { ConnectWith: $.makeArray($(this.Options.ConnectWith)), Items: this.Items, Placeholder: this.Placeholder }, validateDropTarget)
        .on("dragover.widgets.movable", { ConnectWith: $.makeArray($(this.Options.ConnectWith)), Items: this.Items }, observeMovable)
        .on("drop.widgets.movable", dropMovable);
    }
  };

  /****************************************************************************
  * Drops a movable element into the user's desired position.
  *
  * @param e {event} The event.
  * @returns False to stop event propagation.
  ****************************************************************************/
  function dropMovable(e)
  {
    _placeholders.filter(":visible").after(_draggedItem.Element);
    _draggedItem.Element.trigger("dragend.widgets.movable");

    e.stopPropagation();
    return false;
  }

  /****************************************************************************
  * Initiates movability of an element.
  *
  * @param e {event} The event.
  ****************************************************************************/
  function initializeMovable(e)
  {
    if (e.data.Handle && !_usingHandles)
      return false;
    else
      _usingHandles = false;

    var draggedElement = $(e.target)
      .addClass("Movable-Dragging")
      .attr("aria-grabbed", "true");

    var dataTransfer = e.originalEvent.dataTransfer;
    dataTransfer.effectAllowed = "move";
    dataTransfer.setData("text", "");

    var dragImage = e.data.DragImage || e.target;
    var dragX = e.data.CursorAt[0] || 0;
    var dragY = e.data.CursorAt[1] || 0;
    dataTransfer.setDragImage(dragImage, dragX, dragY);

    _dragHeight = draggedElement.outerHeight();
    _draggedItem =
    {
      Element: draggedElement,
      OldParent: draggedElement.parent(),
      StartIndex: draggedElement.index()
    };
  }

  /****************************************************************************
  * Determines if the element the mouse is over is a valid drop target.
  *
  * @param e {event} The event.
  ****************************************************************************/
  function observeMovable(e)
  {
    if (!e.data.Items.is(_draggedItem.Element) && e.data.ConnectWith.indexOf(_draggedItem.Element.parent()[0]) < 0)
      return;

    e.preventDefault();
  }

  /****************************************************************************
  * Updates the DOM based on where the movable element was dropped.
  *
  * @param e {event} The event.
  ****************************************************************************/
  function updateMovable(e)
  {
    if (!_draggedItem)
      return;

    _draggedItem.Element
      .removeClass("Movable-Dragging")
      .attr("aria-grabbed", "false")
      .show();

    _placeholders.detach();

    var draggedElement = $(e.target);

    _draggedItem.EndIndex = draggedElement.index();
    _draggedItem.NewParent = draggedElement.parent();

    if (e.data.Change)
    {
      if (_draggedItem.StartIndex !== _draggedItem.EndIndex || _draggedItem.NewParent.get(0) !== _draggedItem.OldParent.get(0))
        e.data.Change(_draggedItem);
    }

    _draggedItem = null;
  }

  /****************************************************************************
  * Moves the placeholder based on where the cursor and dragged element are.
  *
  * @param e {event} The event.
  * @returns False to stop event propagation.
  ****************************************************************************/
  function validateDropTarget(e)
  {
    if (!e.data.Items.is(_draggedItem.Element) && e.data.ConnectWith.indexOf(_draggedItem.Element.parent()[0]) < 0)
      return;

    e.preventDefault();
    e.originalEvent.dataTransfer.dropEffect = "move";

    var draggedElement = $(e.target);
    if (e.data.Items.is(draggedElement))
    {
      var thisHeight = draggedElement.outerHeight();

      // If the height of the dragged element is too large, create a dead zone
      // to prevent flickering
      if (thisHeight > _dragHeight)
      {
        var deadZone = thisHeight - _dragHeight;
        var offsetTop = draggedElement.offset().top;

        if (e.data.Placeholder.index() < draggedElement.index() && e.originalEvent.pageY < offsetTop + deadZone)
          return false;
        else if (e.data.Placeholder.index() > draggedElement.index() && e.originalEvent.pageY > offsetTop + thisHeight - deadZone)
          return false;
      }

      _draggedItem.Element.hide();
      draggedElement[(e.data.Placeholder.index() < draggedElement.index()) ? "after" : "before"](e.data.Placeholder);
      _placeholders.not(e.data.Placeholder).detach();
    }
    else if (!_placeholders.is(draggedElement) && !draggedElement.children(e.data.Items).length)
      _placeholders.detach();

    return false;
  }

  /****************************************************************************
  * The Movable plugin.
  ****************************************************************************/
  $.fn.Movable = function(options)
  {
    var settings = $.extend(
    {
      Change: null,
      ConnectWith: null,
      CursorAt: null,
      DragImage: null,
      Handle: null,
      Items: "*",
      Placeholder: null
    }, options);

    // This proves bondage is a good thing
    return this.each(function()
    {
      new Movable($(this), settings);
    });
  };
})(jQuery);