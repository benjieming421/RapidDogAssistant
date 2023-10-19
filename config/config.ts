import { defineConfig } from '@umijs/max';

export default defineConfig({
  plugins: [require.resolve('umi-plugin-extensions')],
  extensions: {
    name: '土狗捕捉器',
    description:
      '基于 多链数据开发 的 Chrome 插件土狗行情插件 实现一插件完成所有操作，不再烦恼打开多个网站进行多种数据查询',
    optionsUI: {
      page: '@/pages/options',
      openInTab: true,
    },
    background: { service_worker: '@/background/index' },
    popupUI: '@/pages/popup',
    icons: {
      128: 'logo/logo@128.png',
    },
    host_permissions: ['https://api.fgsasd.org/v1api/*'],
    permissions: ['storage', 'contextMenus'],
  },
  mpa: {
    template: './public/template/index.html',
  },
});
