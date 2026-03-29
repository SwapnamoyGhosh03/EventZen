using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace TicketingService.Infrastructure.Auth;

public class JwtAuthOptions : AuthenticationSchemeOptions
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
}

public class JwtAuthHandler : AuthenticationHandler<JwtAuthOptions>
{
    public JwtAuthHandler(
        IOptionsMonitor<JwtAuthOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder) : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.ContainsKey("Authorization"))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var authHeader = Request.Headers.Authorization.ToString();
        if (!authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid authorization header"));
        }

        var token = authHeader["Bearer ".Length..].Trim();

        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(Options.Secret);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = Options.Issuer,
                ValidateAudience = false,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(5)
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

            if (validatedToken is not JwtSecurityToken jwtToken ||
                !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return Task.FromResult(AuthenticateResult.Fail("Invalid token algorithm"));
            }

            // Extract custom claims and add them as standard claims
            var claims = new List<Claim>(principal.Claims);

            var userId = principal.FindFirst("userId")?.Value
                ?? principal.FindFirst("UserId")?.Value
                ?? principal.FindFirst("sub")?.Value
                ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId != null && !claims.Any(c => c.Type == "UserId"))
            {
                claims.Add(new Claim("UserId", userId));
            }

            var email = principal.FindFirst("email")?.Value
                ?? principal.FindFirst(ClaimTypes.Email)?.Value;
            if (email != null && !claims.Any(c => c.Type == "Email"))
            {
                claims.Add(new Claim("Email", email));
            }

            // Extract roles
            var roleClaims = principal.FindAll("roles")
                .Concat(principal.FindAll(ClaimTypes.Role));
            foreach (var roleClaim in roleClaims)
            {
                if (!claims.Any(c => c.Type == ClaimTypes.Role && c.Value == roleClaim.Value))
                {
                    claims.Add(new Claim(ClaimTypes.Role, roleClaim.Value));
                }
            }

            // Extract permissions
            var permissionClaims = principal.FindAll("permissions");
            foreach (var permClaim in permissionClaims)
            {
                if (!claims.Any(c => c.Type == "Permission" && c.Value == permClaim.Value))
                {
                    claims.Add(new Claim("Permission", permClaim.Value));
                }
            }

            var identity = new ClaimsIdentity(claims, Scheme.Name);
            var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name);

            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
        catch (SecurityTokenExpiredException)
        {
            return Task.FromResult(AuthenticateResult.Fail("Token has expired"));
        }
        catch (Exception ex)
        {
            return Task.FromResult(AuthenticateResult.Fail($"Token validation failed: {ex.Message}"));
        }
    }
}
