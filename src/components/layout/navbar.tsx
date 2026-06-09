"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag, Bell, Home, Store, ShoppingCart,
  Package, User, Bike, ChefHat, MapPin,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { getInitial } from "@/lib/utils";

export function TopNav() {
  const { user, isAuth } = useAuthStore();
  const router = useRouter();

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl grad flex items-center justify-center shadow-md">
            <ShoppingBag className="text-white" size={16} />
          </div>
          <div className="leading-none">
            <p className="text-sm font-extrabold grad-t">QabiFly</p>
            <div className="flex items-center gap-0.5">
              <MapPin size={8} className="text-gray-400" />
              <span className="text-[9px] text-gray-400 font-medium">
                Reoti, Ballia
              </span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/notifications"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Bell size={18} className="text-gray-600" />
          </Link>
          <button
            onClick={() => router.push(isAuth ? "/profile" : "/login")}
            className="w-8 h-8 rounded-full grad flex items-center justify-center ml-1 shadow-md"
          >
            <span className="text-white font-extrabold text-xs">
              {isAuth ? getInitial(user?.virtual_name || user?.full_name) : "G"}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export function BotNav() {
  const path           = usePathname();
  const router         = useRouter();
  const { isAuth, user } = useAuthStore();
  const { count }      = useCartStore();
  const role           = user?.role;

  const buyerTabs = [
    { icon: Home,         label: "Home",    href: "/",       auth: false },
    { icon: Store,        label: "Shops",   href: "/shops",  auth: false },
    { icon: ShoppingCart, label: "Cart",    href: "/cart",   auth: false, badge: count },
    { icon: Package,      label: "Orders",  href: "/orders", auth: true  },
    { icon: User,         label: "Profile", href: "/profile",auth: false },
  ];

  const shopkeeperTabs = [
    { icon: Home,    label: "Home",      href: "/",                     auth: false },
    { icon: ChefHat, label: "Dashboard", href: "/shopkeeper/dashboard", auth: true  },
    { icon: Package, label: "Orders",    href: "/shopkeeper/orders",    auth: true  },
    { icon: Store,   label: "Shop",      href: "/shopkeeper/shop",      auth: true  },
    { icon: User,    label: "Profile",   href: "/profile",              auth: false },
  ];

  const deliveryTabs = [
    { icon: Home,    label: "Home",       href: "/",                  auth: false },
    { icon: Bike,    label: "Dashboard",  href: "/delivery/dashboard",auth: true  },
    { icon: Package, label: "Deliveries", href: "/delivery/orders",   auth: true  },
    { icon: User,    label: "Profile",    href: "/profile",           auth: false },
  ];

  const tabs =
    role === "SHOPKEEPER"   ? shopkeeperTabs :
    role === "DELIVERY_BOY" ? deliveryTabs   :
    buyerTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-lg">
      <div className="max-w-md mx-auto flex">
        {tabs.map((tab) => {
          const Icon   = tab.icon;
          const active = path === tab.href || path.startsWith(tab.href + "/");
          const badge  = (tab as any).badge;

          return (
            <button
              key={tab.href}
              onClick={() => {
                if (tab.auth && !isAuth) router.push("/login");
                else router.push(tab.href);
              }}
              className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors"
            >
              <div className="relative">
                <Icon
                  size={22}
                  className={active ? "text-purple-600" : "text-gray-400"}
                />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 grad rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[9px] font-bold uppercase tracking-wide ${
                  active ? "text-purple-600" : "text-gray-400"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}