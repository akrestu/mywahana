<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStaff
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! in_array($user?->participation_level, ['staff', 'srstaff'])) {
            return redirect('/home');
        }

        return $next($request);
    }
}
