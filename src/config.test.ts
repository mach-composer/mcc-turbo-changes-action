import { it, expect } from "vitest";
import { Config, parseConfig } from "./config";

it("should parse config", () => {
  const input = `
    "@commerce-backend/account":
      name: account
      extra-files:
        - backend/Dockerfile.node
        - backend/services/account/terraform/*

    "@commerce-backend/checkout":
      name: checkout
  `;

  const config = parseConfig(input);
  const expected: Config = {
    packages: [
      {
        name: "account",
        scope: "@commerce-backend/account",
        extraFiles: [
          "backend/Dockerfile.node",
          "backend/services/account/terraform/*",
        ],
      },
      {
        name: "checkout",
        scope: "@commerce-backend/checkout",
        extraFiles: undefined,
      },
    ],
  };

  expect(config).toEqual(expected);
});
