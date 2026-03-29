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
import { PlusCircle, FileText, IndianRupee, Handshake, Users, LogOut, Settings } from "lucide-react";
import ProjectList from "@/components/ProjectList";
import { logout, getCurrentUser } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      marginLineItems: true,
      mediators: true,
      createdBy: { select: { username: true } },
      updatedBy: { select: { username: true } },
    },
  });

  const projectsAny = projects as any[];

  const totalProjects = projects.length;
  const projectsInTalk = projects.filter((p) => p.stage === "In Talk").length;
  const dealsCompleted = projects.filter(
    (p) => p.stage === "Deal Completed" || p.stage === "Amount Credited"
  ).length;
 
  const totalRevenue = projectsAny.reduce(
    (acc: number, p: any) =>
      acc +
      p.marginLineItems.reduce(
        (sum: number, item: any) => sum + ((item.sellUnitPriceInclGst * item.qty) / (1 + item.sellGstPercent / 100)),
        0
      ),
    0
  );
 
  const totalProfit = projectsAny.reduce((acc: number, p: any) => {
    const sellingExGst = p.marginLineItems.reduce(
      (sum: number, item: any) => sum + ((item.sellUnitPriceInclGst * item.qty) / (1 + item.sellGstPercent / 100)),
      0
    );
    const costConsidered = p.marginLineItems.reduce((sum: number, item: any) => {
      const buyingExGst = (item.buyingAmountInclGst * item.qty) / (1 + item.buyGstPercent / 100);
      return sum + (item.itcEligible ? buyingExGst : (item.buyingAmountInclGst * item.qty));
    }, 0);
    const mediatorCost = p.mediators.reduce((sum: number, m: any) => sum + m.amount, 0);
    return acc + (sellingExGst - costConsidered - mediatorCost);
  }, 0);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Project Dashboard</h2>
          <p className="text-sm text-muted-foreground hidden md:block">Real-time overview of your educational projects</p>
        </div>
        <div className="flex items-center space-x-2 self-end md:self-auto">
          <Link href="/project/new">
            <Button size="sm" className="md:size-default">
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="inline">Create Project</span>
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
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Total Profit (Net)</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(totalProfit)}</div>
          </CardContent>
        </Card>
      </div>

      <ProjectList projects={projects} />
    </div>
  );
}
