
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
      "chunk-4LT7VAZ2.js",
      "chunk-OUX425KP.js"
    ],
    "route": "/admin-reports"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NVM2KWFY.js",
      "chunk-HGBES23S.js"
    ],
    "route": "/login"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-LWAXACHI.js",
      "chunk-RTKJV6AJ.js"
    ],
    "route": "/admin-dashboard"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-DSM2QC77.js",
      "chunk-HGBES23S.js",
      "chunk-RTKJV6AJ.js"
    ],
    "route": "/admin-records"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-DL6AWJWI.js",
      "chunk-HGBES23S.js",
      "chunk-RTKJV6AJ.js"
    ],
    "route": "/admin-notifications"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-SLZPR7LY.js"
    ],
    "route": "/treasurer-dashboard"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-O4YSVWDE.js",
      "chunk-JIOEO4KX.js"
    ],
    "route": "/treasurer-home"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-WXC7QT6L.js",
      "chunk-JIOEO4KX.js",
      "chunk-HGBES23S.js"
    ],
    "route": "/treasurer-records"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-HLTC6X5N.js",
      "chunk-JIOEO4KX.js",
      "chunk-HGBES23S.js"
    ],
    "route": "/treasurer-settings"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-VBYATSES.js",
      "chunk-JIOEO4KX.js"
    ],
    "route": "/treasurer-about"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-SO7QVN7S.js",
      "chunk-JIOEO4KX.js"
    ],
    "route": "/treasurer-contact"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 856, hash: '352a555bc8bcd07829358f1f75cebc12b7036f339deb71974b1c586e2434f88f', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1258, hash: '8c995afc9ed67c103f1d060c0669644e4f7fee157a95ad7b72f44f41da28f5d9', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-NNREUR7T.css': {size: 4951, hash: '8v2xHj7cJAU', text: () => import('./assets-chunks/styles-NNREUR7T_css.mjs').then(m => m.default)}
  },
};
