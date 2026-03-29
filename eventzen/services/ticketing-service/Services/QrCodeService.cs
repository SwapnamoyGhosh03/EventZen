using TicketingService.Helpers;

namespace TicketingService.Services;

public class QrCodeService
{
    private readonly string _hmacSecret;

    public QrCodeService(IConfiguration configuration)
    {
        _hmacSecret = configuration["TicketHmacSecret"]
            ?? throw new ArgumentNullException("TicketHmacSecret is not configured");
    }

    public string GenerateQrCode(string ticketId)
    {
        return HmacHelper.GenerateQrCodeData(ticketId, _hmacSecret);
    }

    public bool ValidateQrCode(string qrCodeData)
    {
        return HmacHelper.ValidateQrCodeData(qrCodeData, _hmacSecret);
    }

    public string ExtractTicketId(string qrCodeData)
    {
        return HmacHelper.ExtractTicketId(qrCodeData);
    }
}
