
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
      "chunk-GVGSCBVO.js",
      "chunk-OUX425KP.js"
    ],
    "route": "/admin-reports"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-LLGXL4NN.js",
      "chunk-P473T4LV.js"
    ],
    "route": "/login"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-DEL4U4FO.js",
      "chunk-K6SBEZUR.js"
    ],
    "route": "/admin-dashboard"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-OZBTI3A7.js",
      "chunk-P473T4LV.js",
      "chunk-K6SBEZUR.js"
    ],
    "route": "/admin-records"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-G7GPHX3W.js",
      "chunk-P473T4LV.js",
      "chunk-K6SBEZUR.js"
    ],
    "route": "/admin-notifications"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-OMGZE7SP.js"
    ],
    "route": "/treasurer-dashboard"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-X2PKXWPP.js",
      "chunk-5PVIR7WD.js"
    ],
    "route": "/treasurer-home"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-DQV5JI5K.js",
      "chunk-5PVIR7WD.js",
      "chunk-P473T4LV.js"
    ],
    "route": "/treasurer-records"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-A4UPQZK7.js",
      "chunk-5PVIR7WD.js",
      "chunk-P473T4LV.js"
    ],
    "route": "/treasurer-settings"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-27CDAB5P.js",
      "chunk-5PVIR7WD.js"
    ],
    "route": "/treasurer-about"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-ULQCVWNG.js",
      "chunk-5PVIR7WD.js"
    ],
    "route": "/treasurer-contact"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 856, hash: 'b02c05924d6e6667ed29b86ecf2b7a17777289f1e5b9f9310de475a97f4077f1', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1258, hash: '9ffb78127f34a964d5c8e89f09f1432d88eec8e8bfe3e5169ad26b16272427d5', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-NNREUR7T.css': {size: 4951, hash: '8v2xHj7cJAU', text: () => import('./assets-chunks/styles-NNREUR7T_css.mjs').then(m => m.default)}
  },
};
