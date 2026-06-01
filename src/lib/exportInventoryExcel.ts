import ExcelJS from "exceljs";
import type { ItemWithPhotos } from "./api";
import { dispositionLabel } from "./disposition";
import { photoPublicUrl } from "./supabase";
import type { Photo } from "../types";

function sortKey(externalId: string | null): number {
  if (!externalId) return 999999;
  const n = parseInt(externalId, 10);
  return Number.isNaN(n) ? 999998 : n;
}

function primaryPhoto(item: ItemWithPhotos): Photo | null {
  return (
    item.photos.find((p) => p.uploaded && p.storage_path && p.is_primary) ??
    item.photos.find((p) => p.uploaded && p.storage_path) ??
    null
  );
}

function extraPhotoUrls(item: ItemWithPhotos, primary: Photo | null): string[] {
  const urls: string[] = [];
  for (const p of item.photos) {
    if (!p.uploaded || !p.storage_path) continue;
    if (primary && p.id === primary.id) continue;
    const url = photoPublicUrl(p.storage_path, "full");
    if (url) urls.push(url);
  }
  return urls;
}

export async function downloadInventoryExcel(items: ItemWithPhotos[]): Promise<void> {
  const sorted = [...items].sort((a, b) => sortKey(a.external_id) - sortKey(b.external_id));

  const wb = new ExcelJS.Workbook();
  wb.creator = "Cragleigh Inventory";
  const ws = wb.addWorksheet("Inventory", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws.columns = [
    { header: "#", key: "num", width: 10 },
    { header: "Category", key: "category", width: 18 },
    { header: "Description", key: "description", width: 42 },
    { header: "Disposal", key: "disposal", width: 22 },
    { header: "Status", key: "status", width: 16 },
    { header: "Comments", key: "comments", width: 28 },
    { header: "Photo ref", key: "photoRef", width: 14 },
    { header: "Image", key: "image", width: 14 },
    { header: "More images", key: "moreImages", width: 36 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8E4DC" },
  };

  for (const item of sorted) {
    const photo = primaryPhoto(item);
    const imageUrl = photo ? photoPublicUrl(photo.storage_path, "full") : null;
    const more = extraPhotoUrls(item, photo);

    const row = ws.addRow({
      num: item.external_id ?? "",
      category: item.category ?? "",
      description: item.brief_description ?? "",
      disposal: item.disposal_method ?? "",
      status: dispositionLabel(item.disposition_status),
      comments: item.comments ?? "",
      photoRef: item.photo_refs_raw ?? "",
      image: imageUrl ? "View image" : "",
      moreImages: more.join("\n"),
    });

    if (imageUrl) {
      const cell = row.getCell("image");
      cell.value = { text: "View image", hyperlink: imageUrl };
      cell.font = { color: { argb: "FF0563C1" }, underline: true };
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cragleigh-inventory-${date}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
