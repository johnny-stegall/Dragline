using Microsoft.AspNetCore.Mvc;

namespace Dragline.Controllers
{
  public class HomeController : Controller
  {
    public IActionResult Index()
    {
      return View();
    }

    [Route("components")]
    public IActionResult Components()
    {
      return View();
    }

    [Route("styling")]
    public IActionResult Styling()
    {
      return View();
    }
  }
}
