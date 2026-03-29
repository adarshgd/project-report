"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./actions/auth";

export async function saveProject(projectId: string | null, data: any) {
  try {
    // Sanitize data: remove IDs and projectIds from nested items to avoid Prisma conflicts
    const contents = data.contents?.map(({ id, projectId, ...rest }: any) => rest) || [];
    const mediators = data.mediators?.map(({ id, projectId, ...rest }: any) => rest) || [];
    const marginLineItems = data.marginLineItems?.map(({ id, projectId, ...rest }: any) => rest) || [];

    const user = await getCurrentUser();
    const userId = user?.id;

    if (projectId) {
      await prisma.projectContent.deleteMany({ where: { projectId } });
      await prisma.mediator.deleteMany({ where: { projectId } });
      await prisma.marginLineItem.deleteMany({ where: { projectId } });

      await prisma.project.update({
        where: { id: projectId },
        data: {
          name: data.name,
          totalCost: data.totalCost,
          stage: data.stage,
          materialStatus: data.materialStatus,
          status: data.status || "In Progress",
          notes: data.notes || null,
          contents: { create: contents },
          mediators: { create: mediators },
          marginLineItems: { create: marginLineItems },
        },
      });
      revalidatePath("/");
      revalidatePath(`/project/${projectId}`);
      return { success: true, id: projectId };
    } else {
      const newProject = await prisma.project.create({
        data: {
          name: data.name,
          totalCost: data.totalCost,
          stage: data.stage,
          materialStatus: data.materialStatus,
          status: data.status || "In Progress",
          notes: data.notes || null,
          contents: { create: contents },
          mediators: { create: mediators },
          marginLineItems: { create: marginLineItems },
        },
      });
      revalidatePath("/");
      return { success: true, id: newProject.id };
    }
  } catch (error) {
    console.error("Failed to save project", error);
    return { success: false, error: "Failed to save project" };
  }
}

export async function deleteProject(projectId: string) {
  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/");
}
