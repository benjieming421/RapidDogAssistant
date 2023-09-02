/*
 * @Author: benjieming421
 * @Date: 2023-09-01 23:56:04
 * @LastEditTime: 2023-09-02 16:53:56
 * @FilePath: \RapidDogAssistant\src\background\badge\index.ts
 * @Description: 插件badge轮询
 *
 * Copyright (c) 2023 by hzsdezhanghao@gmail.com, All Rights Reserved.
 */

import { getToken } from '@/axios/api';
import { priceConverterK,getNowTime,priceConverter } from '@/utils';
import sessionT from '@/utils/session';

const coin = '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c-bsc';

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
    ${(result?.token?.symbol ?? '-')}/USDT ${priceConverter(result?.token?.current_price_usd ?? 0)}
    涨跌幅    ${price_change}
    持有人数  ${priceConverterK(result?.token?.holders ?? 0)}
    更新时间  ${getNowTime()}`;
    
    chrome.action.setBadgeText({
      text: priceConverterK(result?.token?.current_price_usd ?? 0),
    });
    chrome.action.setTitle({ title: titles });
    chrome.action.setBadgeBackgroundColor({ color: '#FFFFFF' })
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
