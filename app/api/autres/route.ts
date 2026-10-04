import { actorRead,actorWrite } from "@/lib/cnac/actor-handler"
export const runtime = "nodejs"
export async function GET() { return actorRead("autres") }
export async function POST(request:Request) { return actorWrite("autres",request,"POST") }
export async function PUT(request:Request) { return actorWrite("autres",request,"PUT") }
