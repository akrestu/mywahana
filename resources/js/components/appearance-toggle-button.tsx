import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';

export function AppearanceToggleButton() {
    const { appearance, updateAppearance } = useAppearance();

    const options: { value: Appearance; icon: typeof Sun; label: string }[] = [
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'dark', icon: Moon, label: 'Dark' },
        { value: 'system', icon: Monitor, label: 'System' },
    ];

    const CurrentIcon =
        appearance === 'light' ? Sun : appearance === 'dark' ? Moon : Monitor;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="group h-9 w-9 cursor-pointer"
                    aria-label="Toggle theme"
                >
                    <CurrentIcon className="size-5! opacity-80 group-hover:opacity-100" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {options.map(({ value, icon: Icon, label }) => (
                    <DropdownMenuItem
                        key={value}
                        onClick={() => updateAppearance(value)}
                        className={appearance === value ? 'font-medium' : ''}
                    >
                        <Icon className="mr-2 h-4 w-4" />
                        {label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
