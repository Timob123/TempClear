import { supabase, photoPublicUrl } from "./supabase";
import type { DispositionStatus, Item, MullensGroup, Photo } from "../types";

const IMG_RE = /IMG[_\s]?(\d+)/i;

function extractImgNumbers(text: string): number[] {
  const nums: number[] = [];
  const re = new RegExp(IMG_RE.source, "gi");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const n = parseInt(match[1], 10);
    if (!Number.isNaN(n) && n < 100000) nums.push(n);
  }
  return nums;
}

export type ItemWithPhotos = Item & { photos: Photo[] };

export type MullensGroupItem = Item & {
  photos: Photo[];
  master_external_id: string | null;
};

export type MasterMullensLink = {
  group_number: number;
  group_title: string;
  mullens_item_no: number | null;
};

export type ItemInput = {
  external_id?: string | null;
  category?: string | null;
  disposal_method?: string | null;
  disposition_status?: DispositionStatus;
  brief_description?: string | null;
  comments?: string | null;
  photo_refs_raw?: string | null;
  catalog_status?: Item["catalog_status"];
};

function attachPhotos<T extends Item>(items: T[], photos: Photo[] | null): (T & { photos: Photo[] })[] {
  const byItem = new Map<string, Photo[]>();
  for (const p of photos ?? []) {
    if (!p.item_id) continue;
    const list = byItem.get(p.item_id) ?? [];
    list.push(p);
    byItem.set(p.item_id, list);
  }
  return items.map((item) => ({
    ...item,
    photos: (byItem.get(item.id) ?? []).sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary)
    ),
  }));
}

