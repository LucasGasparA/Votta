import { prisma } from '../prisma/client.js'

export async function logAudit(params: {
  userId: string
  action: string
  entityType?: string
  entityId?: string
  detail?: Record<string, unknown>
  ip?: string
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId:     params.userId,
        action:     params.action,
        entityType: params.entityType ?? null,
        entityId:   params.entityId  ?? null,
        detail:     params.detail ? JSON.stringify(params.detail) : null,
        ip:         params.ip       ?? null,
      },
    })
  } catch {
    // Nunca deixar auditoria derrubar a operação principal
  }
}
