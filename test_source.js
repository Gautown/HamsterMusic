import fs from 'fs';
import vm from 'vm';

// 读取 JS 音源文件
const jsCode = fs.readFileSync('temp_source.js', 'utf-8');

// 创建一个沙箱环境
const sandbox = {
  console,
  setTimeout,
  setInterval,
  clearTimeout,
  clearInterval,
  Promise,
  Error,
  Math,
  Date,
  JSON,
  encodeURIComponent,
  decodeURIComponent,
  fetch: undefined,
  module: { exports: {} },
  exports: {},
  window: {},
  global: {},
  // 添加 lx 对象以满足音源依赖
  globalThis: {
    lx: {
      EVENT_NAMES: {},
      utils: {
        b64: {
          encode: (str) => Buffer.from(str).toString('base64'),
          decode: (str) => Buffer.from(str, 'base64').toString('utf-8'),
        }
      },
      version: '2.0.0',
      request: {
        fetch: async (url, options) => {
          console.log('Fetch called:', url);
          // 这里需要实际的 fetch 实现
          throw new Error('fetch not implemented');
        }
      }
    }
  },
};

// 合并到 global
Object.assign(sandbox.global, sandbox.globalThis);

// 执行 JS 代码
try {
  const context = vm.createContext(sandbox);
  const result = vm.runInContext(jsCode, context);
  
  console.log('=== Execution completed ===');
  console.log('Result type:', typeof result);
  console.log('Result:', result);
  
  // 检查 sandbox 中导出的对象
  console.log('\n=== Sandbox exports ===');
  console.log('Module exports:', sandbox.module?.exports);
  console.log('Exports:', sandbox.exports);
  
  // 查找所有可能的音源对象
  console.log('\n=== Checking global objects ===');
  for (const key of Object.keys(sandbox)) {
    if (sandbox[key] && typeof sandbox[key] === 'object') {
      const obj = sandbox[key];
      if (obj.name || obj.version || obj.search) {
        console.log(`Found potential source in ${key}:`, {
          name: obj.name,
          version: obj.version,
          hasSearch: typeof obj.search === 'function',
          hasGetMusicUrl: typeof obj.getMusicUrl === 'function'
        });
      }
    }
  }
  
  // 检查 globalThis.lx
  console.log('\n=== globalThis.lx ===');
  if (sandbox.globalThis?.lx) {
    const lx = sandbox.globalThis.lx;
    console.log('lx keys:', Object.keys(lx));
    if (lx.source) {
      console.log('lx.source:', lx.source);
    }
  }
  
} catch (error) {
  console.error('Execution error:', error.message);
  console.error('Stack:', error.stack);
}
