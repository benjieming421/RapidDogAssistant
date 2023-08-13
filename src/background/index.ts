import sessionT from "@/utils/session"
import {getToken} from '@/axios/api'

//接口循环定时器
let times:any = null;

//初始化把GAS BTC ETH BNB DOGE XRP 合约存内存上
const coinList = [
  {symbol: 'BTC', contract: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', chain: 'bsc' },
  {symbol: 'ETH', contract: '0x2170ed0880ac9a755fd29b2688956bd959f933f8', chain: 'bsc' },
  {symbol: 'BNB', contract: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', chain: 'bsc' },
  {
    symbol: 'DOGE',
    contract: '0xba2ae424d960c26247dd6c32edc70b295c744c43',
    chain: 'bsc',
  },
  { symbol: 'XRP',contract: '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe', chain: 'bsc' },
];

(async ()=>{
  await sessionT.set('coinList',coinList);
  await sessionT.set('coinList-detail', [])
})()

const add = () => {
  chrome.notifications.create('',{
    type: 'basic',
    iconUrl: chrome.runtime.getURL('/logo/logo@16.png'),
    title: '插件被点击启动',
    message: 'Notification message'
}, (notificationId) => {
  console.log('Notification created!', notificationId);
});
}

//不定时循环请求coin接口 10-15秒
async function fetchDataAndUpdate(apilist?:[], index=0) {
  apilist = await sessionT.get('coinList') ?? [];
  const coinListDetail = await sessionT.get('coinList-detail') ?? [];

  let lastIndex = index == apilist.length ? 0 : index;
  try{
    // 发起接口请求
    const result = await getToken(apilist[lastIndex].contract ,apilist[lastIndex].chain);
    //这段换成储存数据在local
    coinListDetail[lastIndex] = result?.data?.token || {};
    coinListDetail[lastIndex].time = new Date().getTime();
    await sessionT.set('coinList-detail', coinListDetail);
    // 等待一段时间后再次调用该函数（不定时）
    const randomDelay = Math.floor(Math.random() * 5000) + 10000; // 10秒到15秒之间的随机延迟
    times = setTimeout(() => fetchDataAndUpdate(apilist, (lastIndex+1)), randomDelay);
  }catch (error) {
    // 处理请求错误
    console.error('Error fetching data:', error);
    // 发生错误时，等待一段时间后再次调用该函数（不定时）
    const randomDelay = Math.floor(Math.random() * 5000) + 10000; // 10秒到15秒之间的随机延迟
    times = setTimeout(() => fetchDataAndUpdate(apilist, (lastIndex+1)), randomDelay);
    lastIndex += 1;
  }
};

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.startfetchDataAndUpdate)
    {
        //监听开始请求列表
        fetchDataAndUpdate();
        console.log('监听开始请求列表');
    }else if (request.endfetchDataAndUpdate)
    {
        //监听清除请求列表
        clearTimeout(times);
        console.log('结束监听开始请求列表');
    }
});


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
};
