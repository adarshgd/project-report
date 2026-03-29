import LoginForm from "@/components/LoginForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="mb-8 text-center max-w-sm mx-auto">
        <Image 
          src="/logo.png" 
          alt="Experimind Labs" 
          width={400} 
          height={100} 
          className="w-full h-auto mb-4" 
          priority 
        />

      </div>
      <LoginForm />
    </div>
  );
}
