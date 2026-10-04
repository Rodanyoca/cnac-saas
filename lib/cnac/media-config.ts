export function cnacUploadAvailability(_env:Record<string,string|undefined>=process.env){
 const configured=(key:string)=>Boolean(_env[key]?.trim()&&!['A_COMPLETER'].includes(_env[key]!.trim()))
 const oauth=['GOOGLE_OAUTH_CLIENT_ID','GOOGLE_OAUTH_CLIENT_SECRET','GOOGLE_DRIVE_REFRESH_TOKEN'].every(configured)
 return {avatar:oauth&&configured('GOOGLE_DRIVE_ACTEURS_AVATARS_FOLDER_ID'),passeport:false,logo:oauth&&configured('GOOGLE_DRIVE_FEDERATION_LOGOS_FOLDER_ID')}
}
