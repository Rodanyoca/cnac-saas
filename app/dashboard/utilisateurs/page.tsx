import { UsersRepository } from "@/lib/users/repository"
import { createGoogleUsersSheetsAdapter } from "@/lib/users/google-adapter"
import UsersClient from "./users-client"
export const dynamic = "force-dynamic"
export default async function UsersPage() { const users = await new UsersRepository(createGoogleUsersSheetsAdapter()).getUsers(); return <UsersClient initialUsers={users.map((user) => ({ id: user.idUser, nom: user.nomComplet, email: user.email, type: user.typeUser, statut: user.statut, superAdmin: user.estSuperAdmin }))} /> }
