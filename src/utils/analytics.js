const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function initGA() {
  if (!GA_MEASUREMENT_ID) {
    console.warn("Google Analytics: VITE_GA_MEASUREMENT_ID is not configured. Tracking is disabled.");
    return;
  }

  // Prevent multiple injections
  if (document.getElementById('gtag-script')) return;

  const script = document.createElement('script');
  script.id = 'gtag-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false // We will track page views manually in Single Page Application routing
  });
}

export function trackPageView(path) {
  if (!GA_MEASUREMENT_ID) return;
  if (window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path
    });
  }
}

export function trackEvent(action, category, label, value) {
  if (!GA_MEASUREMENT_ID) return;
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
}
