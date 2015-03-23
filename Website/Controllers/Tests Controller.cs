using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Dragline.Controllers
{
  public class TestsController : Controller
  {
    public ActionResult Accordion()
    {
      return View();
    }

    public ActionResult Adaptable()
    {
      return View();
    }

    [ActionName("adaptable-filtering")]
    public ActionResult AdaptableFiltering()
    {
      return View();
    }

    [ActionName("adaptable-grouping")]
    public ActionResult AdaptableGrouping()
    {
      return View();
    }

    [ActionName("adaptable-helpers")]
    public ActionResult AdaptableHelpers()
    {
      return View();
    }

    [ActionName("adaptable-paging")]
    public ActionResult AdaptablePaging()
    {
      return View();
    }

    [ActionName("adaptable-positioning")]
    public ActionResult AdaptablePositioning()
    {
      return View();
    }

    [ActionName("adaptable-script-loader")]
    public ActionResult AdaptableScriptLoader()
    {
      return View();
    }

    [ActionName("adaptable-sortable")]
    public ActionResult AdaptableSortable()
    {
      return View();
    }

    [ActionName("adaptable-sorting")]
    public ActionResult AdaptableSorting()
    {
      return View();
    }

    [ActionName("adaptable-state")]
    public ActionResult AdaptableState()
    {
      return View();
    }

    [ActionName("adaptable-views")]
    public ActionResult AdaptableViews()
    {
      return View();
    }

    public ActionResult Carousel()
    {
      return View();
    }

    [ActionName("character-counter")]
    public ActionResult CharacterCounter()
    {
      return View();
    }

    public ActionResult Dropdown()
    {
      return View();
    }

    public ActionResult Index()
    {
      return View();
    }

    public ActionResult Metaform()
    {
      return View();
    }

    public ActionResult Modal()
    {
      return View();
    }

    [ActionName("password-strength")]
    public ActionResult PasswordStrength()
    {
      return View();
    }

    [ActionName("responsive-navigation")]
    public ActionResult ResponsiveNavigation()
    {
      return View();
    }

    public ActionResult Toasty()
    {
      return View();
    }
  }
}
