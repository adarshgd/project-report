import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Project Manager</h1>
        <p className="text-slate-500">Secure entry for authorized personnel only</p>
      </div>
      <LoginForm />
    </div>
  );
}
