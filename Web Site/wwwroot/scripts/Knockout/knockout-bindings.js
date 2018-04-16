/******************************************************************************
* Wrapper around the value binding that allows for numeric formatting.
******************************************************************************/
ko.bindingHandlers.numericValue =
{
  /****************************************************************************
  * Called once for each DOM element the binding is used on. Set initial state
  * for the DOM element and register event-handlers here.
  ****************************************************************************/
  init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
  {
    ko.bindingHandlers.value.init(element, valueAccessor, allBindingsAccessor);
  },

  /****************************************************************************
  * This will be called once when the binding is first applied to an element,
  * and again whenever any observables/computeds that are accessed change
  * Update the DOM element based on the supplied values here.
  ****************************************************************************/
  update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
  {
    var value = ko.utils.unwrapObservable(valueAccessor());
    var precision = ko.utils.unwrapObservable(allBindingsAccessor().precision) || 2;
    var formattedValue = parseFloat(value).toFixed(precision);

    ko.bindingHandlers.value.update(element, function()
    {
      return formattedValue;
    });
  }
};

/******************************************************************************
* Toggles visibility of elements using jQuerys fadeIn()/fadeOut() methods.
******************************************************************************/
ko.bindingHandlers.fadeVisible =
{
  /****************************************************************************
  * Called once for each DOM element the binding is used on. Set initial state
  * for the DOM element and register event-handlers here.
  ****************************************************************************/
  init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
  {
    var value = valueAccessor();
    $(element).toggle(ko.utils.unwrapObservable(value));
  },

  /****************************************************************************
  * This will be called once when the binding is first applied to an element,
  * and again whenever any observables/computeds that are accessed change
  * Update the DOM element based on the supplied values here.
  ****************************************************************************/
  update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
  {
    var value = valueAccessor();
    (ko.utils.unwrapObservable(value)) ? $(element).fadeIn() : $(element).fadeOut('fast');
  }
};

/******************************************************************************
* Wrapper around the text binding to format dates.
******************************************************************************/
ko.bindingHandlers.formatDate =
{
  /****************************************************************************
  * This will be called once when the binding is first applied to an element,
  * and again whenever any observables/computeds that are accessed change
  * Update the DOM element based on the supplied values here.
  ****************************************************************************/
  update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
  {
    var unwrappedValue = ko.utils.unwrapObservable(valueAccessor());
    var allBindings = allBindingsAccessor();
    var dateFormat = allBindings.dateFormat || "M/D/YYYY";
    $(element).text(moment(unwrappedValue).format(dateFormat));
  }
};

/******************************************************************************
* Makes an element (in)visible using the jQuery UI sliding animation.
******************************************************************************/
ko.bindingHandlers.slideVisible =
{
  /****************************************************************************
  * Called once for each DOM element the binding is used on. Set initial state
  * for the DOM element and register event-handlers here.
  ****************************************************************************/
  init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
  {
    var value = valueAccessor();
    $(element).toggle(ko.utils.unwrapObservable(value));
  },

  /****************************************************************************
  * This will be called once when the binding is first applied to an element,
  * and again whenever any observables/computeds that are accessed change
  * Update the DOM element based on the supplied values here.
  ****************************************************************************/
  update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
  {
    var value = valueAccessor();
    (ko.utils.unwrapObservable(value)) ? $(element).slideDown('fast') : $(element).slideUp('fast');
  }
};

/******************************************************************************
* Logs the change of an observable to the console.
******************************************************************************/
ko.bindingHandlers.log =
{
  /****************************************************************************
  * This will be called once when the binding is first applied to an element,
  * and again whenever any observables/computeds that are accessed change
  * Update the DOM element based on the supplied values here.
  ****************************************************************************/
  update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
  {
    var value = ko.utils.unwrapObservable(valueAccessor());
    console.log("observable changed", value);
  }
};

/******************************************************************************
* Bindings may only proceed as normal if the value is false.
******************************************************************************/
ko.bindingHandlers.allowBindings =
{
  /****************************************************************************
  * Called once for each DOM element the binding is used on. Set initial state
  * for the DOM element and register event-handlers here.
  ****************************************************************************/
  init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
  {
    var shouldAllowBindings = ko.utils.unwrapObservable(valueAccessor());
    return { controlsDescendantBindings: !shouldAllowBindings };
  }
};

// From http://www.knockmeout.net/2011/06/lazy-loading-observable-in-knockoutjs.html
ko.lazyObservable = function(callback, target)
{
  // Private observable
  var _value = ko.observable();
  var requesting = false;

  var result = ko.dependentObservable(
  {
    read: function()
    {
      // If it has not been loaded, execute the supplied function
      if (!result.loaded() && !requesting)
      {
        requesting = true;
        callback.call(target);
      }

      // Always return the current value
      return _value();
    },
    write: function(newValue)
    {
      // Indicate that the value is now loaded and set it
      requesting = false;
      result.loaded(true);
      _value(newValue);
    },

    // Do not evaluate immediately when created
    deferEvaluation: true  
  });

  // Expose the current state, which can be bound against
  result.loaded = ko.observable();

  // Load it again
  result.refresh = function()
  {
    result.loaded(false);
  };

  return result;
};