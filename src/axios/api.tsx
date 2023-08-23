import axios from '@/axios';

//测试是否联通
export const verifyToken = async (header?: {}) => {
  return await axios.get(
    `/v3/tokens/0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c-bsc`,
    {},
    { ...header },
  );
};

//获取代币详细
export const getToken = async (contract: string, chain: string) => {
  return await axios.get(`/v3/tokens/${contract}-${chain}`);
};

//搜索代币
export const searchToken = async (keyword: string) => {
  let result = await axios.get(`/v2/tokens/query?keyword=${keyword}`);
  return result.data.token_list;
};
