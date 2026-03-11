import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
  showEndDate?: boolean;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  showEndDate = true,
}: DateRangePickerProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  // Format the selected date range for display
  const formatDisplayDate = () => {
    if (!dateRange?.from) {
      return "Selecionar data";
    }

    if (showEndDate && dateRange.to) {
      return `${format(dateRange.from, "dd 'de' MMM", { locale: ptBR })} - ${format(dateRange.to, "dd 'de' MMM", { locale: ptBR })}`;
    }
    
    return format(dateRange.from, "dd 'de' MMMM, yyyy", { locale: ptBR });
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDisplayDate()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={(range) => {
              onDateRangeChange(range);
              if (range?.to) {
                setIsPopoverOpen(false);
              }
            }}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
