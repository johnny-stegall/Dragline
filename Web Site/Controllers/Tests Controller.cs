using Microsoft.AspNet.Mvc;

namespace Dragline.Controllers
{
  public class TestsController : Controller
  {
    [Route("tests/accordion")]
    public IActionResult Accordion()
    {
      return View();
    }

    [Route("tests/adaptable")]
    public IActionResult Adaptable()
    {
      return View();
    }

    [Route("tests/adaptable-filtering")]
    public IActionResult AdaptableFiltering()
    {
      return View("Adaptable-Filtering");
    }

    [Route("tests/adaptable-grouping")]
    public IActionResult AdaptableGrouping()
    {
      return View("Adaptable-Grouping");
    }

    [Route("tests/adaptable-paging")]
    public IActionResult AdaptablePaging()
    {
      return View("Adaptable-Paging");
    }

    [Route("tests/adaptable-positioning")]
    public IActionResult AdaptablePositioning()
    {
      return View("Adaptable-Positioning");
    }

    [Route("tests/adaptable-script-loader")]
    public IActionResult AdaptableScriptLoader()
    {
      return View("Adaptable-Script-Loader");
    }

    [Route("tests/adaptable-sortable")]
    public IActionResult AdaptableSortable()
    {
      return View("Adaptable-Sortable");
    }

    [Route("tests/adaptable-sorting")]
    public IActionResult AdaptableSorting()
    {
      return View("Adaptable-Sorting");
    }

    [Route("tests/adaptable-state")]
    public IActionResult AdaptableState()
    {
      return View("Adaptable-State");
    }

    [Route("tests/adaptable-views")]
    public IActionResult AdaptableViews()
    {
      return View("Adaptable-Views");
    }

    [Route("tests/bug-fixing")]
    public IActionResult BugFixing()
    {
      return View("Bug-Fixing");
    }

    [Route("tests/carousel")]
    public IActionResult Carousel()
    {
      return View();
    }

    [Route("tests/character-counter")]
    public IActionResult CharacterCounter()
    {
      return View("Character-Counter");
    }

    [Route("tests/dropdown")]
    public IActionResult Dropdown()
    {
      return View();
    }

    [Route("tests/index")]
    public IActionResult Index()
    {
      return View();
    }

    [Route("tests/infinite-scrolling")]
    public IActionResult InfiniteScrolling()
    {
      return View("Infinite-Scrolling");
    }

    [Route("tests/metaform")]
    public IActionResult Metaform()
    {
      return View();
    }

    [Route("tests/modal")]
    public IActionResult Modal()
    {
      return View();
    }

    [Route("tests/password-strength")]
    public IActionResult PasswordStrength()
    {
      return View("Password-Strength");
    }

    [Route("tests/toasty")]
    public IActionResult Toasty()
    {
      return View();
    }
  }
}
