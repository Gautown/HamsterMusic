import fs from 'fs';

const jsCode = fs.readFileSync('temp_source.js', 'utf-8');

// 查找所有可能的 IP 地址和域名
console.log('=== 查找 IP 地址和域名 ===');
const ipPattern = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g;
const ips = jsCode.match(ipPattern);
if (ips) {
  console.log('IP addresses:', [...new Set(ips)]);
}

// 查找 flower 相关的路径
console.log('\n=== flower 相关路径 ===');
const flowerPattern = /flower[^\s'"\)]+/g;
const flowerPaths = jsCode.match(flowerPattern);
if (flowerPaths) {
  console.log([...new Set(flowerPaths)]);
}

// 查找 source-info 路径
console.log('\n=== source-info 路径 ===');
const sourceInfoPattern = /source-info[^\s'"\)]+/g;
const sourceInfos = jsCode.match(sourceInfoPattern);
if (sourceInfos) {
  console.log([...new Set(sourceInfos)]);
}

// 提取所有看起来像 URL 的部分（包括编码的）
console.log('\n=== 可能的 API 端点 ===');
const apiPatterns = [
  /https?:\\?\/\\?\/[^\s'"\)]+/g,
  /\/[\w\-]+\/[\w\-]+/g
];

for (const pattern of apiPatterns) {
  const matches = jsCode.match(pattern);
  if (matches) {
    const unique = [...new Set(matches)];
    console.log(`\nPattern: ${pattern}`);
    unique.slice(0, 30).forEach(m => console.log('  ', m));
  }
}

// 查找质量标识
console.log('\n=== 音质标识 ===');
const qualityPattern = /(128k|320k|flac|ape|wav)/gi;
const qualities = jsCode.match(qualityPattern);
if (qualities) {
  console.log([...new Set(qualities)]);
}
