import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { SupportWidget } from "@/components/SupportWidget";
import { ThemeProvider } from "@/lib/theme";
import { InfrastructureProvider } from "@/lib/infrastructure/InfrastructureProvider";
import { initSentry } from "@/lib/sentry";

import appCss from "../styles.css?url";

// Initialize Sentry for production error tracking
initSentry();

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-gold">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-gradient-gold px-4 py-2 text-sm font-medium text-gold-foreground transition-opacity hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Amira Gold — Buy, Store & Invest in Gold" },
      { name: "description", content: "Amira Gold lets you buy physical gold, invest in digital gold, and store securely in world-class vaults." },
      { name: "author", content: "Amira Gold" },
      { property: "og:title", content: "Amira Gold — Buy, Store & Invest in Gold" },
      { property: "og:description", content: "The trusted way to buy, store, and invest in gold globally." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          id="amira-theme-init"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ 
            __html: `(function(){try{var s=localStorage.getItem('amira-theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=(s==='light'||s==='dark')?s:(m?'dark':'light');var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);r.style.colorScheme=t;}catch(e){document.documentElement.classList.add('dark');}})();` 
          }} 
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <InfrastructureProvider>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
          <Toaster />
          <SupportWidget />
        </AuthProvider>
      </ThemeProvider>
    </InfrastructureProvider>
  );
}
