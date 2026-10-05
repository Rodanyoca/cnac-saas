import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { createRequire } from "node:module"
import { createElement, type ComponentType, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ts from "typescript"

const require = createRequire(import.meta.url)
function render(canEdit: boolean, uploadAvailable: boolean) {
  const module = { exports: {} }
  const container = ({ children }: { children?: ReactNode }) => createElement("div", null, children)
  const noop = () => null
  const mocks: Record<string, unknown> = {
    "@/lib/api/confirmed-save": {},
    "next/navigation": { useRouter: () => ({ refresh: noop }) },
    "next/image": { __esModule: true, default: noop },
    "lucide-react": { CheckCircle2: noop, Loader2: noop, Pencil: noop, Upload: noop },
    "@/components/ui/avatar": { Avatar: container, AvatarFallback: container, AvatarImage: noop },
    "@/components/ui/button": { Button: ({ children, disabled }: { children: ReactNode; disabled?: boolean }) => createElement("button", { disabled }, children) },
    "@/components/ui/dialog": Object.fromEntries(["Dialog", "DialogContent", "DialogDescription", "DialogFooter", "DialogHeader", "DialogTitle", "DialogTrigger"].map(name => [name, container])),
    "@/lib/federations/logo": { logoDialogReducer: (state: unknown) => state },
  }
  const code = ts.transpileModule(readFileSync(new URL("../../components/dashboard/federation-logo-manager.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  runInNewContext(code, { module, exports: module.exports, require: (name: string) => name in mocks ? mocks[name] : require(name) })
  const { FederationLogoManager } = module.exports as { FederationLogoManager: ComponentType<{ federationId: string; federationName: string; initials: string; initialUrl: string; canEdit: boolean; uploadAvailable: boolean }> }
  return renderToStaticMarkup(createElement(FederationLogoManager, { federationId: "FED1", federationName: "Test", initials: "T", initialUrl: "", canEdit, uploadAvailable }))
}

test("authorized logo editing stays visible with an explanation when uploads are unavailable", () => {
  const html = render(true, false)
  assert.match(html, /<button disabled="">Modifier le logo<\/button>/)
  assert.match(html, /Envoi des logos temporairement indisponible/)
  assert.doesNotMatch(html, /type="file"/)
})

test("configured uploads enable the dialog and read-only users never see editing controls", () => {
  assert.match(render(true, true), /Modifier le logo/)
  assert.doesNotMatch(render(true, true), /<button disabled="">Modifier le logo/)
  assert.doesNotMatch(render(false, false), /Modifier le logo|Envoi des logos/)
})
