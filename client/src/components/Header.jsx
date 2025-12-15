import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Link } from "wouter";

export function Header() {
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Destinations', href: '#features' },
    { name: 'Forum', href: '/forum' },
    { name: 'Stocks', href: 'http://127.0.0.1:5000/login' },
    { name: 'About', href: '#about' },
  ];

  return (
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-sm border-b z-50">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <span className="text-2xl font-bold text-primary cursor-pointer" data-testid="text-logo">
                Destinate
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="flex items-baseline space-x-4">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors hover-elevate"
                data-testid={`link-nav-${item.name.toLowerCase()}`}
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/signin">
              <Button variant="ghost" data-testid="button-sign-in">
                Sign In
              </Button>
            </Link>
            <Link href="/itineraries">
              <Button data-testid="button-get-started">
                Plan your trip
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}