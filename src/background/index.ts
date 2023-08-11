//初始化把GAS BTC ETH BNB DOGE XRP 合约存内存上
const coinList = {
  BTC: { contract: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', chain: 'bsc' },
  ETH: { contract: '0x2170ed0880ac9a755fd29b2688956bd959f933f8', chain: 'bsc' },
  BNB: { contract: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', chain: 'bsc' },
  DOGE: {
    contract: '0xba2ae424d960c26247dd6c32edc70b295c744c43',
    chain: 'bsc',
  },
  XRP: { contract: '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe', chain: 'bsc' },
};

//初始化右键上下菜单栏 添加独立窗口打开模式
if (!chrome.runtime.lastError) {
  chrome.contextMenus.create({
    id: 'myContextMenu3306',
    title: '独立窗口打开',
    contexts: ['all'],
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'myContextMenu3306') {
      // 在这里处理右键菜单点击事件
      chrome.windows.create(
        {
          url: chrome.runtime.getURL('/popup.html'),
          // width: 700,
          // height: 550,
          width: 380,
          height: 240,
          top: 200,
          type: 'popup',
        },
        function (e) {
          chrome.windows.update(e.id, {
            focused: true,
          });
        },
      );
    }
  });
}
