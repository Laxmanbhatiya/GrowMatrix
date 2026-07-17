"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center font-sans bg-background text-foreground">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-md shadow-primary/10">
        <AlertCircle size={32} />
      </div>
      
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
        Page Not Found
      </h1>
      
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        The requested URL path does not exist in the GrowMatrix indexing router.
      </p>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-md hover:bg-primary/95 transition-all shadow-sm duration-150"
        >
          Return to Dashboard
        </Link>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-secondary transition-colors duration-150"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
