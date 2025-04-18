require('dotenv').config();
const axios = require('axios');
const { createCanvas } = require('canvas');
const { HttpsProxyAgent } = require('https-proxy-agent');
const chalk = require('chalk');
const readlineSync = require('readline-sync');
const fs = require('fs').promises;
const path = require('path');
const { scheduleJob } = require('node-schedule');

const API_BASE_URL = 'https://api-v2.polyflow.tech/api/scan2earn';

// 谷歌浏览器UA生成器
const generateChromeUA = () => {
  const majorVersion = getRandomInt(90, 123);
  const minorVersion = getRandomInt(0, 9);
  const buildVersion = getRandomInt(1000, 9999);
  const branchVersion = getRandomInt(100, 999);
  
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${majorVersion}.0.${minorVersion}.${buildVersion} Safari/537.36`;
};

// 保存UA到文件
const saveUserAgents = async (userAgents) => {
  try {
    await fs.writeFile(path.join(__dirname, 'user_agents.json'), JSON.stringify(userAgents, null, 2), 'utf8');
    console.log(chalk.green('✅ 用户代理已保存到 user_agents.json'));
  } catch (error) {
    console.error(chalk.red(`❌ 保存用户代理失败: ${error.message}`));
  }
};

// 从文件读取UA
const readUserAgents = async () => {
  try {
    const data = await fs.readFile(path.join(__dirname, 'user_agents.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log(chalk.yellow('⚠️ 未找到用户代理文件，将创建新的用户代理'));
    return {};
  }
};

// 确保每个token都有对应的UA
const ensureUserAgents = async (tokens) => {
  const userAgents = await readUserAgents();
  
  let hasNewUA = false;
  tokens.forEach((token, index) => {
    const tokenKey = `token_${index}`;
    if (!userAgents[tokenKey]) {
      userAgents[tokenKey] = generateChromeUA();
      hasNewUA = true;
      console.log(chalk.green(`✅ 为 Token ${index + 1} 生成新的用户代理`));
    }
  });
  
  if (hasNewUA) {
    await saveUserAgents(userAgents);
  }
  
  return userAgents;
};

const readTokens = async () => {
  try {
    const data = await fs.readFile(path.join(__dirname, 'token.txt'), 'utf8');
    const tokens = data.split('\n').map(line => line.trim()).filter(line => line);
    if (!tokens.length) throw new Error('No tokens found in token.txt');
    return tokens;
  } catch (error) {
    console.error(chalk.red(`❌ Error reading token.txt: ${error.message}`));
    process.exit(1);
  }
};

const readProxies = async () => {
  try {
    const data = await fs.readFile(path.join(__dirname, 'proxies.txt'), 'utf8');
    const proxies = data.split('\n').map(line => line.trim()).filter(line => line);
    return proxies.length ? proxies : null;
  } catch (error) {
    console.error(chalk.red(`❌ Error reading proxies.txt: ${error.message}`));
    return null;
  }
};

const getRandomProxy = (proxies) => {
  if (!proxies || !proxies.length) return null;
  return proxies[Math.floor(Math.random() * proxies.length)];
};

const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomFloat = (min, max, decimals = 2) => {
  const num = Math.random() * (max - min) + min;
  return parseFloat(num.toFixed(decimals));
};

const getRandomDate = () => {
  const now = new Date();
  const daysAgo = getRandomInt(0, 30);
  const randomDate = new Date(now);
  randomDate.setDate(now.getDate() - daysAgo);
  return randomDate.toLocaleDateString();
};

const getRandomName = () => {
  const firstNames = ['John', 'Jane', 'Mike', 'Emma', 'David', 'Sarah', 'Robert', 'Linda', 'William', 'Emily', 
                      'James', 'Olivia', 'Alex', 'Sophia', 'Daniel', 'Mia', 'Thomas', 'Ava', 'Joseph', 'Isabella'];
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Taylor', 'Miller', 'Wilson', 'Moore', 'Jackson', 'Martin', 'Lee',
                     'Davis', 'White', 'Harris', 'Clark', 'Lewis', 'Young', 'Walker', 'Hall', 'Allen', 'Wright'];
  
  return `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
};