export async function fetchMullensGroups(): Promise<MullensGroup[]> {
  const { data, error } = await supabase
    .from("mullens_groups_summary")
    .select("*")
    .order("group_number", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MullensGroup[];
}

export async function fetchMullensGroupItems(groupNumber: number): Promise<MullensGroupItem[]> {
  const { data: mullensItems, error: itemsError } = await supabase
    .from("items")
    .select("*")
    .eq("source_sheet", "mullens")
    .eq("group_number", groupNumber)
    .order("mullens_item_no", { ascending: true });
  if (itemsError) throw itemsError;
  if (!mullensItems?.length) return [];

  const masterNums = [
    ...new Set(
      mullensItems.map((i) => i.master_item_id).filter((n): n is number => n != null)
    ),
  ];
  const masterByNum = new Map<number, ItemWithPhotos>();

  if (masterNums.length) {
    const { data: masters, error: masterErr } = await supabase
      .from("items")
      .select("*")
      .eq("source_sheet", "master");
    if (masterErr) throw masterErr;
    const masterIds = (masters ?? [])
      .filter((m) => {
        const n = parseInt(String(m.external_id ?? ""), 10);
        return !Number.isNaN(n) && masterNums.includes(n);
      })
      .map((m) => m.id);

    let masterPhotos: Photo[] = [];
    if (masterIds.length) {
      const { data: photos, error: photosErr } = await supabase
        .from("photos")
        .select("*")
        .in("item_id", masterIds);
      if (photosErr) throw photosErr;
      masterPhotos = photos ?? [];
    }

    for (const m of attachPhotos(masters ?? [], masterPhotos)) {
      const n = parseInt(String(m.external_id ?? ""), 10);
      if (!Number.isNaN(n)) masterByNum.set(n, m);
    }
  }

  const mullensIds = mullensItems.map((i) => i.id);
  const { data: mPhotos, error: mPhotosErr } = await supabase
    .from("photos")
    .select("*")
    .in("item_id", mullensIds);
  if (mPhotosErr) throw mPhotosErr;
  const withOwnPhotos = attachPhotos(mullensItems, mPhotos ?? []);

  return withOwnPhotos.map((item) => {
    const master =
      item.master_item_id != null ? masterByNum.get(item.master_item_id) : undefined;
    const photos = item.photos.length ? item.photos : (master?.photos ?? []);
    return {
      ...item,
      photos,
      master_external_id: master?.external_id ?? null,
    };
  });
}

export async function fetchMullensLinksForMaster(
  externalId: string | null
): Promise<MasterMullensLink[]> {
  const n = parseInt(String(externalId ?? ""), 10);
  if (Number.isNaN(n)) return [];

  const { data: mullensRows, error } = await supabase
    .from("items")
    .select("group_number, mullens_item_no")
    .eq("source_sheet", "mullens")
    .eq("master_item_id", n);
  if (error) throw error;
  if (!mullensRows?.length) return [];

  const groupNums = [...new Set(mullensRows.map((r) => r.group_number).filter((g): g is number => g != null))];
  const { data: groups, error: gErr } = await supabase
    .from("mullens_groups")
    .select("group_number, title")
    .in("group_number", groupNums);
  if (gErr) throw gErr;
  const titleByGroup = new Map((groups ?? []).map((g) => [g.group_number, g.title as string]));

  return mullensRows
    .filter((r) => r.group_number != null)
    .map((r) => ({
      group_number: r.group_number as number,
      group_title: titleByGroup.get(r.group_number as number) ?? `Group ${r.group_number}`,
      mullens_item_no: r.mullens_item_no,
    }));
}

export async function fetchMasterItems(): Promise<ItemWithPhotos[]> {
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("*")
    .eq("source_sheet", "master")
    .order("external_id", { ascending: true });

  if (itemsError) throw itemsError;
  if (!items?.length) return [];

  const ids = items.map((i) => i.id);
  const { data: photos, error: photosError } = await supabase
    .from("photos")
    .select("*")
    .in("item_id", ids);

  if (photosError) throw photosError;
  return attachPhotos(items, photos);
}

export async function createItem(input: ItemInput): Promise<Item> {
  const { data, error } = await supabase
    .from("items")
    .insert({
      ...input,
      source_sheet: "master",
      item_type: "household",
      catalog_status: input.catalog_status ?? "draft",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(id: string, input: ItemInput): Promise<Item> {
  const { data, error } = await supabase.from("items").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteItem(id: string): Promise<void> {
  const { data: photos } = await supabase.from("photos").select("id, storage_path").eq("item_id", id);
  for (const p of photos ?? []) {
    if (p.storage_path) {
      await supabase.storage.from("inventory-photos").remove([p.storage_path]);
    }
  }
  await supabase.from("photos").delete().eq("item_id", id);
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw error;
}

function imgNumberFromFilename(name: string): number | null {
  const m = name.match(IMG_RE);
  return m ? parseInt(m[1], 10) : null;
}

const DEFAULT_CATEGORIES = [
  "Lighting & lamps",
  "Silver",
  "Furniture",
  "Brass & Copper Ornaments",
  "Silver/EPNS cutlery & serving utensils",
  "Waterford Glass",
  "Paintings or Wall Hanging Decorations",
  "Jewlery",
  "Crystal Glassware, Decanters, Bowls and  vases",
  "Ceramics",
  "Fine China / Crockery",
  "Fine China and Crockery",
  "Appliances",
  "Brass / Copper Trays & Wall Hangings",
];

export async function fetchCategoryOptions(): Promise<string[]> {
  const { data } = await supabase.from("items").select("category").eq("source_sheet", "master");
  const set = new Set(DEFAULT_CATEGORIES);
  for (const row of data ?? []) {
    if (row.category?.trim()) set.add(row.category.trim());
  }
  return [...set].sort();
}

export async function fetchDisposalOptions(): Promise<string[]> {
  const { data } = await supabase.from("items").select("disposal_method").eq("source_sheet", "master");
  const set = new Set<string>();
  for (const row of data ?? []) {
    if (row.disposal_method?.trim()) set.add(row.disposal_method.trim());
  }
  return [...set].sort();
}

export async function getNextItemNumber(): Promise<string> {
  const { data } = await supabase.from("items").select("external_id").eq("source_sheet", "master");
  let max = 0;
  for (const row of data ?? []) {
    const n = parseInt(String(row.external_id ?? ""), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return String(max + 1);
}

async function nextImgNumber(): Promise<number> {
  const { data } = await supabase.from("photos").select("img_number").order("img_number", { ascending: false }).limit(1);
  const fromPhotos = data?.[0]?.img_number ?? 2393;
  const { data: items } = await supabase.from("items").select("photo_refs_raw").eq("source_sheet", "master");
  let maxFromRefs = 0;
  for (const row of items ?? []) {
    for (const n of extractImgNumbers(String(row.photo_refs_raw ?? ""))) {
      maxFromRefs = Math.max(maxFromRefs, n);
    }
  }
  return Math.max(fromPhotos, maxFromRefs) + 1;
}

export async function getNextPhotoRef(): Promise<{ imgNumber: number; photoRef: string }> {
  const imgNumber = await nextImgNumber();
  return { imgNumber, photoRef: `IMG_${imgNumber}` };
}

export async function fetchNextMasterIds(): Promise<{
  itemNumber: string;
  imgNumber: number;
  photoRef: string;
}> {
  const [itemNumber, photo] = await Promise.all([getNextItemNumber(), getNextPhotoRef()]);
  return { itemNumber, ...photo };
}

export async function uploadPhotoForItem(
  itemId: string,
  file: File,
  setPrimary = false,
  forcedImgNumber?: number
): Promise<Photo> {
  let imgNumber = forcedImgNumber ?? imgNumberFromFilename(file.name);
  if (!imgNumber) imgNumber = await nextImgNumber();

  const storagePath = `img/${imgNumber}/${file.name.replace(/\s+/g, "_")}`;
  const { error: upErr } = await supabase.storage
    .from("inventory-photos")
    .upload(storagePath, file, { upsert: true, contentType: file.type || undefined });
  if (upErr) throw upErr;

  if (setPrimary) {
    await supabase.from("photos").update({ is_primary: false }).eq("item_id", itemId);
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const { data, error } = await supabase
    .from("photos")
    .insert({
      item_id: itemId,
      img_number: imgNumber,
      storage_path: storagePath,
      local_filename: file.name,
      file_format: ext,
      uploaded: true,
      is_primary: setPrimary,
      is_duplicate_copy: false,
      file_size_bytes: file.size,
    })
    .select()
    .single();
  if (error) throw error;

  const item = await supabase.from("items").select("photo_refs_raw").eq("id", itemId).single();
  const ref = `IMG_${imgNumber}`;
  const existing = item.data?.photo_refs_raw?.trim();
  if (!existing?.includes(ref)) {
    await supabase
      .from("items")
      .update({
        photo_refs_raw: existing ? `${existing} / ${ref}` : ref,
        catalog_status: "catalogued",
      })
      .eq("id", itemId);
  }

  return data;
}

export async function deletePhoto(photo: Photo): Promise<void> {
  if (photo.storage_path) {
    await supabase.storage.from("inventory-photos").remove([photo.storage_path]);
  }
  const { error } = await supabase.from("photos").delete().eq("id", photo.id);
  if (error) throw error;
}

export async function downloadPhoto(photo: Photo): Promise<void> {
  const url = photoPublicUrl(photo.storage_path);
  if (!url) throw new Error("No file in storage");

  const res = await fetch(url);
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = photo.local_filename || `IMG_${photo.img_number}.jpg`;
  a.click();
  URL.revokeObjectURL(a.href);
}
