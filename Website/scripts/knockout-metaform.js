/******************************************************************************
* Knockout Metaform Binding
* Author: John Stegall
* Copyright: 2010-2015 John Stegall
* License: MIT
*
* This binding creates standardized form fields (INPUT, SELECT, and TEXTAREA)
* inside a FORM element based on metadata.
******************************************************************************/

;(function(window, document, undefined)
{
  "use strict";

  var ONE_YEAR_EXPIRATION = 8760;
  var STORAGE_PREFIX = "Metaform: ";
  var _alphaNumeric = /[^A-Za-z0-9]+/;
  var _dragStartIndex = -1;
  var _dragEndIndex = -1;
  var _options;

  /******************************************************************************
  * Builds INPUT, SELECT, and TEXTAREA elements within a FORM based on metadata.
  ******************************************************************************/
  ko.bindingHandlers.metaform =
  {
    /****************************************************************************
    * Called once for each DOM element the binding is used on. Set initial state
    * for the DOM element and register event-handlers here.
    ****************************************************************************/
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
    {
      if (!window.jQuery)
        throw "jQuery is required.";
      else if (!jQuery.ui.sortable)
        throw "The jQuery UI Sortable component is required.";
      else if (!ko.mapping)
        throw "The Knockout Mapping plugin is required.";

      var metaformParameters = valueAccessor();
      _options = metaformParameters.Options;

      if (!element.jquery)
        element = $(element);

      element.addClass("Metaform");
    },

    /****************************************************************************
    * This will be called once when the binding is first applied to an element,
    * and again whenever any observables/computeds that are accessed change.
    * Update the DOM element based on the supplied values here.
    ****************************************************************************/
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext)
    {
      var metaformParameters = valueAccessor();

      if (!metaformParameters.Model && (_options && typeof (_options.CacheExpiration) !== "undefined"))
        metaformParameters.Model = ko.mapping.fromJS(loadCachedLayout());

      if (!metaformParameters.Model || typeof (metaformParameters.Model) !== "object")
        return;

      cacheLayout(metaformParameters.Model);

      if (!element.jquery)
        element = $(element);

      updateForm.call(metaformParameters.Model, element);
      toggleEditMode.call(metaformParameters.Model, element);
      toggleEmptyFields.call(metaformParameters.Model, element);
    }
  };

  /****************************************************************************
  * Applies attributes to an element.
  *
  * @param element {jQuery} The element.
  * @param attributes {object} An object (or associatve array) of attributes.
  ****************************************************************************/
  function applyAttributes(element, attributes)
  {
    if (!element.length)
      return;

    for (var attribute in attributes)
      element.attr(attribute, attributes[attribute]());
  }

  /****************************************************************************
  * Applies CSS styling to an element.
  *
  * @param element {jQuery} The element.
  * @param styles {object} An object (or associative array) of CSS styles.
  ****************************************************************************/
  function applyStyling(element, styles)
  {
    if (!element.length)
      return;

    for (var style in styles)
      element.css(style, styles[style]());
  }

  /**************************************************************************
  * Moves the element at the end index to the start index, "bubbling" all
  * elements between those indexes back/forward one position in the array.
  *
  * @param array {array} The array.
  * @param startIndex {int} The start index.
  * @param endIndex {int} The end index.
  **************************************************************************/
  function bubbleArrayElements(array, startIndex, endIndex)
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
  * Caches the layout in localStorage.
  *
  * @param metaform {object} The metaform view model.
  **************************************************************************/
  function cacheLayout(metaform)
  {
    if (!metaform || !_options || _options.CacheExpiration < 0)
      return;
    else if (_options.CacheExpiration == 0)
      _options.CacheExpiration = ONE_YEAR_EXPIRATION;

    var cachedData =
    {
      Layout: ko.mapping.toJS(metaform),
      Expiration: (+new Date()) + ((_options.CacheExpiration || 24) * 1000 * 60 * 60)
    };

    cachedData = JSON.stringify(cachedData);
    localStorage.setItem(STORAGE_PREFIX + document.location, cachedData);
  }

  /****************************************************************************
  * Creates a form field.
  *
  * @param fieldset {jQuery} A FIELDSET element.
  * @param fieldList {jQuery} The OL element in the FIELDSET that fields get
  * attached to.
  * @param metadata {object} The FIELDSET metadata.
  * @returns The new jQuery-wrapped form field element.
  ****************************************************************************/
  function createField(fieldset, fieldList, metadata)
  {
    var newField;
    if (metadata.Type().toLowerCase() === "select")
      newField = $("<select />");
    else if (metadata.Type().toLowerCase() === "textarea")
      newField = $("<textarea />");
    else
      newField = $("<input />").attr("type", metadata.Type().toLowerCase());

    newField
      .addClass("Editable")
      .attr("id", fieldList.attr("id").substring(2) + "-" + metadata.Label().replace(_alphaNumeric, ""));

    if (metadata.Data)
      metadata.Data.call(newField, metadata);

    if (metadata.Styling)
      applyStyling(newField, metadata.Styling);

    if (metadata.Attributes)
      applyAttributes(newField, metadata.Attributes);

    return newField;
  }

  /****************************************************************************
  * Creates the LI element that wraps an individual form element. The LABEL
  * for the form field and the drag anchor are also created.
  *
  * @this {object} The field metadata.
  * @param fieldList {jQuery} An OL element.
  * @param metadata {object} The FIELDSET metadata.
  * @returns The jQuery-wrapped LI element.
  ****************************************************************************/
  function createFieldContainer(fieldList, metadata)
  {
    var deleteIcon = $("<i />")
      .addClass("fa fa-close")
      .on("click.widgets.metaform", $.proxy(deleteField, metadata, this));

    var fieldContainer = $("<li />")
      .addClass("Form-Group")
      .data("Metaform Field", this)
      .append("<i class=\"fa fa-ellipsis-v Anchor\" />")
      .append(deleteIcon);

    if (this.Label)
      fieldContainer.append("<label>" + this.Label() + "</label>");

    if (this.ContainerStyling)
      applyStyling(fieldContainer, this.ContainerStyling);

    fieldList.append(fieldContainer);

    return fieldContainer;
  }

  /****************************************************************************
  * Creates a FIELDSET element using metadata.
  *
  * @this {object} The FIELDSET metadata.
  * @param formElement {jQuery} The FORM element.
  * @param metaform {object} The metaform view model.
  * @returns The new jQuery-wrapped FIELDSET element.
  ****************************************************************************/
  function createFieldset(formElement, metaform)
  {
    if (!formElement)
      throw "No FORM element found.";
    else if (!this)
      throw "No metadata found.";
    else if (!this.Title())
      throw "The title for the FIELDSET is required.";

    var fieldList = $("<ol />")
      .attr("id", "ol" + this.Title().replace(_alphaNumeric, ""))
      .addClass("Forms");

    var toggleIcon = $("<i />")
      .addClass("fa fa-chevron-up")
      .on("click.widgets.metaform", toggleFieldset);

    var deleteIcon = $("<i />")
      .addClass("fa fa-close")
      .on("click.widgets.metaform", $.proxy(deleteFieldset, metaform, this));

    var fieldset = $("<fieldset />")
      .append("<header>" + this.Title() + "</header>")
      .append("<i class=\"fa fa-ellipsis-v Anchor\" />")
      .append(toggleIcon)
      .append(deleteIcon)
      .append(fieldList);

    if (this.Styling)
      applyStyling(fieldset, this.Styling);

    for (var fieldIndex = 0; fieldIndex < this.Fields().length; fieldIndex++)
    {
      var fieldContainer = createFieldContainer.call(this.Fields()[fieldIndex], fieldList, this);
      var newField = createField(fieldset, fieldList, this.Fields()[fieldIndex]);

      fieldContainer
        .append(newField)
        .children("label")
        .attr("for", newField.attr("id"));
    }

    return fieldset;
  }

  /****************************************************************************
  * Deletes a Field (inside a Fieldset) from the Metaform view model.
  *
  * @this {object} The FIELDSET metadata.
  * @param metadata {object} The field metadata.
  * @param e {event} The event.
  ****************************************************************************/
  function deleteField(metadata, e)
  {
    var fieldIndex = this.Fields.indexOf(metadata);

    if (fieldIndex > -1)
    {
      this.Fields.splice(fieldIndex, 1);
      removeFields($(e.target).parents("fieldset"), this);
    }
  }

  /****************************************************************************
  * Deletes a Fieldset from the Metaform view model.
  *
  * @this {object} The metaform view model.
  * @param metadata {object} The FIELDSET metadata.
  * @param e {event} The event.
  ****************************************************************************/
  function deleteFieldset(metadata, e)
  {
    var fieldsetIndex = this.Fieldsets.indexOf(metadata);

    if (fieldsetIndex > -1)
    {
      this.Fieldsets.splice(fieldsetIndex, 1);
      removeFieldsets($(e.target).parents("form.Metaform"), this);
    }
  }

  /****************************************************************************
  * Checks localStorage for the layout, and if found and not expired, loads
  * the cached layout.
  ****************************************************************************/
  function loadCachedLayout()
  {
    var cachedData = JSON.parse(localStorage.getItem(STORAGE_PREFIX + document.location)) || {};
    if (cachedData.Expiration >= (+new Date()))
      return cachedData.Layout;
    else
      return null;
  }

  /****************************************************************************
  * Updates the metadata to reflect that a user moved a field.
  *
  * @this {object} The metaform view model.
  * @param e {event} The event.
  * @param ui {object} See the jQuery UI Sortable documentation for details.
  ****************************************************************************/
  function moveField(e, ui)
  {
    _dragEndIndex = ui.item.index();

    if (_dragStartIndex < 0 || _dragEndIndex < 0)
      return;

    var metaform = ui.item.parents("form.Metaform");

    if (ui.sender)
    {
      var oldParentIndex = ui.sender.parents("form.Metaform").children("fieldset").index(ui.sender.parents("fieldset"));
      var newParentIndex = ui.item.parents("form.Metaform").children("fieldset").index(ui.item.parents("fieldset"));
      var item = this.Fieldsets()[oldParentIndex].Fields().splice(_dragStartIndex, 1)[0];

      this.Fieldsets()[newParentIndex].Fields().splice(_dragEndIndex, 0, item);
    }
    else
    {
      var parentIndex = ui.item.parents("form.Metaform").children("fieldset").index(ui.item.parents("fieldset"));
      bubbleArrayElements(this.Fieldsets()[parentIndex].Fields(), _dragStartIndex, _dragEndIndex);
    }

    _dragStartIndex = -1;
    _dragEndIndex = -1;
  }

  /****************************************************************************
  * Updates the metadata to reflect that a user moved a FIELDSET.
  *
  * @this {object} The metaform view model.
  * @param e {event} The event.
  * @param ui {object} See the jQuery UI Sortable documentation for details.
  ****************************************************************************/
  function moveFieldset(e, ui)
  {
    _dragEndIndex = ui.item.parent().children("fieldset").index(ui.item);

    bubbleArrayElements(this.Fieldsets(), _dragStartIndex, _dragEndIndex);

    _dragStartIndex = -1;
    _dragEndIndex = -1;
  }

  /****************************************************************************
  * Removes any form field elements that no longer have metadata
  * representation.
  *
  * @param fieldset {jQuery} The FIELDSET element.
  * @param metadata {object} The FIELDSET metadata.
  ****************************************************************************/
  function removeFields(fieldset, metadata)
  {
    fieldset
      .find("li.Form-Group")
      .filter(function(index, listItem)
      {
        for (var fieldIndex = 0; fieldIndex < metadata.Fields().length; fieldIndex++)
        {
          var fieldId = $(listItem).parent().attr("id").substr(2) + "-" + metadata.Fields()[fieldIndex].Label().replace(_alphaNumeric, "");

          if ($(listItem).find("#" + fieldId).length)
            return false;
        }

        return true;
      })
      .remove();
  }

  /****************************************************************************
  * Removes any FIELDSET elements that no longer exist in the metadata.
  *
  * @param formElement {jQuery} The FORM element.
  * @param metaform {object} The metaform view model.
  ****************************************************************************/
  function removeFieldsets(formElement, metaform)
  {
    formElement
      .children("fieldset")
      .filter(function(index, fieldset)
      {
        for (var fieldsetIndex = 0; fieldsetIndex < metaform.Fieldsets().length; fieldsetIndex++)
        {
          var sortableId = "ol" + metaform.Fieldsets()[fieldsetIndex].Title().replace(_alphaNumeric, "");

          if ($(fieldset).children("ol").attr("id") === sortableId)
            return false;
        }

        return true;
      })
      .remove();
  }

  /****************************************************************************
  * Toggles the editing the layout.
  *
  * @this {object} The metaform view model.
  * @param formElement {jQuery} The FORM element.
  ****************************************************************************/
  function toggleEditMode(formElement)
  {
    var sortableList = formElement.find("ol.Forms");

    if (this.EditMode() && !sortableList.hasClass("Movable"))
    {
      formElement.children("fieldset").addClass("Movable");

      sortableList
        .addClass("Movable")
        .sortable(
        {
          connectWith: "ol.Forms",
          handle: "i.fa-ellipsis-v",
          placeholder: "Form-Group Sortable-Placeholder",
          receive: $.proxy(moveField, this),
          start: function(e, ui)
          {
            _dragStartIndex = ui.item.index();
          },
          stop: $.proxy(moveField, this)
        })
        .disableSelection();

      formElement.sortable(
      {
        handle: "i.fa-ellipsis-v",
        start: function(e, ui)
        {
          _dragStartIndex = ui.item.parent().children("fieldset").index(ui.item);
        },
        stop: $.proxy(moveFieldset, this)
      })
      .disableSelection();
    }
    else if (!this.EditMode() && sortableList.hasClass("Movable"))
    {
      formElement.sortable("destroy");
      formElement.children("fieldset").removeClass("Movable");
      sortableList
        .removeClass("Movable")
        .sortable("destroy");
    }
  }

  /****************************************************************************
  * Toggles the display of empty fields.
  *
  * @this {object} The metaform view model.
  * @param formElement {jQuery} The FORM element.
  ****************************************************************************/
  function toggleEmptyFields(formElement)
  {
    var emptyInputs = formElement
      .find("input")
      .add("select")
      .add("textarea")
      .filter(function(index, element)
      {
        return !$(this).val();
      });

    if (this.DisplayEmpty() && !emptyInputs.is(":visible"))
      emptyInputs.parents("li.Form-Group").show();
    else if (!this.DisplayEmpty() && emptyInputs.is(":visible"))
      emptyInputs.parents("li.Form-Group").hide();
  }

  /****************************************************************************
  * Toggles the display of a FIELDSET.
  ****************************************************************************/
  function toggleFieldset()
  {
    var toggleIcon = $(this);
    var fieldset = toggleIcon.parent();

    if (fieldset.css("height") === "30px")
    {
      fieldset
        .animate(
        {
          "height": fieldset.data("Height"),
          "overflow": "auto",
          "padding": "10px"
        })
        .find("li.Form-Group")
        .css("visibility", "visible");

      toggleIcon
        .removeClass("fa-chevron-down")
        .addClass("fa-chevron-up");
    }
    else
    {
      fieldset
        .data("Height", fieldset.css("height"))
        .animate(
        {
          "height": "30px",
          "overflow": "hidden",
          "padding": "0"
        })
        .find("li.Form-Group")
        .css("visibility", "hidden");

      toggleIcon
        .removeClass("fa-chevron-up")
        .addClass("fa-chevron-down");
    }
  }

  /****************************************************************************
  * Updates the INPUT, SELECT, and TEXTAREA elements inside a FIELDSET.
  *
  * @this {object} The FIELDSET metadata.
  * @param fieldset {jQuery} The FIELDSET element.
  ****************************************************************************/
  function updateFields(fieldset)
  {
    var fieldList = fieldset.children("ol.Forms");

    removeFields(fieldset, this);

    for (var fieldIndex = 0; fieldIndex < this.Fields().length; fieldIndex++)
    {
      var fieldId = this.Title().replace(_alphaNumeric, "") + "-" + this.Fields()[fieldIndex].Label().replace(_alphaNumeric, "");
      var fieldListItem = fieldset.find("#" + fieldId).parents("li.Form-Group");

      if (!fieldListItem.length)
      {
        var fieldContainer = createFieldContainer.call(this.Fields()[fieldIndex], fieldList, this);
        var newField = createField(fieldset, fieldList, this.Fields()[fieldIndex]);

        fieldContainer
          .append(newField)
          .insertBefore(fieldset.children("li:eq(" + fieldIndex + ")"))
          .children("label")
          .attr("for", newField.attr("id"));
      }
      else if (fieldListItem.index() !== fieldIndex)
        fieldListItem.insertBefore(fieldset.find("ol.Forms > li:eq(" + fieldIndex + ")"));
    }
  }

  /****************************************************************************
  * Updates each FIELDSET element in the FORM element.
  *
  * @this {object} The metaform view model.
  * @param formElement {jQuery} The FORM element.
  ****************************************************************************/
  function updateForm(formElement)
  {
    if (!this.Fieldsets())
    {
      formElement.children("fieldset").remove();
      return;
    }

    removeFieldsets(formElement, this);

    for (var fieldsetIndex = 0; fieldsetIndex < this.Fieldsets().length; fieldsetIndex++)
    {
      var sortableId = "ol" + this.Fieldsets()[fieldsetIndex].Title().replace(_alphaNumeric, "");
      var fieldset = formElement.find("fieldset > ol[id='" + sortableId + "']").parent();

      if (!fieldset.length)
      {
        var newFieldset = createFieldset.call(this.Fieldsets()[fieldsetIndex], formElement, this);

        if (formElement.children("fieldset").length > fieldsetIndex)
          newFieldset.insertBefore(formElement.children("fieldset:eq(" + fieldsetIndex + ")"));
        else
          formElement.append(newFieldset);
      }
      else if (fieldset.index() !== fieldsetIndex)
      {
        updateFields.call(this.Fieldsets()[fieldsetIndex], fieldset);
        fieldset.insertBefore(formElement.children("fieldset:eq(" + fieldsetIndex + ")"));
      }
    }
  }
})(window, document);
