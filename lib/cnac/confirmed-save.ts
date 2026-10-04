import { CnacDataError } from "./model.ts"

export type SaveRow = { sheet: "ENTITES" | "FEDERATIONS" | "ATHLETES"; id: string; mode: "create" | "update"; values: Record<string, string>; before?: Record<string, string> }
export type SavePlan = { scope: string; rows: SaveRow[]; media?: { kind: "logo" | "avatar"; recordId: string; fileId: string; mimeType: string; digest: string; oldId: string } }
export type SaveAdapter = {
  read: (rows: SaveRow[]) => Promise<(Record<string, string> | undefined)[]>
  mediaExists: () => Promise<boolean>
  upload: () => Promise<void>
  write: (rows: SaveRow[]) => Promise<void>
  removeUnused: (fileId: string) => Promise<void>
}
export class ConfirmedSaveError extends CnacDataError {
  readonly resetTicket: boolean
  constructor(message: string, resetTicket = false, status = 502) { super("SAVE_UNCONFIRMED", message, status); this.resetTicket = resetTicket }
}
const matches = (row: Record<string, string> | undefined, values: Record<string, string>) => !!row && Object.entries(values).every(([key, value]) => (row[key] || "") === value)

// Une réponse perdue ne prouve jamais que Sheets n'a pas écrit.
export async function executeConfirmedSave(plan: SavePlan, adapter: SaveAdapter) {
  let current = await adapter.read(plan.rows)
  if (plan.rows.every((row, index) => matches(current[index], row.values))) {
    if (plan.media?.oldId && plan.media.oldId !== plan.media.fileId) await adapter.removeUnused(plan.media.oldId).catch(() => undefined)
    return
  }
  const conflict = plan.rows.some((row, index) => row.mode === "create" ? !!current[index] : !current[index] || !matches(current[index], row.before || {}))
  if (conflict) throw new ConfirmedSaveError("La fiche a changé. Rechargez-la avant de poursuivre ; aucune autre écriture n’a été effectuée.", false, 409)
  if (plan.media && !await adapter.mediaExists()) {
    try { await adapter.upload() }
    catch (error) {
      if (error instanceof CnacDataError && error.code === "MEDIA_AUTHORIZATION") throw error
      throw new ConfirmedSaveError("L’envoi à Google Drive n’est pas confirmé. La fiche est conservée. Réessayez avec la même sélection.")
    }
  }
  try { await adapter.write(plan.rows) } catch { /* confirmer aussi une écriture ayant renvoyé une erreur */ }
  try { current = await adapter.read(plan.rows) }
  catch { throw new ConfirmedSaveError("La confirmation Sheets est indisponible. Gardez ce formulaire ouvert et réessayez : la même fiche sera vérifiée avant toute nouvelle écriture.") }
  if (!plan.rows.every((row, index) => matches(current[index], row.values))) {
    if (plan.media) {
      try { await adapter.removeUnused(plan.media.fileId) }
      catch { throw new ConfirmedSaveError("La sauvegarde n’est pas confirmée et le nettoyage doit être repris. Réessayez dans ce formulaire.") }
    }
    throw new ConfirmedSaveError("La sauvegarde n’a pas été effectuée. Les données précédentes sont conservées. Vous pouvez corriger ou réessayer.", true)
  }
  if (plan.media?.oldId && plan.media.oldId !== plan.media.fileId) await adapter.removeUnused(plan.media.oldId).catch(() => undefined)
}
