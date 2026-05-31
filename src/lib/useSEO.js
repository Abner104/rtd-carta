import { useEffect } from "react";

export function useSEO({ title, description, image, url }) {
  useEffect(() => {
    if (title) {
      document.title = title;
      setMeta("og:title", title);
      setMeta("twitter:title", title);
    }
    if (description) {
      setMeta("description", description);
      setMeta("og:description", description);
      setMeta("twitter:description", description);
    }
    if (image) {
      setMeta("og:image", image);
      setMeta("twitter:image", image);
      setMeta("twitter:card", "summary_large_image");
    }
    if (url) {
      setMeta("og:url", url);
    }
    setMeta("og:type", "website");
  }, [title, description, image, url]);
}

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`) ||
           document.querySelector(`meta[property="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(name.startsWith("og:") || name.startsWith("twitter:") ? "property" : "name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
