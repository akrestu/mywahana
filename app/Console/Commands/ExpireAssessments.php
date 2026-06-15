<?php

namespace App\Console\Commands;

use App\Models\AssessmentSession;
use App\Models\HrAssessmentSession;
use Illuminate\Console\Command;

class ExpireAssessments extends Command
{
    protected $signature = 'assessments:expire';
    protected $description = 'Auto-complete assessment sessions that have exceeded the time limit';

    public function handle(): int
    {
        $safety = AssessmentSession::expireAllOverdue();
        $hr = HrAssessmentSession::expireAllOverdue();

        if ($safety + $hr > 0) {
            $this->info("Expired {$safety} safety and {$hr} HR assessment session(s).");
        }

        return Command::SUCCESS;
    }
}
