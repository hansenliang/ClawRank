import { Config } from "@remotion/cli/config";
import path from "path";

// When Node cannot download Chrome Headless Shell (e.g. TLS / corporate proxy), set
// REMOTION_BROWSER_EXECUTABLE to a local Chromium-based binary (see remotion/README.md).
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE?.trim();
if (browserExecutable) {
  Config.setBrowserExecutable(browserExecutable);
}

Config.overrideWebpackConfig((currentConfiguration) => {
  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      alias: {
        ...(currentConfiguration.resolve?.alias ?? {}),
        "@": path.resolve(__dirname, ".."),
      },
    },
  };
});
