export type ApiErrorCode="NOT_FOUND"|"EMPTY_RESULT"|"OPTIONAL_RELATION_MISSING"|"INVALID_DATA"|"CONFLICT"|"AUTHENTICATION_REQUIRED"|"ACCESS_DENIED"|"RATE_LIMITED"|"SOURCE_UNAVAILABLE"|"INTERNAL_ERROR"
export type ApiErrorPayload={code:ApiErrorCode;message:string;request_id:string;details_non_sensibles:string|null;champ_concerne:string|null;retryable:boolean;error:string}

const safeMessage=(error:unknown)=>error instanceof Error?error.message:String(error||"")
export function classifyApiError(error:unknown,statusHint?:number){
 const raw=safeMessage(error),status=statusHint||(/introuvable|not found/i.test(raw)?404:/doublon|existe déjà|conflit/i.test(raw)?409:/quota|rate limit|too many/i.test(raw)?429:/timeout|timed out|indisponible|unavailable|Failed to read Google Sheet/i.test(raw)?503:400)
 const code:ApiErrorCode=status===401?"AUTHENTICATION_REQUIRED":status===403?"ACCESS_DENIED":status===404?"NOT_FOUND":status===409?"CONFLICT":status===429?"RATE_LIMITED":status===503?"SOURCE_UNAVAILABLE":status>=500?"INTERNAL_ERROR":"INVALID_DATA"
 const publicMessage=code==="SOURCE_UNAVAILABLE"?"La source de données est temporairement indisponible. Réessayez dans quelques instants.":code==="RATE_LIMITED"?"Trop de demandes ont été envoyées. Réessayez dans quelques instants.":code==="INTERNAL_ERROR"?"Une erreur interne empêche momentanément cette opération.":raw||"La demande ne peut pas être traitée."
 return{status,code,message:publicMessage,retryable:["RATE_LIMITED","SOURCE_UNAVAILABLE","INTERNAL_ERROR"].includes(code)}
}

export function apiErrorPayload(error:unknown,requestId:string,statusHint?:number,context?:{details?:string;field?:string}):{status:number;payload:ApiErrorPayload}{
 const classified=classifyApiError(error,statusHint)
 return{status:classified.status,payload:{code:classified.code,message:classified.message,error:classified.message,request_id:requestId,details_non_sensibles:context?.details??null,champ_concerne:context?.field??null,retryable:classified.retryable}}
}
