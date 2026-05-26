import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { RequestStatus, SiteRequestRecord } from "../types/request.js";
import type { RequestStore } from "./requestStore.js";

export class FileRequestStore implements RequestStore {
  constructor(private readonly path: string) {}

  async create(record: SiteRequestRecord): Promise<SiteRequestRecord> {
    const records = await this.read();
    records.push(record);
    await this.write(records);
    return record;
  }

  async get(id: string): Promise<SiteRequestRecord | undefined> {
    return (await this.read()).find((record) => record.id === id);
  }

  async list(status?: RequestStatus): Promise<SiteRequestRecord[]> {
    const records = await this.read();
    return status ? records.filter((record) => record.status === status) : records;
  }

  async update(record: SiteRequestRecord): Promise<SiteRequestRecord> {
    const records = await this.read();
    const index = records.findIndex((item) => item.id === record.id);
    if (index === -1) {
      throw new Error(`Request '${record.id}' was not found.`);
    }

    records[index] = record;
    await this.write(records);
    return record;
  }

  private async read(): Promise<SiteRequestRecord[]> {
    try {
      const content = await readFile(this.path, "utf8");
      return JSON.parse(content) as SiteRequestRecord[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }

      throw error;
    }
  }

  private async write(records: SiteRequestRecord[]) {
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, JSON.stringify(records, null, 2), "utf8");
  }
}
