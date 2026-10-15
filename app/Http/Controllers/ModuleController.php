<?php

namespace App\Http\Controllers;

use App\Services\InboxService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ModuleController extends Controller
{
    public function index(Request $request, InboxService $inbox)
    {
        return Inertia::render('modules/index', [
            'counts' => [
                'k3' => $inbox->countForMe($request->user()),
            ],
        ]);
    }
}
