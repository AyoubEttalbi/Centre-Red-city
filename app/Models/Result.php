<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Result extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'subject_id',
        'class_id',
        'grade1',
        'grade2',
        'grade3',
        'final_grade',
        'notes',
        'exam_date',
    ];

    protected $casts = [
        'exam_date' => 'date',
    ];

    // Relationship to Student
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    // Relationship to Subject
    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    // Relationship to Class
    public function class()
    {
        return $this->belongsTo(Classes::class);
    }

    // Calculate final grade based on available grades
    public function calculateFinal()
    {
        $grades = [];
        $numeric_values = [];
        $validGrades = 0;
        
        // Extract scale from the first non-empty grade to maintain consistent format
        $scale = '20'; // Default scale
        foreach ([$this->grade1, $this->grade2, $this->grade3] as $grade) {
            if (!empty($grade) && strpos($grade, '/') !== false) {
                $scale = $this->detectScale($grade);
                break;
            }
        }
        
        // Check if each grade is set and extract numeric values if possible
        if (!empty($this->grade1)) {
            $grades[] = $this->grade1;
            $numValue = $this->extractNumericValue($this->grade1);
            if ($numValue !== null) {
                // Get the raw number before scaling
                $rawNumerator = $this->extractRawNumerator($this->grade1);
                if ($rawNumerator !== null) {
                    $numeric_values[] = $rawNumerator;
                    $validGrades++;
                } else {
                    $numeric_values[] = $numValue;
                    $validGrades++;
                }
            } else {
                // Log::info('Could not extract numeric value from grade1', ['value' => $this->grade1]);
            }
        }
        
        if (!empty($this->grade2)) {
            $grades[] = $this->grade2;
            $numValue = $this->extractNumericValue($this->grade2);
            if ($numValue !== null) {
                // Get the raw number before scaling
                $rawNumerator = $this->extractRawNumerator($this->grade2);
                if ($rawNumerator !== null) {
                    $numeric_values[] = $rawNumerator;
                    $validGrades++;
                } else {
                    $numeric_values[] = $numValue;
                    $validGrades++;
                }
            } else {
                // Log::info('Could not extract numeric value from grade2', ['value' => $this->grade2]);
            }
        }
        
        if (!empty($this->grade3)) {
            $grades[] = $this->grade3;
            $numValue = $this->extractNumericValue($this->grade3);
            if ($numValue !== null) {
                // Get the raw number before scaling
                $rawNumerator = $this->extractRawNumerator($this->grade3);
                if ($rawNumerator !== null) {
                    $numeric_values[] = $rawNumerator;
                    $validGrades++;
                } else {
                    $numeric_values[] = $numValue;
                    $validGrades++;
                }
            } else {
                // Log::info('Could not extract numeric value from grade3', ['value' => $this->grade3]);
            }
        }
        
        // Calculate the final grade: sum of all grades divided by 3 (always)
        if (count($numeric_values) > 0) {
            // Calculate sum of all values
            $sum = array_sum($numeric_values);
            
            // Always divide by 3, even if some grades are missing
            $average = $sum / 3;
            
            // Format the final grade with the detected scale
            $this->final_grade = number_format($average, 1) . '/' . $scale;
            
        } else if (count($grades) > 0) {
            // If we don't have numeric values but have grades, use the most recent grade
            $this->final_grade = end($grades);
        } else {
            $this->final_grade = null;
        }
        
        return $this;
    }
    
    // Helper method to extract the raw numerator from a grade like "14/20"
    private function extractRawNumerator($grade)
    {
        // Check for fraction format (e.g., "14/20")
        if (preg_match('/^(\d+(\.\d+)?)\s*\/\s*(\d+(\.\d+)?)$/', $grade, $matches)) {
            $numerator = floatval($matches[1]);
            return $numerator;
        }
        
        return null;
    }
    
    // Helper method to extract numeric value from a grade like "14/20" or "A+"
    private function extractNumericValue($grade)
    {
        // Check for fraction format (e.g., "14/20")
        if (preg_match('/^(\d+(\.\d+)?)\s*\/\s*(\d+(\.\d+)?)$/', $grade, $matches)) {
            $numerator = floatval($matches[1]);
            $denominator = floatval($matches[3]);
            
            if ($denominator > 0) {
                // Convert to a percentage (0-100 scale)
                $percentage = ($numerator / $denominator) * 100;
                return $percentage;
            }
        }
        
        // Check for just a number (e.g., "85")
        if (is_numeric($grade)) {
            $value = floatval($grade);
            return $value;
        }
        
        return null;
    }
    
    // Helper method to detect the scale used (e.g., "/20", "/10", etc.)
    private function detectScale($grade)
    {
        if (preg_match('/\/(\d+(\.\d+)?)$/', $grade, $matches)) {
            return $matches[1];
        }
        
        return '20'; // Default scale changed to 20
    }
} 