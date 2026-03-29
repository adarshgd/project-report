"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { logout } from "@/app/actions/auth";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";

export default function Header({ user }: { user: any }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) return null;

  return (
    <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 no-print">
      <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="Experimind Labs" 
            width={180} 
            height={50} 
            className="h-10 md:h-12 w-auto object-contain" 
            priority 
          />
        </Link>
        <div className="flex items-center gap-1 md:gap-4">
          {user?.role === "admin" && (
            <Link href="/admin">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 md:w-auto md:px-3 text-xs border-slate-200">
                <Settings className="h-4 w-4 md:mr-2 text-slate-600" />
                <span className="hidden md:inline">Admin</span>
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-600" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
