import type { ActivityStatus } from "./types"
const clean = (value: unknown) => String(value ?? "").trim()
export function normalizeStatus(value: unknown): ActivityStatus { const status=clean(value).toUpperCase().replace(/[ÉÈ]/g,"E").replace(/[ -]/g,"_"); return ["PLANIFIE","EN_COURS","TERMINE","REALISE","REPORTE","ANNULE"].includes(status)?status as ActivityStatus:"NON_RENSEIGNE" }
export function formatDateFr(value:string){const m=clean(value).match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}/${m[1]}`:clean(value)}
export function formatPeriod(start:string,end:string){const a=formatDateFr(start),b=formatDateFr(end);return a&&b&&a!==b?`${a} – ${b}`:a||b||"—"}
