import { Config } from "@remotion/cli/config";
import path from "path";

// When Node cannot download Chrome Headless Shell (e.g. TLS / corporate proxy), set
// REMOTION_BROWSER_EXECUTABLE to a local Chromium-based binary (see remotion/README.md).
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE?.trim();
if (browserExecutable) {
  Config.setBrowserExecutable(browserExecutable);
}

/** e.g. `REMOTION_GL=swiftshader` if GPU screenshots show random blank / wrong-frame glitches. */
type ChromiumGlRenderer =
  | "swangle"
  | "angle"
  | "egl"
  | "swiftshader"
  | "vulkan"
  | "angle-egl";
const GL_RENDERERS = new Set<ChromiumGlRenderer>([
  "swangle",
  "angle",
  "egl",
  "swiftshader",
  "vulkan",
  "angle-egl",
]);
const glEnv = process.env.REMOTION_GL?.trim();
if (glEnv && GL_RENDERERS.has(glEnv as ChromiumGlRenderer)) {
  Config.setChromiumOpenGlRenderer(glEnv as ChromiumGlRenderer);
}

/**
 * libx265 defaults often tag HEVC as `hev1` in MP4; Photos / QuickTime expect `hvc1`.
 * SDR web output: tag BT.709 so players don’t guess wrong color metadata.
 * @see remotion/README.md (HEVC delivery)
 */
Config.overrideFfmpegCommand(({ args }) => {
  const next = [...args];
  if (!next.includes("libx265")) {
    return next;
  }
  const outIdx = next.length - 1;
  next.splice(
    outIdx,
    0,
    "-tag:v",
    "hvc1",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-colorspace",
    "bt709",
  );
  return next;
});

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
