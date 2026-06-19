<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;

class NotificationController extends Controller
{
    public function markRead(string $id): RedirectResponse
    {
        auth()->user()->notifications()->where('id', $id)->update(['read_at' => now()]);

        return back();
    }

    public function markAllRead(): RedirectResponse
    {
        auth()->user()->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }

    public function clearAll(): RedirectResponse
    {
        auth()->user()->notifications()->delete();

        return back();
    }
}
