import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleWranglerDeployOutputEntry } from "./commandOutputParsing";
import { setOutput } from "@actions/core";
import { WranglerActionConfig } from "./wranglerAction";
import { OutputEntryDeployment } from "./wranglerArtifactManager";

vi.mock("@actions/core");
vi.mock("./wranglerAction", () => ({
    info: vi.fn(),
}));

describe("handleWranglerDeployOutputEntry", () => {
    const mockConfig = {} as WranglerActionConfig;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should handle clean URL", () => {
        const entry: OutputEntryDeployment = {
            version: 1,
            type: "deploy",
            targets: ["https://example.com"],
        };
        handleWranglerDeployOutputEntry(mockConfig, entry);
        expect(setOutput).toHaveBeenCalledWith("deployment-url", "https://example.com");
    });

    it("should handle URL without protocol", () => {
        const entry: OutputEntryDeployment = {
            version: 1,
            type: "deploy",
            targets: ["example.com"],
        };
        handleWranglerDeployOutputEntry(mockConfig, entry);
        expect(setOutput).toHaveBeenCalledWith("deployment-url", "https://example.com");
    });

    it("should handle URL with extra text (custom domain)", () => {
        const entry: OutputEntryDeployment = {
            version: 1,
            type: "deploy",
            targets: ["example.com (custom domain)"],
        };
        handleWranglerDeployOutputEntry(mockConfig, entry);
        expect(setOutput).toHaveBeenCalledWith("deployment-url", "https://example.com");
    });

    it("should handle URL with extra text and protocol", () => {
        const entry: OutputEntryDeployment = {
            version: 1,
            type: "deploy",
            targets: ["https://foo.bar (Custom)"],
        };
        handleWranglerDeployOutputEntry(mockConfig, entry);
        expect(setOutput).toHaveBeenCalledWith("deployment-url", "https://foo.bar");
    });

    it("should take the first URL if multiple are present", () => {
        const entry: OutputEntryDeployment = {
            version: 1,
            type: "deploy",
            targets: ["https://primary.com", "https://secondary.com"],
        };
        handleWranglerDeployOutputEntry(mockConfig, entry);
        expect(setOutput).toHaveBeenCalledWith("deployment-url", "https://primary.com");
    });
});
