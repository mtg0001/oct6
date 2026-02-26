import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PrioridadeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

const prioridades = [
  { value: "baixa", label: "Baixa", color: "bg-green-500" },
  { value: "media", label: "Média", color: "bg-orange-300" },
  { value: "alta", label: "Alta", color: "bg-red-400" },
  { value: "extremamente_alta", label: "Extremamente Alta", color: "bg-red-700" },
];

export function PrioridadeSelect({ value, onValueChange, className }: PrioridadeSelectProps) {
  const selected = prioridades.find((p) => p.value === value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Selecione...">
          {selected && (
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${selected.color} shrink-0`} />
              {selected.label}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {prioridades.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${p.color} shrink-0`} />
              {p.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Map stored priority value to display label */
export function getPrioridadeLabel(value: string): string {
  return prioridades.find((p) => p.value === value)?.label || value || "—";
}