const getRandomAddress = () => {
  const streets = ['Main St', 'Oak Ave', 'Maple Rd', 'Cedar Ln', 'Pine Dr', 'Elm St', 'Washington Ave', 
                  'Park Rd', 'Lake Dr', 'River Rd', 'Forest Ave', 'Broadway', 'Highland Ave', 'Sunset Blvd'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 
                 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Boston', 'Seattle'];
  const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'FL', 'OH', 'MI', 'GA', 'NC', 'WA', 'MA'];
  const zipCodes = Array.from({ length: 5 }, () => getRandomInt(0, 9)).join('');
  
  return `${getRandomInt(1, 9999)} ${getRandomItem(streets)}, ${getRandomItem(cities)}, ${getRandomItem(states)} ${zipCodes}`;
};

const getRandomProducts = (count = getRandomInt(1, 5)) => {
  const productNames = [
    'Desktop Computer', 'Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Headphones', 'Speakers', 'Printer',
    'Tablet', 'Smartphone', 'Camera', 'USB Drive', 'External Hard Drive', 'Router', 'Smart Watch',
    'Software License', 'Office Chair', 'Desk', 'Filing Cabinet', 'Paper Shredder', 'Projector',
    'Scanner', 'Server', 'Network Switch', 'UPS Battery Backup', 'Toner Cartridge', 'Phone System',
    'Webcam', 'Microphone', 'Graphics Card', 'RAM Module', 'CPU', 'Power Supply'
  ];
  
  const products = [];
  const usedProducts = new Set();
  
  for (let i = 0; i < count; i++) {
    let productName;
    do {
      productName = getRandomItem(productNames);
    } while (usedProducts.has(productName));
    
    usedProducts.add(productName);
    
    products.push({
      desc: productName,
      qty: getRandomInt(1, 10),
      price: getRandomFloat(10, 1000)
    });
  }
  
  return products;
};

const generateFileName = () => {
  const randomString = Math.random().toString(36).substring(2, 12);
  const timestamp = Date.now();
  return `invoice-${timestamp}-${randomString}.png`;
};

