import { describe, expect, it } from "vitest";
import devConfig from "../webpack.config.dev.cjs";

describe("webpack.config.dev.cjs", () => {
  it("includes ws: true for WebSocket upgrade support in proxy config (V63)", () => {
    expect(devConfig.devServer).toBeDefined();
    expect(devConfig.devServer.proxy).toBeDefined();
    
    const apiProxy = devConfig.devServer.proxy.find(
      (p) => p.context && p.context.includes("/api")
    );
    
    expect(apiProxy).toBeDefined();
    expect(apiProxy.ws).toBe(true);
  });
});