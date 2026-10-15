export type Kelayakan = 'layak' | 'catatan' | 'dilarang';
export type StatusTindakan = 'pending' | 'continue' | 'progress' | 'close';

export const kelayakanLabels: Record<Kelayakan, string> = {
    layak: 'Layak Bekerja',
    catatan: 'Bekerja dengan Catatan',
    dilarang: 'Dilarang Bekerja',
};

// UI labels only; database values stay pending/continue/progress/close.
export const tindakanLabels: Record<StatusTindakan, string> = {
    pending: 'Menunggu',
    continue: 'Berlanjut',
    progress: 'Diproses',
    close: 'Selesai',
};
