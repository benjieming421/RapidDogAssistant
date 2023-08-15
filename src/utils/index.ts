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
