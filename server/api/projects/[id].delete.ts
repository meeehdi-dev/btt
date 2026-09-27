import { Effect } from 'effect'
import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { client, project, release } from '../../db/schema'
import { conflict, idParam, notFound, requireUserId } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const id = yield* idParam(event, 'id')
    const [record] = yield* promiseEffect('load project for deletion', () =>
      db
        .select({ project })
        .from(project)
        .innerJoin(client, eq(project.clientId, client.id))
        .where(and(eq(project.id, id), eq(client.userId, userId)))
        .limit(1),
    )
    if (!record) return yield* notFound('Project not found')
    if (!record.project.archivedAt)
      return yield* conflict('Archive the project before permanently deleting it')

    const [child] = yield* promiseEffect('check project releases before deletion', () =>
      db.select({ id: release.id }).from(release).where(eq(release.projectId, id)).limit(1),
    )
    if (child) return yield* conflict('Permanently delete the project releases first')

    yield* promiseEffect('delete project', () => db.delete(project).where(eq(project.id, id)))
    return { deleted: true }
  }),
)
