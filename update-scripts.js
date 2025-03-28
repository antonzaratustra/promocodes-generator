// Обновляем импорты для поддержки ES модулей
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Загружаем конфигурацию
let config;
try {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, 'clasp-config.json'), 'utf8'));
} catch (error) {
  console.error('Ошибка загрузки конфигурации:', error.message);
  console.log('Создаем конфигурацию по умолчанию...');
  
  // Создаем конфигурацию по умолчанию
  config = {
    sheets: [
      {
        name: 'MRWRU_DRWRU',
        scriptId: '', // Заполните ваш Script ID
        deploymentDescription: 'RestaurantWeek Moscow and Dubai RU'
      },
      {
        name: 'DRWEN',
        scriptId: '', // Заполните ваш Script ID
        deploymentDescription: 'RestaurantWeek Dubai EN'
      },
      {
        name: 'MSWRU_DSWRU',
        scriptId: '', // Заполните ваш Script ID
        deploymentDescription: 'SalonWeek Moscow and Dubai RU'
      },
      {
        name: 'DSWEN',
        scriptId: '', // Заполните ваш Script ID
        deploymentDescription: 'SalonWeek Dubai EN'
      }
    ]
  };
  
  fs.writeFileSync(path.join(__dirname, 'clasp-config.json'), JSON.stringify(config, null, 2));
  console.log('Конфигурация создана. Пожалуйста, заполните scriptId для каждого проекта в файле clasp-config.json');
  process.exit(1);
}

// Path to your Apps Script code
const scriptPath = path.join(__dirname, 'appscript');

// Create the directory if it doesn't exist
if (!fs.existsSync(scriptPath)) {
  fs.mkdirSync(scriptPath);
}

// Function to execute shell commands
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(`stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

// Функция для копирования кода во все проекты
async function copyCodeToProjects() {
  const sourceCode = fs.readFileSync(path.join(scriptPath, 'Code.js'), 'utf8');
  
  for (const sheet of config.sheets) {
    const projectDir = path.join(scriptPath, sheet.name);
    
    // Создаем директорию проекта, если она не существует
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    
    // Записываем Code.js в директорию проекта
    fs.writeFileSync(path.join(projectDir, 'Code.js'), sourceCode);
    console.log(`Код скопирован в ${sheet.name}`);
  }
}

// Function to update a single sheet
async function updateSheet(sheet) {
  console.log(`Обновление ${sheet.name}...`);
  
  // Create .clasp.json for this sheet
  const claspConfig = {
    scriptId: sheet.scriptId,
    rootDir: path.join('appscript', sheet.name)
  };
  
  fs.writeFileSync(path.join(__dirname, '.clasp.json'), JSON.stringify(claspConfig, null, 2));
  
  // Push code to the sheet
  await executeCommand('npx clasp push -f');
  
  console.log(`Код успешно отправлен в ${sheet.name}`);
}

// Функция для создания нового развертывания
async function deploySheet(sheet) {
  console.log(`Создание развертывания для ${sheet.name}...`);
  
  // Create .clasp.json for this sheet
  const claspConfig = {
    scriptId: sheet.scriptId,
    rootDir: path.join('appscript', sheet.name)
  };
  
  fs.writeFileSync(path.join(__dirname, '.clasp.json'), JSON.stringify(claspConfig, null, 2));
  
  // Create a new deployment
  const deployOutput = await executeCommand(`npx clasp deploy --description "${sheet.deploymentDescription}"`);
  
  // Extract deployment ID and URL from the output
  const deploymentIdMatch = deployOutput.match(/- ([-_A-Za-z0-9]+) @\d+/);
  const deploymentId = deploymentIdMatch ? deploymentIdMatch[1] : null;
  
  if (deploymentId) {
    // Get the deployment URL
    const deploymentInfo = await executeCommand(`npx clasp deployments`);
    const urlMatch = deploymentInfo.match(new RegExp(`${deploymentId}.*?(https://script.google.com/macros/s/[^\\s]+)`));
    const deploymentUrl = urlMatch ? urlMatch[1] : null;
    
    if (deploymentUrl) {
      console.log(`URL развертывания для ${sheet.name}: ${deploymentUrl}`);
      return {
        name: sheet.name,
        deploymentId,
        deploymentUrl
      };
    }
  }
  
  throw new Error(`Не удалось получить информацию о развертывании для ${sheet.name}`);
}

