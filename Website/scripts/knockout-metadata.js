/******************************************************************************
* Hides a form field if there is no value.
******************************************************************************/
ko.bindingHandlers.hideIfEmpty =
{
  /****************************************************************************
  * This will be called once when the binding is first applied to an element,
  * and again whenever any observables/computeds that are accessed change
  * Update the DOM element based on the supplied values here.
  ****************************************************************************/
  update: function(element, valueAccessor, allBindings, viewModel, bindingContext)
  {
    if (!element.jquery)
      element = $(element)

    // Users can pass an external condition; make sure it passes
    var condition = ko.unwrap(valueAccessor());

    if (condition && (!element.val() || element.val() == ""))
      element.parents("li.field-group").hide();
  }
};

/******************************************************************************
* Builds INPUT, SELECT, and TEXTAREA elements within a FORM based on metadata.
******************************************************************************/
ko.bindingHandlers.metadataForm =
{
  /****************************************************************************
  * This will be called once when the binding is first applied to an element,
  * and again whenever any observables/computeds that are accessed change
  * Update the DOM element based on the supplied values here.
  ****************************************************************************/
  update: function(element, valueAccessor, allBindings, viewModel, bindingContext)
  {
    if (!element.jquery)
      element = $(element)

    element.empty();

    MetadataForm.createHiddenSettings(element);

    var layout = ko.mapping.toJS(valueAccessor());

    layout.Fieldsets.forEach(function(fieldset)
    {
      MetadataForm.createFieldset(element, fieldset);
    });
  }
};
