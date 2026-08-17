import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  cloudRecord: vi.fn(),
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: { getItem: mocks.getItem, setItem: mocks.setItem },
}));
vi.mock("@/lib/cloud-sync", () => ({ cloudRecordMobileOperationalEvents: mocks.cloudRecord }));

import { SUBSCRIPTION_EVENTS_STORAGE_KEY, logSubscriptionEvent } from "@/lib/subscription-events";

describe("subscription operational events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getItem.mockResolvedValue(null);
    mocks.setItem.mockResolvedValue(undefined);
    mocks.cloudRecord.mockResolvedValue({ recorded: 1 });
  });

  it("persists an event locally before attempting best-effort first-party delivery", async () => {
    await logSubscriptionEvent("paywall_viewed", "settings", { source: "pro_badge" });
    expect(mocks.setItem).toHaveBeenCalledWith(SUBSCRIPTION_EVENTS_STORAGE_KEY, expect.stringContaining('"paywall_viewed"'));
    await vi.waitFor(() => expect(mocks.cloudRecord).toHaveBeenCalledWith([expect.objectContaining({ name: "paywall_viewed", metadata: { origin: "settings", source: "pro_badge" } })]));
  });

  it("retains the local record when first-party delivery is unavailable", async () => {
    mocks.cloudRecord.mockRejectedValue(new Error("offline"));
    await expect(logSubscriptionEvent("app_opened", "root")).resolves.toBeUndefined();
    expect(mocks.setItem).toHaveBeenCalledWith(SUBSCRIPTION_EVENTS_STORAGE_KEY, expect.stringContaining('"app_opened"'));
  });
});
