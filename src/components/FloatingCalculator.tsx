"use client";

import React, { useState } from "react";
import { Calculator, X, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A floating, easy-access calculator for financial computations.
 * Optimized for Experimind Labs' project reporting needs.
 */
export default function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);

  const handleNumber = (n: string) => {
    if (display === "0" || display === "Error" || hasCalculated) {
      setDisplay(n);
      setHasCalculated(false);
    } else {
      setDisplay(display + n);
    }
  };

  const handleOperator = (op: string) => {
    if (display === "Error") return;
    setExpression(display + " " + op + " ");
    setDisplay("0");
    setHasCalculated(false);
  };

  const calculate = () => {
    try {
      if (!expression) return;
      const fullExpression = expression + display;
      
      // Simple and safe math evaluator
      const cleanExpr = fullExpression.replace(/[^-+/*0-9.]/g, "");
      // eslint-disable-next-line no-eval
      const result = eval(cleanExpr);
      
      // Format to maximum 4 decimal places, removing trailing zeros
      const formattedResult = Number(Number(result).toFixed(4)).toString();
      
      setHistory([`${fullExpression} = ${formattedResult}`, ...history.slice(0, 2)]);
      setDisplay(formattedResult);
      setExpression("");
      setHasCalculated(true);
    } catch (e) {
      setDisplay("Error");
    }
  };

  const clear = () => {
    setDisplay("0");
    setExpression("");
    setHasCalculated(false);
  };

  const deleteLast = () => {
    if (display === "Error" || hasCalculated) {
      clear();
      return;
    }
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const handlePercent = () => {
    if (display === "Error") return;
    setDisplay((Number(display) / 100).toString());
    setHasCalculated(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] print:hidden">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          title="Open Calculator"
          className="h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 transition-all hover:scale-110 active:scale-95 group border-2 border-white/20"
        >
          <Calculator className="h-7 w-7 text-white group-hover:rotate-12 transition-transform" />
        </Button>
      ) : (
        <Card className="w-72 shadow-2xl border-2 border-slate-200 overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-5 duration-200">
          <CardHeader className="p-3 bg-slate-900 text-white flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1 rounded">
                <Calculator className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-xs font-black tracking-widest uppercase italic">Experi-Calc</CardTitle>
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-3 space-y-3 bg-white">
            {/* Display Area */}
            <div className="bg-slate-900 p-3 rounded-md text-right min-h-[72px] flex flex-col justify-end shadow-inner mb-4">
              <div className="text-[10px] text-blue-400/50 font-mono h-4 truncate">
                {expression}
              </div>
              <div className="text-2xl font-bold font-mono text-white truncate break-all">
                {display}
              </div>
            </div>

            {/* Buttons Grid */}
            <div className="grid grid-cols-4 gap-2">
              {/* Row 1 */}
              <CalcButton onClick={clear} className="text-red-500 bg-red-50 hover:bg-red-100 border-red-100">C</CalcButton>
              <CalcButton onClick={deleteLast} className="bg-slate-50"><Delete className="h-4 w-4 text-slate-600" /></CalcButton>
              <CalcButton onClick={handlePercent} className="bg-slate-50 text-slate-600">%</CalcButton>
              <CalcButton onClick={() => handleOperator("/")} className="bg-blue-50 text-blue-700 border-blue-100">÷</CalcButton>

              {/* Row 2 */}
              <CalcButton onClick={() => handleNumber("7")}>7</CalcButton>
              <CalcButton onClick={() => handleNumber("8")}>8</CalcButton>
              <CalcButton onClick={() => handleNumber("9")}>9</CalcButton>
              <CalcButton onClick={() => handleOperator("*")} className="bg-blue-50 text-blue-700 border-blue-100">×</CalcButton>

              {/* Row 3 */}
              <CalcButton onClick={() => handleNumber("4")}>4</CalcButton>
              <CalcButton onClick={() => handleNumber("5")}>5</CalcButton>
              <CalcButton onClick={() => handleNumber("6")}>6</CalcButton>
              <CalcButton onClick={() => handleOperator("-")} className="bg-blue-50 text-blue-700 border-blue-100">−</CalcButton>

              {/* Row 4 */}
              <CalcButton onClick={() => handleNumber("1")}>1</CalcButton>
              <CalcButton onClick={() => handleNumber("2")}>2</CalcButton>
              <CalcButton onClick={() => handleNumber("3")}>3</CalcButton>
              <CalcButton onClick={() => handleOperator("+")} className="bg-blue-50 text-blue-700 border-blue-100">+</CalcButton>

              {/* Row 5 */}
              <CalcButton onClick={() => handleNumber("0")} className="col-span-2">0</CalcButton>
              <CalcButton onClick={() => handleNumber(".")}>.</CalcButton>
              <CalcButton onClick={calculate} className="bg-blue-600 text-white hover:bg-blue-700 font-black shadow-lg border-blue-700 shadow-blue-200 shadow-md transform active:translate-y-0.5 active:shadow-none">=</CalcButton>
            </div>

            {/* Simple History */}
            {history.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100 italic text-[9px] text-slate-400 text-center truncate">
                    {history[0]}
                </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CalcButton({ children, onClick, className }: { children: React.ReactNode, onClick: () => void, className?: string }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-11 p-0 text-base font-bold rounded-lg hover:bg-slate-100 active:scale-95 transition-all shadow-sm border border-slate-200",
        className
      )}
    >
      {children}
    </Button>
  );
}
