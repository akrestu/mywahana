<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Minishlink\WebPush\WebPush;
use NotificationChannels\WebPush\WebPushChannel;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureWebPush();
    }

    /**
     * Tanpa logger, WebPush memakai trigger_error() untuk peringatan seperti
     * "GMP/BCMath belum terpasang", yang oleh Laravel diubah menjadi exception
     * sehingga setiap notifikasi (mis. ke PIC Laporan Bahaya) berakhir 500.
     * Dengan logger, peringatan itu cukup masuk ke log.
     */
    protected function configureWebPush(): void
    {
        $this->app->when(WebPushChannel::class)
            ->needs(WebPush::class)
            ->give(fn (): WebPush => (new WebPush(
                $this->webPushAuth(),
                [],
                30,
                config('webpush.client_options', []),
                Log::channel(),
            ))
                ->setReuseVAPIDHeaders(true)
                ->setAutomaticPadding(config('webpush.automatic_padding')));
    }

    /**
     * Sama dengan WebPushServiceProvider::webPushAuth() bawaan paket.
     *
     * @return array<string, array<string, string>>
     */
    protected function webPushAuth(): array
    {
        $vapid = config('webpush.vapid');

        if (empty($vapid['public_key']) || empty($vapid['private_key'])) {
            return [];
        }

        $auth = [
            'publicKey' => $vapid['public_key'],
            'privateKey' => $vapid['private_key'],
            'subject' => $vapid['subject'] ?: url('/'),
        ];

        if (! empty($vapid['pem_file'])) {
            $auth['pemFile'] = Str::startsWith($vapid['pem_file'], 'storage')
                ? base_path($vapid['pem_file'])
                : $vapid['pem_file'];
        }

        return ['VAPID' => $auth];
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
