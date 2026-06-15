import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import ThemeToggle from "./ThemeToggle";
import { useAppearance } from "../../roles/shared/AppearanceContext";

// Mock the appearance context hook
vi.mock("../../roles/shared/AppearanceContext", () => ({
  useAppearance: vi.fn(),
}));

describe("ThemeToggle Component", () => {
  it("renders correct theme label and description in dark mode", () => {
    useAppearance.mockReturnValue({
      theme: "dark",
      toggleTheme: vi.fn(),
    });

    render(<ThemeToggle showLabel={true} />);

    // In dark mode, it should display "Chuyển sang light mode" as aria-label and "Dark" as label
    const button = screen.getByRole("button", { name: "Chuyển sang light mode" });
    expect(button).toBeInTheDocument();
    expect(screen.getByText("Dark")).toBeInTheDocument();
  });

  it("renders correct theme label and description in light mode", () => {
    useAppearance.mockReturnValue({
      theme: "light",
      toggleTheme: vi.fn(),
    });

    render(<ThemeToggle showLabel={true} />);

    // In light mode, it should display "Chuyển sang dark mode" as aria-label and "Light" as label
    const button = screen.getByRole("button", { name: "Chuyển sang dark mode" });
    expect(button).toBeInTheDocument();
    expect(screen.getByText("Light")).toBeInTheDocument();
  });

  it("calls toggleTheme callback when clicked", async () => {
    const toggleThemeMock = vi.fn();
    useAppearance.mockReturnValue({
      theme: "light",
      toggleTheme: toggleThemeMock,
    });

    render(<ThemeToggle />);

    const button = screen.getByRole("button");
    await userEvent.click(button);

    expect(toggleThemeMock).toHaveBeenCalledTimes(1);
  });
});
