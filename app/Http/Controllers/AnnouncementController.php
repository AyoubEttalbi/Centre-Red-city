<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Log;

class AnnouncementController extends Controller
{
    /**
     * Display a listing of the resource.
     * 
     * @param Request $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        // Get query parameters for filtering
        $status = $request->query('status', 'all'); // 'all', 'active', 'upcoming', 'expired'
        
        // Base query
        $query = Announcement::query();
        
        // Apply date filtering based on status parameter
        $now = Carbon::now();
        
        if ($status === 'active') {
            $query->where(function($q) use ($now) {
                $q->where(function($q) use ($now) {
                    $q->whereNull('date_start')
                      ->orWhere('date_start', '<=', $now);
                })->where(function($q) use ($now) {
                    $q->whereNull('date_end')
                      ->orWhere('date_end', '>=', $now);
                });
            });
        } elseif ($status === 'upcoming') {
            $query->where('date_start', '>', $now);
        } elseif ($status === 'expired') {
            $query->where('date_end', '<', $now);
        }
        
        // Get user role for role-based visibility
        $userRole = Auth::user() ? Auth::user()->role : null;
        
        // Apply role-based visibility filter based on user role
        if ($userRole === 'admin') {
            // Admin sees all announcements (no visibility filter needed)
        } else {
            // Teachers and assistants only see announcements with visibility 'all' or matching their role
            $query->where(function($q) use ($userRole) {
                $q->where('visibility', 'all')
                  ->orWhere('visibility', $userRole);
            });
        }
        
        // Order by announcement date (most recent first)
        $query->orderBy('date_announcement', 'desc');
        
        // Execute query
        $announcements = $query->get();

        // Unread count for current user
        $unreadCount = 0;
        if (Auth::check()) {
            $userId = Auth::id();
            $unreadCount = $announcements->filter(function($announcement) use ($userId) {
                return !$announcement->reads()->where('user_id', $userId)->exists();
            })->count();
        }

        return Inertia::render('Menu/AnnouncementsPage', [
            'announcements' => $announcements,
            'filters' => [
                'status' => $status,
            ],
            'userRole' => $userRole, // Pass user role to frontend
            'unreadCount' => $unreadCount,
        ]);
    }
    public function viewAllAnnouncements(Request $request)
    {
        // Get query parameters for filtering
        $status = $request->query('status', 'all'); // 'all', 'active', 'upcoming', 'expired'
        
        // Base query
        $query = Announcement::query();
        
        // Apply date filtering based on status parameter
        $now = Carbon::now();
        
        if ($status === 'active') {
            $query->where(function($q) use ($now) {
                $q->where(function($q) use ($now) {
                    $q->whereNull('date_start')
                      ->orWhere('date_start', '<=', $now);
                })->where(function($q) use ($now) {
                    $q->whereNull('date_end')
                      ->orWhere('date_end', '>=', $now);
                });
            });
        } elseif ($status === 'upcoming') {
            $query->where('date_start', '>', $now);
        } elseif ($status === 'expired') {
            $query->where('date_end', '<', $now);
        }
        
        // Get user role for role-based visibility
        $userRole = Auth::user() ? Auth::user()->role : null;
        
        // Apply role-based visibility filter based on user role
        if ($userRole === 'admin') {
            // Admin sees all announcements (no visibility filter needed)
        } else {
            // Teachers and assistants only see announcements with visibility 'all' or matching their role
            $query->where(function($q) use ($userRole) {
                $q->where('visibility', 'all')
                  ->orWhere('visibility', $userRole);
            });
        }
        
        // Order by announcement date (most recent first)
        $query->orderBy('date_announcement', 'desc');
        
        // Execute query
        $announcements = $query->get();
        
        return Inertia::render('Menu/Announcements/AllAnnouncements', [
            'announcements' => $announcements,
            'filters' => [
                'status' => $status,
            ],
            'userRole' => $userRole, // Pass user role to frontend
        ]);
    }

    /**
     * Get announcements for dashboard widget
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getActiveAnnouncements()
    {
        $userRole = Auth::user() ? Auth::user()->role : null;
        $now = Carbon::now();
        
        $query = Announcement::query();
        
        // Apply role-based visibility filter based on user role
        if ($userRole === 'admin') {
            // Admin sees all announcements (no visibility filter needed)
        } else {
            // Teachers and assistants only see announcements with visibility 'all' or matching their role
            $query->where(function($q) use ($userRole) {
                $q->where('visibility', 'all')
                  ->orWhere('visibility', $userRole);
            });
        }
        
        // Apply active date filter
        $query->where(function($q) use ($now) {
            $q->where(function($subq) use ($now) {
                $subq->whereNull('date_start')
                     ->orWhere('date_start', '<=', $now);
            })->where(function($subq) use ($now) {
                $subq->whereNull('date_end')
                     ->orWhere('date_end', '>=', $now);
            });
        });
        
        $announcements = $query->orderBy('date_announcement', 'desc')
                              ->limit(5)
                              ->get();
        
        return response()->json($announcements);
    }

    /**
     * Show the form for creating a new resource.
     * 
     * @return \Inertia\Response
     */
    public function create()
    {
        // Only admins should be able to create announcements
        if (Auth::user()->role !== 'admin') {
            return redirect()->route('announcements.index')
                ->with('error', 'You do not have permission to create announcements.');
        }
        
        return Inertia::render('Announcements/Create');
    }

