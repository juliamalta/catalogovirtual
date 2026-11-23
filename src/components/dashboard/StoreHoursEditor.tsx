"use client";

import { useRef, useState } from "react";
import { Clock3, Copy, LoaderCircle, Save } from "lucide-react";
import { saveStoreHoursAction } from "@/app/painel/actions";
import { businessHoursConfigurationSchema } from "@/lib/validations/business-hours";
import type { BusinessHoursConfiguration, BusinessHoursDay, BusinessHoursPeriod, StoreOperatingStatus } from "@/types/business-hours.types";
import { BusinessHoursDayCard } from "./business-hours-day-card";
import { BusinessHoursControls } from "./business-hours-controls";
import { CopyBusinessHoursPanel } from "./copy-business-hours-panel";
import { businessHoursCopyDestinations, businessHoursOverwriteTargets, businessWeekDays, countConfiguredBusinessDays, getBusinessHoursEditorErrors } from "./business-hours-editor.utils";

interface StoreHoursEditorProps {
  storeSlug: string;
  initialSchedule: BusinessHoursConfiguration;
  initialStatus: StoreOperatingStatus;
}

export function StoreHoursEditor({ storeSlug, initialSchedule, initialStatus }: StoreHoursEditorProps) {
  const editor = useRef<HTMLElement>(null);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [status, setStatus] = useState(initialStatus);
  const [copySource, setCopySource] = useState(1);
  const [copyTargets, setCopyTargets] = useState<number[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [copyExpanded, setCopyExpanded] = useState(false);
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [copyError, setCopyError] = useState<string>();
  const [copyFeedback, setCopyFeedback] = useState<string>();
  const [validationAttempted, setValidationAttempted] = useState(false);
  const feedback = validationAttempted ? getBusinessHoursEditorErrors(schedule) : undefined;
  const configuredDays = countConfiguredBusinessDays(schedule);

  function markChanged() {
    setDirty(true);
    setSaved(false);
    setError(undefined);
    setCopyFeedback(undefined);
    setConfirmOverwrite(false);
  }

  function updateDay(dayOfWeek: number, update: (day: BusinessHoursDay) => BusinessHoursDay) {
    setSchedule((current) => ({ ...current, days: current.days.map((day) => day.dayOfWeek === dayOfWeek ? update(day) : day) }));
    markChanged();
  }

  function updatePeriod(dayOfWeek: number, periodIndex: number, key: keyof BusinessHoursPeriod, value: string) {
    updateDay(dayOfWeek, (day) => ({ ...day, periods: day.periods.map((period, index) => index === periodIndex ? { ...period, [key]: value } : period) }));
  }

  function toggleExpandedDay(dayOfWeek: number) {
    setExpandedDays((current) => { const next = new Set(current); if (next.has(dayOfWeek)) next.delete(dayOfWeek); else next.add(dayOfWeek); return next; });
  }

  function changeCopySource(source: number) {
    setCopySource(source);
    setCopyTargets((current) => current.filter((day) => day !== source));
    setConfirmOverwrite(false);
    setCopyError(undefined);
    setCopyFeedback(undefined);
  }

  function toggleCopyTarget(day: number) {
    if (day === copySource) return;
    setCopyTargets((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]);
    setConfirmOverwrite(false);
    setCopyError(undefined);
    setCopyFeedback(undefined);
  }

  function applyCopy() {
    const source = schedule.days.find((day) => day.dayOfWeek === copySource);
    const targets = businessHoursCopyDestinations(schedule, copySource, copyTargets);
    if (!source || !targets.length) return;
    const targetIds = targets.map((day) => day.dayOfWeek);
    setSchedule((current) => ({ ...current, days: current.days.map((day) => targetIds.includes(day.dayOfWeek)
      ? { ...source, dayOfWeek: day.dayOfWeek, periods: source.periods.map((period) => ({ ...period })) } : day) }));
    setCopyTargets([]);
    setCopyError(undefined);
    markChanged();
    setCopyFeedback(`Horários copiados para ${targets.length} ${targets.length === 1 ? "dia" : "dias"}. Salve para aplicar as alterações.`);
  }

  function copyScheduleToSelectedDays() {
    setCopyFeedback(undefined);
    setCopyError(undefined);
    if (!businessHoursCopyDestinations(schedule, copySource, copyTargets).length) {
      setCopyError("Selecione ao menos um dia de destino.");
      return;
    }
    if (businessHoursOverwriteTargets(schedule, copySource, copyTargets).length) { setConfirmOverwrite(true); return; }
    applyCopy();
  }

  async function saveSchedule() {
    if (saving) return;
    setValidationAttempted(true);
    const parsed = businessHoursConfigurationSchema.safeParse(schedule);
    if (!parsed.success) {
      const errors = getBusinessHoursEditorErrors(schedule);
      setExpandedDays((current) => new Set([...current, ...Object.keys(errors.days).map(Number)]));
      if (errors.timeZone) setControlsExpanded(true);
      setSaved(false);
      setError("Confira os campos indicados antes de salvar os horários.");
      window.requestAnimationFrame(() => {
        const target = editor.current?.querySelector<HTMLElement>('[aria-invalid="true"]:not(:disabled)')
          ?? editor.current?.querySelector<HTMLElement>('.has-error .hours-expand-day');
        target?.focus(); target?.scrollIntoView({ block: "center" });
      });
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      const result = await saveStoreHoursAction(storeSlug, parsed.data);
      if (result.success) {
        setStatus(result.status);
        setSchedule(parsed.data);
        setDirty(false);
        setSaved(true);
        setCopyFeedback(undefined);
      } else setError(result.error);
    } catch { setError("Não foi possível salvar os horários agora. Tente novamente."); }
    finally { setSaving(false); }
  }

  const isTemporaryClosePending = dirty && schedule.manualStatus === "TEMPORARILY_CLOSED" && status.state !== "TEMPORARILY_CLOSED";
  return <section ref={editor} id="horarios" className="dashboard-form dashboard-settings-form business-hours-editor" aria-labelledby="business-hours-title" aria-busy={saving}>
    <header className="hours-header"><div className="hours-header-copy"><h2 id="business-hours-title">Horários de atendimento</h2><p>Defina os dias e horários em que sua loja recebe pedidos.</p><span className="hours-configured-count">{configuredDays} {configuredDays === 1 ? "dia configurado" : "dias configurados"}</span></div>
      <button className="hours-header-copy-action" type="button" disabled={saving} aria-controls="business-hours-copy-fields" onClick={() => {
        setCopyExpanded(true);
        window.requestAnimationFrame(() => { const panel = document.getElementById("business-hours-copy"); panel?.scrollIntoView({ block: "nearest" }); panel?.querySelector("select")?.focus(); });
      }}><Copy size={16} aria-hidden="true" />Copiar horários</button>
    </header>
    <div className="hours-saved-status" data-state={status.state} role="status"><Clock3 size={16} aria-hidden="true" /><strong>{status.label}</strong>{status.detail && <span>{status.detail}</span>}<span className="hours-status-timezone">{schedule.timeZone}</span></div>
    {dirty && <p className="hours-status-note">Alterações não salvas. O estado de funcionamento considera os horários salvos.</p>}
    {isTemporaryClosePending && <p className="hours-status-note">O fechamento temporário será ativado ao salvar.</p>}
    {feedback?.general.map((message) => <p key={message} className="hours-field-error" role="alert">{message}</p>)}
    <fieldset className="hours-editable-fields" disabled={saving} aria-label="Configurar horários de atendimento">
      <div className="hours-days">
        {businessWeekDays.map(({ day: dayOfWeek, label }) => {
          const day = schedule.days.find((item) => item.dayOfWeek === dayOfWeek);
          if (!day) return null;
          return <BusinessHoursDayCard key={dayOfWeek} day={day} label={label} expanded={expandedDays.has(dayOfWeek)} errors={feedback?.days[dayOfWeek]}
            onExpand={() => toggleExpandedDay(dayOfWeek)}
            onToggle={(isOpen) => { updateDay(dayOfWeek, (current) => ({ ...current, isOpen })); if (isOpen) setExpandedDays((current) => new Set([...current, dayOfWeek])); }}
            onAdd={() => updateDay(dayOfWeek, (current) => ({ ...current, periods: [...current.periods, { opensAt: "", closesAt: "" }] }))}
            onRemove={(periodIndex) => updateDay(dayOfWeek, (current) => ({ ...current, periods: current.periods.filter((_, index) => index !== periodIndex) }))}
            onPeriodChange={(index, field, value) => updatePeriod(dayOfWeek, index, field, value)} />;
        })}
      </div>
      <CopyBusinessHoursPanel schedule={schedule} expanded={copyExpanded} source={copySource} targets={copyTargets} confirmOverwrite={confirmOverwrite} error={copyError} feedback={copyFeedback}
        onExpanded={() => setCopyExpanded((value) => !value)} onSource={changeCopySource} onTarget={toggleCopyTarget} onCopy={copyScheduleToSelectedDays} onConfirm={applyCopy} onCancel={() => setConfirmOverwrite(false)} />
      <BusinessHoursControls schedule={schedule} expanded={controlsExpanded} timeZoneError={feedback?.timeZone} onExpand={() => setControlsExpanded((value) => !value)}
        onManualStatus={(manualStatus) => { setSchedule((current) => ({ ...current, manualStatus })); markChanged(); }}
        onTimeZone={(timeZone) => { setSchedule((current) => ({ ...current, timeZone })); markChanged(); }} />
    </fieldset>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {saved && <p className="notice-success" role="status">Horários salvos. O estado de funcionamento foi atualizado.</p>}
    <div className="hours-save-actions"><p role="status">{saving ? "Salvando seus horários…" : dirty ? "Há alterações para salvar." : "Nenhuma alteração pendente."}</p><button type="button" disabled={!dirty || saving} onClick={saveSchedule} className="primary-button">{saving ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}{saving ? "Salvando horários…" : "Salvar horários"}</button></div>
  </section>;
}
