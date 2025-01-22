import Elysia, { t } from 'elysia'
import { db } from '../../db/connection'
import dayjs from 'dayjs'
import { auth } from '../auth'
import { authLinks } from '../../db/schema'
import { eq } from 'drizzle-orm'

export const authenticateFromLink = new Elysia().use(auth).get(
  '/auth-link/authenticate',
  async ({ query, set }) => {
    const { code, redirect } = query

    const authLinkFromCode = await db.query.authLinks.findFirst({
      where(fields, { eq }) {
        return eq(fields.code, code)
      },
    })

    if (!authLinkFromCode) {
      throw new Error('Auth Link not found.')
    }

    const daysSinceAuthlinksWasCreated = dayjs().diff(
      authLinkFromCode.createdAt,
      'days'
    )

    if (daysSinceAuthlinksWasCreated > 7) {
      throw new Error('Auth link expired, please generate a new one.')
    }

    const manageRestaurant = await db.query.restaurants.findFirst({
      where(fields, { eq }) {
        return eq(fields.managerId, authLinkFromCode.userId)
      },
    })

    await db.delete(authLinks).where(eq(authLinks.code, code))

    // set.redirect = redirect
  },
  {
    query: t.Object({
      code: t.String(),
      redirect: t.String(),
    }),
  }
)
