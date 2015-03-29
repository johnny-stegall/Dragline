/******************************************************************************
* jQuery Password Strength Plugin
* Author: John Stegall
* Copyright: 2007-2015 John Stegall
* License: MIT
*
* Displays password strength under an INPUT element. Also provides callback
* handlers for password confirmation matching and mismatching.
******************************************************************************/
;(function($, window, document, undefined)
{
  "use strict";

  var _defaults =
  {
    Confirmation:
    {
      Element: null,
      InvalidCallback: null,
      ValidCallback: null
    },
    FairPattern: /^(?=.*[A-Za-z]+)(?=.*[0-9]+).{6,}$/,
    GoodPattern: /^(?=.*[A-Z]+)(?=.*[a-z]+)(?=.*[0-9]+).{8,}$/,
    StrongPattern: /^(?=.*[A-Z]+)(?=.*[a-z]+)(?=.*[0-9]+)(?=.*[^A-Za-z0-9 ]+).{8,}$/
  };

  /****************************************************************************
  * The Password Strength constructor.
  *
  * @param element {jQuery} The INPUT element to give password strength.
  * @param options {object} Settings to apply to the password strength.
  ****************************************************************************/
  var PasswordStrength = function(element, options)
  {
    this.Element = element;
    this.Options = $.extend({}, _defaults, options);
    this.Strength = null;
      
    element.wrap("<div class=\"PasswordStrength\" />");
    buildStrength.call(this);
      
    if (this.Options.Confirmation.Element)
    {
      if (typeof (this.Options.Confirmation.Element) === "string")
        this.Options.Confirmation.Element = $(this.Options.Confirmation.Element);

      this.Options.Confirmation.Element.wrap("<div class=\"PasswordStrength\" />");
    }

    wireEvents.call(this);
  }

  PasswordStrength.prototype =
  {
    /****************************************************************************
    * Frees resources used by the plugin and unbinds event-handlers.
    ****************************************************************************/
    destroy: function()
    {
      this.Strength.remove();

      this.Element
        .removeData("Password Strength")
        .unwrap()
        .off(".widgets.passwordstrength");

      if (this.Options.Confirmation && this.Options.Confirmation.Element)
      {
        this.Options.Confirmation.Element
          .unwrap()
          .off(".widgets.passwordstrength");
      }
    }
  };

  /**************************************************************************
  * Builds the UI that tells the user their password's stud muffin potential.
  *
  * @this A PasswordStrength instance.
  **************************************************************************/
  function buildStrength()
  {
    var meterDiv = $("<div />")
      .addClass("Meter")
      .append("<span />");

    this.Strength = $("<div />")
      .addClass("Strength")
      .append($("<small><strong>Strength:</strong> <span>Weak</span></small>"))
      .append(meterDiv);

    this.Element.parent().append(this.Strength);
  }

  /**************************************************************************
  * Updates the UI as the user types their password or confirms it.
  *
  * @this A PasswordStrength instance.
  **************************************************************************/
  function updateConfirmation()
  {
    var confirmElement = this.Options.Confirmation.Element;

    if (this.Element.val().length + confirmElement.val().length === 0)
      confirmElement.next().fadeOut();
    else if (this.Options.Confirmation.ValidCallback && this.Element.val() === confirmElement.val())
      this.Options.Confirmation.ValidCallback();
    else if (this.Options.Confirmation.InvalidCallback)
      this.Options.Confirmation.InvalidCallback();
  }

  /**************************************************************************
  * Let's the user know how small or large their penis is.
  *
  * @this A PasswordStrength instance.
  **************************************************************************/
  function updateStrength()
  {
    this.Strength.removeClass("Strong Moderate Fair Weak");

    var strength = "Weak";

    if (this.Options.StrongPattern.test(this.Element.val()))
      strength = "Strong";
    else if (this.Options.GoodPattern.test(this.Element.val()))
      strength = "Moderate";
    else if (this.Options.FairPattern.test(this.Element.val()))
      strength = "Fair";

    this.Strength.find("small span").text(strength);
    this.Strength.addClass(strength);

    if (!this.Strength.is(":visible"))
      this.Strength.fadeIn();
  }

  /**************************************************************************
  * Wires event-handlers.
  *
  * @this A PasswordStrength instance.
  **************************************************************************/
  function wireEvents()
  {
    var self = this;

    this.Element
      .on("keyup.widgets.passwordstrength", $.proxy(updateStrength, this))
      .on("blur.widgets.passwordstrength", function()
      {
        self.Strength.fadeOut();
      });

    if (this.Options.Confirmation.Element)
    {
      this.Options.Confirmation.Element.on("keyup.widgets.passwordstrength", $.proxy(updateConfirmation, this));
      this.Element.on("keyup.widgets.passwordstrength", $.proxy(updateConfirmation, this));
    }
  }

  /****************************************************************************
  * The Password Strength plugin.
  ****************************************************************************/
  $.fn.PasswordStrength = function(options)
  {
    var args = arguments;

    if (options === undefined || typeof (options) === "object")
    {
      // This proves bondage is a good thing
      return this.each(function()
      {
        // Allow the plugin to only be instantiated once
        if ($.data(this, "Password Strength") === undefined)
          $.data(this, "Password Strength", new PasswordStrength($(this), options));
      });
    }
    else if (typeof (options) === "string")
    {
      // Cache the method call to make it possible to return a value
      var result;

      this.each(function()
      {
        var instance = $.data(this, "Password Strength");

        // Call the method with any parameters also passed
        if (instance instanceof (PasswordStrength) && typeof (instance[options]) === "function")
          result = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
      });

      // Return the method's return value; otherwise maintain chainability
      return result !== undefined ? result : this;
    }
  }
})(jQuery, window, document);