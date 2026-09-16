import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Download, FileSpreadsheet, GraduationCap, Pencil, Plus, Search, Trash2, Upload, X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { DEPTS } from '@/lib/constants';

type Departemen = (typeof DEPTS)[number];
type Tags = 'S' | 'NS';
type Answer = 'A' | 'B' | 'C' | 'D';

type QuestionRecord = {
    id: number;
    departemen: Departemen;
    tags: Tags;
    question: string;
    jawaban_1: string;
    jawaban_2: string;
    jawaban_3: string;
    jawaban_4: string;
    jawaban_benar: 1 | 2 | 3 | 4;
    keterangan: string | null;
};

type PaginatedQuestions = {
    data: QuestionRecord[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    next_page_url: string | null;
    prev_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Filters = { search?: string; departemen?: string; tags?: string };
type Props = { questions: PaginatedQuestions; filters: Filters; departemenOptions: Departemen[] };

const ANSWER_LETTER: Record<1 | 2 | 3 | 4, Answer> = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };

type QuestionFormData = {
    departemen: Departemen | '';
    tags: Tags | '';
    question: string;
    jawaban_1: string;
    jawaban_2: string;
    jawaban_3: string;
    jawaban_4: string;
    kunci_jawaban: Answer | '';
    keterangan: string;
};

const emptyForm: QuestionFormData = {
    departemen: '', tags: '', question: '',
    jawaban_1: '', jawaban_2: '', jawaban_3: '', jawaban_4: '',
    kunci_jawaban: '', keterangan: '',
};

function QuestionFormDialog({ question, onClose }: { question: QuestionRecord | null | 'new'; onClose: () => void }) {
    const isEdit = question !== null && question !== 'new';
    const { data, setData, post, put, processing, errors, reset } = useForm<QuestionFormData>(
        isEdit
            ? {
                departemen: question.departemen,
                tags: question.tags,
                question: question.question,
                jawaban_1: question.jawaban_1,
                jawaban_2: question.jawaban_2,
                jawaban_3: question.jawaban_3,
                jawaban_4: question.jawaban_4,
                kunci_jawaban: ANSWER_LETTER[question.jawaban_benar],
                keterangan: question.keterangan ?? '',
            }
            : emptyForm,
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit) {
            put(`/admin/assessment/questions/${question.id}`, { onSuccess: () => {
 reset(); onClose(); 
} });
        } else {
            post('/admin/assessment/questions', { onSuccess: () => {
 reset(); onClose(); 
} });
        }
    };

    return (
        <Dialog open={question !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Soal' : 'Tambah Soal'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Departemen</Label>
                            <Select value={data.departemen} onValueChange={(v) => setData('departemen', v as Departemen)}>
                                <SelectTrigger className="text-sm"><SelectValue placeholder="Pilih departemen" /></SelectTrigger>
                                <SelectContent>
                                    {DEPTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.departemen && <p className="text-xs text-destructive">{errors.departemen}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Tags</Label>
                            <Select value={data.tags} onValueChange={(v) => setData('tags', v as Tags)}>
                                <SelectTrigger className="text-sm"><SelectValue placeholder="Pilih tags" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="S">S (Staff)</SelectItem>
                                    <SelectItem value="NS">NS (Non-Staff)</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.tags && <p className="text-xs text-destructive">{errors.tags}</p>}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Pertanyaan</Label>
                        <Textarea
                            value={data.question}
                            onChange={(e) => setData('question', e.target.value)}
                            rows={3}
                            placeholder="Tulis pertanyaan..."
                        />
                        {errors.question && <p className="text-xs text-destructive">{errors.question}</p>}
                    </div>

                    {(['jawaban_1', 'jawaban_2', 'jawaban_3', 'jawaban_4'] as const).map((field, i) => (
                        <div key={field} className="space-y-1.5">
                            <Label>Pilihan {String.fromCharCode(65 + i)}</Label>
                            <Input
                                value={data[field]}
                                onChange={(e) => setData(field, e.target.value)}
                                placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                            />
                            {errors[field] && <p className="text-xs text-destructive">{errors[field]}</p>}
                        </div>
                    ))}

                    <div className="space-y-1.5">
                        <Label>Kunci Jawaban</Label>
                        <Select value={data.kunci_jawaban} onValueChange={(v) => setData('kunci_jawaban', v as Answer)}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="Pilih jawaban benar" /></SelectTrigger>
                            <SelectContent>
                                {(['A', 'B', 'C', 'D'] as const).map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {errors.kunci_jawaban && <p className="text-xs text-destructive">{errors.kunci_jawaban}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Keterangan (opsional)</Label>
                        <Textarea
                            value={data.keterangan}
                            onChange={(e) => setData('keterangan', e.target.value)}
                            rows={2}
                            placeholder="Penjelasan jawaban..."
                        />
                        {errors.keterangan && <p className="text-xs text-destructive">{errors.keterangan}</p>}
                    </div>

                    <DialogFooter className="gap-2 pt-1">
                        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>Batal</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Menyimpan...' : 'Simpan'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminAssessmentQuestions({ questions, filters, departemenOptions }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [formTarget, setFormTarget] = useState<QuestionRecord | null | 'new'>(null);
    const [toDelete, setToDelete] = useState<QuestionRecord | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [selection, setSelection] = useState<{ key: string; ids: Set<number> }>({ key: '', ids: new Set() });
    const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);
    const [batchDeleting, setBatchDeleting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const pageIds = questions.data.map((q) => q.id);
    const pageKey = `${questions.current_page}:${filters.search ?? ''}:${filters.departemen ?? ''}:${filters.tags ?? ''}:${pageIds.join(',')}`;
    const selectedIds = selection.key === pageKey ? selection.ids : new Set<number>();
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

    const toggleSelection = (id: number) => {
        const next = new Set(selectedIds);

        if (next.has(id)) {
next.delete(id);
} else {
next.add(id);
}

        setSelection({ key: pageKey, ids: next });
    };
    const togglePage = () => setSelection({ key: pageKey, ids: allSelected ? new Set() : new Set(pageIds) });
    const confirmBatchDelete = () => {
        if (selectedIds.size === 0) {
return;
}

        setBatchDeleting(true);
        router.delete('/admin/assessment/questions/batch', {
            data: { ids: [...selectedIds] },
            onSuccess: () => {
 setSelection({ key: '', ids: new Set() }); setBatchConfirmOpen(false); 
},
            onFinish: () => setBatchDeleting(false),
        });
    };

    const { data, setData, post, processing, errors, reset } = useForm<{ file: File | null }>({ file: null });

    const applyFilters = (newFilters: Partial<Filters>) => {
        const merged = { ...filters, ...newFilters, search };
        const cleaned = Object.fromEntries(
            Object.entries(merged).filter(([, v]) => v !== undefined && v !== 'all' && v !== ''),
        );
        router.get('/admin/assessment/questions', cleaned, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const confirmDelete = () => {
        if (!toDelete) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/assessment/questions/${toDelete.id}`, {
            onFinish: () => {
 setDeleting(false); setToDelete(null); 
},
        });
    };

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/assessment/questions/import', { onSuccess: () => {
            reset();

            if (fileRef.current) {
fileRef.current.value = '';
}

            setImportOpen(false);
        } });
    };

    const hasActiveFilter = !!(filters.search || filters.departemen || filters.tags);
    const clearFilters = () => {
        setSearch('');
        router.get('/admin/assessment/questions', {}, { preserveState: false, replace: true });
    };

    return (
        <>
            <Head title="Admin — Bank Soal Assessment Safety" />

            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold">Bank Soal Assessment Safety</h2>
                        <p className="text-sm text-muted-foreground">{questions.total} soal tersimpan dalam sistem</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <a href="/admin/assessment/questions/export">
                            <Button size="sm" variant="outline" className="gap-1.5">
                                <Download size={14} /> Export
                            </Button>
                        </a>
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setImportOpen(true)}>
                            <Upload size={14} /> Import
                        </Button>
                        <Button size="sm" className="gap-1.5" onClick={() => setFormTarget('new')}>
                            <Plus size={14} /> Tambah Soal
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <form onSubmit={handleSearch} className="flex min-w-52 flex-1 gap-2">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari pertanyaan..."
                                className="pl-8 text-sm"
                            />
                        </div>
                        <Button type="submit" size="sm" variant="outline">Cari</Button>
                    </form>

                    <Select value={filters.departemen ?? 'all'} onValueChange={(v) => applyFilters({ departemen: v })}>
                        <SelectTrigger className="w-40 text-sm"><SelectValue placeholder="Semua Departemen" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Departemen</SelectItem>
                            {departemenOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filters.tags ?? 'all'} onValueChange={(v) => applyFilters({ tags: v })}>
                        <SelectTrigger className="w-32 text-sm"><SelectValue placeholder="Semua Tags" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Tags</SelectItem>
                            <SelectItem value="S">S</SelectItem>
                            <SelectItem value="NS">NS</SelectItem>
                        </SelectContent>
                    </Select>

                    {hasActiveFilter && (
                        <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={clearFilters}>
                            <X size={13} /> Reset
                        </Button>
                    )}
                </div>

                <p className="text-xs text-muted-foreground">
                    {questions.from !== null && questions.to !== null
                        ? `Menampilkan ${questions.from}–${questions.to} dari ${questions.total} soal`
                        : `${questions.total} soal`}
                    {hasActiveFilter && ' (terfilter)'}
                </p>

                {questions.data.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox checked={allSelected} onCheckedChange={togglePage} aria-label="Pilih semua soal di halaman ini" />
                            Pilih semua di halaman ini
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{selectedIds.size} soal dipilih</span>
                            <Button size="sm" variant="destructive" className="gap-1.5" disabled={selectedIds.size === 0} onClick={() => setBatchConfirmOpen(true)}>
                                <Trash2 size={14} /> Hapus Terpilih
                            </Button>
                        </div>
                    </div>
                )}

                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="w-10"><span className="sr-only">Pilih</span></TableHead>
                                <TableHead className="w-14 text-center">ID</TableHead>
                                <TableHead>Pertanyaan</TableHead>
                                <TableHead className="w-32">Departemen</TableHead>
                                <TableHead className="w-16 text-center">Tags</TableHead>
                                <TableHead className="w-20 text-center">Kunci</TableHead>
                                <TableHead className="w-24 text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {questions.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                                            <GraduationCap size={36} className="text-muted-foreground/30" />
                                            <p className="text-sm text-muted-foreground">Tidak ada soal yang sesuai filter.</p>
                                            {hasActiveFilter && (
                                                <Button size="sm" variant="outline" onClick={clearFilters}>Reset filter</Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                questions.data.map((q) => (
                                    <TableRow key={q.id}>
                                        <TableCell><Checkbox checked={selectedIds.has(q.id)} onCheckedChange={() => toggleSelection(q.id)} aria-label={`Pilih soal ${q.id}`} /></TableCell>
                                        <TableCell className="text-center text-xs text-muted-foreground">
                                            {q.id}
                                        </TableCell>
                                        <TableCell className="max-w-md">
                                            <p className="line-clamp-2 text-sm">{q.question}</p>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{q.departemen}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="text-xs">{q.tags}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="text-xs">{ANSWER_LETTER[q.jawaban_benar]}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="icon" variant="ghost"
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                    onClick={() => setFormTarget(q)}
                                                >
                                                    <Pencil size={14} />
                                                </Button>
                                                <Button
                                                    size="icon" variant="ghost"
                                                    className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => setToDelete(q)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {questions.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <p className="text-xs text-muted-foreground">
                            Halaman {questions.current_page} dari {questions.last_page}
                        </p>
                        <div className="flex items-center gap-1">
                            {questions.prev_page_url ? (
                                <Link href={questions.prev_page_url}>
                                    <Button variant="outline" size="sm" className="h-8 px-2 text-xs">← Sebelumnya</Button>
                                </Link>
                            ) : (
                                <Button variant="outline" size="sm" className="h-8 px-2 text-xs" disabled>← Sebelumnya</Button>
                            )}
                            {questions.next_page_url ? (
                                <Link href={questions.next_page_url}>
                                    <Button variant="outline" size="sm" className="h-8 px-2 text-xs">Berikutnya →</Button>
                                </Link>
                            ) : (
                                <Button variant="outline" size="sm" className="h-8 px-2 text-xs" disabled>Berikutnya →</Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {formTarget !== null && <QuestionFormDialog question={formTarget} onClose={() => setFormTarget(null)} />}

            {/* ── Dialog: Konfirmasi Hapus ── */}
            <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Soal?</DialogTitle>
                        <DialogDescription className="space-y-1">
                            <span className="block">Anda akan menghapus soal ini secara permanen.</span>
                            <span className="block text-amber-600 dark:text-amber-400">
                                Riwayat jawaban peserta yang pernah mengerjakan soal ini juga akan ikut terhapus dari statistik.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setToDelete(null)} disabled={deleting}>Batal</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={batchConfirmOpen} onOpenChange={(open) => {
 if (!batchDeleting) {
setBatchConfirmOpen(open);
} 
}}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus {selectedIds.size} Soal?</DialogTitle>
                        <DialogDescription>
                            Soal yang dipilih di halaman ini akan dihapus permanen. Statistik jawaban peserta untuk soal tersebut juga akan terhapus.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setBatchConfirmOpen(false)} disabled={batchDeleting}>Batal</Button>
                        <Button variant="destructive" onClick={confirmBatchDelete} disabled={batchDeleting || selectedIds.size === 0}>
                            {batchDeleting ? 'Menghapus...' : 'Ya, Hapus Soal'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Import Excel ── */}
            <Dialog open={importOpen} onOpenChange={(open) => {
 if (!processing) {
 setImportOpen(open); 
} 
}}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet size={18} className="text-primary" />
                            Import Soal dari Excel
                        </DialogTitle>
                        <DialogDescription>
                            Isi kolom ID untuk memperbarui soal yang sudah ada, atau kosongkan untuk menambah soal baru.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Langkah 1 — Download template</p>
                        <a
                            href="/admin/assessment/questions/import-template"
                            className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3 transition-colors hover:bg-muted"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background border">
                                <Download size={16} className="text-primary" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium">Download Template Excel</p>
                                <p className="text-xs text-muted-foreground">Atau export soal yang sudah ada untuk diedit</p>
                            </div>
                        </a>
                    </div>

                    <div className="relative flex items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Langkah 2 — Upload file</span>
                        <div className="h-px flex-1 bg-border" />
                    </div>

                    <form onSubmit={handleImport} className="space-y-3">
                        <div className={`relative overflow-hidden rounded-lg border-2 border-dashed transition-colors ${data.file ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/40'}`}>
                            {data.file ? (
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                        <FileSpreadsheet size={16} className="text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium" title={data.file.name}>
                                            {data.file.name.length > 30
                                                ? data.file.name.slice(0, 13) + '…' + data.file.name.slice(-12)
                                                : data.file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{(data.file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
 setData('file', null);

 if (fileRef.current) {
 fileRef.current.value = ''; 
} 
}}
                                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex cursor-pointer flex-col items-center gap-1.5 px-4 py-6 text-center">
                                    <Upload size={20} className="text-muted-foreground/50" />
                                    <span className="text-sm font-medium">Pilih file Excel</span>
                                    <span className="text-xs text-muted-foreground">Format: .xlsx atau .xls</span>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        className="sr-only"
                                        onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                                    />
                                </label>
                            )}
                        </div>
                        {errors.file && <p className="text-sm text-destructive">{errors.file}</p>}

                        <DialogFooter className="gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={() => setImportOpen(false)} disabled={processing}>Batal</Button>
                            <Button type="submit" disabled={processing || !data.file} className="gap-2">
                                {processing ? (
                                    <>
                                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Mengupload...
                                    </>
                                ) : (
                                    <><Upload size={14} /> Upload & Import</>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
