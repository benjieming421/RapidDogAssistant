import sessionT from '@/utils/session';
import fetchAdapter from '@vespaiach/axios-fetch-adapter';
import axios, { Method } from 'axios';
const baseURL = `https://api.vbdg.xyz/v1api/`;

const tokenReturn = async () => {
  const token = await sessionT.get('token');
  return token;
};

/**
 * 简易封装axios
 * @param method 请求方法类型
 * @param url 请求地址
 * @param params 请求参数
 */
function apiAxios(
  method: Method,
  url: string,
  params: any = {},
  headers: any = {},
): Promise<any> {
  return new Promise((resolve, reject) => {
    axios({
      method,
      baseURL,
      url,
      params: method === 'GET' ? params : null,
      data: method === 'POST' ? params : null,
      headers: {
        ...headers,
      },
      adapter: fetchAdapter,
    })
      .then(({ data }) => {
        /** 额外处理 */
        resolve(data);
      })
      .catch((e) => {
        /** 额外处理 */
        reject(e);
      });
  });
}

export default {
  get: async function (url: string, params?: any, headers?: any) {
    let token = await tokenReturn();
    let headersT = { ...headers, 'X-Auth': token };
    url == '/v1/captcha/getCaptcha' && delete headersT['X-Auth'];
    return apiAxios('GET', url, params, headersT);
  },
  post: async function (url: string, params?: any, headers?: any) {
    let token = await tokenReturn();
    let headersT = { ...headers, 'X-Auth': token };
    return apiAxios('POST', url, params, headersT);
  },
};