const generateInvoice = () => {
  const canvas = createCanvas(600, 800);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';

  ctx.font = 'bold 30px Arial';
  const companyNames = ['TechSupply Inc.', 'Global Systems', 'Infinity Tech', 'Digital Solutions', 'Smart Services'];
  const companyName = getRandomItem(companyNames);
  ctx.fillText(companyName, 50, 50);

  ctx.font = '12px Arial';
  ctx.fillText(`Phone: ${getRandomInt(100, 999)}-${getRandomInt(100, 999)}-${getRandomInt(1000, 9999)}`, 50, 70);
  ctx.fillText(`Email: info@${companyName.toLowerCase().replace(/\s+/g, '')}.com`, 50, 85);

  ctx.font = 'bold 24px Arial';
  ctx.fillText('INVOICE', 450, 50);

  const invoiceId = `INV-${getRandomInt(10000, 99999)}`;
  const invoiceDate = getRandomDate();
  ctx.font = '16px Arial';
  ctx.fillText(`Invoice #: ${invoiceId}`, 400, 80);
  ctx.fillText(`Date: ${invoiceDate}`, 400, 100);

  const customerName = getRandomName();
  const customerAddress = getRandomAddress();
  
  ctx.font = 'bold 18px Arial';
  ctx.fillText('BILL TO:', 50, 130);
  ctx.font = '16px Arial';
  ctx.fillText(customerName, 50, 155);

  const addressParts = customerAddress.split(', ');
  ctx.fillText(addressParts[0], 50, 175);
  ctx.fillText(addressParts.slice(1).join(', '), 50, 195);

  ctx.font = 'bold 18px Arial';
  ctx.fillText('PAYMENT DETAILS:', 400, 130);
  ctx.font = '16px Arial';
  
  const paymentMethods = ['Credit Card', 'Bank Transfer', 'PayPal', 'Check', 'Cash'];
  ctx.fillText(`Method: ${getRandomItem(paymentMethods)}`, 400, 155);
  ctx.fillText(`Due Date: ${getRandomDate()}`, 400, 175);

  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(50, 230, 500, 30);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Description', 60, 250);
  ctx.fillText('Qty', 280, 250);
  ctx.fillText('Price', 340, 250);
  ctx.fillText('Total', 480, 250);

  ctx.font = '14px Arial';
  const items = getRandomProducts();
  let y = 280;
  let grandTotal = 0;
  
  items.forEach((item) => {
    const total = item.qty * item.price;
    grandTotal += total;
    ctx.fillText(item.desc, 60, y);
    ctx.fillText(item.qty.toString(), 280, y);
    ctx.fillText(`$${item.price.toFixed(2)}`, 340, y);
    ctx.fillText(`$${total.toFixed(2)}`, 480, y);
    y += 30;
  });

  const taxRate = getRandomFloat(0, 0.1);
  const tax = grandTotal * taxRate;
  
  y += 20;
  ctx.fillRect(340, y - 10, 210, 1); 
  
  ctx.fillText('Subtotal:', 400, y + 10);
  ctx.fillText(`$${grandTotal.toFixed(2)}`, 480, y + 10);
  
  ctx.fillText(`Tax (${(taxRate * 100).toFixed(1)}%):`, 400, y + 40);
  ctx.fillText(`$${tax.toFixed(2)}`, 480, y + 40);
  
  ctx.font = 'bold 16px Arial';
  ctx.fillText('TOTAL:', 400, y + 70);
  ctx.fillText(`$${(grandTotal + tax).toFixed(2)}`, 480, y + 70);
  
  y += 100;
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Notes:', 50, y);
  ctx.font = '14px Arial';
  
  const notes = [
    'Payment due within 30 days.',
    'Please include invoice number on your payment.',
    'Thank you for your business!',
    'For questions, contact our accounting department.',
    'A late fee of 1.5% will be applied to overdue invoices.'
  ];
  
  notes.forEach((note, index) => {
    ctx.fillText(note, 50, y + 25 + (index * 20));
  });
  
  return canvas.toBuffer('image/png');
};

const getPresignedUrl = async (fileName, token, userAgent, proxy) => {
  const headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.6',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'origin': 'https://app.polyflow.tech',
    'authorization': `Bearer ${token}`,
    'content-type': 'application/json',
    'user-agent': userAgent,
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'sec-gpc': '1',
    'Referer': 'https://app.polyflow.tech/',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
  try {
    const response = await axios.get(`${API_BASE_URL}/get_presigned_url?file_name=${fileName}`, {
      headers,
      httpsAgent: proxy ? new HttpsProxyAgent(proxy) : undefined,
    });
    
    if (response.data?.msg?.presigned_url) {
      const urlStart = response.data.msg.presigned_url.substring(0, 30);
      console.log(chalk.white(`  📝 Got presigned URL: ${urlStart}... (key: ${response.data.msg.key})`));
    } else {
      console.log(chalk.white(`  📝 Got presigned URL response`));
    }
    
    if (!response.data?.msg?.presigned_url || !response.data?.msg?.key) {
      throw new Error('Invalid presigned URL response');
    }
    const url = response.data.msg.presigned_url;
    const key = response.data.msg.key;
    if (!url.startsWith('https://')) {
      throw new Error(`Invalid URL format: ${url}`);
    }
    return { url, key };
  } catch (error) {
    console.error(chalk.red(`  ❌ Error getting presigned URL: ${error.message}`));
    throw error;
  }
};

const uploadInvoice = async (presignedUrl, fileBuffer, proxy) => {
  try {
    new URL(presignedUrl);
    await axios.put(presignedUrl, fileBuffer, {
      headers: {
        'content-type': 'application/octet-stream',
      },
      httpsAgent: proxy ? new HttpsProxyAgent(proxy) : undefined,
    });
    console.log(chalk.green('  ✅ Invoice uploaded successfully'));
  } catch (error) {
    console.error(chalk.red(`  ❌ Error uploading invoice: ${error.message}`));
    throw error;
  }
};

