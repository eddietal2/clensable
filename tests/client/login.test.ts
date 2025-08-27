// tests/client/login.test.ts
import { render, fireEvent, waitFor, screen } from "@testing-library/svelte";
import LoginPage from "../../src/routes/login/+page.svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("LoginPage", () => {
  const dummyEmail = "test@example.com";

  beforeEach(() => {
    vi.restoreAllMocks(); // reset mocks before each test
  });

  it("shows success message after submitting valid email", async () => {
    // Mock fetch to return success
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Magic link sent" })
    }));

    render(LoginPage);

    const input = screen.getByLabelText("Email") as HTMLInputElement;
    const button = screen.getByText("Send Magic Link") as HTMLButtonElement;

    // Type email and submit
    await fireEvent.input(input, { target: { value: dummyEmail } });
    await fireEvent.click(button);

    // Spinner should appear and button should be disabled
    expect(button.disabled).toBe(true);

    // Success message appears after 2 seconds
    await waitFor(() => {
      expect(screen.getByText("Magic Link Sent!")).toBeDefined();
    }, { timeout: 2500 });
  });

  it("shows error message if API returns an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Invalid email" })
    }));

    render(LoginPage);

    const input = screen.getByLabelText("Email") as HTMLInputElement;
    const button = screen.getByText("Send Magic Link") as HTMLButtonElement;

    await fireEvent.input(input, { target: { value: dummyEmail } });
    await fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Invalid email")).toBeDefined();
    });

    expect(button.disabled).toBe(false);
  });

  it("shows unexpected error if fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));

    render(LoginPage);

    const input = screen.getByLabelText("Email") as HTMLInputElement;
    const button = screen.getByText("Send Magic Link") as HTMLButtonElement;

    await fireEvent.input(input, { target: { value: dummyEmail } });
    await fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Unexpected error")).toBeDefined();
    });
  });
});
