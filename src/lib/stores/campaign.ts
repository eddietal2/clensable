import { writable } from 'svelte/store';

export interface CampaignStore {
  id: string;
  name: string;
  targetZip?: string;
  leadCount?: number;
}

export const currentCampaign = writable<CampaignStore | null>(null);