    /**
     * Store a newly created resource in storage.
     * 
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        // Only admins should be able to store announcements
        if (Auth::user()->role !== 'admin') {
            return redirect()->route('announcements.index')
                ->with('error', 'You do not have permission to create announcements.');
        }
        
        // Validate request data
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'date_announcement' => 'nullable|date',
            'date_start' => 'nullable|date',
            'date_end' => 'nullable|date|after_or_equal:date_start',
            'visibility' => 'required|string|in:all,teacher,assistant',
        ]);
        
        // Set default announcement date to now if not provided
        if (empty($validatedData['date_announcement'])) {
            $validatedData['date_announcement'] = Carbon::now();
        }
        
        // Create new announcement
        Announcement::create($validatedData);

        return redirect()->route('announcements.index')
            ->with('success', 'Announcement created successfully.');
    }

    /**
     * Display the specified resource.
     * 
     * @param Announcement $announcement
     * @return \Inertia\Response
     */
    public function show(Announcement $announcement)
    {
        // Check if user has permission to view this announcement
        $userRole = Auth::user()->role;
        
        // Admin can view all announcements, others can only view 'all' or those matching their role
        if ($userRole !== 'admin' && 
            $announcement->visibility !== 'all' && 
            $announcement->visibility !== $userRole) {
            return redirect()->route('announcements.index')
                ->with('error', 'You do not have permission to view this announcement.');
        }
        
        return Inertia::render('Menu/Announcement', [
            'announcement' => $announcement,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     * 
     * @param Announcement $announcement
     * @return \Inertia\Response
     */
    public function edit(Announcement $announcement)
    {
        // Only admins should be able to edit announcements
        if (Auth::user()->role !== 'admin') {
            return redirect()->route('announcements.index')
                ->with('error', 'You do not have permission to edit announcements.');
        }
        
        return Inertia::render('Announcements/Edit', [
            'announcement' => $announcement,
        ]);
    }

    /**
     * Update the specified resource in storage.
     * 
     * @param Request $request
     * @param Announcement $announcement
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Announcement $announcement)
    {
        // Only admins should be able to update announcements
        if (Auth::user()->role !== 'admin') {
            return redirect()->route('announcements.index')
                ->with('error', 'You do not have permission to update announcements.');
        }
        
        // Validate request data
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'date_announcement' => 'nullable|date',
            'date_start' => 'nullable|date',
            'date_end' => 'nullable|date|after_or_equal:date_start',
            'visibility' => 'required|string|in:all,teacher,assistant',
        ]);
        
        // Update announcement
        $announcement->update($validatedData);

        return redirect()->route('announcements.index')
            ->with('success', 'Announcement updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     * 
     * @param Announcement $announcement
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Announcement $announcement)
    {
        // Only admins should be able to delete announcements
        if (Auth::user()->role !== 'admin') {
            return redirect()->route('announcements.index')
                ->with('error', 'You do not have permission to delete announcements.');
        }
        
        $announcement->delete();

        return redirect()->route('announcements.index')
            ->with('success', 'Announcement deleted successfully.');
    }

    /**
     * Mark all visible announcements as read for the current user.
     */
    public function markAllRead(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        $userRole = $user->role;
        $now = Carbon::now();
        $query = Announcement::query();
        if ($userRole !== 'admin') {
            $query->where(function($q) use ($userRole) {
                $q->where('visibility', 'all')
                  ->orWhere('visibility', $userRole);
            });
        }
        $query->where(function($q) use ($now) {
            $q->where(function($subq) use ($now) {
                $subq->whereNull('date_start')
                     ->orWhere('date_start', '<=', $now);
            })->where(function($subq) use ($now) {
                $subq->whereNull('date_end')
                     ->orWhere('date_end', '>=', $now);
            });
        });
        $announcements = $query->get();
        foreach ($announcements as $announcement) {
            $alreadyRead = $announcement->reads()->where('user_id', $user->id)->exists();
            if (!$alreadyRead) {
                $announcement->reads()->create([
                    'user_id' => $user->id,
                    'read_at' => now(),
                ]);
            }
        }
        return back();
    }
}