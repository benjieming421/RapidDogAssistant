import sessionT from '@/utils/session';
import axios, { Method } from 'axios';
const baseURL = `https://api.vbdg.xyz/v1api/`;

const data = { token: '' };

(async () => {
  const token = await sessionT.get('token');
  data.token = token;
})();

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
        'X-Auth': data.token,
      },
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
  get: function (url: string, params?: any, headers?: any) {
    return apiAxios('GET', url, params, headers);
  },
  post: function (url: string, params?: any, headers?: any) {
    return apiAxios('POST', url, params, headers);
  },
};
