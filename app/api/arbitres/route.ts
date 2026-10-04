import { actorRead,actorWrite } from "@/lib/cnac/actor-handler"
export const runtime = "nodejs"
export async function GET() { return actorRead("arbitres") }
export async function POST(request:Request) { return actorWrite("arbitres",request,"POST") }
export async function PUT(request:Request) { return actorWrite("arbitres",request,"PUT") }
