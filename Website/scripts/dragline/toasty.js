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
    FadeIn: 500,
    FadeOut: 1000,
    HangTime: 5000,
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
    * @param element {jQuery} The TABLE element to turn into an adaptable.
    * @param options {object} Settings to apply to the adaptable.
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
          $.Toasty.remove(alertId);
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
      var offsetHeight = parseInt(alertDiv.css("paddingTop"))
        + parseInt(alertDiv.css("paddingBottom"))
        + parseInt(alertDiv.css("borderWidth"));

      var alertImage = $("<img />")
        .attr("src", imageUrl)
        .css("marginBottom", alertDiv.height() - offsetHeight + "px");
        
      alertDiv.prepend(alertImage);
    },
    
    /****************************************************************************
    * Sets event-handlers on an alert to make it go boom after the specified
    * amount of time. A toast also needs to stick around, even if it's in the
    * middle of disappearing if a user gets touchy with the bread.
    *
    * @param alertId {int} The alert ID.
    * @param alertDiv {jQuery} The DIV element containing the alert.
    ****************************************************************************/
    applyTimeBomb: function(alertId, alertDiv)
    {
      Toasty["Timer-" + alertId] = setTimeout(function()
      {
        $.Toasty.remove(alertId);
      }, Toasty.Options.HangTime);
      alertDiv.bind("mouseenter mouseleave", function(event)
      {
        if (event.type === "mouseenter")
        {
          clearTimeout(Toasty["Timer-" + alertId]);
          delete Toasty["Timer-" + alertId];
          alertDiv.stop().css({ opacity: "0.75", height: "auto" });
        }
        else
        {
          Toasty["Timer-" + alertId] = setTimeout(function()
          {
            $.Toasty.remove(alertId);
          }, Toasty.Options.HangTime);
        }
      });
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
      {
        alertDiv.addClass(parameters.CssClass);
        return;
      }
      
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

      Toasty.MessageCount++;
      var alertId = Toasty.MessageCount;
      
      var alertDiv = $("<div />")
        .attr("id", "Toasty-" + alertId);
      
      Toasty.styleAlert(alertDiv, parameters);
      
      if (parameters.Dismissable)
        Toasty.addDismissButton(alertDiv, alertId);
      
      if (parameters.Title)
        alertDiv.append("<large>" + parameters.Title + "</large>");

      alertDiv.append($("<p>" + parameters.Text + "</p>"));
      
      if (parameters.MaxMessages > 0 && Toasty.Visible >= parameters.MaxMessages)
        return;

      Toasty.Visible++;
      
      if (!Toasty.Element.is(":visible"))
        Toasty.Element.css("display", "block");
      
      Toasty.Element.append(alertDiv);
      alertDiv.fadeIn(Toasty.Options.FadeIn);
      
      if (parameters.ImageUrl)
        Toasty.addImage(alertDiv, parameters.ImageUrl);
      
      if (!parameters.Sticky)
        Toasty.applyTimeBomb(alertId, alertDiv);
      
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
      var alertDiv = $("#Toasty-" + alertId);
      
      alertDiv.animate({ opacity: 0 }, Toasty.Options.FadeOut, function()
      {
        alertDiv.animate({ height: 0, margin: 0, padding: 0 }, 400, function()
        {
          alertDiv.remove();
          Toasty.Visible--;
          
          if (Toasty.Visible < 1)
            Toasty.Element.hide();
        });
      });
    },
    
    /**************************************************************************
    * Removes all alerts.
    **************************************************************************/
    removeAll: function()
    {
      Toasty.Element.children().fadeOut(Toasty.Options.FadeOut, function()
      {
        Toasty.Visible = 0;
        Toasty.Element.hide();
      });
    }
  };
})(jQuery, window, document);