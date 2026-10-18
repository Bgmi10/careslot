"use client";
import { useState } from "react";
import ServicesTab from "./ServicesTab";
import SlotsTab from "./SlotsTab";
import { BookingsTab, UsersTab, ReportsTab } from "./OtherTabs";

const tabs = { Services: ServicesTab, Slots: SlotsTab, Bookings: BookingsTab, Users: UsersTab, Reports: ReportsTab };

export default function Admin() {
  const [tab, setTab] = useState<keyof typeof tabs>("Services");
  const Tab = tabs[tab];
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Admin</h1>
      <div role="tablist" className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(tabs) as (keyof typeof tabs)[]).map((t) => (
          <button key={t} role="tab" aria-selected={t === tab} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${t === tab ? "bg-brand text-white" : "bg-white border border-ink/20 hover:bg-brand-soft"}`}>{t}</button>
        ))}
      </div>
      <Tab />
    </>
  );
}
