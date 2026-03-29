"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { logout } from "@/app/actions/auth";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) return null;

  return (
    <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 no-print">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="Experimind Labs" 
            width={180} 
            height={50} 
            className="h-10 w-auto object-contain" 
            priority 
          />
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
