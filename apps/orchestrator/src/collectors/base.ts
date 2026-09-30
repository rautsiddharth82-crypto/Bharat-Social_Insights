import { Post } from "@bsi/types";

export interface Collector {
  platformName: string;
  isConfigured(): boolean;
  fetch(): Promise<Post[]>;
}
