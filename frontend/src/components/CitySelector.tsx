import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, Check } from "lucide-react";
import { S, BRAND } from '../lib/design';
import { getCityName } from '../lib/tripFormatters';

interface CitySelectorProps {
  value: string;
  onChange: (val: string) => void;
  citiesData: any[];
  placeholder?: string;
}

export function CitySelector({ value, onChange, citiesData, placeholder = 'Pesquisar cidade...' }: CitySelectorProps) {
  const [open, setOpen] = useState(false);
  const offices = citiesData.filter((c: any) => c.isOffice).sort((a: any, b: any) => a.name.localeCompare(b.name));
  const regularCities = citiesData.filter((c: any) => !c.isOffice).sort((a: any, b: any) => a.name.localeCompare(b.name));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          style={{ ...(S.input as any), display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: BRAND.white, color: value ? BRAND.text : BRAND.textMuted, cursor: 'pointer', textAlign: 'left' }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value ? getCityName(value, citiesData) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Escreva para pesquisar..." />
          <CommandList>
            <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
            <CommandGroup heading="📍 Escritórios LOBA">
              {offices.map((c: any) => (
                <CommandItem key={c.id} value={c.name} onSelect={() => { onChange(c.id.toString()); setOpen(false); }}>
                  <Check className={cn('mr-2 h-4 w-4', value === c.id.toString() ? 'opacity-100' : 'opacity-0')} />
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Todos os Concelhos">
              {regularCities.map((c: any) => (
                <CommandItem key={c.id} value={c.name} onSelect={() => { onChange(c.id.toString()); setOpen(false); }}>
                  <Check className={cn('mr-2 h-4 w-4', value === c.id.toString() ? 'opacity-100' : 'opacity-0')} />
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
