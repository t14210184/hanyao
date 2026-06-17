/**
 * URL Area parameter parser
 */
(function() {
  if (typeof window === 'undefined') return;

  function parseArea() {
    const params = new URLSearchParams(window.location.search);
    const area = params.get('area');
    if (area === 'kaohsiung' || area === 'pingtung') {
      console.log(`[GEO] URL parameter 'area' detected: ${area}`);
      // Initialize dataLayer
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'area_selected',
        area: area,
        selection_method: 'url_parameter'
      });
      // Dispatch a custom event for React components to listen to
      const event = new CustomEvent('areaChanged', { detail: area });
      window.dispatchEvent(event);
    }
  }

  // Run on DOMContentLoaded or immediately if DOM is already loaded
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', parseArea);
  } else {
    parseArea();
  }
})();
