namespace FinanceService.DTOs;

public class CreateSponsorshipRequest
{
    public string CompanyName { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? Message { get; set; }
    public decimal Amount { get; set; }
}
