import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home", () => {
  test("見出しが表示される", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: /to get started/i }),
    ).toBeInTheDocument();
  });
});
