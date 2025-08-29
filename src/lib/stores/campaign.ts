import { writable } from 'svelte/store';

export interface CampaignStore {
  id: string;
  name: string;
}

export const currentCampaign = writable<CampaignStore | null>(null);
