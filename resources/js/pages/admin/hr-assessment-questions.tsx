import { Head, router, useForm } from '@inertiajs/react';
import {
    Download, FileSpreadsheet, Pencil, Plus, Trash2, Upload, X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { AdminTitle } from '@/components/admin/admin-title';
import {
    adminButton,
    adminButtonPrimary,
    DataTable,
    FilterBar,
    MoreMenu,
    rowClass,
    SearchField,
    SelectionAction,
    SelectionBar,
    TableCard,
    TableEmpty,
    TablePager,
    theadRowClass,
} from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type Answer = 'A' | 'B' | 'C' | 'D';

type QuestionRecord = {
    id: number;
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

type Filters = { search?: string };
type Props = { questions: PaginatedQuestions; filters: Filters };

const ANSWER_LETTER: Record<1 | 2 | 3 | 4, Answer> = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };

type QuestionFormData = {
    question: string;
    jawaban_1: string;
    jawaban_2: string;
    jawaban_3: string;
    jawaban_4: string;
    kunci_jawaban: Answer | '';
    keterangan: string;
};

const emptyForm: QuestionFormData = {
    question: '', jawaban_1: '', jawaban_2: '', jawaban_3: '', jawaban_4: '', kunci_jawaban: '', keterangan: '',
};

function QuestionFormDialog({ question, onClose }: { question: QuestionRecord | null | 'new'; onClose: () => void }) {
    const isEdit = question !== null && question !== 'new';
    const { data, setData, post, put, processing, errors, reset } = useForm<QuestionFormData>(
        isEdit
            ? {
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
            put(`/admin/hr-assessment/questions/${question.id}`, { onSuccess: () => {
 reset(); onClose(); 
} });
        } else {
            post('/admin/hr-assessment/questions', { onSuccess: () => {
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

export default function AdminHrAssessmentQuestions({ questions, filters }: Props) {
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
    const pageKey = `${questions.current_page}:${filters.search ?? ''}:${pageIds.join(',')}`;
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
        router.delete('/admin/hr-assessment/questions/batch', {
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
            Object.entries(merged).filter(([, v]) => v !== undefined && v !== ''),
        );
        router.get('/admin/hr-assessment/questions', cleaned, { preserveState: true, replace: true });
    };

    const confirmDelete = () => {
        if (!toDelete) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/hr-assessment/questions/${toDelete.id}`, {
            onFinish: () => {
 setDeleting(false); setToDelete(null); 
},
        });
    };

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/hr-assessment/questions/import', { onSuccess: () => {
            reset();

            if (fileRef.current) {
fileRef.current.value = '';
}

            setImportOpen(false);
        } });
    };

    const hasActiveFilter = !!filters.search;
    const clearFilters = () => {
        setSearch('');
        router.get('/admin/hr-assessment/questions', {}, { preserveState: false, replace: true });
    };

    return (
        <>
            <Head title="Admin — Bank Soal HR Assessment" />

            <div className="flex flex-col gap-[18px] pb-10">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <AdminTitle
                        eyebrow="Assessment"
                        title="Bank Soal HR Assessment"
                        description={questions.total + ' soal tersimpan'}
                    />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setImportOpen(true)}
                            className={adminButton}
                        >
                            Impor Excel
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormTarget('new')}
                            className={adminButtonPrimary}
                        >
                            <Plus /> Tambah soal
                        </button>
                        <MoreMenu>
                            <DropdownMenuItem asChild>
                                <a href="/admin/hr-assessment/questions/export">
                                    <Download /> Ekspor Excel
                                </a>
                            </DropdownMenuItem>
                        </MoreMenu>
                    </div>
                </div>

                <FilterBar>
                    <SearchField
                        value={search}
                        onChange={setSearch}
                        onSubmit={() => applyFilters({ search })}
                        placeholder="Cari pertanyaan…"
                        label="Cari soal"
                    />
                    {hasActiveFilter && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="h-10 px-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
                        >
                            Reset filter
                        </button>
                    )}
                </FilterBar>

                <SelectionBar
                    count={selectedIds.size}
                    onClear={() => setSelection({ key: pageKey, ids: new Set() })}
                >
                    <SelectionAction onClick={() => setBatchConfirmOpen(true)}>
                        <Trash2 /> Hapus
                    </SelectionAction>
                </SelectionBar>

                <TableCard
                    footer={
                        <TablePager
                            from={questions.from}
                            to={questions.to}
                            total={questions.total}
                            prev={questions.prev_page_url}
                            next={questions.next_page_url}
                        />
                    }
                >
                    {questions.data.length === 0 ? (
                        <TableEmpty>Tidak ada soal yang sesuai filter.</TableEmpty>
                    ) : (
                        <DataTable className="min-w-[760px]">
                            <thead>
                                <tr className={theadRowClass}>
                                    <th className="w-12">
                                        <Checkbox
                                            checked={
                                                allSelected
                                                    ? true
                                                    : selectedIds.size > 0
                                                      ? 'indeterminate'
                                                      : false
                                            }
                                            onCheckedChange={togglePage}
                                            aria-label="Pilih semua soal di halaman ini"
                                        />
                                    </th>
                                    <th className="w-14">ID</th>
                                    <th>Pertanyaan</th>
                                    <th>Kunci</th>
                                    <th>
                                        <span className="sr-only">Aksi</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {questions.data.map((q) => (
                                    <tr
                                        key={q.id}
                                        className={rowClass(selectedIds.has(q.id))}
                                    >
                                        <td>
                                            <Checkbox
                                                checked={selectedIds.has(q.id)}
                                                onCheckedChange={() =>
                                                    toggleSelection(q.id)
                                                }
                                                aria-label={'Pilih soal ' + q.id}
                                            />
                                        </td>
                                        <td className="tabular text-muted-foreground">
                                            {q.id}
                                        </td>
                                        <td className="max-w-md">
                                            <button
                                                type="button"
                                                onClick={() => setFormTarget(q)}
                                                className="line-clamp-2 text-left font-semibold hover:underline"
                                            >
                                                {q.question}
                                            </button>
                                        </td>
                                        <td>
                                            <Badge variant="ink">
                                                {ANSWER_LETTER[q.jawaban_benar]}
                                            </Badge>
                                        </td>
                                        <td className="text-right whitespace-nowrap">
                                            <button
                                                type="button"
                                                aria-label="Ubah"
                                                onClick={() => setFormTarget(q)}
                                                className="inline-flex size-8 items-center justify-center rounded-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
                                            >
                                                <Pencil className="size-4" />
                                            </button>
                                            <button
                                                type="button"
                                                aria-label="Hapus"
                                                onClick={() => setToDelete(q)}
                                                className="inline-flex size-8 items-center justify-center rounded-[10px] text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </DataTable>
                    )}
                </TableCard>
            </div>

            {formTarget !== null && <QuestionFormDialog question={formTarget} onClose={() => setFormTarget(null)} />}

            {/* ── Dialog: Konfirmasi Hapus ── */}
            <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Soal?</DialogTitle>
                        <DialogDescription className="space-y-1">
                            <span className="block">Anda akan menghapus soal ini secara permanen.</span>
                            <span className="block text-warning">
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
                            href="/admin/hr-assessment/questions/import-template"
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
