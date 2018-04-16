/******************************************************************************
* jQuery Toast Alert Plugin
* Author: John Stegall
* Copyright: 2010 John Stegall
* License: MIT
*
* Creates toast messages in the specified element. Constructed using standard
* jQuery construction: $(selector).Toasty(options). However, all public
* methods are attached to the $.Toasty namespace for easy of use.
******************************************************************************/
;(function($, window, document, undefined)
{
  "use strict";

  var _defaults =
  {
    MaxMessages: 0
  };

  /****************************************************************************
  * The Toasty single object with static methods.
  ****************************************************************************/
  var Toasty =
  {
    Element: null,
    Options: null,
    MessageCount: 0,
    Visible: 0,
    
    /****************************************************************************
    * Initialization.
    *
    * @param element {jQuery} The element to turn into a toasty.
    * @param options {object} Settings to apply to the toasty element.
    ****************************************************************************/
    _create: function(element, options)
    {
      element.addClass("Toasty");
        
      this.Element = element;
      this.Options = $.extend({}, _defaults, options);
    },
    
    /****************************************************************************
    * Adds a button that allows the user to dismiss the alert.
    *
    * @param alertDiv {jQuery} The DIV element containing the alert.
    * @param alertId {int} The alert ID.
    ****************************************************************************/
    addDismissButton: function(alertDiv, alertId)
    {
      var dismissButton = $("<button />")
        .attr("type", "button")
        .append("<i class=\"fa fa-times\" />")
        .on("click.widgets.toasty", function()
        {
          alertDiv.addClass("Acknowledged");
        });
      
      alertDiv.append(dismissButton);
    },
    
    /****************************************************************************
    * Adds an image to the alert.
    *
    * @param alertDiv {jQuery} The DIV element containing the alert.
    * @param imageUrl {string} The image URL.
    ****************************************************************************/
    addImage: function(alertDiv, imageUrl)
    {
      var alertImage = $("<img />")
        .attr("src", imageUrl);
        
      alertDiv.append(alertImage);
    },
    
    /****************************************************************************
    * Applies styling to an alert.
    *
    * @param alertDiv {jQuery} The DIV element containing the alert.
    * @param parameters {object} The toast alert parameters.
    ****************************************************************************/
    styleAlert: function(alertDiv, parameters)
    {
      if (parameters.CssClass)
        alertDiv.addClass(parameters.CssClass);
      else
        alertDiv.addClass(parameters.Type);
    }
  };

  /****************************************************************************
  * The Toasty plugin.
  ****************************************************************************/
  $.fn.Toasty = function(options)
  {
    // This proves bondage is a good thing
    Toasty._create(this, options);
    return this;
  };
  
  /****************************************************************************
  * The public method namespace.
  ****************************************************************************/
  $.Toasty =
  {
    /**************************************************************************
    * Creates a toast alert.
    *
    * @param parameters {object} The toast alert parameters.
    **************************************************************************/
    add: function(parameters)
    {
      if (!parameters)
        throw new Error("No message parameters supplied.");
      else if (typeof (parameters) === "string")
        parameters = { Text: parameters };
      else if (parameters.Type && parameters.CssClass)
        throw new Error("You can only supply the Type parameter or CssClass parameter, not both.");

      var alertId = Toasty.MessageCount;
      var alertDiv = $("<div />")
        .attr("id", "Toasty-" + alertId)
        .one("transitionend webkitTransitionEnd", function()
        {
          if (!parameters.Sticky)
            alertDiv.addClass("Fade");

          alertDiv.one("transitionend webkitTransitionEnd", function()
          {
            $.Toasty.remove(alertId);
          });
        });
      
      Toasty.MessageCount++;
      Toasty.styleAlert(alertDiv, parameters);
      
      if (parameters.Dismissable)
        Toasty.addDismissButton(alertDiv, alertId);
      
      if (parameters.Title)
        alertDiv.append("<large>" + parameters.Title + "</large>");

      if (parameters.ImageUrl)
        Toasty.addImage(alertDiv, parameters.ImageUrl);

      alertDiv.append($("<span>" + parameters.Text + "</span>"));
      
      if (parameters.MaxMessages > 0 && Toasty.Visible >= parameters.MaxMessages)
        return;

      Toasty.Visible++;
      Toasty.Element.append(alertDiv);

      window.setTimeout(function()
      {
        alertDiv.addClass("Toast");
      }, 500);

      return alertId;
    },

    /**************************************************************************
    * Removes a specific alert. The first step is to slowly fade it out by
    * making the opacity gradually 0, then reducing the height to 0, which
    * gives it a "scrolling up" effect. Once completely invisible, it's
    * removed.
    *
    * @param alertId {int} The alert ID.
    **************************************************************************/
    remove: function(alertId)
    {
      $("#Toasty-" + alertId).remove();
      Toasty.Visible--;
    },
    
    /**************************************************************************
    * Removes all alerts.
    **************************************************************************/
    removeAll: function()
    {
      Toasty.Element.children()
        .css("opacity", 0)
        .on("transitionend", function()
        {
          $(this).remove();
          Toasty.Visible = 0;
        });
    }
  };
})(jQuery, window, document);