// Функция для получения URL развертываний
async function getDeploymentUrls(sheet) {
  console.log(`Получение URL развертывания для ${sheet.name}...`);
  
  // Create .clasp.json for this sheet
  const claspConfig = {
    scriptId: sheet.scriptId,
    rootDir: path.join('appscript', sheet.name)
  };
  
  fs.writeFileSync(path.join(__dirname, '.clasp.json'), JSON.stringify(claspConfig, null, 2));
  
  // Get deployments
  const deploymentInfo = await executeCommand(`npx clasp deployments`);
  
  // Find the latest deployment with the correct description
  const deploymentMatch = deploymentInfo.match(new RegExp(`([-_A-Za-z0-9]+) @\\d+ ${sheet.deploymentDescription}.*?(https://script.google.com/macros/s/[^\\s]+)`));
  
  if (deploymentMatch) {
    const deploymentId = deploymentMatch[1];
    const deploymentUrl = deploymentMatch[2];
    
    console.log(`Найден URL развертывания для ${sheet.name}: ${deploymentUrl}`);
    
    return {
      name: sheet.name,
      deploymentId,
      deploymentUrl
    };
  }
  
  throw new Error(`Не найдено развертывание для ${sheet.name} с описанием "${sheet.deploymentDescription}"`);
}

// Функция для отправки кода во все проекты
async function pushToAllSheets() {
  // Сначала копируем код во все проекты
  await copyCodeToProjects();
  
  for (const sheet of config.sheets) {
    try {
      await updateSheet(sheet);
    } catch (error) {
      console.error(`Ошибка при обновлении ${sheet.name}: ${error.message}`);
    }
  }
  
  console.log('Все проекты успешно обновлены!');
}

// Функция для создания развертываний для всех проектов
async function deployAllSheets() {
  const deployments = [];
  
  // Сначала копируем код во все проекты
  await copyCodeToProjects();
  
  for (const sheet of config.sheets) {
    try {
      const deployment = await deploySheet(sheet);
      deployments.push(deployment);
    } catch (error) {
      console.error(`Ошибка при развертывании ${sheet.name}: ${error.message}`);
    }
  }
  
  if (deployments.length > 0) {
    updateReferralsJs(deployments);
  }
  
  console.log('Все проекты успешно развернуты!');
}

// Функция для получения URL развертываний для всех проектов
async function getAllDeploymentUrls() {
  const deployments = [];
  
  for (const sheet of config.sheets) {
    try {
      const deployment = await getDeploymentUrls(sheet);
      deployments.push(deployment);
    } catch (error) {
      console.error(`Ошибка при получении URL для ${sheet.name}: ${error.message}`);
    }
  }
  
  if (deployments.length > 0) {
    updateReferralsJs(deployments);
  }
  
  console.log('Все URL развертываний успешно обновлены!');
}

// Function to update referrals.js
function updateReferralsJs(deployments) {
  const referralsPath = path.join(__dirname, 'referrals.js');
  let referralsCode = fs.readFileSync(referralsPath, 'utf8');
  
  // Создаем карту URL для каждого кода мероприятия
  const urlMap = {};
  for (const deployment of deployments) {
    // Разбиваем имя на коды мероприятий
    const eventCodes = deployment.name.split('_');
    for (const code of eventCodes) {
      urlMap[code] = deployment.deploymentUrl;
    }
  }
  
  // Replace the getDataUrl function
  const newGetDataUrlFunction = `
    // Функция для определения URL получения данных
    function getDataUrl(eventCode) {
        switch(eventCode) {
${Object.entries(urlMap).map(([code, url]) => 
  `            case '${code}':\n                return '${url}';`
).join('\n')}
            default:
                throw new Error('Неизвестный тип мероприятия');
        }
    }`;
  
  // Replace the existing getDataUrl function
  referralsCode = referralsCode.replace(
    /function getDataUrl\(eventCode\) \{[\s\S]*?default:[\s\S]*?}\s*}/m,
    newGetDataUrlFunction
  );
  
  fs.writeFileSync(referralsPath, referralsCode);
  console.log('Функция getDataUrl в referrals.js успешно обновлена!');
}

// Основная функция
async function main() {
  const command = process.argv[2] || 'help';
  
  switch (command) {
    case 'push':
      await pushToAllSheets();
      break;
    case 'deploy':
      await deployAllSheets();
      break;
    case 'update-urls':
      await getAllDeploymentUrls();
      break;
    case 'help':
    default:
      console.log(`
Использование:
  node update-scripts.js [команда]

Команды:
  push         - Отправить код во все проекты
  deploy       - Создать новые развертывания для всех проектов
  update-urls  - Обновить URL развертываний без создания новых
  help         - Показать эту справку
      `);
      break;
  }
}

// Запускаем основную функцию
main().catch(console.error);