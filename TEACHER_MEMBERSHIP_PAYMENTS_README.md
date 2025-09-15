# Teacher Membership Payment System

## Overview

This system changes how teacher wallets are incremented when students pay for memberships. Instead of giving teachers their full commission upfront, the system now distributes payments monthly based on the selected months.

## Key Changes

### Before (Old System)
- When a student paid for 3 months, teachers received their full commission immediately
- Example: Student pays 1000 DH for 3 months, teacher gets 300 DH (30%) immediately

### After (New System)
- When a student pays for 3 months, teachers receive their commission monthly
- Example: Student pays 1000 DH for 3 months, teacher gets 100 DH (30% ÷ 3 months) each month

## Database Structure

### New Table: `teacher_membership_payments`

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `student_id` | bigint | Student who made the payment |
| `teacher_id` | bigint | Teacher receiving the payment |
| `membership_id` | bigint | Associated membership |
| `invoice_id` | bigint | Associated invoice (nullable for multiple invoices) |
| `selected_months` | json | Array of months like ["2025-01", "2025-02", "2025-03"] |
| `months_rest_not_paid_yet` | json | Array of remaining unpaid months |
| `total_teacher_amount` | decimal | Total amount teacher should earn for this payment |
| `monthly_teacher_amount` | decimal | Amount teacher gets per month |
| `payment_percentage` | decimal | What percentage of the invoice was paid |
| `teacher_subject` | string | Subject the teacher teaches |
| `teacher_percentage` | decimal | Teacher's percentage from offer |
| `is_active` | boolean | Whether this record is still active |

## How It Works

### 1. Payment Processing
When a student pays for a membership:
1. System calculates teacher's total commission based on payment percentage
2. System divides the commission by the number of selected months
3. System creates/updates records in `teacher_membership_payments` table
4. All selected months are added to `months_rest_not_paid_yet`

### 2. Monthly Payment Distribution
At the start of each month (scheduled job):
1. System finds all active records where current month is in `selected_months` but not yet paid
2. System increments teacher wallets by `monthly_teacher_amount`
3. System removes current month from `months_rest_not_paid_yet`
4. If all months are paid, record is marked as inactive

### 3. Multiple Payments
When a student makes additional payments:
1. System finds existing record for the teacher and membership
2. System merges new selected months with existing ones
3. System recalculates total and monthly amounts
4. System adds new months to unpaid list

## Files Created/Modified

### New Files
- `database/migrations/2025_01_20_000001_create_teacher_membership_payments_table.php`
- `app/Models/TeacherMembershipPayment.php`
- `app/Services/TeacherMembershipPaymentService.php`
- `app/Console/Commands/ProcessTeacherMonthlyPayments.php`
- `app/Http/Controllers/TeacherMembershipPaymentController.php`

### Modified Files
- `app/Http/Controllers/InvoiceController.php` - Updated to use new service
- `app/Http/Controllers/MembershipController.php` - Updated to use new service
- `app/Console/Kernel.php` - Added scheduled job
- `routes/web.php` - Added API routes for testing

## Usage

### Running the Migration
```bash
php artisan migrate
```

### Manual Monthly Payment Processing
```bash
# Process current month
php artisan teachers:process-monthly-payments

# Process specific month
php artisan teachers:process-monthly-payments --month=2025-01
```

### API Endpoints (Admin Only)
- `GET /api/teacher-payments` - List all teacher payment records
- `GET /api/teacher-payments/{id}` - Get specific payment record
- `POST /api/teacher-payments/process-monthly` - Manually process monthly payments
- `GET /api/teacher-payments/earnings-summary` - Get earnings summary
- `GET /api/teacher-payments/pending-payments` - Get pending payments

### Scheduled Job
The system automatically processes monthly payments on the 1st of each month at 2:00 AM.

## Example Scenarios

### Scenario 1: Student pays 50% for 3 months
- Student pays 500 DH for 3 months (Jan, Feb, Mar)
- Teacher percentage: 30%
- Teacher total commission: 150 DH (500 × 30%)
- Monthly amount: 50 DH (150 ÷ 3)
- Result: Teacher gets 50 DH each month (Jan, Feb, Mar)

### Scenario 2: Student completes payment (additional 50%)
- Student pays remaining 500 DH
- Teacher total commission: 300 DH (1000 × 30%)
- Monthly amount: 100 DH (300 ÷ 3)
- Result: Teacher gets 100 DH each month (Jan, Feb, Mar)

### Scenario 3: Student pays for 1 month only
- Student pays 333 DH for 1 month (Jan)
- Teacher percentage: 30%
- Teacher total commission: 100 DH (333 × 30%)
- Monthly amount: 100 DH
- Result: Teacher gets 100 DH in January

## Benefits

1. **Better Cash Flow Management**: Teachers receive payments as services are provided
2. **Accurate Tracking**: System tracks exactly which months are paid/unpaid
3. **Flexible Payments**: Supports partial payments and multiple payment scenarios
4. **Automated Processing**: Monthly payments are processed automatically
5. **Audit Trail**: Complete history of all teacher payments

## Migration from Old System

The new system is designed to work alongside the old system. Existing invoices will continue to work as before, but new invoices will use the new monthly payment system.

To migrate existing data, you would need to create a separate migration script that:
1. Analyzes existing paid invoices
2. Creates teacher membership payment records
3. Calculates remaining unpaid months
4. Sets up the monthly payment schedule

## Testing

You can test the system by:
1. Creating a new invoice with a student payment
2. Checking the `teacher_membership_payments` table
3. Running the monthly payment command manually
4. Verifying teacher wallet increments
5. Checking that months are marked as paid
