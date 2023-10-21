import { useEffect, useState } from 'react';
import Home from './Home';
import SetPage from './SetPage';
import './style.less';

interface DataType {
  symbol: string;
  current_price_usd: number;
  price_change: number;
  time: string;
  dexname: string;
}

const Popup = () => {
  //当前主页显示的组件名称
  const [pagename, setPagename] = useState('');

  useEffect(() => {
    return () => {
      setPagename('');
    };
  }, []);

  return (
    <div style={{width: '100%',height: '100%'}}>
      {pagename == '' && <Home setPagename={setPagename} />}
      {pagename == 'SetPage' && <SetPage setPagename={setPagename} />}
    </div>
  );
};

export default Popup;
