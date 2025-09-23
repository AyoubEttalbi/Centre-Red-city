-- Debug Payment Status Issue for Invoice ID 606
-- Run these commands on your production database to investigate

-- 1. Check the specific invoice details
SELECT 
    i.id as invoice_id,
    i.totalAmount,
    i.amountPaid,
    i.rest,
    i.billDate,
    i.selected_months,
    i.includePartialMonth,
    i.partialMonthAmount,
    i.membership_id,
    i.student_id,
    i.offer_id,
    m.deleted_at as membership_deleted_at
FROM invoices i
LEFT JOIN memberships m ON i.membership_id = m.id
WHERE i.id = 606;

-- 2. Check teacher membership payment records for this invoice
SELECT 
    tmp.id,
    tmp.teacher_id,
    tmp.invoice_id,
    tmp.selected_months,
    tmp.months_rest_not_paid_yet,
    tmp.total_teacher_amount,
    tmp.monthly_teacher_amount,
    tmp.immediate_wallet_amount,
    tmp.total_paid_to_teacher,
    tmp.is_active,
    tmp.teacher_subject,
    tmp.teacher_percentage,
    tmp.created_at,
    tmp.updated_at
FROM teacher_membership_payments tmp
WHERE tmp.invoice_id = 606;

-- 3. Check all invoices for the same student (maria ait amar) to compare
SELECT 
    i.id as invoice_id,
    i.totalAmount,
    i.amountPaid,
    i.rest,
    i.billDate,
    i.selected_months,
    i.includePartialMonth,
    i.partialMonthAmount,
    m.deleted_at as membership_deleted_at
FROM invoices i
LEFT JOIN memberships m ON i.membership_id = m.id
WHERE i.student_id = (SELECT id FROM students WHERE CONCAT(firstName, ' ', lastName) LIKE '%maria%ait%amar%' LIMIT 1)
ORDER BY i.id DESC;

-- 4. Check if there are any teacher membership payment records for this student
SELECT 
    tmp.id,
    tmp.teacher_id,
    tmp.invoice_id,
    tmp.selected_months,
    tmp.months_rest_not_paid_yet,
    tmp.is_active,
    tmp.teacher_subject,
    tmp.teacher_percentage,
    i.billDate,
    s.firstName,
    s.lastName
FROM teacher_membership_payments tmp
JOIN invoices i ON tmp.invoice_id = i.id
JOIN students s ON i.student_id = s.id
WHERE s.firstName LIKE '%maria%' AND s.lastName LIKE '%ait%amar%'
ORDER BY tmp.invoice_id DESC;

-- 5. Check the membership details for this student
SELECT 
    m.id as membership_id,
    m.student_id,
    m.deleted_at,
    m.teachers,
    m.offer_id,
    o.name as offer_name,
    o.percentage,
    s.firstName,
    s.lastName
FROM memberships m
JOIN students s ON m.student_id = s.id
LEFT JOIN offers o ON m.offer_id = o.id
WHERE s.firstName LIKE '%maria%' AND s.lastName LIKE '%ait%amar%'
ORDER BY m.id DESC;

-- 6. Check all invoices for September 2025 to see the pattern
SELECT 
    i.id as invoice_id,
    i.totalAmount,
    i.amountPaid,
    i.rest,
    i.billDate,
    i.selected_months,
    i.includePartialMonth,
    i.partialMonthAmount,
    m.deleted_at as membership_deleted_at,
    s.firstName,
    s.lastName,
    CASE 
        WHEN m.deleted_at IS NOT NULL THEN 'deleted'
        WHEN i.amountPaid >= i.totalAmount THEN 'paid'
        WHEN i.amountPaid > 0 THEN 'partial'
        ELSE 'unpaid'
    END as payment_status
FROM invoices i
LEFT JOIN memberships m ON i.membership_id = m.id
LEFT JOIN students s ON i.student_id = s.id
WHERE i.billDate >= '2025-09-01' AND i.billDate < '2025-10-01'
ORDER BY i.id DESC;

-- 7. Check if there are any teacher membership payment records for September 2025
SELECT 
    tmp.id,
    tmp.teacher_id,
    tmp.invoice_id,
    tmp.selected_months,
    tmp.months_rest_not_paid_yet,
    tmp.is_active,
    tmp.teacher_subject,
    tmp.teacher_percentage,
    i.billDate,
    s.firstName,
    s.lastName,
    CASE 
        WHEN JSON_CONTAINS(tmp.months_rest_not_paid_yet, '"2025-09"') THEN 'pending'
        ELSE 'paid'
    END as month_status
FROM teacher_membership_payments tmp
JOIN invoices i ON tmp.invoice_id = i.id
JOIN students s ON i.student_id = s.id
WHERE i.billDate >= '2025-09-01' AND i.billDate < '2025-10-01'
ORDER BY tmp.invoice_id DESC;
