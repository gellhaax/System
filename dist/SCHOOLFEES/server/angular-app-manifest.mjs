
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 1,
    "redirectTo": "/login",
    "route": "/"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-HBTR6IQ6.js",
      "chunk-OUX425KP.js"
    ],
    "route": "/admin-reports"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-46IGTJBI.js",
      "chunk-JCMBLEVW.js"
    ],
    "route": "/login"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-I3OSVBDT.js",
      "chunk-I3WZDVBE.js"
    ],
    "route": "/admin-dashboard"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-US2DRLSP.js",
      "chunk-JCMBLEVW.js",
      "chunk-I3WZDVBE.js"
    ],
    "route": "/admin-records"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-KRK4TR66.js",
      "chunk-JCMBLEVW.js",
      "chunk-I3WZDVBE.js"
    ],
    "route": "/admin-notifications"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-XUGQTXMI.js"
    ],
    "route": "/treasurer-dashboard"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-BAICATQR.js",
      "chunk-N3CLU2A3.js"
    ],
    "route": "/treasurer-home"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-OXCO7HIO.js",
      "chunk-N3CLU2A3.js",
      "chunk-JCMBLEVW.js"
    ],
    "route": "/treasurer-records"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-AOKQ25LO.js",
      "chunk-N3CLU2A3.js",
      "chunk-JCMBLEVW.js"
    ],
    "route": "/treasurer-settings"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-XW2P3RUK.js",
      "chunk-N3CLU2A3.js"
    ],
    "route": "/treasurer-about"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-YWGWVWTI.js",
      "chunk-N3CLU2A3.js"
    ],
    "route": "/treasurer-contact"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 856, hash: '2ddabe4430eaa7120c3715786a325eaa17123e67d4b63412c4b3e8f3eb6f9419', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1258, hash: 'ec9bb470cd1d2aed59fadfd7bc339bf2e6deb30d347d2f60d748d654cec96ce4', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-HUNQKC2L.css': {size: 4951, hash: '/4hcQM8zkv8', text: () => import('./assets-chunks/styles-HUNQKC2L_css.mjs').then(m => m.default)}
  },
};
