using FinanceService.DTOs;
using FinanceService.Infrastructure.Auth;
using FinanceService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceService.Controllers;

[ApiController]
[Route("api/v1/payments")]
[Produces("application/json")]
public class PaymentController(IPaymentService paymentService) : ControllerBase
{
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> InitiatePayment([FromBody] CreatePaymentRequest request)
    {
        var userId = User.GetUserId();
        var payment = await paymentService.InitiatePaymentAsync(userId, request);
        return StatusCode(201, ApiResponse<object>.Ok(payment));
    }

    [HttpPost("verify")]
    [Authorize]
    public async Task<IActionResult> VerifyPayment([FromQuery] string paymentId)
    {
        var payment = await paymentService.VerifyPaymentAsync(paymentId);
        return Ok(ApiResponse<object>.Ok(payment));
    }
}
