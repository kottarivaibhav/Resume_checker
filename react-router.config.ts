import type { Config } from "@react-router/dev/config";

export default {
  ssr: false, // Keep this for easier deployment
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;