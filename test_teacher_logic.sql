-- =====================================================
-- TEACHER LOGIC VERIFICATION SQL SCRIPT
-- =====================================================
-- This script helps verify the teacher-student-payment logic
-- Replace @teacher_id with your actual teacher ID (e.g., 1)
-- Replace @teacher_email with your actual teacher email (e.g., 'www@dd.cc')
-- Replace @test_month with the month you want to test (e.g., '2025-09')

SET @teacher_id = 1;
SET @teacher_email = 'www@dd.cc';
SET @test_month = '2025-09';

-- =====================================================
-- 1. BASIC TEACHER INFORMATION
-- =====================================================
SELECT 
    'TEACHER INFO' as section,
    id,
    first_name,
    last_name,
    email,
    status,
    wallet,
    created_at
FROM teachers 
WHERE id = @teacher_id OR email = @teacher_email;

-- =====================================================
-- 2. TOTAL STUDENTS COUNT (NEW LOGIC - without payment status filter)
-- =====================================================
SELECT 
    'TOTAL STUDENTS (NEW LOGIC)' as section,
    COUNT(DISTINCT student_id) as total_students
FROM memberships 
WHERE JSON_CONTAINS(teachers, JSON_OBJECT('teacherId', CAST(@teacher_id AS CHAR)))
AND deleted_at IS NULL;

-- =====================================================
-- 3. TOTAL STUDENTS COUNT (OLD LOGIC - with payment status filter)
-- =====================================================
SELECT 
    'TOTAL STUDENTS (OLD LOGIC)' as section,
    COUNT(DISTINCT student_id) as total_students_with_payment_filter
FROM memberships 
WHERE JSON_CONTAINS(teachers, JSON_OBJECT('teacherId', CAST(@teacher_id AS CHAR)))
AND payment_status IN ('paid', 'pending')
AND deleted_at IS NULL;

-- =====================================================
-- 4. STUDENTS WITH PAYMENTS IN SPECIFIC MONTH
-- =====================================================
SELECT 
    'STUDENTS WITH PAYMENTS IN MONTH' as section,
    COUNT(DISTINCT m.student_id) as students_with_payments_in_month
FROM memberships m
INNER JOIN invoices i ON m.id = i.membership_id
WHERE JSON_CONTAINS(m.teachers, JSON_OBJECT('teacherId', CAST(@teacher_id AS CHAR)))
AND m.payment_status IN ('paid', 'pending')
AND m.deleted_at IS NULL
AND i.deleted_at IS NULL
AND (
    JSON_CONTAINS(i.selected_months, JSON_QUOTE(@test_month))
    OR (i.selected_months IS NULL AND DATE_FORMAT(i.billDate, '%Y-%m') = @test_month)
);

-- =====================================================
-- 5. DETAILED BREAKDOWN OF PAYMENT MONTHS
-- =====================================================
SELECT 
    'PAYMENT MONTHS BREAKDOWN' as section,
    i.id as invoice_id,
    s.firstName,
    s.lastName,
    i.selected_months,
    i.billDate,
    i.totalAmount,
    i.amountPaid,
    i.payment_status,
    CASE 
        WHEN JSON_CONTAINS(i.selected_months, JSON_QUOTE(@test_month)) THEN 'YES'
        WHEN i.selected_months IS NULL AND DATE_FORMAT(i.billDate, '%Y-%m') = @test_month THEN 'YES (fallback)'
        ELSE 'NO'
    END as has_payment_in_test_month
FROM memberships m
INNER JOIN invoices i ON m.id = i.membership_id
INNER JOIN students s ON m.student_id = s.id
WHERE JSON_CONTAINS(m.teachers, JSON_OBJECT('teacherId', CAST(@teacher_id AS CHAR)))
AND m.payment_status IN ('paid', 'pending')
AND m.deleted_at IS NULL
AND i.deleted_at IS NULL
ORDER BY s.lastName, s.firstName;

-- =====================================================
-- 6. MONTHLY PAYMENT STATISTICS
-- =====================================================
SELECT 
    'MONTHLY PAYMENT STATS' as section,
    DATE_FORMAT(i.billDate, '%Y-%m') as month,
    COUNT(DISTINCT i.id) as invoice_count,
    COUNT(DISTINCT m.student_id) as unique_students,
    SUM(i.amountPaid) as total_amount_paid,
    AVG(i.amountPaid) as avg_amount_per_invoice
