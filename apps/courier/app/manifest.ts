import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SCMS Courier",
    short_name: "SCMS",
    description: "Strategic courier shift and assignment app",
    start_url: "/",
    display: "standalone",
    background_color: "#0d1326",
    theme_color: "#ff8000",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
