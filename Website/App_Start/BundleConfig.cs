using System.Web;
using System.Web.Optimization;

namespace Dragline
{
  public class BundleConfig
  {
    // For more information on Bundling, visit http://go.microsoft.com/fwlink/?LinkId=254725
    public static void RegisterBundles(BundleCollection bundles)
    {
      var dependencyCssBundle = new StyleBundle("~/css/lib");
      dependencyCssBundle.Include("~/css/lib/normalize-{version}.css");

      var draglineCssBundle = new StyleBundle("~/css/dragline");
      draglineCssBundle.Include("~/css/dragline/elements.css",
            "~/css/dragline/classes.css",
            "~/css/dragline/printer-friendly.css",
            "~/css/dragline/responsive.css",
            "~/css/dragline/modal.css",
            "~/css/dragline/toasty.css");

#if DEBUG
      var dependencyBundle = new ScriptBundle("~/scripts/lib");
      dependencyBundle.Include("~/scripts/lib/jquery-{version}.js",
        "~/scripts/lib/jquery-ui-{version}.js",
        "~/scripts/lib/knockout-{version}.js",
        "~/scripts/lib/knockout-mapping-{version}.js",
        "~/scripts/lib/lazy-{version}.js",
        "~/scripts/lib/moment-{version}.js");
#else
      var dependencyBundle = new Bundle("~/scripts/lib");
      dependencyBundle.Include("//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js",
        "~/scripts/lib/jquery-ui-{version}.js",
        "//cdnjs.cloudflare.com/ajax/libs/knockout/3.1.0/knockout-min.js",
        "//cdnjs.cloudflare.com/ajax/libs/knockout.mapping/2.4.1/knockout.mapping.min.js",
        "~/scripts/lib/lazy-{version}.js",
        "//cdnjs.cloudflare.com/ajax/libs/moment.js/2.7.0/moment.min.js");
#endif

      var draglineBundle = new ScriptBundle("~/scripts/dragline");
      draglineBundle.Include("~/scripts/knockout-bindings.js",
        "~/scripts/modal.js",
        "~/scripts/responsive-navigation.js",
        "~/scripts/toasty.js");

      bundles.Add(dependencyCssBundle);
      bundles.Add(draglineCssBundle);
      bundles.Add(dependencyBundle);
      bundles.Add(draglineBundle);
    }
  }
}