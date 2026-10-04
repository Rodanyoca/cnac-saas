export function isCnacDemoMode(env:Record<string,string|undefined>=process.env) {
  return env.CNAC_DEMO_MODE === "true" || env.NEXT_PUBLIC_CNAC_DEMO_MODE === "true"
}

export function canWriteLocalTerritorialMutation(resource:string,method:string,env:Record<string,string|undefined>=process.env,host="",origin="") {
  const resources=new Set(["hierarchie","zones","ligues","ententes","cercles","clubs","equipes","athletes"])
  const action=method.toUpperCase()
  // L'identification est modifiable depuis le même écran que les structures.
  const supported=resources.has(resource)||(resource==="identification"&&action==="PUT")
  if(env.NODE_ENV!=="development"||!isCnacDemoMode(env)||!supported||!(["POST","PUT"] as string[]).includes(action))return false
  try{
    const hostname=new URL(`http://${host}`).hostname
    const originUrl=new URL(origin)
    const localHost=hostname==="localhost"||hostname==="127.0.0.1"||hostname==="[::1]"
    return localHost&&originUrl.host===host&&originUrl.hostname===hostname
  }catch{return false}
}

export const CNAC_DEMO_USER = {
  id: "CNAC-DEMO",
  nom: "Administrateur de démonstration",
  email: "demo@cnac.local",
  idUser: "CNAC-DEMO",
  typeUser: "ADMIN",
  estSuperAdmin: true,
  statut: "ACTIF",
  sessionVersion: 1,
  iat: 0,
  exp: 4_102_444_800,
  doitChangerMotDePasse: false,
} as const
