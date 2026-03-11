import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function TimePicker({
  value,
  onChange,
  className,
  placeholder = "Selecionar hora"
}: TimePickerProps) {
  // Generate time options in 30-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        const timeString = `${formattedHour}:${formattedMinute}`;
        const displayTime = `${formattedHour}:${formattedMinute}`;
        
        options.push({
          value: timeString,
          label: displayTime
        });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className={cn("relative", className)}>
      <Select 
        value={value} 
        onValueChange={onChange}
      >
        <SelectTrigger className="w-full pl-3 pr-1 flex items-center">
          <Clock className="h-4 w-4 mr-2 opacity-70" />
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {timeOptions.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}