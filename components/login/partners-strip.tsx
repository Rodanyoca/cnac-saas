import Image from "next/image"
import styles from "@/app/login/login.module.css"

export type Partner = { name: string; shortName: string; logo: string; logoVariant: "standard" | "wide-canvas" | "compact"; href?: string }

export function PartnersStrip({ partners }: { partners: Partner[] }) {
  if (partners.length === 0) return null

  return (
    <section className={styles.partners} aria-labelledby="partners-title">
      <p id="partners-title">Avec le soutien de nos partenaires</p>
      <div className={styles.partnerList}>
        {partners.map((partner) => {
          const logo = <><Image src={partner.logo} alt={partner.name} width={132} height={58} className={styles.partnerLogo} /><span>{partner.shortName}</span></>
          return partner.href ? <a key={partner.name} href={partner.href} className={styles.partner} data-logo-variant={partner.logoVariant}>{logo}</a> : <div key={partner.name} className={styles.partner} data-logo-variant={partner.logoVariant}>{logo}</div>
        })}
      </div>
    </section>
  )
}
