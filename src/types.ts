export type CatalogStatus =
  | "draft"
  | "catalogued"
  | "tba"
  | "missing_photo"
  | "needs_review";

export type DispositionStatus =
  | "at_cragleigh"
  | "taken"
  | "removed"
  | "with_mullens"
  | "sold"
  | "auction"
  | "ebay_clearance"
  | "charity"
  | "unknown";

export type Item = {
  id: string;
  external_id: string | null;
  item_type: string;
  category: string | null;
  disposal_method: string | null;
  disposition_status: DispositionStatus;
  brief_description: string | null;
  comments: string | null;
  value_amount: number | null;
  catalog_status: CatalogStatus;
  photo_refs_raw: string | null;
  source_sheet: string;
  mullens_item_no?: number | null;
  master_item_id?: number | null;
  group_number?: number | null;
};

export type MullensGroup = {
  group_number: number;
  title: string;
  notes: string | null;
  storage_path: string | null;
  item_count: number;
};

export type Photo = {
  id: string;
  item_id: string | null;
  img_number: number;
  storage_path: string | null;
  local_filename: string;
  is_primary: boolean;
  uploaded: boolean;
};
