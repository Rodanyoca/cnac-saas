import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, FileText, ShieldCheck } from "lucide-react"
import type { LegalDocument as DocumentContent } from "@/lib/legal/content"

const documents = [
  { kind: "confidentialite", label: "Confidentialité", href: "/confidentialite" },
  { kind: "conditions-utilisation", label: "Conditions d’utilisation", href: "/conditions-utilisation" },
] as const
const linkStyle = "rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"

export function LegalDocument({ document }: { document: DocumentContent }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#document" className="sr-only z-50 rounded-md bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Aller au contenu</a>
      <div className="h-1 bg-[linear-gradient(90deg,#0b8fda_0_46%,#f7ce20_46%_53%,#cf1736_53%_100%)]" />
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-8">
          <Link href="/login" className={`flex items-center gap-3 ${linkStyle}`} aria-label="CNAC — page de connexion">
            <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white p-1"><Image src="/images/logo-cnac.png" alt="" fill sizes="48px" className="object-contain p-1" /></span>
            <span><span className="block text-lg font-bold tracking-wide">CNAC</span><span className="block max-w-64 text-xs leading-5 text-muted-foreground">Comité National Antidopage Congolais</span></span>
          </Link>
          <Link href="/login" className={`flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground ${linkStyle}`}><ArrowLeft size={16} aria-hidden="true" />Retour à la connexion</Link>
        </div>
      </header>

      <main id="document" tabIndex={-1} className="mx-auto max-w-6xl px-5 pb-16 pt-10 outline-none sm:px-8 sm:pt-14">
        <div className="max-w-3xl">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-300"><ShieldCheck size={16} aria-hidden="true" />Espace institutionnel CNAC</p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{document.title}</h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">{document.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-primary">Version pour relecture</span>
            <span>Version 1.0</span><span>Mise à jour : <time dateTime="2026-10-04">4 octobre 2026</time></span>
          </div>
        </div>

        <nav aria-label="Documents institutionnels" className="mt-8 flex flex-wrap gap-2 border-b border-border pb-6">
          {documents.map(item => <Link key={item.kind} href={item.href} aria-current={document.kind === item.kind ? "page" : undefined} className={`inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm transition-colors ${linkStyle} ${document.kind === item.kind ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-card hover:text-foreground"}`}><FileText size={16} aria-hidden="true" />{item.label}</Link>)}
        </nav>

        <div className="my-8 grid gap-3 sm:grid-cols-3">
          {document.highlights.map(item => <div key={item.title} className="rounded-lg border border-border/70 bg-card/50 p-5"><h2 className="text-sm font-semibold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p></div>)}
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          <nav aria-label="Sommaire" className="rounded-lg border border-border bg-card/40 p-5 lg:sticky lg:top-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Dans ce document</p>
            <ol className="space-y-3">
              {document.sections.map((section, index) => <li key={section.id}><a href={`#${section.id}`} className={`flex gap-3 text-sm leading-5 text-muted-foreground transition-colors hover:text-primary ${linkStyle}`}><span className="w-5 shrink-0 text-xs tabular-nums text-sky-300">{String(index + 1).padStart(2, "0")}</span><span>{section.title}</span></a></li>)}
            </ol>
          </nav>

          <article aria-label={document.title} className="min-w-0">
            {document.sections.map((section, index) => <section id={section.id} aria-labelledby={`${section.id}-title`} key={section.id} className="scroll-mt-6 border-b border-border/60 py-7 first:pt-0">
              <div className="mb-4 flex items-start gap-3"><span className="mt-1 text-xs font-medium tabular-nums text-sky-300">{String(index + 1).padStart(2, "0")}</span><h2 id={`${section.id}-title`} className="text-xl font-semibold leading-7 tracking-tight">{section.title}</h2></div>
              <div className="space-y-4 text-[15px] leading-7 text-slate-300">{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
              {section.items && <ul className="mt-4 list-disc space-y-3 pl-5 text-[15px] leading-7 text-slate-300 marker:text-sky-300">{section.items.map(item => <li key={item}>{item}</li>)}</ul>}
            </section>)}
            <aside aria-label="Contact CNAC" className="mt-8 rounded-lg border border-sky-400/25 bg-sky-400/5 p-6">
              <h2 className="text-lg font-semibold">Une question ou une demande ?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Adressez-vous à l’administration du CNAC ou à votre administrateur habilité. Précisez l’objet de votre demande sans communiquer votre mot de passe ni de pièce sensible par un canal non autorisé.</p>
              <div className="mt-4 flex flex-col items-start gap-2 text-sm">
                <a href="mailto:contact@cnac-onadrdc.com" className={`break-all text-sky-300 underline underline-offset-4 hover:text-sky-200 ${linkStyle}`}>contact@cnac-onadrdc.com</a>
                <a href="mailto:cnac2006.rdcongo@gmail.com" className={`break-all text-sky-300 underline underline-offset-4 hover:text-sky-200 ${linkStyle}`}>cnac2006.rdcongo@gmail.com</a>
              </div>
            </aside>
            {document.kind === "confidentialite" && <section aria-label="Références" className="mt-8 text-xs leading-6 text-muted-foreground">
              <h2 className="mb-2 font-semibold text-foreground">Textes et informations de référence</h2>
              <ul className="space-y-2">
                <li><a className={`underline underline-offset-4 hover:text-foreground ${linkStyle}`} href="https://are.gouv.cd/download/ordonnance-loi-23-010-du-13-mars-portant-code-du-numerique/" target="_blank" rel="noopener noreferrer">Code du numérique de la RDC — ordonnance-loi n° 23/010 du 13 mars 2023 (nouvel onglet)</a></li>
                <li><a className={`underline underline-offset-4 hover:text-foreground ${linkStyle}`} href="https://www.wada-ama.org/en/resources/world-anti-doping-code-and-international-standards/international-standard-protection" target="_blank" rel="noopener noreferrer">AMA — protection de la vie privée et des renseignements personnels (nouvel onglet)</a></li>
                <li><a className={`underline underline-offset-4 hover:text-foreground ${linkStyle}`} href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel Web Analytics — informations de confidentialité (nouvel onglet)</a></li>
              </ul>
            </section>}
          </article>
        </div>
      </main>

      <footer className="border-t border-border bg-card/30">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-xs text-muted-foreground sm:px-8">
          <p>CNAC · Plateforme institutionnelle · Accès réservé aux utilisateurs habilités</p>
          <nav aria-label="Pied de page" className="flex flex-wrap gap-5">{documents.map(item => <Link key={item.kind} href={item.href} className={`hover:text-foreground ${linkStyle}`}>{item.label}</Link>)}<Link href="/login" className={`flex items-center gap-1 hover:text-foreground ${linkStyle}`}>Connexion<ArrowUpRight size={13} aria-hidden="true" /></Link></nav>
        </div>
      </footer>
    </div>
  )
}