const saveInvoice = async (invoicePath, token, userAgent, proxy) => {
  const headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.6',
    'authorization': `Bearer ${token}`,
    'content-type': 'application/json',
    'user-agent': userAgent,
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'sec-gpc': '1',
    'Referer': 'https://app.polyflow.tech/',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
  try {
    const response = await axios.post(`${API_BASE_URL}/save_invoice`, {
      invoice_path: invoicePath,
    }, {
      headers,
      httpsAgent: proxy ? new HttpsProxyAgent(proxy) : undefined,
    });
    console.log(chalk.green('  ✅ Invoice saved successfully'));
  } catch (error) {
    console.error(chalk.red(`  ❌ Error saving invoice: ${error.message}`));
    throw error;
  }
};

const processInvoice = async (token, userAgent, proxy, scanIndex, totalScans) => {
  console.log(chalk.cyan(`\n🔄 [${scanIndex}/${totalScans}] Starting scan...`));
  try {
    const fileName = generateFileName();
    console.log(chalk.white(`  📄 Generating unique invoice: ${fileName}`));
    const invoiceBuffer = generateInvoice();

    console.log(chalk.white('  🔑 Fetching presigned URL...'));
    const { url: presignedUrl, key } = await getPresignedUrl(fileName, token, userAgent, proxy);

    console.log(chalk.white(`  📤 Uploading invoice to S3...`));
    await uploadInvoice(presignedUrl, invoiceBuffer, proxy);

    console.log(chalk.white('  💾 Saving invoice metadata...'));
    await saveInvoice(key, token, userAgent, proxy);

    console.log(chalk.green(`✅ [${scanIndex}/${totalScans}] Scan completed successfully`));
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ [${scanIndex}/${totalScans}] Failed to process invoice: ${error.message}`));
    return false;
  }
};

// 保存配置到文件
const saveConfig = async (config) => {
  try {
    await fs.writeFile(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 2), 'utf8');
    console.log(chalk.green('✅ 配置已保存到 config.json'));
  } catch (error) {
    console.error(chalk.red(`❌ 保存配置失败: ${error.message}`));
  }
};

// 生成随机的执行时间点（只在白天）
const generateRandomRunTimes = (count) => {
  const runTimes = [];
  // 定义白天时间范围（8:00-22:00）
  const startHour = 8;
  const endHour = 22;
  const workingHours = endHour - startHour;
  
  // 获取当地时区偏移（分钟）
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset();
  console.log(chalk.white(`  🌐 当前时区偏移: ${timezoneOffset} 分钟`));
  
  // 根据时区调整工作时间范围
  const localStartHour = Math.max(8, startHour - Math.floor(timezoneOffset / 60));
  const localEndHour = Math.min(22, endHour - Math.floor(timezoneOffset / 60));
  const localWorkingHours = localEndHour - localStartHour;
  
  console.log(chalk.white(`  🕒 本地工作时间范围: ${localStartHour}:00 - ${localEndHour}:00`));
  
  // 避免时间点过于接近
  const minHoursBetweenRuns = localWorkingHours / (count + 1);
  
  // 生成均匀分布的随机时间点
  for (let i = 0; i < count; i++) {
    // 为每个时间点分配一个时间段，然后在段内随机选择
    const segmentStart = localStartHour + minHoursBetweenRuns * i;
    const segmentEnd = localStartHour + minHoursBetweenRuns * (i + 1);
    
    // 在分配的时间段内随机选择一个小时
    const randomHour = Math.floor(segmentStart + Math.random() * (segmentEnd - segmentStart));
    // 随机分钟
    const randomMinute = Math.floor(Math.random() * 60);
    
    // 格式化为 "HH:MM" 
    const timeString = `${String(randomHour).padStart(2, '0')}:${String(randomMinute).padStart(2, '0')}`;
    runTimes.push(timeString);
  }
  
  // 按时间排序
  return runTimes.sort((a, b) => {
    const [aHour, aMin] = a.split(':').map(Number);
    const [bHour, bMin] = b.split(':').map(Number);
    return (aHour * 60 + aMin) - (bHour * 60 + bMin);
  });
};

// 从文件读取配置
const readConfig = async () => {
  try {
    const data = await fs.readFile(path.join(__dirname, 'config.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log(chalk.yellow('⚠️ 未找到配置文件，将使用默认配置'));
    return {
      minDailyScans: 4,      // 每天最少扫描次数
      maxDailyScans: 6,      // 每天最多扫描次数
      minScansPerRun: 3,     // 每次运行最少扫描次数
      maxScansPerRun: 8,     // 每次运行最多扫描次数
      minDelay: 60,          // 扫描之间最小延迟(秒)
      maxDelay: 300,         // 扫描之间最大延迟(秒)
      runTimes: []           // 运行时间将自动生成
    };
  }
};

// 获取今天的随机扫描参数
const getRandomScanParams = (config) => {
  // 随机生成今日扫描次数
  const dailyScans = getRandomInt(config.minDailyScans, config.maxDailyScans);
  
  // 生成每次运行的随机扫描次数数组
  const scansPerRunArray = [];
  for (let i = 0; i < dailyScans; i++) {
    scansPerRunArray.push(getRandomInt(config.minScansPerRun, config.maxScansPerRun));
  }
  
  return {
    dailyScans,
    scansPerRunArray
  };
};

// 执行定时任务
const runScheduledTask = async (tokens, userAgents, proxies, config, taskIndex) => {
  // 获取当前任务应该执行的扫描次数
  const scansPerRun = config.scansPerRunArray[taskIndex];
  const { minDelay, maxDelay } = config;
  
  console.log(chalk.yellow('\n🕒 执行定时任务'));
  console.log(chalk.white('--------------------------------------------------------'));
  console.log(chalk.green(`✅ 将执行 ${scansPerRun} 次扫描`));
  
  let successfulScans = 0;
  const startTime = Date.now();
  
  for (let i = 1; i <= scansPerRun; i++) {
    const tokenIndex = (i - 1) % tokens.length;
    const token = tokens[tokenIndex];
    const userAgent = userAgents[`token_${tokenIndex}`];
    const proxy = getRandomProxy(proxies);
    
    console.log(chalk.white(`  🔑 使用 Token ${tokenIndex + 1}: ${token.slice(0, 20)}...`));
    console.log(chalk.white(`  🌐 使用用户代理: ${userAgent.slice(0, 30)}...`));
    if (proxy) console.log(chalk.white(`  🌐 使用代理: ${proxy}`));
    
    const success = await processInvoice(token, userAgent, proxy, i, scansPerRun);
    if (success) successfulScans++;
    
    if (i < scansPerRun) {
      const delay = getRandomInt(minDelay, maxDelay);
      console.log(chalk.white(`  ⏱️ 等待 ${delay} 秒后进行下一次扫描...`));
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(chalk.yellow('\n🏁 扫描摘要'));
  console.log(chalk.white('--------------------------------------------------------'));
  console.log(chalk.green(`✅ 成功完成 ${successfulScans}/${scansPerRun} 次扫描`));
  console.log(chalk.white(`⏱️ 总时间: ${duration} 秒\n`));
  
  if (successfulScans < scansPerRun) {
    console.log(chalk.yellow('⚠️ 部分扫描失败。请检查token有效性或API状态。'));
  }
  
  console.log(chalk.green('✅ 定时任务完成，等待下一次执行'));
};

// 每天0点重新生成运行时间
const scheduleNewDayTasks = async (tokens, userAgents, proxies, config) => {
  // 创建一个在每天0点执行的任务
  scheduleJob({
    name: 'dailyReset',
    rule: '0 0 * * *'
    // 不指定tz参数，将自动使用系统当地时区
  }, async () => {
    console.log(chalk.yellow('\n🔄 凌晨0点，为新的一天生成任务计划'));
    
    // 取消所有现有的定时任务（除了0点的这个任务）
    const scheduledJobs = Object.values(scheduleJob.scheduledJobs);
    for (const job of scheduledJobs) {
      if (job.name !== 'dailyReset') {
        job.cancel();
      }
    }
    
    // 生成新的随机参数
    const { dailyScans, scansPerRunArray } = getRandomScanParams(config);
    config.dailyScans = dailyScans;
    config.scansPerRunArray = scansPerRunArray;
    
    // 生成新的随机运行时间
    config.runTimes = generateRandomRunTimes(dailyScans);
    
    console.log(chalk.green(`✅ 已为今天生成随机执行参数:`));
    console.log(chalk.white(`   - 今日执行次数: ${dailyScans} 次`));
    console.log(chalk.white(`   - 每次扫描次数: ${scansPerRunArray.join(', ')} 次`));
    console.log(chalk.white(`   - 执行时间: ${config.runTimes.join(', ')}`));
    
    await saveConfig(config);
    
    // 重新设置所有任务
    setupDailyTasks(tokens, userAgents, proxies, config);
  });
  
  // 输出当前系统时区信息
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset();
  const timezoneHours = Math.abs(Math.floor(timezoneOffset / 60));
  const timezoneMinutes = Math.abs(timezoneOffset % 60);
  const timezoneSign = timezoneOffset > 0 ? '-' : '+';
  
  console.log(chalk.white(`  🌐 使用系统当地时区: GMT${timezoneSign}${String(timezoneHours).padStart(2, '0')}:${String(timezoneMinutes).padStart(2, '0')}`));
};

// 设置每日定时任务
const setupDailyTasks = (tokens, userAgents, proxies, config) => {
  // 设置所有的计划任务
  config.runTimes.forEach((time, index) => {
    const [hour, minute] = time.split(':').map(Number);
    const cronTime = `${minute} ${hour} * * *`;
    
    scheduleJob({
      name: `task_${index}`,
      rule: cronTime
      // 不指定tz参数，将自动使用系统当地时区
    }, async () => {
      const currentTime = new Date().toLocaleTimeString();
      console.log(chalk.yellow(`\n🕒 [${currentTime}] 执行计划任务 #${index + 1}`));
      await runScheduledTask(tokens, userAgents, proxies, config, index);
    });
    
    console.log(chalk.green(`✅ 已设置定时任务 #${index + 1}: 每天 ${time} (cron: ${cronTime}) - 将扫描 ${config.scansPerRunArray[index]} 次`));
  });
};

