"use client"
import { createContext,useContext,type ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { SelectItem } from "@/components/ui/select"
import { personSexOptions } from "@/lib/cnac/person-sex"
export type CnacActorReferences={scoped?:boolean;sexes:{id:string;label:string}[];uploads:{avatar:boolean;passeport:boolean}}
const Context=createContext<CnacActorReferences>({sexes:[],uploads:{avatar:false,passeport:false}})
export function CnacActorReferencesProvider({value,children}:{value:CnacActorReferences;children:ReactNode}){return <Context.Provider value={value}>{children}</Context.Provider>}
export const useCnacActorReferences=()=>useContext(Context)
export function PersonSexOptions({ rows }: { rows?: Record<string, string>[] } = {}) {
  const { sexes } = useCnacActorReferences()
  const options = rows
    ? personSexOptions(rows)
    : sexes
  return <>{options.map(sex => <SelectItem key={sex.id} value={sex.id}>{sex.label}</SelectItem>)}</>
}
export function ActorMediaInput(props:React.ComponentProps<"input">) {
  const {uploads,scoped}=useCnacActorReferences(),passport=String(props.accept||"").includes("pdf")
  // Les formulaires Athlètes utilisent ImageSelection ; les autres médias restent fermés.
  const available=!scoped || (passport?uploads.passeport:false)
    return <Input {...props} disabled={!available || props.disabled} title={!available?"La gestion des médias n’est pas encore définie pour le CNAC.":props.title}/>
}
