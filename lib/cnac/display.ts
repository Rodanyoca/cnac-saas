export function sexCode(value:string) {
  const normalized=value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
  if(["02","f","femme","feminin"].includes(normalized))return "F"
  if(["01","m","h","homme","masculin"].includes(normalized))return "H"
  return value||"Non renseigné"
}
export function sexId(value:string) { const code=sexCode(value);return code==="F"?"02":code==="H"?"01":value }
export function sexLabel(value:string) {const code=sexCode(value);return code==="F"?"Féminin":code==="H"?"Masculin":code}
