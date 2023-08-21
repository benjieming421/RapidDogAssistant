import { getToken } from '@/axios/api';
import { clearTimeoutList, getNowTime } from '@/utils/index';
import sessionT from '@/utils/session';

//接口循环定时器
let timesList: any = [];
//实时更新数据的按钮
let updateBtn: any = false;

//初始化把GAS BTC ETH BNB DOGE XRP 合约存内存上
const coinList = [
  {
    symbol: 'BTC',
    contract: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
    chain: 'bsc',
  },
  {
    symbol: 'ETH',
    contract: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
    chain: 'bsc',
  },
  {
    symbol: 'CAT',
    contract: '0x0173295183685f27c84db046b5f0bea3e683c24b',
    chain: 'bsc',
  },
  {
    symbol: 'DOGE',
    contract: '0xba2ae424d960c26247dd6c32edc70b295c744c43',
    chain: 'bsc',
  },
  {
    symbol: 'XRP',
    contract: '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe',
    chain: 'bsc',
  },
];

(async () => {
  await sessionT.set('coinList', coinList);
  await sessionT.set('coinList-detail', []);
})();

const add = () => {
  chrome.notifications.create(
    '',
    {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('/logo/logo@16.png'),
      title: '插件被点击启动',
      message: 'Notification message',
    },
    (notificationId) => {
      console.log('Notification created!', notificationId);
    },
  );
};

//不定时循环请求coin接口 15-20秒
async function fetchDataAndUpdate(apilist = [], index = 0) {
  if (!updateBtn) return;
  apilist = await sessionT.get('coinList');
  const coinListDetail = (await sessionT.get('coinList-detail')) ?? [];
  let lastIndex = index >= apilist.length ? 0 : index;
  try {
    // 发起接口请求
    const result = await getToken(
      apilist[lastIndex].contract,
      apilist[lastIndex].chain,
    );
    //这段换成储存数据在local
    coinListDetail[lastIndex] = result?.data?.token || {};
    coinListDetail[lastIndex].time = getNowTime();
    coinListDetail[lastIndex].timespare = new Date().getTime();
    coinListDetail[lastIndex].dexname =
      result?.data?.pairs?.[0]?.show_name || '-';
    await sessionT.set('coinList-detail', coinListDetail);
    console.log(coinListDetail, `后台的 changes local 更新时间${getNowTime()}`);

    // 等待一段时间后再次调用该函数（不定时）
    const randomDelay = Math.floor(Math.random() * 5000) + 15000; // 15秒到20秒之间的随机延迟
    let times = setTimeout(() => {
      fetchDataAndUpdate(apilist, lastIndex + 1);
      clearTimeout(times);
    }, randomDelay);
    timesList.push(times);
  } catch (error) {
    // 处理请求错误
    console.error('Error fetching data:', error);
    // 发生错误时，等待一段时间后再次调用该函数（不定时）
    const randomDelay = Math.floor(Math.random() * 5000) + 15000; // 15秒到20秒之间的随机延迟
    let times = setTimeout(() => {
      fetchDataAndUpdate(apilist, lastIndex + 1);
      clearTimeout(times);
    }, randomDelay);
    timesList.push(times);
    lastIndex += 1;
  }
}

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse,
) {
  if (request.startfetchDataAndUpdate) {
    //循环清除定时器
    clearTimeoutList(timesList);
    //监听开始请求列表
    updateBtn = true;
    await sessionT.set('updateBtn', updateBtn);
    fetchDataAndUpdate();
    console.log('监听开始请求列表', getNowTime());
  } else if (request.endfetchDataAndUpdate) {
    //监听清除请求列表
    updateBtn = false;
    await sessionT.set('updateBtn', updateBtn);
    //循环清除定时器
    clearTimeoutList(timesList);
    console.log('结束监听开始请求列表', getNowTime());
  }
});

//初始化右键上下菜单栏 添加独立窗口打开模式
if (!chrome.runtime.lastError) {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'myContextMenu3306',
      title: '独立窗口打开',
      contexts: ['all'],
    });
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'myContextMenu3306') {
      // 在这里处理右键菜单点击事件
      chrome.windows.create(
        {
          url: chrome.runtime.getURL('/popup.html'),
          width: 468,
          height: 322,
          top: 300,
          left: 500,
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

  chrome.runtime.onConnect.addListener(function (port) {
    if (port.name === 'popup') {
      port.onDisconnect.addListener(function () {
        console.log('popup has been closed', getNowTime());
        closePopupFun();
      });
    }
  });
}

//关闭popup页面执行的函数
const closePopupFun = async () => {
  //循环清除定时器
  clearTimeoutList(timesList);
};
