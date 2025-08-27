import { render, fireEvent, waitFor } from "@testing-library/svelte";
import LoginPage from "../../src/routes/login/+page.svelte";
import { vi } from "vitest";
import '@testing-library/jest-dom';

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

    const { getByLabelText, getByText, queryByText } = render(LoginPage);

    const input = getByLabelText("Email") as HTMLInputElement;
    const button = getByText("Send Magic Link") as HTMLButtonElement;

    // Type email and submit
    await fireEvent.input(input, { target: { value: dummyEmail } });
    await fireEvent.click(button);

    // Spinner should appear and button should be disabled
    expect(button).toBeDisabled();
    expect(queryByText("Magic Link Sent!")).not.toBeInTheDocument();

    // Wait for the 2-second setTimeout in your component
    await waitFor(() => expect(queryByText("Magic Link Sent!")).toBeInTheDocument(), { timeout: 2500 });
  });

  it("shows error message if API returns an error", async () => {
    // Mock fetch to return error
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Invalid email" })
    }));

    const { getByLabelText, getByText } = render(LoginPage);

    const input = getByLabelText("Email") as HTMLInputElement;
    const button = getByText("Send Magic Link") as HTMLButtonElement;

    await fireEvent.input(input, { target: { value: dummyEmail } });
    await fireEvent.click(button);

    // Error message should appear
    await waitFor(() => expect(getByText("Invalid email")).toBeInTheDocument());
    expect(button).not.toBeDisabled();
  });

  it("shows unexpected error if fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));

    const { getByLabelText, getByText } = render(LoginPage);

    const input = getByLabelText("Email") as HTMLInputElement;
    const button = getByText("Send Magic Link") as HTMLButtonElement;

    await fireEvent.input(input, { target: { value: dummyEmail } });
    await fireEvent.click(button);

    await waitFor(() => expect(getByText("Unexpected error")).toBeInTheDocument());
  });
});
