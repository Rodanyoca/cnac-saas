import { notFound } from "next/navigation"
import { createGoogleUsersSheetsAdapter } from "@/lib/users/google-adapter"
import { UsersRepository } from "@/lib/users/repository"
import UserDetailClient from "./user-detail-client"
export const dynamic = "force-dynamic"
export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) { const id = (await params).id, repository = new UsersRepository(createGoogleUsersSheetsAdapter()), user = await repository.getUserById(id); if (!user) notFound(); const [authorizations, audit] = await Promise.all([repository.getAuthorizationsForUser(id), repository.getAuditLog()]); return <UserDetailClient initial={{ id: user.idUser, nomComplet: user.nomComplet, email: user.email, typeUser: user.typeUser, statut: user.statut, estSuperAdmin: user.estSuperAdmin, doitChangerMotDePasse: user.doitChangerMotDePasse, sessionVersion: user.sessionVersion }} initialAuthorizations={authorizations} audit={audit.filter((entry) => entry.idObjet === id || entry.idUser === id).slice(-30)} /> }
