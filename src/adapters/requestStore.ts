import type { RequestStatus, SiteRequestRecord } from "../types/request.js";

export interface RequestStore {
  create(record: SiteRequestRecord): Promise<SiteRequestRecord>;
  get(id: string): Promise<SiteRequestRecord | undefined>;
  list(status?: RequestStatus): Promise<SiteRequestRecord[]>;
  update(record: SiteRequestRecord): Promise<SiteRequestRecord>;
}
