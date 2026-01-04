// Netlify Function: 代理百度汉字API请求
// 路径: /.netlify/functions/hanzi-proxy

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // 允许CORS跨域
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  // 获取查询参数
  const { wd } = event.queryStringParameters || {};
  
  if (!wd) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: true,
        message: '缺少汉字参数 (wd)' 
      })
    };
  }

  try {
    // 构建百度API URL
    const baiduUrl = `https://hanyuapp.baidu.com/dictapp/word/detail_getworddetail?wd=${encodeURIComponent(wd)}&client=pc&lesson_from=xiaodu&smp_names=wordNewData1`;
    
    console.log(`正在请求汉字 "${wd}" 的数据`);
    console.log(`请求URL: ${baiduUrl}`);

    // 调用百度API
    const response = await fetch(baiduUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://hanyu.baidu.com/',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      }
    });

    if (!response.ok) {
      throw new Error(`百度API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // 检查数据格式
    if (!data || !data.data) {
      throw new Error('百度API返回数据格式不正确');
    }

    // 返回处理后的数据
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
           detail: {
            strokeOrderGif: data.data.detail.strokeOrderGif || null,
            pinyinList: data.data.detail.pinyinList || [] 
           }
        }, // data.data,
        source: 'baidu-hanyu-api',
        character: wd
      })
    };

  } catch (error) {
    console.error('代理请求出错:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: true,
        message: error.message || '服务器内部错误',
        details: error.toString()
      })
    };
  }
};