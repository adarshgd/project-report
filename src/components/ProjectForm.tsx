"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteProject, saveProject } from "@/app/actions";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Save, ArrowLeft, Loader2, StickyNote } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProjectForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Basic Info state
  const [name, setName] = useState(initialData?.name || "");
  const [totalCost, setTotalCost] = useState(initialData?.totalCost || 0);
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [stage, setStage] = useState(initialData?.stage || "In Talk");
  const [materialStatus, setMaterialStatus] = useState(initialData?.materialStatus || "In Progress");

  // Dynamic Content Array States
  // Initialize with at least 1 blank row
  const [contents, setContents] = useState<any[]>(
    initialData?.contents?.length > 0 ? initialData.contents : [{ description: "" }]
  );
  
  const [mediators, setMediators] = useState<any[]>(
    initialData?.mediators?.length > 0
      ? initialData.mediators
      : [{ name: "", amount: 0, notes: "" }]
  );

  const [marginItems, setMarginItems] = useState<any[]>(
    initialData?.marginLineItems?.length > 0
      ? initialData.marginLineItems
      : [
          {
            itemService: "",
            qty: 1,
            sellUnitPriceInclGst: 0,
            sellGstPercent: 0,
            buyingAmountInclGst: 0,
            buyGstPercent: 0,
            itcEligible: true,
          },
        ]
  );

  // Auto-add rows handlers
  const handleContentChange = (index: number, value: string) => {
    const newContents = [...contents];
    newContents[index].description = value;
    if (index === newContents.length - 1 && value.trim() !== "") {
      newContents.push({ description: "" });
    }
    setContents(newContents);
  };

  const handleMediatorChange = (index: number, field: string, value: any) => {
    const newMeds = [...mediators];
    newMeds[index][field] = value;
    if (index === newMeds.length - 1 && (newMeds[index].name || newMeds[index].amount > 0)) {
      newMeds.push({ name: "", amount: 0, notes: "" });
    }
    setMediators(newMeds);
  };

  const handleMarginChange = (index: number, field: string, value: any) => {
    const newItems = [...marginItems];
    newItems[index][field] = value;
    if (
      index === newItems.length - 1 &&
      (newItems[index].itemService || newItems[index].sellUnitPriceInclGst > 0 || newItems[index].buyingAmountInclGst > 0)
    ) {
      newItems.push({
        itemService: "",
        qty: 1,
        sellUnitPriceInclGst: 0,
        sellGstPercent: 0,
        buyingAmountInclGst: 0,
        buyGstPercent: 0,
        itcEligible: true,
      });
    }
    setMarginItems(newItems);
  };

  const removeRow = (setter: any, arr: any[], index: number) => {
    if (arr.length > 1) {
      setter(arr.filter((_, i) => i !== index));
    }
  };

  // Calculations
  const calculatedMargins = useMemo(() => {
    return marginItems.map((item) => {
      // Validate inputs safely to not crash
      const qty = Number(item.qty) || 0;
      const sellUnitPriceInclGst = Number(item.sellUnitPriceInclGst) || 0;
      const sellGstPercent = Number(item.sellGstPercent) || 0;
      const buyingAmountInclGst = Number(item.buyingAmountInclGst) || 0;
      const buyGstPercent = Number(item.buyGstPercent) || 0;
      const itcEligible = !!item.itcEligible;

      const sellTotalInclGst = qty * sellUnitPriceInclGst;
      const sellingAmountExGst = sellTotalInclGst / (1 + sellGstPercent / 100);
      const sellGstAmount = sellTotalInclGst - sellingAmountExGst;

      const buyingAmountExGst = buyingAmountInclGst / (1 + buyGstPercent / 100);
      const buyGstAmount = buyingAmountInclGst - buyingAmountExGst;

      const itcClaim = itcEligible ? buyGstAmount : 0;
      const costConsidered = itcEligible ? buyingAmountExGst : buyingAmountInclGst;

      const profitAfterGstItc = sellingAmountExGst - costConsidered;
      const marginPercent = sellingAmountExGst > 0 ? (profitAfterGstItc / sellingAmountExGst) * 100 : 0;

      return {
        ...item,
        sellingAmountExGst,
        sellGstAmount,
        sellTotalInclGst,
        buyingAmountExGst,
        buyGstAmount,
        itcClaim,
        costConsidered,
        profitAfterGstItc,
        marginPercent,
      };
    });
  }, [marginItems]);

  const totals = useMemo(() => {
    return calculatedMargins.reduce(
      (acc, item) => ({
        sellingAmountExGst: acc.sellingAmountExGst + item.sellingAmountExGst,
        sellGstAmount: acc.sellGstAmount + item.sellGstAmount,
        sellTotalInclGst: acc.sellTotalInclGst + item.sellTotalInclGst,
        buyingAmountInclGst: acc.buyingAmountInclGst + Number(item.buyingAmountInclGst || 0),
        buyingAmountExGst: acc.buyingAmountExGst + item.buyingAmountExGst,
        buyGstAmount: acc.buyGstAmount + item.buyGstAmount,
        itcClaim: acc.itcClaim + item.itcClaim,
        costConsidered: acc.costConsidered + item.costConsidered,
        profitAfterGstItc: acc.profitAfterGstItc + item.profitAfterGstItc,
      }),
      {
        sellingAmountExGst: 0,
        sellGstAmount: 0,
        sellTotalInclGst: 0,
        buyingAmountInclGst: 0,
        buyingAmountExGst: 0,
        buyGstAmount: 0,
        itcClaim: 0,
        costConsidered: 0,
        profitAfterGstItc: 0,
      }
    );
  }, [calculatedMargins]);

  const overallMarginPercent =
    totals.sellingAmountExGst > 0 ? (totals.profitAfterGstItc / totals.sellingAmountExGst) * 100 : 0;

  const totalMediatorCost = useMemo(() => {
    return mediators.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  }, [mediators]);

  const netAfterMediator = totals.profitAfterGstItc - totalMediatorCost;

  // Final Action Handlers
  const handleSave = async () => {
    setLoading(true);
    // filter out the empty trailing rows
    const cleanedContents = contents.filter((c) => c.description.trim() !== "");
    const cleanedMediators = mediators.filter((m) => m.name.trim() !== "" || m.amount > 0);
    const cleanedMargins = marginItems.filter(
      (m) => m.itemService.trim() !== "" || m.sellUnitPriceInclGst > 0 || m.buyingAmountInclGst > 0
    ).map(m => ({
      ...m,
      qty: Number(m.qty) || 1,
      sellUnitPriceInclGst: Number(m.sellUnitPriceInclGst) || 0,
      sellGstPercent: Number(m.sellGstPercent) || 0,
      buyingAmountInclGst: Number(m.buyingAmountInclGst) || 0,
      buyGstPercent: Number(m.buyGstPercent) || 0,
      itcEligible: !!m.itcEligible
    }));

    const data = {
      name,
      totalCost: Number(totalCost),
      stage,
      materialStatus,
      notes,
      contents: cleanedContents,
      mediators: cleanedMediators,
      marginLineItems: cleanedMargins,
    };

    const result = await saveProject(initialData?.id || null, data);
    
    if (result.success) {
      // Navigate to the newly created project's URL instead of /new, or dashboard
      if (!initialData) {
        router.push("/");
      } else {
        router.refresh();
      }
    } else {
      alert("Failed to save project. Please check if all fields are valid.");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (initialData?.id && window.confirm("Are you sure you want to delete this project?")) {
      setLoading(true);
      await deleteProject(initialData.id);
      router.push("/");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden flex-col">
      {/* Top Header / Action Bar */}
      <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 lg:h-[60px]">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold">{initialData ? "Edit Project" : "New Project"}</span>
        <div className="ml-auto flex gap-2">
          {initialData && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={loading || !name}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" /> Save Project
          </Button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website Redesign" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Project Cost</label>
                <Input type="number" value={totalCost || ''} onChange={(e) => setTotalCost(Number(e.target.value))} />
              </div>
              <div className="space-y-2 lg:col-span-3">
                <label className="text-sm font-medium">Notes / Remarks</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions..." />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>2. Stage Selector</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {["In Talk", "Deal Completed", "Amount Credited"].map((s) => (
                  <Badge
                    key={s}
                    variant={stage === s ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm"
                    onClick={() => setStage(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Material / Service Status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {["In Progress", "Ordered", "Shipped", "Delivered"].map((s) => (
                  <Badge
                    key={s}
                    variant={materialStatus === s ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm"
                    onClick={() => setMaterialStatus(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>4. Project Contents</CardTitle>
              <CardDescription>Enter the items involved. A new row is automatically added when you type.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Sr. No</TableHead>
                    <TableHead>Content / Item Description</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contents.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>
                        <Input
                          value={c.description}
                          onChange={(e) => handleContentChange(i, e.target.value)}
                          placeholder="e.g. Graphic Designs"
                        />
                      </TableCell>
                      <TableCell>
                        {contents.length > 1 && i !== contents.length - 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeRow(setContents, contents, i)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Mediators</CardTitle>
              <CardDescription>Record any mediators and their cuts. Auto-totals at bottom.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Sr.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount (₹)</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mediators.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>
                        <Input value={m.name} onChange={(e) => handleMediatorChange(i, "name", e.target.value)} placeholder="Mediator name" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={m.amount || ''} onChange={(e) => handleMediatorChange(i, "amount", Number(e.target.value))} />
                      </TableCell>
                      <TableCell>
                        <Input value={m.notes} onChange={(e) => handleMediatorChange(i, "notes", e.target.value)} />
                      </TableCell>
                      <TableCell>
                        {mediators.length > 1 && i !== mediators.length - 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeRow(setMediators, mediators, i)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell colSpan={2} className="text-right">Total Mediator Cost:</TableCell>
                    <TableCell colSpan={3} className="text-left text-blue-600">{formatCurrency(totalMediatorCost)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <CardTitle>6. Project Margin Table</CardTitle>
              <span className="text-sm font-normal text-muted-foreground mr-auto">- Complex computation</span>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[1500px] text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">Sr.</TableHead>
                    <TableHead className="w-[180px]">Item / Service</TableHead>
                    <TableHead className="w-[80px]">Qty</TableHead>
                    <TableHead className="w-[100px]">Sell Prc. Incl GST</TableHead>
                    <TableHead className="w-[100px] bg-slate-50">Sell Amt Ex GST</TableHead>
                    <TableHead className="w-[80px]">Sell GST %</TableHead>
                    <TableHead className="w-[90px] bg-slate-50">Sell GST Amt</TableHead>
                    <TableHead className="w-[100px] bg-blue-50 border-r-4 border-slate-300">Sell Tot. Incl GST</TableHead>
                    <TableHead className="w-[100px]">Buy Amt Incl GST</TableHead>
                    <TableHead className="w-[80px]">Buy GST %</TableHead>
                    <TableHead className="w-[100px] bg-slate-50">Buy Amt Ex GST</TableHead>
                    <TableHead className="w-[90px] bg-slate-50">Buy GST Amt</TableHead>
                    <TableHead className="w-[90px]">ITC Eligible</TableHead>
                    <TableHead className="w-[90px] bg-green-50">ITC Claim</TableHead>
                    <TableHead className="w-[100px] bg-slate-50">Cost Considered</TableHead>
                    <TableHead className="w-[100px] bg-green-100 font-bold text-green-800">Profit A. GST/ITC</TableHead>
                    <TableHead className="w-[80px] bg-blue-50">Margin %</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculatedMargins.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>
                        <Input className="h-8 text-xs" value={item.itemService} onChange={(e) => handleMarginChange(i, "itemService", e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input className="h-8 text-xs px-1" type="number" value={item.qty || ''} onChange={(e) => handleMarginChange(i, "qty", Number(e.target.value))} />
                      </TableCell>
                      <TableCell>
                        <Input className="h-8 text-xs p-1" type="number" value={item.sellUnitPriceInclGst || ''} onChange={(e) => handleMarginChange(i, "sellUnitPriceInclGst", Number(e.target.value))} />
                      </TableCell>
                      <TableCell className="bg-slate-50">{formatCurrency(item.sellingAmountExGst)}</TableCell>
                      <TableCell>
                        <Select value={item.sellGstPercent.toString()} onValueChange={(val) => handleMarginChange(i, "sellGstPercent", Number(val))}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="%" /></SelectTrigger>
                          <SelectContent>
                           {[0, 5, 12, 18, 28].map(p => <SelectItem key={p} value={p.toString()}>{p}%</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="bg-slate-50">{formatCurrency(item.sellGstAmount)}</TableCell>
                      <TableCell className="bg-blue-50 font-medium border-r-4 border-slate-300">{formatCurrency(item.sellTotalInclGst)}</TableCell>
                      
                      <TableCell>
                        <Input className="h-8 text-xs p-1" type="number" value={item.buyingAmountInclGst || ''} onChange={(e) => handleMarginChange(i, "buyingAmountInclGst", Number(e.target.value))} />
                      </TableCell>
                      <TableCell>
                        <Select value={item.buyGstPercent?.toString() || "0"} onValueChange={(val) => handleMarginChange(i, "buyGstPercent", Number(val))}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="%" /></SelectTrigger>
                          <SelectContent>
                           {[0, 5, 12, 18, 28].map(p => <SelectItem key={p} value={p.toString()}>{p}%</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="bg-slate-50">{formatCurrency(item.buyingAmountExGst)}</TableCell>
                      <TableCell className="bg-slate-50">{formatCurrency(item.buyGstAmount)}</TableCell>
                      
                      <TableCell>
                        <Select value={item.itcEligible ? "yes" : "no"} onValueChange={(val) => handleMarginChange(i, "itcEligible", val === "yes")}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="ITC" /></SelectTrigger>
                          <SelectContent>
                           <SelectItem value="yes">Yes</SelectItem>
                           <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="bg-green-50 text-green-700">{formatCurrency(item.itcClaim)}</TableCell>
                      <TableCell className="bg-slate-50">{formatCurrency(item.costConsidered)}</TableCell>
                      <TableCell className="bg-green-100 font-bold text-green-900">{formatCurrency(item.profitAfterGstItc)}</TableCell>
                      <TableCell className="bg-blue-50 font-medium">{item.marginPercent.toFixed(1)}%</TableCell>
                      
                      <TableCell>
                        {marginItems.length > 1 && i !== marginItems.length - 1 && (
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => removeRow(setMarginItems, marginItems, i)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t-2 border-slate-300">
                    <TableCell colSpan={4} className="text-right py-4">TOTALS</TableCell>
                    <TableCell>{formatCurrency(totals.sellingAmountExGst)}</TableCell>
                    <TableCell></TableCell>
                    <TableCell>{formatCurrency(totals.sellGstAmount)}</TableCell>
                    <TableCell className="text-blue-700 border-r-4 border-slate-300">{formatCurrency(totals.sellTotalInclGst)}</TableCell>
                    <TableCell>{formatCurrency(totals.buyingAmountInclGst)}</TableCell>
                    <TableCell></TableCell>
                    <TableCell>{formatCurrency(totals.buyingAmountExGst)}</TableCell>
                    <TableCell>{formatCurrency(totals.buyGstAmount)}</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-green-700">{formatCurrency(totals.itcClaim)}</TableCell>
                    <TableCell>{formatCurrency(totals.costConsidered)}</TableCell>
                    <TableCell className="text-green-800">{formatCurrency(totals.profitAfterGstItc)}</TableCell>
                    <TableCell className="text-blue-600">{overallMarginPercent.toFixed(1)}%</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {/* Spacer block for scrolling bottom past the sticky bar if needed */}
          <div className="h-10" />
        </div>

        {/* Right / Bottom Sticky Summary Panel */}
        <div className="w-80 border-l bg-slate-50 p-6 overflow-y-auto hidden lg:block">
          <div className="sticky top-0 space-y-6">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Summary</h3>
              <p className="text-sm text-muted-foreground break-words">{name || "Untitled Project"}</p>
            </div>
            
            <div className="flex gap-2">
              <Badge>{stage}</Badge>
              <Badge variant="secondary">{materialStatus}</Badge>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Sell (Ex GST)</span>
                <span className="font-medium">{formatCurrency(totals.sellingAmountExGst)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Sell (Incl GST)</span>
                <span className="font-medium">{formatCurrency(totals.sellTotalInclGst)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Buy (Incl GST)</span>
                <span className="font-medium">{formatCurrency(totals.buyingAmountInclGst)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Total ITC Claim</span>
                <span>{formatCurrency(totals.itcClaim)}</span>
              </div>
              
              <div className="flex justify-between text-sm border-t border-slate-200 pt-3">
                <span className="font-medium">Gross Profit</span>
                <span className="font-bold text-green-700">{formatCurrency(totals.profitAfterGstItc)}</span>
              </div>
              <div className="flex justify-between text-sm text-blue-600">
                <span>Gross Margin %</span>
                <span>{overallMarginPercent.toFixed(1)}%</span>
              </div>

              <div className="flex justify-between text-sm text-red-600 border-t border-slate-200 pt-3">
                <span>Mediators Cost</span>
                <span>- {formatCurrency(totalMediatorCost)}</span>
              </div>
              
              <div className="flex justify-between text-base border-t-2 border-slate-800 pt-3 font-black">
                <span>Net Profit</span>
                <span className="text-green-800">{formatCurrency(netAfterMediator)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
