"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_dev_only_123");

export async function login(username: string, password: any) {
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return { success: false, error: "Invalid credentials" };

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return { success: false, error: "Invalid credentials" };

    const token = await new SignJWT({ id: user.id, username: user.username, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(SECRET);

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  revalidatePath("/");
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as any;
  } catch (err) {
    return null;
  }
}

export async function getUsers() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return [];
  return await prisma.user.findMany({
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function createUser(data: any) {
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") return { success: false, error: "Unauthorized" };

  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        role: data.role || "user",
      }
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, error: "Username already exists" };
    return { success: false, error: "Failed to create user" };
  }
}

export async function deleteUser(id: string) {
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") return { success: false, error: "Unauthorized" };

  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete user" };
  }
}
