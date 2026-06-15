import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

interface Props {
    open: boolean;
    onCapture: (file: File) => void;
    onClose: () => void;
}

export function CameraCapture({ open, onCapture, onClose }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [ready, setReady] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            stopStream();
            setReady(false);
            setError(null);
            return;
        }
        startCamera();
        return stopStream;
    }, [open]);

    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setReady(true);
                };
            }
        } catch {
            setError('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan di pengaturan aplikasi.');
        }
    }

    function stopStream() {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }

    function capture() {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !ready || capturing) return;
        setCapturing(true);
        const MAX_WIDTH = 1280;
        const scale = video.videoWidth > MAX_WIDTH ? MAX_WIDTH / video.videoWidth : 1;
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
            setCapturing(false);
            if (!blob) return;
            const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
        }, 'image/jpeg', 0.82);
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[999] bg-black flex flex-col" style={{ touchAction: 'none' }}>
            <div className="flex items-center justify-between px-4 py-3 shrink-0">
                <span className="text-white text-base font-semibold">Ambil Foto</span>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 relative overflow-hidden">
                {error ? (
                    <div className="flex h-full items-center justify-center px-8 text-center text-white text-sm leading-relaxed">
                        {error}
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex items-center justify-center py-10 shrink-0">
                <button
                    type="button"
                    onClick={capture}
                    disabled={!ready || !!error || capturing}
                    className="flex size-20 items-center justify-center rounded-full bg-white shadow-lg disabled:opacity-40 active:scale-95 transition-transform"
                >
                    {capturing ? (
                        <svg className="animate-spin text-black" width={34} height={34} viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                    ) : (
                        <Camera size={34} className="text-black" />
                    )}
                </button>
            </div>
        </div>
    );
}
