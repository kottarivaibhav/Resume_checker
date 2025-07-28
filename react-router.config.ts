import type { Config } from "@react-router/dev/config";

export default {
  ssr: false, // Start with SPA for easier deployment
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;