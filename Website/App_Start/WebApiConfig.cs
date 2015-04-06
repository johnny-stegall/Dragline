using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;

namespace Dragline
{
  public static class WebApiConfig
  {
    public static void Register(HttpConfiguration config)
    {
      // Attribute routing
      config.MapHttpAttributeRoutes();

      // Convention-based routing
      config.Routes.MapHttpRoute("RESTful", "{controller}");
    }
  }
}
