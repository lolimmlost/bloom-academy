import { auth } from "@/lib/auth"

export async function getSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  return session
}

export async function requireSession(request: Request) {
  const session = await getSession(request)
  if (!session) {
    throw new Response("Unauthorized", { status: 401 })
  }
  return session
}
