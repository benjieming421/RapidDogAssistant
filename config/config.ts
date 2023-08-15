import { defineConfig } from '@umijs/max';

export default defineConfig({
  plugins: [require.resolve('umi-plugin-extensions')],
  extensions: {
    name: '土狗捕捉器',
    description: '基于 多链浏览器开发 的 Chrome 插件土狗行情插件',
    optionsUI: {
      page: '@/pages/options',
      openInTab: true,
    },
    background: { service_worker: '@/background/index' },
    popupUI: '@/pages/popup',
    contentScripts: [
      { matches: ['https://github.com/*'], entries: ['@/contentScripts/all'] },
    ],
    icons: {
      16: 'logo/logo@16.png',
      32: 'logo/logo@32.png',
      48: 'logo/logo@48.png',
      128: 'logo/logo@128.png',
    },
    host_permissions: ['https://api.vbdg.xyz/v1api/*'],
    permissions: ['storage', 'contextMenus', 'notifications'],
  },
  mpa: {
    template: './public/template/index.html',
  },
});
