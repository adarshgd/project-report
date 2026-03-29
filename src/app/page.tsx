import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileText, IndianRupee, Handshake, Users } from "lucide-react";
import ProjectList from "@/components/ProjectList";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      marginLineItems: true,
      mediators: true,
    },
  });

  const totalProjects = projects.length;
  const projectsInTalk = projects.filter((p) => p.stage === "In Talk").length;
  const dealsCompleted = projects.filter(
    (p) => p.stage === "Deal Completed" || p.stage === "Amount Credited"
  ).length;

  const totalRevenue = projects.reduce(
    (acc, p) =>
      acc +
      p.marginLineItems.reduce(
        (sum, item) => sum + ((item.sellUnitPriceInclGst * item.qty) / (1 + item.sellGstPercent / 100)),
        0
      ),
    0
  );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Project Report</h2>
        <div className="flex items-center space-x-2">
          <Link href="/project/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projected Revenue (Ex GST)
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Completed</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dealsCompleted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects In Talk</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectsInTalk}</div>
          </CardContent>
        </Card>
      </div>

      <ProjectList projects={projects} />
    </div>
  );
}
