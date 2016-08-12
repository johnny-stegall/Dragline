using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Dragline
{
  public class Startup
  {
    #region Variable Declarations
    private readonly IConfigurationRoot _configuration;
    #endregion

    #region Constructors
    /// <summary>
    /// Constructs an instance of <see cref="Startup" />.
    /// </summary>
    /// <param name="env">The hosting environment.</param>
    public Startup(IHostingEnvironment env)
    {
      // Set up configuration sources
      var builder = new ConfigurationBuilder()
        .AddJsonFile($"{env.ContentRootPath}\\appsettings.json")
        .AddEnvironmentVariables();

      _configuration = builder.Build();
    }
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
      if (env.IsDevelopment())
        app.UseDeveloperExceptionPage();

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
