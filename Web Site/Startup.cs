using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Dragline
{
  public class Startup
  {
    #region Constructors
    /// <summary>
    /// Constructs an instance of <see cref="Startup" />.
    /// </summary>
    /// <param name="env">The hosting environment.</param>
    public Startup(IHostingEnvironment env)
    {
    }
    #endregion

    #region Entry Point
    public static void Main(string[] args) => WebApplication.Run<Startup>(args);
    #endregion

    #region Public Methods
    // This method gets called by the runtime. Use this method to add services to the container.
    public void ConfigureServices(IServiceCollection services)
    {
      services.AddMvc();
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
    {
      app.UseIISPlatformHandler(options => options.AuthenticationDescriptions.Clear());

      // Add static file handling to the request pipeline
      app.UseStaticFiles();

      // Add MVC to the request pipeline
      app.UseMvc(routes =>
      {
        routes.MapRoute("default", "{controller=Home}/{action=Index}/{id?}");
      });
    }
    #endregion
  }
}
