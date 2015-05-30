using System.Web;
using System.Web.Optimization;

namespace Dragline
{
  public class BundleConfig
  {
    // For more information on Bundling, visit http://go.microsoft.com/fwlink/?LinkId=254725
    public static void RegisterBundles(BundleCollection bundles)
    {
      var draglineCssBundle = new StyleBundle("~/dragline-styling");
      draglineCssBundle.Include("~/css/lib/normalize-{version}.css",
        "~/css/dragline/elements.css",
        "~/css/dragline/classes.css",
        "~/css/dragline/printer-friendly.css",
        "~/css/dragline/responsive.css",
        "~/css/dragline/modal.css",
        "~/css/dragline/toasty.css");

      var dependencyBundle = new ScriptBundle("~/library-scripts");
      dependencyBundle.Include("~/scripts/lib/jquery-{version}.js",
        "~/scripts/lib/jquery-ui-{version}.js",
        "~/scripts/lib/knockout-{version}.js",
        "~/scripts/lib/knockout-mapping-{version}.js",
        "~/scripts/lib/lazy-{version}.js",
        "~/scripts/lib/moment-{version}.js");

      var draglineBundle = new ScriptBundle("~/dragline-scripts");
      draglineBundle.Include("~/scripts/dragline/knockout-bindings.js",
        "~/scripts/dragline/modal.js",
        "~/scripts/dragline/toasty.js");

      bundles.Add(draglineCssBundle);
      bundles.Add(dependencyBundle);
      bundles.Add(draglineBundle);
    }
  }
}