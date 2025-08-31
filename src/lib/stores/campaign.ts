import { writable } from 'svelte/store';

export interface CampaignStore {
  id: string;
  name: string;
  targetZip?: string;
  leadCount?: number;
  description?: string;
  radius?: number;
  category?: string;
}

// The currently selected campaign
export const currentCampaign = writable<CampaignStore | null>(null);

// All campaigns for dropdowns
export const campaignsStore = writable<CampaignStore[]>([]);
