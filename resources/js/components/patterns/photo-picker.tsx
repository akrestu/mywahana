import { Camera, Images, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CameraCapture } from '@/components/camera-capture';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { compressImageWithToast } from '@/lib/compress-image';

const SOURCES = [
    { key: 'camera' as const, label: 'Kamera', Icon: Camera },
    { key: 'gallery' as const, label: 'Galeri', Icon: Images },
];

/** Up to `max` photos from camera or gallery, compressed on the device before upload. */
export function PhotoPicker({
    value,
    onChange,
    max = 2,
    label = 'Foto temuan',
}: {
    value: File[];
    onChange: (files: File[]) => void;
    max?: number;
    label?: string;
}) {
    const galleryRef = useRef<HTMLInputElement>(null);
    const [sourceOpen, setSourceOpen] = useState(false);
    const [cameraOpen, setCameraOpen] = useState(false);

    const previews = useMemo(
        () => value.map((f) => URL.createObjectURL(f)),
        [value],
    );
    useEffect(
        () => () => previews.forEach((u) => URL.revokeObjectURL(u)),
        [previews],
    );

    const add = async (file: File) => {
        const compressed = await compressImageWithToast(file, 1600, 0.8);
        onChange([...value, compressed].slice(0, max));
    };

    const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

    const pickSource = (source: 'camera' | 'gallery') => {
        setSourceOpen(false);

        if (source === 'camera') {
            setCameraOpen(true);
        } else {
            galleryRef.current?.click();
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold">{label}</span>
            <div className="grid grid-cols-2 gap-2.5">
                {previews.map((src, i) => (
                    <div
                        key={src}
                        className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted"
                    >
                        <img
                            src={src}
                            alt={`Foto ${i + 1}`}
                            className="size-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => remove(i)}
                            aria-label={`Hapus foto ${i + 1}`}
                            className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                ))}
                {value.length < max && (
                    <button
                        type="button"
                        onClick={() => setSourceOpen(true)}
                        className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card text-sm font-bold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                            <Camera className="size-5" strokeWidth={1.8} />
                        </span>
                        Ambil foto
                    </button>
                )}
            </div>
            <p className="text-xs text-muted-foreground">
                Maks. {max} foto · dikompres otomatis
            </p>

            <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';

                    if (file) {
                        await add(file);
                    }
                }}
            />

            <Sheet open={sourceOpen} onOpenChange={setSourceOpen}>
                <SheetContent
                    side="bottom"
                    className="mx-auto max-w-lg gap-0 border-0 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
                >
                    <div
                        className="mx-auto mt-3 h-1 w-10 rounded-full bg-border"
                        aria-hidden
                    />
                    <SheetHeader className="px-0 pb-4">
                        <SheetTitle className="text-left text-xl font-extrabold">
                            Tambah foto
                        </SheetTitle>
                        <SheetDescription className="text-left">
                            Foto jelas membantu PIC menindaklanjuti lebih cepat.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid grid-cols-2 gap-3">
                        {SOURCES.map(({ key, label: l, Icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => pickSource(key)}
                                className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-lg bg-muted text-sm font-bold hover:bg-accent-soft"
                            >
                                <Icon className="size-6" strokeWidth={1.7} />
                                {l}
                            </button>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>

            <CameraCapture
                open={cameraOpen}
                onCapture={async (file) => {
                    setCameraOpen(false);
                    await add(file);
                }}
                onClose={() => setCameraOpen(false)}
            />
        </div>
    );
}
