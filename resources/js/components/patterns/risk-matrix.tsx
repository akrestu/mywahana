import { computeRisk, riskLabels } from '@/lib/risk';
import type { RiskLevel } from '@/lib/risk';
import { cn } from '@/lib/utils';
import { choiceChip } from './choice-card';

export type RiskOption = { value: string; label: string; sub: string };
export type RiskAxis = 'probabilitas' | 'frekuensi' | 'severity';

const RESULT: Record<RiskLevel, { card: string; desc: string }> = {
    AA: {
        card: 'bg-risk-extreme text-on-solid',
        desc: 'Sangat berbahaya — hentikan pekerjaan segera.',
    },
    A: {
        card: 'bg-destructive-soft text-destructive',
        desc: 'Berbahaya — perlu tindakan segera.',
    },
    B: {
        card: 'bg-warning-soft text-warning',
        desc: 'Sedang — perlu dipantau dan ditangani.',
    },
    C: {
        card: 'bg-success-soft text-success',
        desc: 'Rendah — aman terkendali.',
    },
};

/**
 * Three rows of chips (P, F, S). The result card updates live so the
 * reporter sees how each choice moves the risk value.
 */
export function RiskMatrix({
    axes,
    value,
    onChange,
    errors = {},
}: {
    axes: { key: RiskAxis; title: string; options: RiskOption[] }[];
    value: Record<RiskAxis, string>;
    onChange: (key: RiskAxis, value: string) => void;
    errors?: Partial<Record<RiskAxis, string>>;
}) {
    const p = Number(value.probabilitas) || 0;
    const f = Number(value.frekuensi) || 0;
    const s = Number(value.severity) || 0;
    const risk = p && f && s ? computeRisk(p, f, s) : null;

    return (
        <div className="flex flex-col gap-4">
            <div
                aria-live="polite"
                className={cn(
                    'flex items-center gap-4 rounded-[22px] p-[18px] transition-colors duration-300',
                    risk
                        ? RESULT[risk.level].card
                        : 'bg-muted text-muted-foreground',
                )}
            >
                <div className="flex size-[72px] shrink-0 flex-col items-center justify-center rounded-full bg-card/80 text-foreground">
                    <span className="text-[10px] font-bold tracking-[0.1em] text-muted-foreground">
                        NILAI
                    </span>
                    <span className="tabular text-2xl font-extrabold">
                        {risk ? risk.nilai : '—'}
                    </span>
                </div>
                <div className="min-w-0">
                    {risk ? (
                        <>
                            <p className="text-lg font-extrabold">
                                {riskLabels[risk.level]} · {risk.level}
                            </p>
                            <p className="text-[13px]">
                                {RESULT[risk.level].desc}
                            </p>
                            <p className="tabular mt-1 text-xs opacity-80">
                                {p} × {f} × {s} = {risk.nilai}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm font-semibold">
                            Pilih ketiga nilai untuk melihat tingkat risiko.
                        </p>
                    )}
                </div>
            </div>

            {axes.map(({ key, title, options }) => {
                const picked = options.find((o) => o.value === value[key]);

                return (
                    <div
                        key={key}
                        role="radiogroup"
                        aria-label={title}
                        className="flex flex-col gap-2"
                    >
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[13px] font-semibold">
                                {title}
                            </span>
                            {picked && (
                                <span className="truncate text-xs font-semibold text-muted-foreground">
                                    {picked.label}
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {options.map((o) => {
                                const on = value[key] === o.value;

                                return (
                                    <button
                                        key={o.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={on}
                                        aria-label={`${o.value} — ${o.label}`}
                                        title={`${o.label} · ${o.sub}`}
                                        onClick={() => onChange(key, o.value)}
                                        className={cn(
                                            'tabular h-12 rounded-md text-base font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                                            choiceChip(on),
                                        )}
                                    >
                                        {o.value}
                                    </button>
                                );
                            })}
                        </div>
                        {picked ? (
                            <p className="text-xs text-muted-foreground">
                                {picked.sub}
                            </p>
                        ) : (
                            errors[key] && (
                                <p className="text-sm text-destructive">
                                    {errors[key]}
                                </p>
                            )
                        )}
                    </div>
                );
            })}

            <p className="text-xs text-muted-foreground">
                Ketuk angka untuk melihat penjelasannya. Nilai = Probabilitas ×
                Frekuensi × Severity.
            </p>
        </div>
    );
}
