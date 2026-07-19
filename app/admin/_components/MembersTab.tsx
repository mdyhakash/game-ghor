import { useState } from "react";
import { getMemberDetail, approveMembership } from "@/lib/store";
import type { Members } from "../_hooks/useAdminData";
import DetailStat from "./DetailStat";
import { formatDate } from "../_lib/format";

interface MembersTabProps {
  members: Members;
  refresh: () => void;
}

export default function MembersTab({ members, refresh }: MembersTabProps) {
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const memberDetail = selectedMemberId ? getMemberDetail(selectedMemberId) : null;

  function openMember(id: string) {
    setSelectedMemberId(id);
  }

  function closeMember() {
    setSelectedMemberId(null);
  }

  function handleApprove(id: string) {
    approveMembership(id);
    refresh();
  }

  const filteredMembers = members.filter((m) =>
    m.phone.includes(memberSearch.trim()),
  );

  return (
    <>
      {/* members tab search */}
      <input
        type="tel"
        placeholder="Search by phone number…"
        value={memberSearch}
        onChange={(e) => setMemberSearch(e.target.value)}
        className="w-full md:max-w-xs px-3.5 py-2.5 rounded-xl border border-line bg-bg-soft text-text text-[13.5px] focus:outline-none focus:border-pink mb-4"
      />

      {filteredMembers.length === 0 ? (
        <div className="text-center py-12 text-text-dim text-[13.5px]">
          No members found.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-[18px] md:mx-0 px-[18px] md:px-0">
          <table className="w-full text-[13px] border-collapse min-w-[520px]">
            <thead>
              <tr className="text-left text-text-dim text-[11px] uppercase tracking-wider">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Phone</th>
                <th className="py-2 pr-3">Member ID</th>
                <th className="py-2 pr-3">Points</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => openMember(m.id)}
                  className="border-t border-line cursor-pointer hover:bg-bg-soft"
                >
                  <td className="py-2.5 pr-3 font-semibold">
                    {m.name}
                    {m.membershipStatus === "PENDING" && (
                      <span className="ml-2 text-[10px] font-bold text-gold bg-[var(--gold-dim)] border border-gold px-1.5 py-0.5 rounded-full align-middle">
                        PENDING
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-text-dim">{m.phone}</td>
                  <td className="py-2.5 pr-3 text-text-dim">{m.id}</td>
                  <td className="py-2.5 pr-3 font-bold text-gold">
                    {m.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* member detail modal */}
      {selectedMemberId && memberDetail && (
        <div
          className="fixed inset-0 z-20 bg-black/60 flex items-center justify-center p-4"
          onClick={closeMember}
        >
          <div
            className="bg-card border border-line rounded-2xl w-full max-w-md p-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-display text-lg font-bold">
                  {memberDetail.member.name}
                </div>
                <div className="text-xs text-text-dim mt-0.5">
                  {memberDetail.member.phone}
                </div>
              </div>
              <button
                onClick={closeMember}
                className="text-text-dim text-xl leading-none"
              >
                ×
              </button>
            </div>

            {memberDetail.member.membershipStatus === "PENDING" ? (
              <div className="flex items-center justify-between bg-[var(--gold-dim)] border border-gold rounded-xl px-3.5 py-3 mb-4">
                <span className="text-[12.5px] font-bold text-gold">
                  ⏳ Pending approval
                </span>
                <button
                  onClick={() => handleApprove(memberDetail.member.id)}
                  className="text-[11.5px] font-bold text-white px-3 py-1.5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--pink), var(--purple))",
                  }}
                >
                  Approve membership
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[var(--lime-dim)] border border-lime rounded-xl px-3.5 py-2.5 mb-4 text-[12.5px] font-bold text-lime">
                ✓ Approved member
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <DetailStat
                label="Member ID"
                value={memberDetail.member.id}
                small
              />
              <DetailStat
                label="Member since"
                value={formatDate(memberDetail.member.createdAt)}
              />
              <DetailStat
                label="Points"
                value={String(memberDetail.member.points)}
                accent="text-gold"
              />
              <DetailStat
                label="Total hours"
                value={`${memberDetail.member.totalHours}h`}
              />
              <DetailStat
                label="Total visits"
                value={String(memberDetail.visitCount)}
              />
              <DetailStat
                label="Visits (last 30d)"
                value={String(memberDetail.visitsLast30Days)}
              />
            </div>

            <div className="text-[11px] text-text-dim mb-1">
              Last visit:{" "}
              {memberDetail.lastVisit
                ? formatDate(memberDetail.lastVisit)
                : "No visits yet"}
            </div>

            <div className="text-[12px] tracking-wider text-text-dim uppercase font-semibold pt-3 pb-2">
              Booking history
            </div>
            {memberDetail.bookings.length === 0 ? (
              <div className="text-[12.5px] text-text-dim py-3">
                No bookings yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {memberDetail.bookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex justify-between items-center bg-bg-soft rounded-xl px-3 py-2 text-[12.5px]"
                  >
                    <div>
                      <div className="font-semibold">
                        {b.device?.name ?? "Device"} · #{b.token}
                      </div>
                      <div className="text-text-dim text-[11px] mt-0.5">
                        {formatDate(b.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">৳{b.finalPrice}</div>
                      <div className="text-[10.5px] text-text-dim mt-0.5">
                        {b.status}
                        {b.paid ? " · paid" : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
