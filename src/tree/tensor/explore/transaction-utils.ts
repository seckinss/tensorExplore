import { getAMMBidCollectionTransaction, getNftBuyTransaction, Mint } from '../../../api/tensor-api';
import { connection } from '../../../shared/connection';
import { Transaction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { Buffer } from 'buffer';
const SOURCE_TO_FEE_BPS = {
  "TENSORSWAP": 150,
  "TCOMP": 150,
  "MAGICEDEN_V2": 250,
  "default": 150
}


export async function getEmptyTransaction(account: string): Promise<string> {
  const { blockhash } = await connection.getLatestBlockhash();
  const transferInstruction = new TransactionInstruction({
    keys: [
      { pubkey: new PublicKey(account), isSigner: true, isWritable: true },
      { pubkey: new PublicKey('X6n2p9QCS2fWEmx1d6bVpRDMBZC82mvKqVyRVJ8qMv5'), isSigner: false, isWritable: true },
    ],
    programId: new PublicKey('11111111111111111111111111111111'),
    data: Buffer.from([2, 0, 0, 0, 232, 3, 0, 0, 0, 0, 0, 0]), //1000 lamport for abuse prevention
  });
  const transaction = new Transaction().add(transferInstruction);
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = new PublicKey(account);
  return transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  }).toString('base64');
}
export async function createBidNftTransaction(
  ownerAddress: string,
  price: number,
  collectionId: string
): Promise<string | null> {
  const blockhash = (await connection.getLatestBlockhash().then((res) => res.blockhash));
  console.log(blockhash);
  return getAMMBidCollectionTransaction({
    ownerAddress: ownerAddress,
    price: price,
    quantity: 1,
    collectionId: collectionId,
    latestBlockhash: blockhash,
  })
}

export async function createBuyNftTransaction(
  mint: Mint,
  buyerAddress: string,
): Promise<string | null> {
  const blockhash = await connection
    .getLatestBlockhash({ commitment: 'max' })
    .then((res) => res.blockhash);

  const totalPrice = getTotalPrice(
    parseInt(mint.listing.price, 10),
    mint.royaltyBps,
    mint.listing.source
  );
  return getNftBuyTransaction({
    mintAddress: mint.mint,
    ownerAddress: mint.listing.seller,
    buyerAddress: buyerAddress,
    price: totalPrice,
    latestBlockhash: blockhash,
  });
}

export function getTotalPrice(price: number, royaltyBps: number, source: keyof typeof SOURCE_TO_FEE_BPS | string): number {
  const MP_FEE_BPS = source in SOURCE_TO_FEE_BPS
    ? SOURCE_TO_FEE_BPS[source as keyof typeof SOURCE_TO_FEE_BPS]
    : SOURCE_TO_FEE_BPS["default"];
  const royalty = (price * royaltyBps) / 10000;
  const marketPlaceFee = (price * MP_FEE_BPS) / 10000;

  return price + royalty + marketPlaceFee;
}

