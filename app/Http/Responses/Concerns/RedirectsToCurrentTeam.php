<?php

namespace App\Http\Responses\Concerns;

use Illuminate\Support\Facades\URL;

trait RedirectsToCurrentTeam
{
    protected function redirectPathForCurrentTeam($request, string $redirect): string
    {
        $team = $this->currentTeam($request);

        URL::defaults(['current_team' => $team->slug]);

        return "/{$team->slug}{$redirect}";
    }

    protected function resolveAdminOrTeamRedirect($request, string $redirect): string
    {
        $user = $request->user();

        if ($user?->is_admin) {
            return '/admin';
        }

        return $this->redirectPathForCurrentTeam($request, $redirect);
    }

    protected function currentTeam($request)
    {
        $user = $request->user();
        $team = $user?->currentTeam ?? $user?->personalTeam() ?? $user?->teams()->first();

        if (! $team) {
            abort(403);
        }

        return $team;
    }
}
