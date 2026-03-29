"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Printer, Copy } from "lucide-react";

export default function ProjectList({ projects }: { projects: any[] }) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === "All" || p.stage === stageFilter;
    const matchesStatus = statusFilter === "All" || p.materialStatus === statusFilter;
    return matchesSearch && matchesStage && matchesStatus;
  });

  const exportCSV = () => {
    const headers = [
      "Project Name",
      "Stage",
      "Material Status",
      "Total Cost",
      "Notes",
      "Created At",
      "Last Updated",
    ].join(",");
    
    const rows = filteredProjects.map((p) =>
      [
        `"${p.name}"`,
        `"${p.stage}"`,
        `"${p.materialStatus}"`,
        p.totalCost,
        `"${p.notes || ""}"`,
        `"${new Date(p.createdAt).toLocaleDateString()}"`,
        `"${new Date(p.updatedAt).toLocaleDateString()}"`,
      ].join(",")
    );
    
    const csvData = [headers, ...rows].join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Projects_Export_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex items-center space-x-2 border rounded-md px-3 bg-white w-full md:w-1/3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            className="border-0 shadow-none focus-visible:ring-0"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Select value={stageFilter} onValueChange={(val) => setStageFilter(val || "All")}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Stages</SelectItem>
            <SelectItem value="In Talk">In Talk</SelectItem>
            <SelectItem value="Deal Completed">Deal Completed</SelectItem>
            <SelectItem value="Amount Credited">Amount Credited</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "All")}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Material Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Ordered">Ordered</SelectItem>
            <SelectItem value="Shipped">Shipped</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2 w-full md:w-auto mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={exportCSV}>
             Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-hidden print-friendly">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Material Status</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="text-right">Project Cost</TableHead>
              <TableHead className="text-right">Last Updated</TableHead>
              <TableHead className="text-right no-print">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  No projects match your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <TableRow 
                  key={project.id}
                  className={
                    project.status === "Completed" 
                      ? "bg-green-50 hover:bg-green-100" 
                      : "bg-yellow-50 hover:bg-yellow-100 animate-blink-yellow"
                  }
                >
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{project.stage}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{project.materialStatus}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={
                        project.status === "Completed" 
                          ? "bg-green-600 hover:bg-green-600 text-white" 
                          : "bg-yellow-500 hover:bg-yellow-500 text-white"
                      }
                    >
                      {project.status || "In Progress"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-700">
                    {(() => {
                      const sellingExGst = project.marginLineItems.reduce(
                        (sum: number, item: any) => sum + ((item.sellUnitPriceInclGst * item.qty) / (1 + item.sellGstPercent / 100)),
                        0
                      );
                      const costConsidered = project.marginLineItems.reduce((sum: number, item: any) => {
                        const buyingExGst = (item.buyingAmountInclGst * item.qty) / (1 + item.buyGstPercent / 100);
                        return sum + (item.itcEligible ? buyingExGst : (item.buyingAmountInclGst * item.qty));
                      }, 0);
                      const mediatorCost = project.mediators.reduce((sum: number, m: any) => sum + m.amount, 0);
                      return formatCurrency(sellingExGst - costConsidered - mediatorCost);
                    })()}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(project.totalCost)}</TableCell>
                  <TableCell className="text-right">{new Date(project.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right no-print gap-2 flex justify-end">
                    <Link href={`/project/${project.id}`}>
                      <Button variant="outline" size="sm">Open</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
