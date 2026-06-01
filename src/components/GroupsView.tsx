import { useMemo, useState } from "react";
import GroupDetailModal from "./GroupDetailModal";
import { photoPublicUrl } from "../lib/supabase";
import type { MullensGroup } from "../types";

type Props = {
  groups: MullensGroup[];
  loading?: boolean;
  onOpenMaster?: (externalId: string) => void;
};

export default function GroupsView({ groups, loading, onOpenMaster }: Props) {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<MullensGroup | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => {
      const hay = `group ${g.group_number} ${g.title} ${g.item_count}`.toLowerCase();
      return hay.includes(q);
    });
  }, [groups, search]);

  const totalItems = useMemo(
    () => groups.reduce((sum, g) => sum + (g.item_count ?? 0), 0),
    [groups]
  );

  if (loading && groups.length === 0) {
    return <p className="muted empty">Loading Mullens groups…</p>;
  }

  return (
    <>
      <section className="toolbar toolbar--groups">
        <input
          type="search"
          placeholder="Search group number or title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search"
        />
        <span className="groups-stats muted">
          {groups.length} groups · {totalItems} Mullens items
        </span>
        {search && (
          <button type="button" className="btn-ghost" onClick={() => setSearch("")}>
            Clear
          </button>
        )}
      </section>

      {filtered.length === 0 ? (
        <p className="muted empty">No groups match your search.</p>
      ) : (
        <div className="groups-grid">
          {filtered.map((group) => {
            const photoUrl = group.storage_path ? photoPublicUrl(group.storage_path) : null;
            return (
              <button
                key={group.group_number}
                type="button"
                className="group-card"
                onClick={() => setSelectedGroup(group)}
              >
                <div className="group-card-media">
                  {photoUrl ? (
                    <img src={photoUrl} alt="" loading="lazy" />
                  ) : (
                    <span className="group-card-placeholder">Group {group.group_number}</span>
                  )}
                </div>
                <div className="group-card-body">
                  <span className="group-card-num">Group {group.group_number}</span>
                  <span className="group-card-title">{group.title}</span>
                  <span className="group-card-count">
                    {group.item_count} item{group.item_count === 1 ? "" : "s"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <GroupDetailModal
        group={selectedGroup}
        open={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        onOpenMaster={
          onOpenMaster
            ? (id) => {
                setSelectedGroup(null);
                onOpenMaster(id);
              }
            : undefined
        }
      />
    </>
  );
}
