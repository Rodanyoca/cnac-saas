import { actorRead,actorWrite } from "@/lib/cnac/actor-handler"
export const runtime = "nodejs"
export async function GET() { return actorRead("entraineurs") }
export async function POST(request:Request) { return actorWrite("entraineurs",request,"POST") }
export async function PUT(request:Request) { return actorWrite("entraineurs",request,"PUT") }
