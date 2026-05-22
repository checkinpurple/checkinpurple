import { useEffect } from "react";

interface OGMetaProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "profile" | "music" | "website";
}

/**
 * Sets Open Graph meta tags so WhatsApp, Twitter, iMessage etc.
 * show a rich preview when the link is shared.
 *
 * Usage:
 *   <OGMeta
 *     title="Nova Shade · Artist on CheckinPurple"
 *     description="Amapiano DJ · 247 followers · Available for bookings"
 *     image={artist.avatar_url}
 *     url={`https://checkinpurple.vercel.app/artist/${artist.username}`}
 *   />
 */
export default function OGMeta({ title, description, image, url, type = "website" }: OGMetaProps) {
  useEffect(() => {
    const set = (property: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setName = (name: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const fullTitle = title.includes("CheckinPurple") ? title : `${title} · CheckinPurple`;
    document.title = fullTitle;

    set("og:title", fullTitle);
    set("og:description", description);
    set("og:type", type === "profile" ? "profile" : type === "music" ? "music.song" : "website");
    set("og:site_name", "CheckinPurple");
    if (url) set("og:url", url);
    if (image) set("og:image", image);

    // Twitter card
    setName("twitter:card", image ? "summary_large_image" : "summary");
    setName("twitter:title", fullTitle);
    setName("twitter:description", description);
    if (image) setName("twitter:image", image);

    // WhatsApp / iMessage use og: tags, no extra work needed
  }, [title, description, image, url, type]);

  return null;
}
