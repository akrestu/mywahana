import { PenLine, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Finger/mouse signature canvas. Reports whether something has been drawn
 * and, when `onDataUrl` is given, the PNG data URL after every stroke.
 */
export function SignaturePad({
    onChange,
    onDataUrl,
    label = 'Tanda tangan di sini',
}: {
    onChange?: (filled: boolean) => void;
    onDataUrl?: (dataUrl: string | null) => void;
    label?: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const callbacks = useRef({ onChange, onDataUrl });

    useEffect(() => {
        callbacks.current = { onChange, onDataUrl };
    }, [onChange, onDataUrl]);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext('2d')!;
        ctx.strokeStyle = getComputedStyle(canvas).color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const pos = (e: MouseEvent | Touch) => {
            const r = canvas.getBoundingClientRect();

            return {
                x: (e.clientX - r.left) * (canvas.width / r.width),
                y: (e.clientY - r.top) * (canvas.height / r.height),
            };
        };

        let dirty = false;

        const down = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            drawing.current = true;
            const p = pos('touches' in e ? e.touches[0] : e);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
        };
        const move = (e: MouseEvent | TouchEvent) => {
            if (!drawing.current) {
                return;
            }

            e.preventDefault();
            const p = pos('touches' in e ? e.touches[0] : e);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            dirty = true;
        };
        const up = () => {
            if (!drawing.current) {
                return;
            }

            drawing.current = false;

            if (dirty) {
                setIsEmpty(false);
                callbacks.current.onChange?.(true);
                callbacks.current.onDataUrl?.(canvas.toDataURL('image/png'));
            }
        };

        canvas.addEventListener('mousedown', down);
        canvas.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        canvas.addEventListener('touchstart', down, { passive: false });
        canvas.addEventListener('touchmove', move, { passive: false });
        canvas.addEventListener('touchend', up);

        return () => {
            canvas.removeEventListener('mousedown', down);
            canvas.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
            canvas.removeEventListener('touchstart', down);
            canvas.removeEventListener('touchmove', move);
            canvas.removeEventListener('touchend', up);
        };
    }, []);

    const clear = () => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
        onChange?.(false);
        onDataUrl?.(null);
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="relative overflow-hidden rounded-md border-2 border-dashed border-border bg-input">
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={240}
                    aria-label={label}
                    className="block w-full cursor-crosshair touch-none text-foreground"
                />
                {isEmpty && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <PenLine className="size-6 opacity-40" />
                        <p className="text-sm font-medium opacity-70">
                            {label}
                        </p>
                    </div>
                )}
            </div>
            {!isEmpty && (
                <button
                    type="button"
                    onClick={clear}
                    className="flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-muted-foreground transition-colors hover:text-destructive"
                >
                    <RotateCcw className="size-4" /> Ulangi tanda tangan
                </button>
            )}
        </div>
    );
}
