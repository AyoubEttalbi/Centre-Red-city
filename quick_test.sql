-- =====================================================
-- QUICK TEACHER LOGIC TEST
-- =====================================================
-- Replace the values below with your actual data

SET @teacher_id = 1;
SET @test_month = '2025-09';

-- Quick summary for your specific case
SELECT 
    'QUICK SUMMARY' as info,
    (SELECT COUNT(DISTINCT student_id) 
     FROM memberships 
     WHERE JSON_CONTAINS(teachers, JSON_OBJECT('teacherId', CAST(@teacher_id AS CHAR)))
     AND deleted_at IS NULL) as total_students_taught,
    
    (SELECT COUNT(*) 
     FROM (
         SELECT i.id
         FROM memberships m
         INNER JOIN invoices i ON m.id = i.membership_id
         CROSS JOIN JSON_TABLE(
             COALESCE(i.selected_months, JSON_ARRAY(DATE_FORMAT(i.billDate, '%Y-%m'))),
             '$[*]' COLUMNS (month_value JSON PATH '$')
         ) AS months
         WHERE JSON_CONTAINS(m.teachers, JSON_OBJECT('teacherId', CAST(@teacher_id AS CHAR)))
         AND m.payment_status IN ('paid', 'pending')
         AND m.deleted_at IS NULL
         AND i.deleted_at IS NULL
         AND JSON_UNQUOTE(JSON_EXTRACT(month_value, '$')) = @test_month
     ) as monthly_payments) as payment_months_for_september_2025;

-- Show why there's a difference
SELECT 
    'EXPLANATION' as info,
    'Total students taught by teacher (all time)' as metric_1,
    'Payment months for September 2025 only' as metric_2,
    'Difference = students taught in other months or without Sep 2025 payments' as explanation;

