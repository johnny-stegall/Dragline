(function()
{
  if (!window.AdapTable)
    throw "AdapTable core is not loaded.";

  /**************************************************************************
  * Adds icons for various actions that can be taken against the data/table.
  **************************************************************************/
  AdapTable.addActionButton = function(faIcon, tooltip, clickCallback)
  {
    var actionIcon = $("<i />")
      .addClass("fa")
      .addClass(faIcon)
      .attr("title", tooltip)
      .on("click.widgets.adaptable", clickCallback);

    this.Container.find("div.Actions").append(actionIcon);
  }

  /**************************************************************************
  * Moves the element at the end index to the start index, "bubbling" all
  * elements between those indexes back/forward one position in the array.
  *
  * @param array {array} The array.
  * @param startIndex {int} The start index.
  * @param endIndex {int} The end index.
  **************************************************************************/
  AdapTable.bubbleArrayElements = function(array, startIndex, endIndex)
  {
    if (startIndex < endIndex)
    {
      for (var index = startIndex; index < endIndex; index++)
        array[index] = array.splice(index + 1, 1, array[index])[0];
    }
    else if (startIndex > endIndex)
    {
      for (var index = startIndex; index > endIndex; index--)
        array[index] = array.splice(index - 1, 1, array[index])[0];
    }
  }

  /**************************************************************************
  * Finds a column by the specified property with the specified value.
  *
  * @param property {string} The name of the property.
  * @param value {variant} The value of the property to look for.
  * @returns The column object, or null if it wasn't found.
  **************************************************************************/
  AdapTable.findColumn = function(property, value)
  {
    var layout = this.Element.data("Layout");
    for (var columnIndex = 0; columnIndex < layout.Columns.length; columnIndex++)
    {
      if (layout.Columns[columnIndex][property] == value)
        return layout.Columns[columnIndex];
    }

    return null;
  }

  /**************************************************************************
  * Appends a copy of the specified element to the DIV element that acts as
  * the menu and displays the menu in the appropriate position relative to
  * the element that clicked it, or hides the menu.
  *
  * @param e {event} The event.
  * @param menuContent {jQuery} The element to clone and append to the menu.
  **************************************************************************/
  AdapTable.toggleMenu = function(e, menuContent)
  {
    if (!this.Menu.is(":visible") && !menuContent)
      return;

    e.stopPropagation();
    this.Menu
      .empty()
      .hide();

    var sourceElement = this.Menu.data("Source");
    if (sourceElement && sourceElement.tagName.toUpperCase() === "BUTTON")
      $(sourceElement).removeClass("Active");

    var clickedElement = $(e.target);
    if (!menuContent || sourceElement === clickedElement[0])
    {
      this.Menu.data("Source", null);
      return;
    }

    this.Menu
      .data("Source", clickedElement[0])
      .append(menuContent.clone(true))
      .children()
      .show();

    var position =
    {
      top: clickedElement.position().top + clickedElement.outerHeight(),
      left: clickedElement.position().left,
      right: "auto"
    };

    if (position.left + this.Menu.width() > this.Container.outerWidth())
    {
      position.left = "auto";
      position.right = 0;
    }

    if (clickedElement[0].tagName.toUpperCase() === "BUTTON")
      clickedElement.addClass("Active");

    this.Menu
      .css(position)
      .show();
  }
})();
