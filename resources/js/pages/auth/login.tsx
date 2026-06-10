import { Form, Head } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';

const GREETINGS = [
    'Selamat datang!',
    'Welcome!',
    'Bienvenue!',
    'Bienvenido!',
    'Willkommen!',
    'Benvenuto!',
    'Добро пожаловать!',
    'こんにちは！',
    '欢迎！',
    'مرحباً!',
];

const TYPING_SPEED = 60;
const DELETING_SPEED = 35;
const PAUSE_AFTER_TYPE = 1800;
const PAUSE_AFTER_DELETE = 300;

function useTypingGreeting(words: string[]) {
    const [displayed, setDisplayed] = useState('');
    const [wordIndex, setWordIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        const current = words[wordIndex];

        const tick = () => {
            if (!isDeleting) {
                const next = current.slice(0, displayed.length + 1);
                setDisplayed(next);
                if (next === current) {
                    timeoutRef.current = setTimeout(() => setIsDeleting(true), PAUSE_AFTER_TYPE);
                } else {
                    timeoutRef.current = setTimeout(tick, TYPING_SPEED);
                }
            } else {
                const next = current.slice(0, displayed.length - 1);
                setDisplayed(next);
                if (next === '') {
                    setIsDeleting(false);
                    setWordIndex((i) => (i + 1) % words.length);
                    timeoutRef.current = setTimeout(() => {}, PAUSE_AFTER_DELETE);
                } else {
                    timeoutRef.current = setTimeout(tick, DELETING_SPEED);
                }
            }
        };

        timeoutRef.current = setTimeout(tick, isDeleting ? DELETING_SPEED : TYPING_SPEED);
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [displayed, isDeleting, wordIndex, words]);

    return displayed;
}

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    const greeting = useTypingGreeting(GREETINGS);

    return (
        <div className="flex min-h-svh items-center justify-center bg-muted/50 p-4">
            <Head title="Masuk" />

            <Card className="w-full max-w-sm rounded-3xl border border-border/60 px-2 py-8 shadow-sm">
                <CardContent>
                    <div className="flex flex-col items-center gap-8">

                        {/* Logo */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl">
                                <AppLogoIcon className="size-14 object-contain" />
                            </div>
                            <span className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">
                                MyWahana
                            </span>
                        </div>

                        {/* Heading */}
                        <div className="space-y-1.5 text-center">
                            <h1 className="inline-flex min-h-[2.25rem] items-center text-3xl font-semibold text-foreground">
                                {greeting}
                                <span className="ml-0.5 inline-block h-[1.15em] w-[2px] animate-pulse rounded-full bg-foreground align-middle" />
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Masuk menggunakan NIK / NRPP karyawan
                            </p>
                        </div>

                        {/* Status message */}
                        {status && (
                            <div className="w-full rounded-xl bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                                {status}
                            </div>
                        )}

                        {/* Form */}
                        <Form
                            {...store()}
                            resetOnSuccess={['password']}
                            className="w-full space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="nik" className="block text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                            NIK / NRPP
                                        </Label>
                                        <Input
                                            id="nik"
                                            type="text"
                                            name="nik"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="username"
                                            placeholder="Nomor Induk Karyawan"
                                            className="h-11 rounded-xl bg-muted/50 border-0 px-4 focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                        <InputError message={errors.nik} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="password" className="block text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                            Password
                                        </Label>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder="Masukkan password"
                                            className="h-11 rounded-xl bg-muted/50 border-0 px-4 focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex items-center justify-center gap-2 pt-1">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            tabIndex={3}
                                        />
                                        <Label
                                            htmlFor="remember"
                                            className="cursor-pointer text-sm font-normal text-muted-foreground"
                                        >
                                            Ingat saya
                                        </Label>
                                    </div>

                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="mt-2 w-full rounded-xl"
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing && <Spinner />}
                                        Masuk
                                    </Button>
                                </>
                            )}
                        </Form>

                        {/* Footer note */}
                        <p className="w-10/12 text-center text-xs text-muted-foreground">
                            Belum memiliki akses? Hubungi{' '}
                            <span className="font-medium text-foreground">
                                administrator
                            </span>{' '}
                            untuk mendapatkan akun.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

