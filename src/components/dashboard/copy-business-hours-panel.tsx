import React, { useEffect, useRef } from "react";
import { ChevronDown, Copy } from "lucide-react";
import type { BusinessHoursConfiguration } from "@/types/business-hours.types";
import { businessHoursOverwriteTargets, businessWeekDays, summarizeBusinessHoursDay } from "./business-hours-editor.utils";

interface CopyBusinessHoursPanelProps {
  schedule: BusinessHoursConfiguration; expanded: boolean; source: number; targets: number[];
  confirmOverwrite: boolean; error?: string; feedback?: string;
  onExpanded: () => void; onSource: (day: number) => void; onTarget: (day: number) => void;
  onCopy: () => void; onConfirm: () => void; onCancel: () => void;
}
export function CopyBusinessHoursPanel({ schedule, expanded, source, targets, confirmOverwrite, error, feedback, onExpanded, onSource, onTarget, onCopy, onConfirm, onCancel }: CopyBusinessHoursPanelProps) {
  const confirmButton = useRef<HTMLButtonElement>(null);
  const copyButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (confirmOverwrite) confirmButton.current?.focus(); }, [confirmOverwrite]);
  const sourceDay = schedule.days.find((day) => day.dayOfWeek === source);
  const overwritten = businessHoursOverwriteTargets(schedule, source, targets).map((day) => businessWeekDays.find((item) => item.day === day.dayOfWeek)?.label).join(", ");
  return <div className="hours-copy-panel" id="business-hours-copy">
    <button className="hours-copy-heading" type="button" aria-expanded={expanded} aria-controls="business-hours-copy-fields" onClick={onExpanded}>
      <Copy size={18} aria-hidden="true" /><span><strong>Copiar horários para outros dias</strong><small>Reutilize os períodos já configurados.</small></span><ChevronDown size={17} className={expanded ? "is-expanded" : ""} aria-hidden="true" />
    </button>
    <div className="hours-copy-fields" id="business-hours-copy-fields" hidden={!expanded}>
      <label className="hours-copy-source">Dia de origem<select value={source} onChange={(event) => onSource(Number(event.currentTarget.value))}>
        {businessWeekDays.map(({ day, label }) => <option key={day} value={day}>{label}</option>)}
      </select><small>{sourceDay && `${sourceDay.isOpen ? "Aberto" : "Fechado"} · ${summarizeBusinessHoursDay(sourceDay)}`}</small></label>
      <fieldset className="hours-copy-targets"><legend>Copiar para</legend><div>
        {businessWeekDays.filter(({ day }) => day !== source).map(({ day, label }) => <label className={targets.includes(day) ? "is-selected" : ""} key={day}>
          <input type="checkbox" checked={targets.includes(day)} onChange={() => onTarget(day)} /><span>{label}</span>
        </label>)}
      </div></fieldset>
      {error && <p className="hours-field-error" role="alert">{error}</p>}
      {confirmOverwrite ? <div className="hours-copy-confirmation" role="group" aria-label="Confirmar substituição de horários"><p>Os horários de <strong>{overwritten}</strong> serão substituídos pelos do dia de origem. A alteração só será aplicada ao salvar.</p>
        <div><button className="secondary-button" type="button" onClick={() => { onCancel(); window.requestAnimationFrame(() => copyButton.current?.focus()); }}>Cancelar</button><button ref={confirmButton} className="primary-button" type="button" onClick={() => { onConfirm(); window.requestAnimationFrame(() => copyButton.current?.focus()); }}>Substituir e copiar</button></div>
      </div> : <button ref={copyButton} className="secondary-button" type="button" onClick={onCopy}><Copy size={16} aria-hidden="true" />Copiar horários</button>}
    </div>
    {feedback && <p className="hours-copy-feedback" role="status">{feedback}</p>}
  </div>;
}
