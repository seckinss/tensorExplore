import { VercelRequest, VercelResponse } from '@vercel/node';
import { createCanvas, loadImage, registerFont } from 'canvas';
import axios from 'axios';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

 interface NFTData {
  name: string;
  collId: string;
  processedIcon?: string;
  icon: string;
  spread: number;
  buyNow: number;
  sellNow: number;
  listed: number;
  marketCap: number;
  volume: number;
  numMints: number;
}

const collIds = [
  '05c52d84-2e49-4ed9-a473-b43cab41e777',
  '099c4f20-fd22-44b3-af6d-43d2b9f4cf21',
  '435d4e97-a543-4504-87b3-32018c635999',
  '712a0252-9d60-48bc-a40b-a031091a2149',
  '79eb758a-0b96-423d-814b-0dc8cff5f347',
  '8db09545-aecc-4c0b-855a-f6c7a7318742',
  'ac3c5fb8-e8b5-41e5-b744-7df52b38ddbd',
  'bc7844c1-169f-4933-93e4-d8f1b8f2b0ea',
  'bd366797-5599-417a-be03-1e43a7e3fb90',
  'f883639c-899e-44c0-9221-2d50d9d67428',
]
registerFont(path.join(process.cwd(), 'fonts', 'Arimo-Regular.ttf'), { family: 'Arial' });
registerFont(path.join(process.cwd(), 'fonts', 'Arimo-Bold.ttf'), { family: 'Arial', weight: 'bold' });
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  try {
    const nftData: NFTData = {
      name: req.query.name as string || '',
      icon: req.query.icon as string || '',
      collId: req.query.collId as string || '',
      spread: parseFloat(req.query.spread as string || '0'),
      buyNow: parseFloat(req.query.buyNow as string || '0'),
      sellNow: parseFloat(req.query.sellNow as string || '0'),
      listed: parseInt(req.query.listed as string || '0'),
      marketCap: parseInt(req.query.marketCap as string || '0'),
      volume: parseInt(req.query.volume as string || '0'),
      numMints: parseInt(req.query.numMints as string || '0'),
    };
    if(collIds.includes(nftData.collId)){
      const iconPath = path.join(process.cwd(), 'nft_icons', `${nftData.collId}.png`);
      const iconBuffer = await fs.readFile(iconPath);
      const processedIconDataUrl = `data:image/webp;base64,${iconBuffer.toString('base64')}`;
      const updatedNftData = { ...nftData, processedIcon: processedIconDataUrl };
      const image = await generateCanvasImage(updatedNftData);
      res.setHeader('Content-Type', 'image/png');
      res.send(image);
      return;
    }
    const processedIconDataUrl = await fetchAndProcessIcon(nftData.icon);
    const updatedNftData = { ...nftData, processedIcon: processedIconDataUrl };
    const image = await generateCanvasImage(updatedNftData);
    res.setHeader('Content-Type', 'image/png');
    res.send(image);
  } catch (error) {
    console.error('Error generating photo:', error);
    res.status(500).send('Error generating photo');
  }
}

async function fetchAndProcessIcon(iconUrl: string): Promise<string> {
  const response = await axios.get(iconUrl, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data, 'binary');
  const processedBuffer = await sharp(buffer)
    .resize(100, 100, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFormat('jpeg')
    .toBuffer();
  return `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
}
async function generateCanvasImage(data: NFTData): Promise<Buffer> {

  const canvas = createCanvas(500, 500);
  const ctx = canvas.getContext('2d');

  // Background gradient
  ctx.fillStyle = "#101010";
  ctx.fillRect(0, 0, 500, 500);

  // Inner rectangle
  ctx.fillStyle = '#19141E';
  ctx.fillRect(50, 50, 400, 500);

  // Load and draw icon
  const img = await loadImage(data.processedIcon || data.icon);
  ctx.drawImage(img, 200, 20, 100, 100);

  // Title
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText(data.name, 250, 160);

  // Spread
  ctx.font = '18px Arial';
  ctx.fillStyle = '#506E78';
  ctx.fillText(`Spread: ${data.spread.toFixed(2)}%`, 250, 190);

  // Buy Now
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#4ADE80';
  ctx.textAlign = 'right';
  ctx.fillText(data.buyNow.toFixed(2).toString(), 200, 250);
  ctx.font = '16px Arial';
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText('BUY NOW', 200, 275);

  // Sell Now
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#F87171';
  ctx.textAlign = 'left';
  ctx.fillText(data.sellNow.toFixed(2).toString(), 300, 250);
  ctx.font = '16px Arial';
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText('SELL NOW', 300, 275);

  // Listed
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'right';
  ctx.fillText((data.listed).toLocaleString('en-US'), 200, 330);
  ctx.font = '16px Arial';
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText('LISTED ▲', 200, 355);

  // Listed (right side)
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.fillText(formatTokenAmount((data.listed/data.numMints*100)) + '%', 300, 330);
  ctx.font = '16px Arial';
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText('LISTED %', 300, 355);

  // Market Cap
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'right';
  ctx.fillText(data.marketCap.toLocaleString('en-US'), 200, 410);
  ctx.font = '16px Arial';
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText('MARKET CAP', 200, 435);

  // 24H Volume
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.fillText(data.volume.toLocaleString('en-US'), 300, 410);
  ctx.font = '16px Arial';
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText('24H VOLUME', 300, 435);

  return canvas.toBuffer('image/png');
}
 function formatTokenAmount(num: number): string {
  if (num >= 1 && num < 1e3) {
    return removeTrailingZeros(num.toFixed(2));
  }
  if (num >= 1e3 && num < 1e6) {
    return removeTrailingZeros((num / 1e3).toFixed(1)) + 'K';
  }
  if (num >= 1e6 && num < 1e9) {
    return removeTrailingZeros((num / 1e6).toFixed(1)) + 'M';
  }
  if (num >= 1e9 && num < 1e12) {
    return removeTrailingZeros((num / 1e9).toFixed(1)) + 'B';
  }
  if (num >= 1e12) {
    return removeTrailingZeros((num / 1e12).toFixed(1)) + 'T';
  }
  return removeTrailingZeros(num.toPrecision(3));
}

function removeTrailingZeros(value: string): string {
  return value.replace(/\.?0+$/, '');
}
