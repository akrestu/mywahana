import { Form } from '@inertiajs/react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400">
                <strong>Perhatian:</strong> Menghapus akun bersifat permanen dan tidak dapat dibatalkan. Semua data Anda akan ikut terhapus.
            </p>

            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="destructive"
                        className="w-full h-11"
                        data-test="delete-user-button"
                    >
                        Hapus Akun Saya
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle>Hapus Akun?</DialogTitle>
                    <DialogDescription>
                        Akun dan seluruh data Anda akan dihapus secara permanen. Tindakan ini <strong>tidak dapat dibatalkan</strong>.
                        <br /><br />
                        Masukkan kata sandi Anda untuk mengonfirmasi.
                    </DialogDescription>

                    <Form
                        {...ProfileController.destroy.form()}
                        options={{ preserveScroll: true }}
                        onError={() => passwordInput.current?.focus()}
                        resetOnSuccess
                        className="space-y-4"
                    >
                        {({ resetAndClearErrors, processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="text-sm font-medium">
                                        Kata Sandi
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        ref={passwordInput}
                                        placeholder="Masukkan kata sandi Anda"
                                        autoComplete="current-password"
                                        className="h-11 text-base"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button
                                            variant="secondary"
                                            className="flex-1"
                                            onClick={() => resetAndClearErrors()}
                                        >
                                            Batal
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        variant="destructive"
                                        disabled={processing}
                                        className="flex-1"
                                        asChild
                                    >
                                        <button type="submit" data-test="confirm-delete-user-button">
                                            {processing ? 'Menghapus...' : 'Ya, Hapus Akun'}
                                        </button>
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
