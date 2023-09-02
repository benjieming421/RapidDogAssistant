/*
 * @Author: benjieming421
 * @Date: 2023-09-01 23:56:04
 * @LastEditTime: 2023-09-02 12:59:50
 * @FilePath: \RapidDogAssistant\src\background\badge\index.ts
 * @Description: 插件badge轮询
 *
 * Copyright (c) 2023 by hzsdezhanghao@gmail.com, All Rights Reserved.
 */

import { getToken } from '@/axios/api';
import { priceConverterK,getNowTime,priceConverter } from '@/utils';
import sessionT from '@/utils/session';

const coin = '0x2170ed0880ac9a755fd29b2688956bd959f933f8-bsc';

//开始轮询
const startPolling = async () => {
  try {
    if (chrome.runtime.lastError) throw new Error("chrome.runtime.lastError");
    let badgeData: string = (await sessionT.get('tbgz')) ?? '';
    if (badgeData?.length == 0 || Object.keys(badgeData).length == 0) {
      await sessionT.set('tbgz', coin);
      badgeData = coin;
    }
    const coinDetail = badgeData.split('-');
    let result = await getToken(coinDetail[0], coinDetail[1]);
    result = result?.data ?? {};
    let price_change =
      result?.token?.price_change < 0
        ? `${result?.token?.price_change || 0}%`
        : `+${result?.token?.price_change || 0}` + '%';

    const titles = `特别关注：
    ETH/USDT ${priceConverter(result?.token?.current_price_usd ?? 0)}
    涨跌幅    ${price_change}
    持有人数  ${result?.token?.holders ?? 0}
    更新时间  ${getNowTime()}`;
    
    chrome.action.setBadgeText({
      text: priceConverterK(result?.token?.current_price_usd ?? 0),
    });
    chrome.action.setTitle({ title: titles });
    // chrome.action.setBadgeBackgroundColor({ color: '#FFFFFF' })
  } catch (error) {
    console.log(error,'badge轮询报错');
    //3秒后重启轮询
    let items = setTimeout(() => {
      chrome.runtime.sendMessage({ restartBadge: true });
      clearTimeout(items);
    },3000)
  }
};

export default startPolling;
