export * from './env';
import axios from '@/axios';
import dayjs from 'dayjs';

export const getCaptcha = async () => {
  const result = await axios.get('/v1/captcha/getCaptcha');
  let objToken = <any>{};
  if (result.status == 1 && result.encode_data) {
    //base64解码
    let decode = window.atob(result.encode_data);
    //URL解码
    let decodeUrl = decodeURIComponent(decode);
    objToken = JSON.parse(decodeUrl);
    return objToken;
  }
};

export const verifyCaptcha = async (data: any) => {
  const result = await axios.post('/v1/captcha/verifyCaptcha', {
    id: data.id,
    value: data.value,
  });
  let objToken = <any>{};
  if (result.status == 1 && result.encode_data) {
    //base64解码
    let decode = window.atob(result.encode_data);
    //URL解码
    let decodeUrl = decodeURIComponent(decode);
    objToken = JSON.parse(decodeUrl);
    return objToken;
  }
};

//判断正负数
export const ispositiveAndNegativereturnColor = (num: number) => {
  return Math.sign(num) === 1
    ? '#4eb61b'
    : Math.sign(num) === -1
    ? '#f56c6c'
    : '#000';
};

//把定时器清空
export const clearTimeoutList = (itemsList: Array<any>) => {
  if (itemsList.length == 0) return;
  for (let d of itemsList) {
    clearTimeout(d);
  }
};

//返回当前时间
export const getNowTime = () => {
  // return dayjs().format('MM-DD HH:mm:ss.SSS');
  return dayjs().format('HH:mm');
};

//延迟函数
export const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

//价格转换器
export const priceConverter = (price: number, decimal?: number) => {
  try {
    let spare = price?.toFixed(decimal ?? 18);
    if (!spare || typeof spare !== 'string') return;
    if (Number(spare.split('.')[0]) <= 0) {
      //获取点后面的0有多少位（截取到数字之前）
      let match = spare.match(/\.0+/);
      const zeroDigits = match ? match[0].length - 1 : 0;
      //除0外的第一个出现的数字
      const matchNumbr = spare.match(/[^0.]/) || [''];
      let matchNumbrIndex = spare?.indexOf(matchNumbr[0]);
      let substringPrice = spare?.substring(
        matchNumbrIndex,
        matchNumbrIndex + 3,
      );
      if (zeroDigits >= 3) {
        return `0.0{${zeroDigits - 1}}${substringPrice}`;
      } else {
        return price.toFixed(4);
      }
    } else {
      return price.toFixed(2);
    }
  } catch (error) {
    console.log(error);
    return '请重新刷新';
  }
};

//价格转换器 1000 => 1k 10000 => 10k
export const priceConverterK = (price: number) => {
  if (price >= 10000) {
    return (price / 1000).toFixed(0) + 'k';
  } else if (price >= 1000) {
    return (price / 1000).toFixed(1) + 'k';
  } else {
    return price.toString();
  }
};
