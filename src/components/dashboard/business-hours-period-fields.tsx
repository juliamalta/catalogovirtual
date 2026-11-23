import React from "react";
import { Trash2 } from "lucide-react";
import type { BusinessHoursPeriod } from "@/types/business-hours.types";
import type { BusinessHoursDayErrors } from "./business-hours-editor.utils";

interface BusinessHoursPeriodFieldsProps {
  dayOfWeek: number; dayLabel: string; index: number; period: BusinessHoursPeriod;
  errors?: BusinessHoursDayErrors;
  onChange: (field: keyof BusinessHoursPeriod, value: string) => void;
  onRemove: () => void;
}
export function BusinessHoursPeriodFields({ dayOfWeek, dayLabel, index, period, errors, onChange, onRemove }: BusinessHoursPeriodFieldsProps) {
  const base = `hours-${dayOfWeek}-${index}`;
  return <fieldset className="hours-period">
    <legend>Período {index + 1}</legend>
    <div className="hours-period-fields">
      {([{ key: "opensAt", label: "De" }, { key: "closesAt", label: "Até" }] as const).map(({ key, label }) => {
        const error = errors?.fields[`${index}.${key}`];
        return <label className="hours-time-field" key={key} htmlFor={`${base}-${key}`}>
          <span>{label}</span><input id={`${base}-${key}`} type="time" value={period[key]}
            aria-label={`${label} · período ${index + 1} de ${dayLabel}`}
            aria-invalid={Boolean(error) || undefined} aria-describedby={error ? `${base}-${key}-error` : undefined}
            onChange={(event) => onChange(key, event.currentTarget.value)} />
          {error && <small id={`${base}-${key}-error`} className="hours-field-error">{error}</small>}
        </label>;
      })}
      <button className="hours-remove-period" type="button" onClick={onRemove} aria-label={`Remover período ${index + 1} de ${dayLabel}`}><Trash2 size={16} aria-hidden="true" /><span>Remover período</span></button>
    </div>
  </fieldset>;
}
