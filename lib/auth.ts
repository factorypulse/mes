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