FROM memberships m
INNER JOIN invoices i ON m.id = i.membership_id
WHERE JSON_CONTAINS(m.teachers, JSON_OBJECT('teacherId', CAST(@teacher_id AS CHAR)))
AND m.payment_status IN ('paid', 'pending')
AND m.deleted_at IS NULL
AND i.deleted_at IS NULL
GROUP BY DATE_FORMAT(i.billDate, '%Y-%m')
ORDER BY month DESC;

-- =====================================================
-- 7. TEACHER MEMBERSHIP PAYMENT RECORDS
-- =====================================================
SELECT 
    'TEACHER PAYMENT RECORDS' as section,
    tmp.id,
    tmp.teacher_id,
    tmp.student_id,
    tmp.membership_id,
    tmp.invoice_id,
    tmp.selected_months,
    tmp.months_rest_not_paid_yet,
    tmp.total_teacher_amount,
    tmp.monthly_teacher_amount,
    tmp.total_paid_to_teacher,
    tmp.teacher_subject,
    tmp.teacher_percentage,
    tmp.is_active,
    tmp.created_at
FROM teacher_membership_payments tmp
WHERE tmp.teacher_id = @teacher_id
ORDER BY tmp.created_at DESC;

-- =====================================================
-- 8. STUDENTS TAUGHT BY TEACHER (DETAILED)
-- =====================================================
SELECT 
    'STUDENTS TAUGHT BY TEACHER' as section,
    s.id as student_id,
    s.firstName,
    s.lastName,
    s.email,
    s.status as student_status,
    c.name as class_name,
    sch.name as school_name,
    m.id as membership_id,
    m.payment_status as membership_payment_status,
    m.teachers as membership_teachers,
    m.created_at as membership_created,
    m.deleted_at as membership_deleted
FROM students s
INNER JOIN memberships m ON s.id = m.student_id
LEFT JOIN classes c ON s.classId = c.id
LEFT JOIN schools sch ON s.schoolId = sch.id
WHERE JSON_CONTAINS(m.teachers, JSON_OBJECT('teacherId', CAST(@teacher_id AS CHAR)))
AND m.deleted_at IS NULL
ORDER BY s.lastName, s.firstName;

-- =====================================================
-- 9. PAYMENT MONTHS COUNT FOR SPECIFIC MONTH
-- =====================================================
SELECT 
    'PAYMENT MONTHS COUNT FOR SPECIFIC MONTH' as section,
    COUNT(*) as payment_months_count
FROM (
    SELECT 
        i.id as invoice_id,
        JSON_UNQUOTE(JSON_EXTRACT(month_value, '$')) as month
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
) as monthly_payments;

-- =====================================================
-- 10. SUMMARY COMPARISON
-- =====================================================
SELECT 
    'SUMMARY COMPARISON' as section,
    (SELECT COUNT(DISTINCT student_id) 
     FROM memberships 
     WHERE JSON_CONTAINS(teachers, JSON_OBJECT('teacherId', CAST(@teacher_id AS CHAR)))
     AND deleted_at IS NULL) as total_students_taught,
    
    (SELECT COUNT(DISTINCT student_id) 
     FROM memberships 
     WHERE JSON_CONTAINS(teachers, JSON_OBJECT('teacherId', CAST(@teacher_id AS CHAR)))
     AND payment_status IN ('paid', 'pending')
     AND deleted_at IS NULL) as students_with_paid_pending_memberships,
    
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
     ) as monthly_payments) as payment_months_for_test_month;

-- =====================================================
-- 11. DEBUG: CHECK FOR DATA INCONSISTENCIES
-- =====================================================
SELECT 
    'DATA INCONSISTENCIES CHECK' as section,
    'Memberships without students' as check_type,
    COUNT(*) as count
FROM memberships m
LEFT JOIN students s ON m.student_id = s.id
WHERE JSON_CONTAINS(m.teachers, JSON_OBJECT('teacherId', CAST(@teacher_id AS CHAR)))
AND s.id IS NULL

UNION ALL

SELECT 
    'DATA INCONSISTENCIES CHECK' as section,
    'Invoices without memberships' as check_type,
    COUNT(*) as count
FROM invoices i
LEFT JOIN memberships m ON i.membership_id = m.id
WHERE m.id IS NULL

UNION ALL

SELECT 
    'DATA INCONSISTENCIES CHECK' as section,
    'Memberships with invalid JSON teachers' as check_type,
    COUNT(*) as count
FROM memberships m
WHERE JSON_CONTAINS(m.teachers, JSON_OBJECT('teacherId', CAST(@teacher_id AS CHAR)))
AND (m.teachers IS NULL OR m.teachers = '' OR m.teachers = '[]');

-- =====================================================
-- END OF SCRIPT
-- =====================================================

