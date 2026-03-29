using System.Security.Cryptography;
using System.Text;

namespace TicketingService.Helpers;

public static class HmacHelper
{
    public static string GenerateQrCodeData(string ticketId, string secret)
    {
        var hmac = ComputeHmacSha256(ticketId, secret);
        var shortHmac = hmac[..8];
        return $"{ticketId}:{shortHmac}";
    }

    public static bool ValidateQrCodeData(string qrCodeData, string secret)
    {
        var parts = qrCodeData.Split(':');
        if (parts.Length != 2)
            return false;

        var ticketId = parts[0];
        var providedHmac = parts[1];

        var expectedHmac = ComputeHmacSha256(ticketId, secret)[..8];
        return string.Equals(providedHmac, expectedHmac, StringComparison.OrdinalIgnoreCase);
    }

    public static string ExtractTicketId(string qrCodeData)
    {
        var parts = qrCodeData.Split(':');
        return parts.Length >= 1 ? parts[0] : string.Empty;
    }

    private static string ComputeHmacSha256(string data, string secret)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var dataBytes = Encoding.UTF8.GetBytes(data);

        using var hmac = new HMACSHA256(keyBytes);
        var hashBytes = hmac.ComputeHash(dataBytes);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}
