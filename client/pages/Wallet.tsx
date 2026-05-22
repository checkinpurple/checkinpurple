import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import AppSidebar from "@/components/AppSidebar";

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price_zar: number;
}

export default function Wallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [packages, setPackages] = useState<CoinPackage[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [balanceRes, packagesRes] = await Promise.all([
          fetch("/api/coins/balance", { headers: { Authorization: `Bearer ${user?.id}` } }),
          fetch("/api/coins/packages"),
        ]);

        const balanceData = await balanceRes.json();
        const packageData = await packagesRes.json();

        setBalance(typeof balanceData.balance === "number" ? balanceData.balance : 0);
        setPackages(Array.isArray(packageData.packages) ? packageData.packages : []);
      } catch {
        setBalance(0);
        setPackages([]);
      }
    };

    if (user) load();
  }, [user]);

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <main className="flex-1 lg:ml-56 pt-16 lg:pt-0 p-6 space-y-4">
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-muted-foreground text-sm">Track your coin balance and available top-up packages.</p>

        <div className="rounded-xl border border-border/40 p-4 max-w-xl bg-card/30">
          <p className="text-sm text-muted-foreground">Current balance</p>
          <p className="text-2xl font-bold">{balance ?? "…"} coins</p>
        </div>

        <div className="space-y-2 max-w-xl">
          <p className="font-semibold">Available packages</p>
          {packages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No packages available.</p>
          ) : (
            packages.map((pkg) => (
              <div key={pkg.id} className="rounded-lg border border-border/40 p-3 bg-card/20 text-sm">
                {pkg.name}: {pkg.coins} coins · R{pkg.price_zar}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
