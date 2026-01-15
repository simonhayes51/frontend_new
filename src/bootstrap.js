// src/bootstrap.js
const API_HOST = "api.futhub.co.uk";

const normalizeApiUrl = (url) => {
  if (typeof url !== "string") return url;

  // scheme-relative -> force https
  if (url.startsWith(`//${API_HOST}`)) {
    return `https:${url}`;
  }

  // explicit http -> force https
  if (url.startsWith(`http://${API_HOST}`)) {
    return url.replace(`http://${API_HOST}`, `https://${API_HOST}`);
  }

  return url;
};

if (typeof window !== "undefined") {
  // XHR
  const _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    try {
      const s = typeof url === "string" ? url : "";
      if (s.includes(API_HOST) || s.startsWith("//")) {
        console.log("🔎 XHR open:", { method, url: s });
        console.trace("XHR open stack");
      }
    } catch {}

    url = normalizeApiUrl(url);
    return _open.call(this, method, url, ...rest);
  };

  // fetch
  const _fetch = window.fetch;
  window.fetch = (input, init) => {
    const url = typeof input === "string" ? input : input?.url;

    try {
      if (typeof url === "string" && (url.includes(API_HOST) || url.startsWith("//"))) {
        console.log("🔎 fetch:", url);
        console.trace("fetch stack");
      }
    } catch {}

    const fixed = normalizeApiUrl(url);
    if (typeof input === "string") input = fixed;
    else if (fixed) input = new Request(fixed, input);

    return _fetch(input, init);
  };

  console.log("✅ bootstrap network guards installed");
}
