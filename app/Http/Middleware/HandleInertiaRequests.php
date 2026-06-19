<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'avatar_url' => $user->avatar && \Illuminate\Support\Facades\Storage::disk('public')->exists($user->avatar)
                        ? \Illuminate\Support\Facades\Storage::disk('public')->url($user->avatar)
                        : null,
                ]) : null,
            ],
            'notifications' => fn () => $user
                ? $user->notifications()->latest()->take(15)->get()->map(fn ($n) => [
                    'id'         => $n->id,
                    'message'    => $n->data['message'],
                    'url'        => $n->data['url'] ?? null,
                    'read_at'    => $n->read_at,
                    'created_at' => $n->created_at,
                ])
                : [],
            'unread_notifications_count' => fn () => $user
                ? $user->unreadNotifications()->count()
                : 0,
            'vapidPublicKey' => config('webpush.vapid.public_key'),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'currentTeam' => fn () => $user?->currentTeam ? $user->toUserTeam($user->currentTeam) : null,
            'teams' => fn () => $user?->toUserTeams(includeCurrent: true) ?? [],
        ];
    }
}
