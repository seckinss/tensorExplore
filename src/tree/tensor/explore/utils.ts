import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { formatTokenAmount } from '../../../shared/number-formatting-utils';

export interface NFTData {
    name: string;
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
const baseUrl = 'https://image-generator-seven-gray.vercel.app/api/generate-photo.ts' //Must change

export function getURL(collection: any){
    const queryParams = new URLSearchParams();
    queryParams.append('name', collection.name);
    queryParams.append('icon', collection.imageUri);
    queryParams.append('collId', collection.collId);
    queryParams.append('spread', (formatTokenAmount((1 - collection.stats.sellNowPriceNetFees / collection.stats.buyNowPriceNetFees )* 100)));
    queryParams.append('buyNow', formatTokenAmount(collection.stats.buyNowPriceNetFees / LAMPORTS_PER_SOL));
    queryParams.append('sellNow', formatTokenAmount(collection.stats.sellNowPriceNetFees / LAMPORTS_PER_SOL));
    queryParams.append('listed', collection.stats.numListed.toString());
    queryParams.append('marketCap', Math.floor(collection.stats.marketCap / LAMPORTS_PER_SOL).toString());
    queryParams.append('volume', Math.floor(collection.stats.volume24h / LAMPORTS_PER_SOL).toString());
    queryParams.append('numMints', collection.stats.numMints.toString());
    const fullUrl = `${baseUrl}?${queryParams.toString()}`;
    return fullUrl;
}
