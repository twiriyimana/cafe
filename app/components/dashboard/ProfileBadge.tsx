import Link from "next/link";
import { clearAuthSession } from "../../../lib/api-client";

type ProfileBadgeProps = { role: "admin" | "user"; active?: boolean };

/** Bottom-left badge of every dashboard sidebar. For admins ("CD") it opens the Account folder. */
export default function ProfileBadge({ role, active = false }: ProfileBadgeProps) {
  const wrapper = "mt-auto flex items-center justify-between gap-2 border-t border-[#4b362a] pt-3 text-[11px]";
  return (
    <div className={wrapper}>
      {role === "admin" ? (
        <Link
          href="/dashboard/admin/account"
          title="Account settings"
          aria-label="Open account settings"
          aria-current={active ? "page" : undefined}
          className={`-mx-1 block rounded-md px-1 py-1.5 text-inherit no-underline transition hover:bg-[#805336] hover:text-white ${active ? "bg-[#805336] text-white" : ""}`}
        >
          CD
        </Link>
      ) : <span className="px-1">US</span>}
      <Link href="/" onClick={clearAuthSession} className="rounded-md px-2 py-1.5 text-[#cdbdaf] no-underline transition hover:bg-[#805336] hover:text-white">
        Log out
      </Link>
    </div>
  );
}
