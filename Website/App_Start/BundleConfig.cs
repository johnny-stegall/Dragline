using System.Web;
using System.Web.Optimization;

namespace Dragline
{
  public class BundleConfig
  {
    // For more information on Bundling, visit http://go.microsoft.com/fwlink/?LinkId=254725
    public static void RegisterBundles(BundleCollection bundles)
    {
      bundles.Add(new ScriptBundle("~/javascript/dragline")
        .Include("~/scripts/jquery.form.js",
          "~/scripts/jquery-ui-{version}.js",
          "~/scripts/knockout-bindings.js",
          "~/scripts/modal.js",
          "~/scripts/responsive-navigation.js",
          "~/scripts/toasty.js"));

      bundles.Add(new StyleBundle("~/css/dragline")
        .Include("~/css/normalize-{version}.css",
          "~/css/elements.css",
          "~/css/classes.css",
          "~/css/printer-friendly.css",
          "~/css/responsive.css",
          "~/css/site.css",
          "~/css/modal.css",
          "~/css/toasty.css"));
    }
  }
}