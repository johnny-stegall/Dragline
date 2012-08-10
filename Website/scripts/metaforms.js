/******************************************************************************
* jQuery Accordion Plugin
* Author: John Stegall
* Copyright: 2008 John Stegall
* License: MIT
*
* This plugin creates standardized form fields (INPUT, SELECT, and TEXTAREA
* inside a FORM element based on metadata.
******************************************************************************/

// TODO: Make FIELDSETs movable (or just show the anchor)
;(function($, window, document, undefined)
{
  "use strict";

  var alphaNumeric = /[A-Za-z0-9]+/;

  /****************************************************************************
  * The MetaForms constructor.
  *
  * @param formElement {jQuery} The FORM element.
  * @param metadata {object} The JSON-serialized metadata.
  ****************************************************************************/
  var MetaForms = function(formElement, metadata)
  {
  }

  /****************************************************************************
  * Applies attributes to an element.
  *
  * @param element {jQuery} The element.
  * @param attributes {object} An object (or associatve array) of attributes.
  ****************************************************************************/
  applyAttributes: function(element, attributes)
  {
    if (!element.length)
      return;

    for (var attribute in attributes)
      element.attr(attribute, attributes[attribute]);
  },

  /****************************************************************************
  * Applies CSS styling to an element.
  *
  * @param element {jQuery} The element.
  * @param styles {object} An object (or associative array) of CSS styles.
  ****************************************************************************/
  applyStyling: function(element, styles)
  {
    if (!element.length)
      return;

    for (var style in styles)
      element.css(style, styles[style]);
  },

  /****************************************************************************
  * Creates the individual form fields inside a FIELDSET element.
  *
  * @param fieldset {jQuery} A FIELDSET element.
  * @param fieldList {jQuery} An OL element.
  * @param metadata {object} The JSON-serialized metadata.
  ****************************************************************************/
  createFields: function(fieldset, fieldList, metadata)
  {
    if (!metadata)
      return;

    for (var formIndex = 0; formIndex < metadata.Fields.length; formIndex++)
    {
      var formField = metadata.Fields[formIndex];
      var fieldContainer = this.createFieldWrapper(formField, fieldList, metadata);

      if (formField.ContainerStyling)
        this.applyStyling(fieldContainer, formField.ContainerStyling);

      var element;
      if (formField.Type === "select")
        element = $("<select />");
      else if (formField.Type === "textarea")
        element = $("<textarea />");
      else
      {
        element = $("<input />")
          .attr("type", formField.Type)
          .addClass("text");
      }

      element
        .addClass("Editable")
        .attr("id", this.alphaNumeric.exec(fieldset.children("header").text()) + "-" + this.alphaNumeric.exec(formField.Label));

      fieldContainer.children("label").attr("for", element.attr("id"));

      if (formField.Data)
        formField.Data.call(element, formField);

      if (formField.Styling)
        this.applyStyling(element, formField.Styling);

      if (formField.Attributes)
        this.applyAttributes(element, formField.Attributes);

      fieldContainer.append(element);
    }
  },

  /****************************************************************************
  * Creates a FIELDSET element using metadata.
  *
  * @param formElement {jQuery} The FORM element.
  * @param metadata {object} The JSON-serialized metadata.
  ****************************************************************************/
  createFieldset: function(formElement, metadata)
  {
    if (!formElement)
      throw "No <form> element specified.";
    else if (!metadata.Title)
      throw "The title for the field set was not specified.";

    var fieldList = $("<ol />")
      .attr("id", "ol" + this.alphaNumeric.exec(metadata.Title))
      .addClass("Forms");

    var fieldset = $("<fieldset />")
      .append("<header>" + metadata.Title + "</header>")
      .append("<i class=\"fa fa-chevron-up Collapsible\" />")
      .append(fieldList);

    if (metadata && metadata.Styling)
      this.applyStyling(fieldset, metadata.Styling);

    this.createFields(fieldset, fieldList, metadata);

    formElement.append(fieldset);
  },

  /****************************************************************************
  * Creates the LI element that wraps an individual form element as well as
  * its accompanying label and drag anchor.
  *
  * @param formMetadata {object} The JSON-serialized metadata for a specific
  * form field.
  * @param fieldList {jQuery} An OL element.
  * @returns The jQuery-wrapped LI element.
  ****************************************************************************/
  createFieldWrapper: function(formMetadata, fieldList)
  {
    var hideButton = $("<i />")
      .addClass("fa fa-close")
      .attr("data-bind", "click: MetadataForm.removeField")
      .data("Form Field", formMetadata);

    var fieldContainer = $("<li />")
      .addClass("field-group")
      .append("<i class=\"fa fa-reorder Anchor\" />")
      .append(hideButton)
      .append("<label>" + formMetadata.Label + "</label>");

    fieldList.append(fieldContainer);

    return fieldContainer;
  },

  /****************************************************************************
  * Creates hidden elements for layout settings.
  *
  * @param formElement {jQuery} The FORM element.
  ****************************************************************************/
  createHiddenSettings: function(formElement)
  {
    var chkDisplayEmpty = $("<input />")
      .attr("id", "chkDisplayEmpty")
      .attr("type", "checkbox")
      .attr("data-bind", "checked: Layout()['Display Empty Fields']")
      .addClass("hidden");

    formElement.append(chkDisplayEmpty);
  },

  /****************************************************************************
  * Hides a form field.
  *
  * @param viewModel {object} The view model.
  * @param e {event} The event.
  ****************************************************************************/
  removeField: function(viewModel, e)
  {
    var element = $(e.target);
    var formMetadata = element.data("Form Field");
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

    element.parents("li.field-group").hide();
  }
})(jQuery, window, document);
