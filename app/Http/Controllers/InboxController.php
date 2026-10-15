<?php

namespace App\Http\Controllers;

use App\Services\InboxService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InboxController extends Controller
{
    public function index(Request $request, InboxService $inbox)
    {
        $user = $request->user();

        return Inertia::render('inbox/index', [
            'for_me' => $inbox->forMe($user),
            'submitted' => $inbox->submitted($user),
            'done' => Inertia::defer(fn () => $inbox->done($user)),
        ]);
    }
}
