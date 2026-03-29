import { prisma } from "@/lib/prisma";
import ProjectForm from "@/components/ProjectForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  
  if (id === "new") {
    return <ProjectForm initialData={null} />;
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      contents: true,
      mediators: true,
      marginLineItems: true,
    },
  });

  if (!project) {
    return notFound();
  }

  return <ProjectForm initialData={project} />;
}