// 配置初始化和定时任务设置
const setupScheduledTasks = async () => {
  console.clear();
  
  console.log(chalk.white('--------------------------------------------------------'));
  console.log(chalk.white('       AUTO SCANPOLYFLOW - AIRDROP INSIDERS  '));
  console.log(chalk.white('--------------------------------------------------------'));

  const tokens = await readTokens();
  console.log(chalk.green(`\n✅ 已加载 ${tokens.length} 个token`));
  tokens.forEach((token, i) => {
    console.log(chalk.white(`  🔑 Token ${i + 1}: ${token.slice(0, 20)}...`));
  });

  const userAgents = await ensureUserAgents(tokens);
  console.log(chalk.green(`✅ 已为所有token配置用户代理`));

  const proxies = await readProxies();
  if (proxies) {
    console.log(chalk.green(`✅ 已加载 ${proxies.length} 个代理`));
  } else {
    console.log(chalk.yellow(`⚠️ 未加载代理，将不使用代理运行`));
  }

  let config = await readConfig();
  
  // 询问是否要更改配置
  const changeConfig = readlineSync.keyInYNStrict(chalk.white('是否要更改当前配置？'));
  
  if (changeConfig) {
    console.log(chalk.yellow('\n⚙️ 配置'));
    console.log(chalk.white('--------------------------------------------------------'));
    
    config.minDailyScans = readlineSync.questionInt(chalk.white(`每天最少执行多少次？(当前: ${config.minDailyScans}): `), {
      defaultInput: config.minDailyScans,
      min: 1
    });
    
    config.maxDailyScans = readlineSync.questionInt(chalk.white(`每天最多执行多少次？(当前: ${config.maxDailyScans}): `), {
      defaultInput: config.maxDailyScans,
      min: config.minDailyScans
    });
    
    config.minScansPerRun = readlineSync.questionInt(chalk.white(`每次运行最少执行多少次扫描？(当前: ${config.minScansPerRun}): `), {
      defaultInput: config.minScansPerRun,
      min: 1
    });
    
    config.maxScansPerRun = readlineSync.questionInt(chalk.white(`每次运行最多执行多少次扫描？(当前: ${config.maxScansPerRun}): `), {
      defaultInput: config.maxScansPerRun,
      min: config.minScansPerRun
    });
    
    config.minDelay = readlineSync.questionInt(chalk.white(`扫描之间的最小延迟(秒)？(当前: ${config.minDelay}): `), {
      defaultInput: config.minDelay,
      min: 1
    });
    
    config.maxDelay = readlineSync.questionInt(chalk.white(`扫描之间的最大延迟(秒)？(当前: ${config.maxDelay}): `), {
      defaultInput: config.maxDelay,
      min: config.minDelay
    });
    
    await saveConfig(config);
  }
  
  // 生成今天的随机扫描参数
  const { dailyScans, scansPerRunArray } = getRandomScanParams(config);
  config.dailyScans = dailyScans;
  config.scansPerRunArray = scansPerRunArray;
  
  // 生成随机运行时间
  config.runTimes = generateRandomRunTimes(dailyScans);
  
  console.log(chalk.green(`\n✅ 已为今天生成随机执行参数:`));
  console.log(chalk.white(`   - 今日执行次数: ${dailyScans} 次`));
  console.log(chalk.white(`   - 每次扫描次数: ${scansPerRunArray.join(', ')} 次`));
  console.log(chalk.white(`   - 执行时间: ${config.runTimes.join(', ')}`));
  
  await saveConfig(config);
  
  console.log(chalk.yellow('\n⚙️ 当前配置'));
  console.log(chalk.white('--------------------------------------------------------'));
  console.log(chalk.white(`  扫描范围: 每天 ${config.minDailyScans}-${config.maxDailyScans} 次`));
  console.log(chalk.white(`  扫描次数: 每次运行 ${config.minScansPerRun}-${config.maxScansPerRun} 次`));
  console.log(chalk.white(`  扫描延迟: ${config.minDelay}-${config.maxDelay} 秒`));
  
  // 设置定时任务
  console.log(chalk.yellow('\n🕒 设置定时任务'));
  console.log(chalk.white('--------------------------------------------------------'));
  
  // 设置每日定时任务
  setupDailyTasks(tokens, userAgents, proxies, config);
  
  // 设置每天0点重新生成任务的计划
  await scheduleNewDayTasks(tokens, userAgents, proxies, config);
  console.log(chalk.green(`✅ 已设置每日零点任务重置计划`));
  
  // 立即执行一次
  const runNow = readlineSync.keyInYNStrict(chalk.white('是否要立即执行一次扫描？'));
  if (runNow) {
    // 选择随机的一个任务配置来执行
    const randomTaskIndex = Math.floor(Math.random() * config.scansPerRunArray.length);
    await runScheduledTask(tokens, userAgents, proxies, config, randomTaskIndex);
  }
  
  console.log(chalk.green('\n✅ 所有定时任务已设置'));
  console.log(chalk.white('脚本将继续运行并按计划执行任务'));
  console.log(chalk.white('请保持此窗口打开，或考虑使用PM2等工具在后台运行'));
};

// 启动应用
setupScheduledTasks().catch(error => {
  console.error(chalk.red(`❌ 致命错误: ${error.message}`));
  process.exit(1);
});
