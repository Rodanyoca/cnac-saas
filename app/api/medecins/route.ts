import { actorRead,actorWrite } from "@/lib/cnac/actor-handler"
export const runtime = "nodejs"
export async function GET() { return actorRead("medecins") }
export async function POST(request:Request) { return actorWrite("medecins",request,"POST") }
export async function PUT(request:Request) { return actorWrite("medecins",request,"PUT") }
