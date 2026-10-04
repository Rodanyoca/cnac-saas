"use client"
import { createContext,useContext,type ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { SelectItem } from "@/components/ui/select"
export type CnacActorReferences={scoped?:boolean;sexes:{id:string;label:string}[];uploads:{avatar:boolean;passeport:boolean}}
const Context=createContext<CnacActorReferences>({sexes:[],uploads:{avatar:false,passeport:false}})
export function CnacActorReferencesProvider({value,children}:{value:CnacActorReferences;children:ReactNode}){return <Context.Provider value={value}>{children}</Context.Provider>}
export const useCnacActorReferences=()=>useContext(Context)
export function PersonSexOptions(){const {sexes}=useCnacActorReferences();return <>{sexes.map(sex=><SelectItem key={sex.id} value={sex.id}>{sex.label}</SelectItem>)}</>}
export function ActorMediaInput(props:React.ComponentProps<"input">) {
  const {uploads,scoped}=useCnacActorReferences(),passport=String(props.accept||"").includes("pdf")
  const available=!scoped || (passport?uploads.passeport:uploads.avatar)
    return <Input {...props} disabled={!available || props.disabled} title={!available?"La gestion des médias n’est pas encore définie pour le CNAC.":props.title}/>
}
