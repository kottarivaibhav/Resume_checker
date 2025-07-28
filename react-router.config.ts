import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
  basename: "/",
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;