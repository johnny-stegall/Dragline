/******************************************************************************
* Knockout Metaform Binding
* Author: John Stegall
* Copyright: 2010-2015 John Stegall
* License: MIT
*
* This binding creates standardized form fields (INPUT, SELECT, and TEXTAREA)
* inside a FORM element based on metadata.
******************************************************************************/

// TODO: Implement requesting layout using present URL
// TODO: Server-side generates the layout by querying the database
// TODO: Server-side generates the layout using a view's model
// TODO: Make FIELDSETs movable (or just show the anchor)
; (function(window, document, undefined)
{
  "use strict";

  var _alphaNumeric = /[^A-Za-z0-9]+/;
  
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
      if (!element.jquery)
        element = $(element);

      var metaform = ko.mapping.toJS(valueAccessor());

      updateFieldsets.call(metaform, element);
      toggleEditMode.call(metaform, element);
      toggleEmptyFields.call(metaform, element);
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
      element.attr(attribute, attributes[attribute]);
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
      element.css(style, styles[style]);
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
    if (metadata.Type === "select")
      newField = $("<select />");
    else if (metadata.Type === "textarea")
      newField = $("<textarea />");
    else
      newField = $("<input />").attr("type", metadata.Type);

    newField
      .addClass("Editable")
      .attr("id", fieldList.attr("id").substring(2) + "-" + metadata.Label.replace(_alphaNumeric, ""));

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
  * @param fieldList {jQuery} An OL element.
  * @param formMetadata {object} The form field metadata.
  * @returns The jQuery-wrapped LI element.
  ****************************************************************************/
  function createFieldContainer(fieldList, metadata)
  {
    var hideButton = $("<i />")
      .addClass("fa fa-close")
      .data("Metaform Field", metadata)
      .on("click.widgets.metaform", removeField);

    var fieldContainer = $("<li />")
      .addClass("Form-Group")
      .append("<i class=\"fa fa-ellipsis-v Anchor\" />")
      .append(hideButton);

    if (metadata.Label)
      fieldContainer.append("<label>" + metadata.Label + "</label>");

    if (metadata.ContainerStyling)
      applyStyling(fieldContainer, metadata.ContainerStyling);

    fieldList.append(fieldContainer);

    return fieldContainer;
  }

  /****************************************************************************
  * Creates a FIELDSET element using metadata.
  *
  * @param formElement {jQuery} The FORM element.
  * @param metadata {object} The FIELDSET metadata.
  * @returns The new jQuery-wrapped FIELDSET element.
  ****************************************************************************/
  function createFieldset(formElement, metadata)
  {
    if (!formElement)
      throw "No FORM element found.";
    else if (!metadata)
      throw "No metadata found.";
    else if (!metadata.Title)
      throw "The title for the FIELDSET is required.";

    var fieldList = $("<ol />")
      .attr("id", "ol" + metadata.Title.replace(_alphaNumeric, ""))
      .addClass("Forms");

    var toggleIcon = $("<i />")
      .addClass("fa fa-chevron-up")
      .on("click.widgets.metaform", toggleFieldset);

    var fieldset = $("<fieldset />")
      .append("<header>" + metadata.Title + "</header>")
      .append(toggleIcon)
      .append(fieldList);

    if (metadata.Styling)
      applyStyling(fieldset, metadata.Styling);

    for (var formIndex = 0; formIndex < metadata.Fields.length; formIndex++)
    {
      var fieldContainer = createFieldContainer(fieldList, metadata.Fields[formIndex]);
      var newField = createField(fieldset, fieldList, metadata.Fields[formIndex]);

      fieldContainer
        .append(newField)
        .children("label")
        .attr("for", newField.attr("id"));
    }

    return fieldset;
  }

  /****************************************************************************
  * Removes a form field.
  *
  * @param e {event} The event.
  ****************************************************************************/
  function removeField(e)
  {
    var element = $(e.target);
    var formMetadata = element.data("Metaform Field");
    var fieldsetIndex = element.parents("fieldset").index() - 1;
    var fields = viewModel.Layout().Fieldsets()[fieldsetIndex].Fields();

    fields.forEach(function(formField)
    {
      if (formField.Label() === formMetadata.Label)
      {
        if (!formField.ContainerStyling)
          formField.ContainerStyling = {};

        if (!formField.ContainerStyling["display"])
          formField.ContainerStyling["display"] = ko.observable("none");
        else
          formField.ContainerStyling["display"]("none");
      }
    });

    element.parents("li.Form-Group").hide();
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
      .filter(function(index, element)
      {
        for (var fieldIndex = 0; fieldIndex < metadata.Fields.length; fieldIndex++)
        {
          var fieldId = metadata.Title.replace(_alphaNumeric, "") + "-" + metadata.Fields[fieldIndex].Label.replace(_alphaNumeric, "");

          if (fieldset.find("#" + fieldId).length)
            return false;
        }

        return true;
      })
      .remove();
  }

  /****************************************************************************
  * Removes any FIELDSET elements that no longer have metadata representation.
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
        for (var fieldsetIndex = 0; fieldsetIndex < metaform.Fieldsets.length; fieldsetIndex++)
        {
          var sortableId = "ol" + metaform.Fieldsets[fieldsetIndex].Title.replace(_alphaNumeric, "");

          if ($(fieldset).children("ol[id='" + sortableId + "']").length)
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

    if (this.EditMode && !sortableList.hasClass("Movable"))
    {
      sortableList
        .addClass("Movable")
        .sortable(
        {
          connectWith: "ol.Forms",
          handle: "i.fa-ellipsis-v",
          placeholder: "Form-Group Sortable-Placeholder",
          start: function()
          {
            console.log();
          },
          update: Party.moveField
        })
        .disableSelection();
    }
    else if (!this.EditMode && sortableList.hasClass("Movable"))
    {
      sortableList
        .removeClass("Movable")
        .sortable("disable");
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

    if (this.DisplayEmpty && !emptyInputs.is(":visible"))
      emptyInputs.parents("li.Form-Group").show();
    else if (!this.DisplayEmpty && emptyInputs.is(":visible"))
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
  * Updates the FIELDSET elements.
  *
  * @this {object} The metaform view model.
  * @param formElement {jQuery} The FORM element.
  ****************************************************************************/
  function updateFieldsets(formElement)
  {
    if (!this.Fieldsets)
    {
      formElement.children("fieldset").remove();
      return;
    }

    removeFieldsets(formElement, this);

    for (var fieldsetIndex = 0; fieldsetIndex < this.Fieldsets.length; fieldsetIndex++)
    {
      var sortableId = "ol" + this.Fieldsets[fieldsetIndex].Title.replace(_alphaNumeric, "");
      var fieldset = formElement.find("fieldset > ol[id='" + sortableId + "']").parent();

      if (!fieldset.length)
      {
        var newFieldset = createFieldset(formElement, this.Fieldsets[fieldsetIndex]);

        if (formElement.children("fieldset").length > fieldsetIndex)
          newFieldset.insertBefore(formElement.children("fieldset:eq(" + fieldsetIndex + ")"));
        else
          formElement.append(newFieldset);
      }
      else if (fieldset.index() !== fieldsetIndex)
      {
        updateFields.call(this.Fieldsets[fieldsetIndex], fieldset);
        fieldset.insertBefore(formElement.children("fieldset:eq(" + fieldsetIndex + ")"));
      }
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

    for (var fieldIndex = 0; fieldIndex < this.Fields.length; fieldIndex++)
    {
      var fieldId = this.Title.replace(_alphaNumeric, "") + "-" + this.Fields[fieldIndex].Label.replace(_alphaNumeric, "");
      var field = fieldset.find("#" + fieldId);

      if (!field.length)
      {
        var fieldContainer = createFieldContainer(fieldList, this.Fields[fieldIndex]);
        var newField = createField(fieldset, fieldList, this.Fields[fieldsetIndex]);

        fieldContainer
          .append(newField)
          .insertBefore(fieldset.children("li:eq(" + fieldIndex + ")"))
          .children("label")
          .attr("for", newField.attr("id"));
      }
      else if (field.index() !== fieldIndex)
        field.insertBefore(fieldset.children("li:eq(" + fieldIndex + ")"));
    }
  }

  /****************************************************************************
  * Updates the metadata to reflect that a user moved a field.
  ****************************************************************************/
  function moveField(event, ui)
  {
    // TODO: Implement moving fields
    //console.log("this:");
    //console.log(this);
    //console.log("Event:");
    //console.log(event);
    //console.log("UI:");
    //console.log(ui);
  }
})(window, document);
