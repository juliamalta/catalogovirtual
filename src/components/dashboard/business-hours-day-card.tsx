import React from "react";
import { ChevronDown, Plus } from "lucide-react";
import type { BusinessHoursDay, BusinessHoursPeriod } from "@/types/business-hours.types";
import { summarizeBusinessHoursDay, type BusinessHoursDayErrors } from "./business-hours-editor.utils";
import { BusinessHoursPeriodFields } from "./business-hours-period-fields";

interface BusinessHoursDayCardProps {
  day: BusinessHoursDay; label: string; expanded: boolean; errors?: BusinessHoursDayErrors;
  onExpand: () => void; onToggle: (isOpen: boolean) => void;
  onAdd: () => void; onRemove: (index: number) => void;
  onPeriodChange: (index: number, field: keyof BusinessHoursPeriod, value: string) => void;
}
export function BusinessHoursDayCard({ day, label, expanded, errors, onExpand, onToggle, onAdd, onRemove, onPeriodChange }: BusinessHoursDayCardProps) {
  const base = `business-hours-day-${day.dayOfWeek}`;
  return <article className={`hours-day-card${day.isOpen ? " is-open" : ""}${errors ? " has-error" : ""}`} aria-labelledby={`${base}-name`}>
    <div className="hours-day-heading">
      <label className="hours-switch"><input type="checkbox" role="switch" aria-label={`Atendimento de ${label}`}
        checked={day.isOpen} onChange={(event) => onToggle(event.currentTarget.checked)} />
        <span className="hours-switch-track" aria-hidden="true"><span /></span>
      </label>
      <div className="hours-day-description"><div className="hours-day-title"><h3 id={`${base}-name`}>{label}</h3><span className="hours-day-state">{day.isOpen ? "Aberto" : "Fechado"}</span></div>
        <p>{summarizeBusinessHoursDay(day)}</p>
        {errors && <small className="hours-day-error-indicator">Confira os horários deste dia</small>}
      </div>
      <button className="hours-expand-day" type="button" onClick={onExpand} aria-expanded={expanded} aria-controls={`${base}-panel`} aria-label={`${expanded ? "Recolher" : "Editar"} horários de ${label}`}>
        <span>{expanded ? "Recolher" : "Editar"}</span><ChevronDown size={16} className={expanded ? "is-expanded" : ""} aria-hidden="true" />
      </button>
    </div>
    <div id={`${base}-panel`} className="hours-day-panel" hidden={!expanded}>
      {!day.isOpen && <p className="hours-closed-note">Este dia está fechado. Seus horários ficam guardados para quando você reabrir.</p>}
      <fieldset disabled={!day.isOpen} className="hours-period-editor" aria-label={`Períodos de ${label}`}>
        {day.periods.map((period, index) => <BusinessHoursPeriodFields key={`${day.dayOfWeek}-${index}`} dayOfWeek={day.dayOfWeek} dayLabel={label} index={index} period={period} errors={errors}
          onChange={(field, value) => onPeriodChange(index, field, value)} onRemove={() => onRemove(index)} />)}
        {day.isOpen && day.periods.length === 0 && <p className="hours-empty-day">Adicione o primeiro período para definir o atendimento deste dia.</p>}
        <button className="hours-add-period" type="button" onClick={onAdd} disabled={day.periods.length >= 5}><Plus size={16} aria-hidden="true" />Adicionar período</button>
      </fieldset>
      {day.periods.some((period) => period.opensAt && period.closesAt && period.closesAt < period.opensAt) && <p className="hours-overnight-note">O encerramento ocorre no dia seguinte.</p>}
      {errors?.summary && <p className="hours-field-error" role="alert">{errors.summary}</p>}
    </div>
  </article>;
}
