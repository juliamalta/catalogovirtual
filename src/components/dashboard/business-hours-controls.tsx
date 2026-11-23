import React from "react";
import { ChevronDown, Settings2 } from "lucide-react";
import type { BusinessHoursConfiguration, ManualStoreStatus } from "@/types/business-hours.types";

const timeZoneSuggestions = ["America/Sao_Paulo", "America/Manaus", "America/Rio_Branco", "America/Belem", "America/Noronha", "UTC", "America/New_York", "Europe/Lisbon", "Europe/London"];
interface BusinessHoursControlsProps {
  schedule: BusinessHoursConfiguration; expanded: boolean; timeZoneError?: string;
  onExpand: () => void; onManualStatus: (status: ManualStoreStatus) => void; onTimeZone: (value: string) => void;
}
export function BusinessHoursControls({ schedule, expanded, timeZoneError, onExpand, onManualStatus, onTimeZone }: BusinessHoursControlsProps) {
  return <div className="hours-controls">
    <button className="hours-controls-heading" type="button" aria-expanded={expanded} aria-controls="business-hours-controls-fields" onClick={onExpand}>
      <Settings2 size={18} aria-hidden="true" /><span>Funcionamento e fuso horário</span><ChevronDown size={17} className={expanded ? "is-expanded" : ""} aria-hidden="true" />
    </button>
    <div id="business-hours-controls-fields" className="hours-controls-fields" hidden={!expanded}>
      <fieldset><legend>Funcionamento da loja</legend><div className="hours-operation-actions">
        <button type="button" className={`secondary-button${schedule.manualStatus === "AUTO" ? " is-selected" : ""}`} aria-pressed={schedule.manualStatus === "AUTO"} onClick={() => onManualStatus("AUTO")}>{schedule.manualStatus === "TEMPORARILY_CLOSED" ? "Reabrir conforme horários" : "Funcionamento automático"}</button>
        <button type="button" className={`secondary-button${schedule.manualStatus === "TEMPORARILY_CLOSED" ? " is-selected" : ""}`} aria-pressed={schedule.manualStatus === "TEMPORARILY_CLOSED"} onClick={() => onManualStatus("TEMPORARILY_CLOSED")}>Fechar temporariamente</button>
      </div><p>O fechamento temporário prevalece sobre os horários até você reabrir. A publicação da loja permanece independente.</p></fieldset>
      <label className="hours-timezone-field" htmlFor="store-hours-timezone">Fuso horário da loja<input id="store-hours-timezone" list="store-timezone-suggestions" value={schedule.timeZone} onChange={(event) => onTimeZone(event.currentTarget.value)} placeholder="America/Sao_Paulo" aria-invalid={Boolean(timeZoneError) || undefined} aria-describedby={timeZoneError ? "store-hours-timezone-error" : "store-hours-timezone-hint"} />
        <small id="store-hours-timezone-hint">America/Sao_Paulo usa o horário de Brasília. Altere se sua loja estiver em outra região.</small>
        {timeZoneError && <small className="hours-field-error" id="store-hours-timezone-error">{timeZoneError}</small>}
      </label>
      <datalist id="store-timezone-suggestions">{timeZoneSuggestions.map((timeZone) => <option key={timeZone} value={timeZone} />)}</datalist>
    </div>
  </div>;
}
