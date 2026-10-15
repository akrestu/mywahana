import { Form, Head, Link, router } from '@inertiajs/react';
import { usePasskeyVerify } from '@laravel/passkeys/react';
import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store } from '@/routes/login';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

function PasskeyLogin() {
    const { verify, isLoading, error, isSupported } = usePasskeyVerify({
        onSuccess: (response) => router.visit(response.redirect ?? '/home'),
    });

    if (!isSupported) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2">
            <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={verify}
                loading={isLoading}
            >
                {!isLoading && <KeyRound />}
                {isLoading ? 'Memverifikasi…' : 'Masuk dengan passkey'}
            </Button>
            {error && <InputError message={error} className="text-center" />}
        </div>
    );
}

export default function Login({ status, canResetPassword }: Props) {
    const [remember, setRemember] = useState(false);

    return (
        <div className="flex min-h-svh bg-card lg:items-center lg:justify-center lg:bg-background lg:p-8">
            <Head title="Masuk" />

            <div className="relative isolate flex w-full flex-col overflow-hidden bg-card lg:max-w-4xl lg:flex-row lg:rounded-[28px] lg:shadow-[0_24px_60px_oklch(0.191_0_0/0.10)]">
                {/* Hero: Merapi Barat */}
                <div className="relative isolate flex h-[300px] shrink-0 flex-col justify-between px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6 sm:h-[360px] lg:h-auto lg:w-1/2 lg:pt-6">
                    <img
                        src="/images/mountain.jpg"
                        alt="Merapi Barat"
                        className="absolute inset-0 -z-20 size-full object-cover object-[62%_55%]"
                    />
                    <div
                        aria-hidden
                        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,oklch(0_0_0/0.30)_0%,transparent_40%,var(--card)_100%)] lg:bg-[linear-gradient(180deg,oklch(0_0_0/0.30)_0%,transparent_45%)]"
                    />
                    <div className="flex items-center gap-2.5 self-start rounded-full bg-white/90 py-1.5 pr-3.5 pl-1.5">
                        <img
                            src="/logo.png"
                            alt="Logo PT.WBK"
                            className="size-[30px]"
                        />
                        <span className="text-xs font-extrabold tracking-[0.1em] text-[oklch(0.191_0_0)]">
                            MYWAHANA
                        </span>
                    </div>
                    <span className="self-end text-xs font-semibold text-muted-foreground lg:text-white/85">
                        Merapi Barat
                    </span>
                </div>

                {/* Form */}
                <div className="relative isolate flex flex-1 flex-col gap-4 overflow-hidden px-6 pt-1 pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:justify-center lg:p-10">
                    <img
                        src="/images/topo.png"
                        alt=""
                        aria-hidden
                        className="pointer-events-none absolute -right-[300px] -bottom-[140px] -z-10 w-[760px] max-w-none opacity-35 dark:opacity-15 dark:invert"
                    />

                    <div>
                        <h1 className="text-[28px] font-extrabold tracking-tight">
                            Masuk ke MyWahana
                        </h1>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            Satu aplikasi untuk semua urusan kerja Anda.
                        </p>
                    </div>

                    {status && (
                        <div
                            role="status"
                            className="rounded-md bg-success-soft px-4 py-3 text-sm font-medium text-success"
                        >
                            {status}
                        </div>
                    )}

                    <Form
                        {...store()}
                        resetOnSuccess={['password']}
                        className="flex flex-col gap-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <Label
                                        htmlFor="nik"
                                        className="text-[13px] font-semibold"
                                    >
                                        NIK / NRPP
                                    </Label>
                                    <Input
                                        id="nik"
                                        type="text"
                                        name="nik"
                                        inputMode="numeric"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="username"
                                        placeholder="Nomor induk karyawan"
                                        aria-invalid={
                                            errors.nik ? true : undefined
                                        }
                                        className="h-[50px] text-[15px]"
                                    />
                                    <InputError message={errors.nik} />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label
                                        htmlFor="password"
                                        className="text-[13px] font-semibold"
                                    >
                                        Kata sandi
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Masukkan kata sandi"
                                        aria-invalid={
                                            errors.password ? true : undefined
                                        }
                                        className="h-[50px] text-[15px]"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex items-center justify-between text-[13px]">
                                    <label
                                        htmlFor="remember"
                                        className="flex min-h-11 cursor-pointer items-center gap-2 font-medium"
                                    >
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            checked={remember}
                                            onCheckedChange={(val) =>
                                                setRemember(val === true)
                                            }
                                            tabIndex={3}
                                            className="size-5"
                                        />
                                        Ingat saya
                                    </label>
                                    {canResetPassword && (
                                        <Link
                                            href="/forgot-password"
                                            className="font-semibold hover:underline"
                                            tabIndex={5}
                                        >
                                            Lupa kata sandi?
                                        </Link>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full"
                                    tabIndex={4}
                                    loading={processing}
                                    data-test="login-button"
                                >
                                    Masuk
                                </Button>
                            </>
                        )}
                    </Form>

                    <PasskeyLogin />

                    <p className="mt-auto pt-2 text-center text-xs text-muted-foreground">
                        Belum punya akses? Hubungi tim IT site Anda.
                    </p>
                </div>
            </div>
        </div>
    );
}
