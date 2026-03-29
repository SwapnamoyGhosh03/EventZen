using FinanceService.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceService.Infrastructure.Data;

public class FinanceDbContext(DbContextOptions<FinanceDbContext> options) : DbContext(options)
{
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<BudgetItem> BudgetItems => Set<BudgetItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Sponsorship> Sponsorships => Set<Sponsorship>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Budget
        modelBuilder.Entity<Budget>(entity =>
        {
            entity.HasKey(e => e.BudgetId);
            entity.Property(e => e.BudgetId).HasColumnType("varchar(36)");
            entity.Property(e => e.EventId).HasColumnType("varchar(36)").IsRequired();
            entity.HasIndex(e => e.EventId).IsUnique();
            entity.Property(e => e.CreatedBy).HasMaxLength(36).IsRequired();
            entity.Property(e => e.Title).HasMaxLength(255).IsRequired();
            entity.Property(e => e.TotalEstimated).HasPrecision(12, 2);
            entity.Property(e => e.TotalApproved).HasPrecision(12, 2);
            entity.Property(e => e.TotalActual).HasPrecision(12, 2);
            entity.Property(e => e.Currency).HasMaxLength(3).HasDefaultValue("INR");
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.ApprovedBy).HasMaxLength(36);
            entity.Property(e => e.Notes).HasMaxLength(2000);
        });

        // BudgetItem
        modelBuilder.Entity<BudgetItem>(entity =>
        {
            entity.HasKey(e => e.ItemId);
            entity.Property(e => e.ItemId).HasColumnType("varchar(36)");
            entity.Property(e => e.BudgetId).HasColumnType("varchar(36)").IsRequired();
            entity.Property(e => e.Category).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.Description).HasMaxLength(500).IsRequired();
            entity.Property(e => e.EstimatedAmount).HasPrecision(12, 2);
            entity.Property(e => e.ActualAmount).HasPrecision(12, 2);
            entity.Property(e => e.Notes).HasMaxLength(2000);

            entity.HasOne(e => e.Budget)
                .WithMany(b => b.BudgetItems)
                .HasForeignKey(e => e.BudgetId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Payment
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.PaymentId);
            entity.Property(e => e.PaymentId).HasColumnType("varchar(36)");
            entity.Property(e => e.EventId).HasColumnType("varchar(36)").IsRequired();
            entity.HasIndex(e => e.EventId);
            entity.Property(e => e.UserId).HasMaxLength(36).IsRequired();
            entity.Property(e => e.RegistrationId).HasMaxLength(36);
            entity.Property(e => e.Amount).HasPrecision(12, 2);
            entity.Property(e => e.Currency).HasMaxLength(3).HasDefaultValue("INR");
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.PaymentMethod).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.GatewayPaymentId).HasMaxLength(255);
            entity.Property(e => e.GatewayResponse).HasColumnType("JSON");
            entity.Property(e => e.Description).HasMaxLength(500);
        });

        // Expense
        modelBuilder.Entity<Expense>(entity =>
        {
            entity.HasKey(e => e.ExpenseId);
            entity.Property(e => e.ExpenseId).HasColumnType("varchar(36)");
            entity.Property(e => e.EventId).HasColumnType("varchar(36)").IsRequired();
            entity.HasIndex(e => e.EventId);
            entity.Property(e => e.BudgetId).HasColumnType("varchar(36)");
            entity.Property(e => e.Category).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.Description).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Amount).HasPrecision(12, 2);
            entity.Property(e => e.Currency).HasMaxLength(3).HasDefaultValue("INR");
            entity.Property(e => e.ReceiptUrl).HasMaxLength(1000);
            entity.Property(e => e.SubmittedBy).HasMaxLength(36).IsRequired();
            entity.Property(e => e.ApprovedBy).HasMaxLength(36);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(30);

            entity.HasOne(e => e.Budget)
                .WithMany()
                .HasForeignKey(e => e.BudgetId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Sponsorship
        modelBuilder.Entity<Sponsorship>(entity =>
        {
            entity.HasKey(e => e.SponsorshipId);
            entity.Property(e => e.SponsorshipId).HasColumnType("varchar(36)");
            entity.Property(e => e.EventId).HasColumnType("varchar(36)").IsRequired();
            entity.HasIndex(e => e.EventId);
            entity.Property(e => e.VendorId).HasMaxLength(36).IsRequired();
            entity.Property(e => e.CompanyName).HasMaxLength(255).IsRequired();
            entity.Property(e => e.LogoUrl).HasColumnType("longtext");
            entity.Property(e => e.Message).HasMaxLength(500);
            entity.Property(e => e.Amount).HasPrecision(12, 2);
        });
    }
}
