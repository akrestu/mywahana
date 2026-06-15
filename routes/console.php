<?php

use App\Console\Commands\ExpireAssessments;
use App\Console\Commands\SendBugarSelamatReminder;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command(SendBugarSelamatReminder::class)->dailyAt('07:00');
Schedule::command(ExpireAssessments::class)->everyMinute();
