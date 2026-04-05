"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calculator, X, Delete, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A DRAGGABLE, high-contrast floating calculator for accurate financial work.
 * Features a bright high-visibility LCD screen and full expression tracking.
 */
export default function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);
  
  // Draggable State
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const calculatorRef = useRef<HTMLDivElement>(null);

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (calculatorRef.current) {
      const rect = calculatorRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Initial Position (Bottom Right)
  useEffect(() => {
    if (isOpen && position.x === 0 && position.y === 0) {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      setPosition({
        x: screenWidth - 320, // Approx width of calc
        y: screenHeight - 480  // Approx height of calc
      });
    }
  }, [isOpen]);

  const handleNumber = (n: string) => {
    if (hasCalculated) {
      setDisplay(n);
      setHasCalculated(false);
    } else if (display === "0" || display === "Error") {
      setDisplay(n);
    } else {
      setDisplay(display + n);
    }
  };

  const handleOperator = (op: string) => {
    if (display === "Error") return;
    setExpression(expression + display + " " + op + " ");
    setDisplay("0");
    setHasCalculated(false);
  };

  const calculate = () => {
    try {
      const fullExpression = expression + display;
      if (!fullExpression || fullExpression === "0") return;

      // Safe evaluation of basic math
      const cleanExpr = fullExpression.replace(/[^-+/*0-9.]/g, "");
      // eslint-disable-next-line no-eval
      const result = eval(cleanExpr);
      
      const formattedResult = Number(Number(result).toFixed(4)).toString();
      
      setHistory([`${fullExpression} = ${formattedResult}`, ...history.slice(0, 2)]);
      setDisplay(formattedResult);
      setExpression("");
      setHasCalculated(true);
    } catch (e) {
      setDisplay("Error");
      setExpression("");
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
    
    // If there's an active expression (like "100 + "), calculating % should be based on the first number.
    // e.g., "100 + 18%" becomes "100 + 18" (where 18 is 18% of 100), results in 118.
    if (expression) {
      try {
        const cleanExpr = expression.replace(/[^-+/*0-9.]/g, "").trim();
        // If the expression ends with an operator, we evaluate everything before it
        const baseExpr = /[-+/*]$/.test(cleanExpr) ? cleanExpr.slice(0, -1) : cleanExpr;
        
        // eslint-disable-next-line no-eval
        const baseValue = parseFloat(eval(baseExpr));
        
        if (!isNaN(baseValue)) {
          const percentFactor = parseFloat(display) / 100;
          const percentValue = baseValue * percentFactor;
          setDisplay(Number(percentValue.toFixed(4)).toString());
        } else {
          setDisplay((Number(display) / 100).toString());
        }
      } catch (e) {
        setDisplay((Number(display) / 100).toString());
      }
    } else {
      setDisplay((Number(display) / 100).toString());
    }
    setHasCalculated(true);
  };

  return (
    <div className="fixed z-[100] print:hidden">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem" }}
          className="h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 transition-all hover:scale-110 active:scale-95 group border-2 border-white/20"
        >
          <Calculator className="h-7 w-7 text-white group-hover:rotate-12 transition-transform" />
        </Button>
      ) : (
        <div 
          ref={calculatorRef}
          style={{ 
            position: "fixed", 
            left: `${position.x}px`, 
            top: `${position.y}px`,
            cursor: isDragging ? "grabbing" : "default"
          }}
          className="select-none"
        >
          <Card className="w-72 shadow-2xl border-stone-300 ring-4 ring-black/5 animate-in fade-in zoom-in slide-in-from-bottom-5 duration-200">
            <CardHeader 
              onMouseDown={handleMouseDown}
              className="p-3 bg-slate-900 text-white flex flex-row items-center justify-between space-y-0 cursor-grab active:cursor-grabbing rounded-t-lg transition-colors hover:bg-slate-800"
            >
              <div className="flex items-center gap-2">
                <GripHorizontal className="h-4 w-4 text-blue-400" />
                <CardTitle className="text-xs font-black tracking-widest uppercase italic pointer-events-none">
                  Experi-Calc v2
                </CardTitle>
              </div>
              <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="h-6 w-6 text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-3 space-y-3 bg-white">
              {/* ULTRA-BRIGHT HIGH-CONTRAST DISPLAY */}
              <div className="bg-white p-4 rounded-xl text-right min-h-[110px] flex flex-col justify-end shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] border-2 border-blue-500 ring-4 ring-blue-50 transition-all group relative">
                <div className="text-sm font-black text-blue-500 font-mono h-6 mb-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
                  {expression}
                </div>
                <div className="text-4xl font-black font-mono text-slate-900 truncate break-all leading-none tracking-tighter">
                  {display === "0" && expression ? "" : display}
                </div>
                <div className="absolute top-2 left-3 text-[10px] font-black text-blue-600 bg-blue-50 px-1 rounded uppercase tracking-widest border border-blue-200">
                  Bright Mode LCD
                </div>
              </div>

              {/* Buttons Grid */}
              <div className="grid grid-cols-4 gap-2">
                <CalcButton onClick={clear} className="text-red-600 bg-red-100/50 hover:bg-red-100 border-red-200">C</CalcButton>
                <CalcButton onClick={deleteLast} className="bg-slate-50"><Delete className="h-4 w-4 text-slate-600" /></CalcButton>
                <CalcButton onClick={handlePercent} className="bg-slate-50 text-slate-700 font-bold">%</CalcButton>
                <CalcButton onClick={() => handleOperator("/")} className="bg-blue-600 text-white hover:bg-blue-700">÷</CalcButton>

                <CalcButton onClick={() => handleNumber("7")}>7</CalcButton>
                <CalcButton onClick={() => handleNumber("8")}>8</CalcButton>
                <CalcButton onClick={() => handleNumber("9")}>9</CalcButton>
                <CalcButton onClick={() => handleOperator("*")} className="bg-blue-600 text-white hover:bg-blue-700">×</CalcButton>

                <CalcButton onClick={() => handleNumber("4")}>4</CalcButton>
                <CalcButton onClick={() => handleNumber("5")}>5</CalcButton>
                <CalcButton onClick={() => handleNumber("6")}>6</CalcButton>
                <CalcButton onClick={() => handleOperator("-")} className="bg-blue-600 text-white hover:bg-blue-700">−</CalcButton>

                <CalcButton onClick={() => handleNumber("1")}>1</CalcButton>
                <CalcButton onClick={() => handleNumber("2")}>2</CalcButton>
                <CalcButton onClick={() => handleNumber("3")}>3</CalcButton>
                <CalcButton onClick={() => handleOperator("+")} className="bg-blue-600 text-white hover:bg-blue-700">+</CalcButton>

                <CalcButton onClick={() => handleNumber("0")} className="col-span-2">0</CalcButton>
                <CalcButton onClick={() => handleNumber(".")}>.</CalcButton>
                <CalcButton onClick={calculate} className="bg-orange-500 text-white hover:bg-orange-600 font-black shadow-lg border-b-4 border-orange-700 transform active:border-b-0 active:translate-y-1 transition-all">=</CalcButton>
              </div>

              {/* Latest Result Label */}
              {history.length > 0 && (
                  <div className="mt-1 pt-1 italic text-[9px] text-blue-300 text-center font-bold">
                      {history[0]}
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function CalcButton({ children, onClick, className }: { children: React.ReactNode, onClick: () => void, className?: string }) {
  return (
    <Button
      variant="outline"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "h-12 p-0 text-lg font-bold rounded-xl hover:bg-slate-100 active:scale-90 transition-all shadow-md border-slate-200 border-2",
        className
      )}
    >
      {children}
    </Button>
  );
}
