import { describe, it, expect, vi } from 'vitest';
import { POST } from '../../src/routes/api/places/+server';

describe('POST /api/places/search', () => {
  it('should return places when given a textQuery', async () => {
    // Mock the request payload
    const requestBody = { textQuery: "Spicy Vegetarian Food in Sydney, Australia" };
    
    // Mock fetch for Google Places API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        places: [
          { displayName: { text: "Spicy Veggie House" }, formattedAddress: "123 Sydney St" }
        ]
      })
    } as any);

    // Call the POST handler
    const response = await POST({
      request: new Request("http://localhost/api/places/search", {
        method: "POST",
        body: JSON.stringify(requestBody)
      })
    } as any);

    // Assertions
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.places).toHaveLength(1);
    expect(data.places[0].displayName.text).toBe("Spicy Veggie House");
  });

  it('should return 400 if textQuery is missing', async () => {
    const response = await POST({
      request: new Request("http://localhost/api/places/search", {
        method: "POST",
        body: JSON.stringify({})
      })
    } as any);

    expect(response.status).toBe(400);
  });
});
