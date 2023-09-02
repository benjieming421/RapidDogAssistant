

import { getToken } from '@/axios/api';
import { clearTimeoutList, getNowTime, priceConverterK } from '@/utils/index';
import sessionT from '@/utils/session';
import startPolling from './badge'

const INTERNAL_STAYALIVE_PORT = "CT_Internal_port_alive"
var alivePort:any = null;

const SECONDS = 1000;
var lastCall = Date.now();
var isFirstStart = true;
var timer = 4*SECONDS;
// -------------------------------------------------------
var wakeup = setInterval(Highlander, timer);
// -------------------------------------------------------

//接口循环定时器
let timesList: any = [];
//实时更新数据的按钮
let updateBtn: any = false;
//badge轮询定时器
let badgeTimes: any = [];

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
  let data = (await sessionT.get('coinList')) ?? {};
  if (Object.keys(data).length == 0) {
    await sessionT.set('coinList', coinList);
    console.log(data, '执行给的coinList 默认请求列表复制');
  }
  console.log(data, '后台的coinList 默认请求列表');
  await sessionT.set('coinList-detail', []);

  //初始化badge轮询
  badgeTimes.forEach((element:any) => {
    clearInterval(element);
  });
  let badgeTimesItems = setInterval(() => {
    startPolling();
  }, 3000);
  badgeTimes.push(badgeTimesItems);
})();

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
    coinListDetail[lastIndex].key =
      result?.data?.token?.token + '-' + result?.data?.token?.chain;
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

if (!chrome.runtime.lastError){
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
  }else if (request.restartBadge) {
    //监听清除badge轮询定时器
    clearInterval(badgeTimes);
    badgeTimes = setInterval(() => {
      startPolling();
    }, 3000);
    console.log('重启badge轮询定时器', getNowTime());
  }
});
}

//初始化右键上下菜单栏 添加独立窗口打开模式
if (!chrome.runtime.lastError) {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'myContextMenu3306',
      title: '独立窗口打开',
      contexts: ['browser_action'],
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
          if (e?.id) {
            chrome.windows.update(e.id, {
              focused: true,
            });
          }
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
  //监听清除badge轮询定时器
  badgeTimes.forEach((element:any) => {
    clearInterval(element);
  });
};

async function Highlander() {

  const now = Date.now();
  const age = now - lastCall;
  
  console.log(`(DEBUG Highlander) ------------- time elapsed from first start: ${convertNoDate(age)}`)
  if (alivePort == null) {
      alivePort = chrome.runtime.connect({name:INTERNAL_STAYALIVE_PORT})

      alivePort.onDisconnect.addListener( (p) => {
          if (chrome.runtime.lastError){
              console.log(`(DEBUG Highlander) Expected disconnect (on error). SW should be still running.`);
          } else {
              console.log(`(DEBUG Highlander): port disconnected`);
          }

          alivePort = null;
      });
  }

  if (alivePort) {
                  
      alivePort.postMessage({content: "ping"});
      
      if (chrome.runtime.lastError) {                              
          console.log(`(DEBUG Highlander): postMessage error: ${chrome.runtime.lastError.message}`)                
      } else {                               
          console.log(`(DEBUG Highlander): "ping" sent through ${alivePort.name} port`)
      }            
  }         
  //lastCall = Date.now();
  if (isFirstStart) {
      isFirstStart = false;
      clearInterval(wakeup);
      timer = 270*SECONDS;
      wakeup = setInterval(Highlander, timer);
  }        
}

function convertNoDate(long:any) {
  var dt = new Date(long).toISOString()
  return dt.slice(-13, -5) // HH:MM:SS only
}