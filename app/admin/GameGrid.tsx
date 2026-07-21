import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api-client";
import { ALL_DEVICE_TYPES, type DeviceType } from "@/lib/data";
import type { Games } from "@/hooks/useAdminData";
import { useToast } from "@/components/Toast";

interface GameGridProps {
  games: Games;
  refresh: () => void;
}

function DeviceTypePicker({
  value,
  onChange,
}: {
  value: DeviceType[];
  onChange: (v: DeviceType[]) => void;
}) {
  function toggle(t: DeviceType) {
    onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);
  }
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {ALL_DEVICE_TYPES.map((t) => (
        <button
          type="button"
          key={t}
          onClick={() => toggle(t)}
          className={`py-1.5 rounded-lg text-[11px] font-semibold border ${
            value.includes(t)
              ? "border-pink bg-(--pink-dim) text-pink"
              : "border-line bg-bg-soft text-text-dim"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export default function GameGrid({ games, refresh }: GameGridProps) {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editDeviceTypes, setEditDeviceTypes] = useState<DeviceType[]>([]);
  const [editAvailable, setEditAvailable] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const { showToast, confirmToast } = useToast();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/admin/games", { name, genre, imageUrl, deviceTypes });
      setName("");
      setGenre("");
      setImageUrl("");
      setDeviceTypes([]);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(g: Games[number]) {
    setEditingId(g.id);
    setEditName(g.name);
    setEditGenre(g.genre);
    setEditImageUrl(g.imageUrl);
    setEditDeviceTypes(g.deviceTypes as DeviceType[]);
    setEditAvailable(g.isAvailable);
    setEditError(null);
  }

  async function handleSave(id: string) {
    setEditSaving(true);
    setEditError(null);
    try {
      await api.patch(`/admin/games/${id}`, {
        name: editName,
        genre: editGenre,
        imageUrl: editImageUrl,
        deviceTypes: editDeviceTypes,
        isAvailable: editAvailable,
      });
      setEditingId(null);
      refresh();
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: string, gameName: string) {
    const ok = await confirmToast(
      `Delete "${gameName}"? This can't be undone.`,
      {
        confirmLabel: "Delete",
      },
    );
    if (!ok) return;
    try {
      await api.delete(`/admin/games/${id}`);
      showToast("Game deleted", "success");
      refresh();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  }

  return (
    <>
      <div className="pb-2 text-[12px] tracking-wider text-text-dim uppercase font-semibold">
        Add a game
      </div>
      <form
        onSubmit={handleAdd}
        className="bg-card border border-line rounded-2xl p-4 flex flex-col gap-4 mb-3 max-w-md"
      >
        <div>
          <label className="text-[11px] font-semibold text-text-dim mb-1.5 block">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Valorant"
            className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-text-dim mb-1.5 block">
            Genre
          </label>
          <input
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="e.g. Tactical FPS"
            className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-text-dim mb-1.5 block">
            Image link (Cloudinary)
          </label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://res.cloudinary.com/..."
            className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-text-dim mb-1.5 block">
            Devices
          </label>
          <DeviceTypePicker value={deviceTypes} onChange={setDeviceTypes} />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2.5 rounded-lg font-display font-bold text-[13px] tracking-wide text-white whitespace-nowrap"
          style={{
            background: "linear-gradient(90deg, var(--pink), var(--purple))",
          }}
        >
          {submitting ? "Adding…" : "Add game"}
        </button>
      </form>
      {error && (
        <div className="mb-3 px-3.5 py-2.5 rounded-[10px] bg-[#ff2e9322] text-pink text-[12.5px] font-semibold">
          {error}
        </div>
      )}

      <div className="pt-4 pb-2 text-[12px] tracking-wider text-text-dim uppercase font-semibold">
        All games ({games.length})
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {games.map((g) =>
          editingId === g.id ? (
            <div
              key={g.id}
              className="bg-card border border-pink rounded-2xl px-4 py-3 flex flex-col gap-2"
            >
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-bg-soft text-text text-[12.5px] focus:outline-none focus:border-pink"
              />
              <input
                value={editGenre}
                onChange={(e) => setEditGenre(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-bg-soft text-text text-[12.5px] focus:outline-none focus:border-pink"
              />
              <input
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-bg-soft text-text text-[12.5px] focus:outline-none focus:border-pink"
              />
              <DeviceTypePicker
                value={editDeviceTypes}
                onChange={setEditDeviceTypes}
              />
              <label className="flex items-center gap-2 text-[12px] text-text-dim">
                <input
                  type="checkbox"
                  checked={editAvailable}
                  onChange={(e) => setEditAvailable(e.target.checked)}
                />
                Available
              </label>
              {editError && (
                <div className="text-[11px] text-pink">{editError}</div>
              )}
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleSave(g.id)}
                  disabled={editSaving}
                  className="flex-1 py-1.5 rounded-lg text-[11.5px] font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--pink), var(--purple))",
                  }}
                >
                  {editSaving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 py-1.5 rounded-lg text-[11.5px] font-semibold text-text-dim bg-bg-soft border border-line"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              key={g.id}
              className="flex items-center justify-between bg-card border border-line rounded-2xl px-4 py-3"
            >
              <div>
                <div className="font-bold text-sm">{g.name}</div>
                <div className="text-xs text-text-dim mt-0.5">
                  {g.genre} · {(g.deviceTypes as string[]).join(", ")}
                </div>
                <div
                  className={`text-[10.5px] font-bold mt-1 ${g.isAvailable ? "text-lime" : "text-taken"}`}
                >
                  {g.isAvailable ? "AVAILABLE" : "HIDDEN"}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(g)}
                  className="text-[10.5px] font-semibold text-text-dim bg-bg-soft border border-line px-2 py-1 rounded-full"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(g.id, g.name)}
                  className="text-[10.5px] font-semibold text-pink bg-[#ff2e9322] border border-pink px-2 py-1 rounded-full"
                >
                  Delete
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </>
  );
}
