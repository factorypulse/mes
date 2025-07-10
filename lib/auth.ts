import { stackServerApp } from "@/stack";

export async function getUser() {
  try {
    const user = await stackServerApp.getUser();
    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

// Export the main auth function for API routes
export async function auth() {
  try {
    const user = await stackServerApp.getUser();
    return user ? { user } : null;
  } catch (error) {
    console.error("Error in auth:", error);
    return null;
  }
}

// Export auth object with api methods for different usage patterns
export const authObject = {
  api: {
    async getSession({ headers }: { headers: Headers }) {
      try {
        const user = await stackServerApp.getUser();
        return user ? { user } : null;
      } catch (error) {
        console.error("Error getting session:", error);
        return null;
      }
    }
  }
};

// Default export for the auth object pattern
export default auth;
