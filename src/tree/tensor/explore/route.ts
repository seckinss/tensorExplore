import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ActionError, ActionGetResponse, ActionPostRequest, ActionPostResponse } from '@solana/actions';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { findCollectionBySlug, getCollectionsBy24hVolume, getListingsByCollection } from '../../../api/tensor-api';
import { createBuyNftTransaction, getTotalPrice, getEmptyTransaction, createBidNftTransaction } from './transaction-utils';
import { formatTokenAmount } from '../../../shared/number-formatting-utils';
import {
  actionSpecOpenApiPostRequestBody,
  actionsSpecOpenApiGetResponse,
  actionsSpecOpenApiPostResponse,
} from '../../openapi';
import { getURL } from './utils';

let collections: any[];
const app = new OpenAPIHono();
app.openapi(createRoute({
  method: 'get',
  path: '/',
  tags: ['Tensor Explore Collections'],
  responses: actionsSpecOpenApiGetResponse,
}), async (c) => {
  let index = 0;
  if(!collections){
    collections = (await getCollectionsBy24hVolume()).collections;
  }
  const collection = collections[index];
  const buyNowPriceNetFees = collection.stats.buyNowPriceNetFees
    ? parseInt(collection.stats.buyNowPriceNetFees)
    : await getListingsByCollection(collection.collId)
      .then(resp => getTotalPrice(
        parseInt(resp.mints[0].listing.price),
        collection.sellRoyaltyFeeBPS,
        resp.mints[0].listing.source
      ));
  const numListed = collection.stats.numListed;

  if (numListed < 1) {
    return c.json(
      {
        type: 'action',
        icon: getURL(collection),
        label: `Not Available`,
        title: collection.name,
        'description': 'Explore NFTs on Tensor',
        disabled: true,
        error: {
          message: `Collection has no listed NFTs`,
        },
      } satisfies ActionGetResponse,
      {
        status: 200,
      },
    );
  }
  const uiPrice = formatTokenAmount(
    buyNowPriceNetFees / LAMPORTS_PER_SOL,
  );
  return c.json(
    {
      type: 'action',
      icon: getURL(collection),
      label: `${uiPrice} SOL`,
      links: {
        actions: [
          {
            href: `/api/tensor/explore/${collection.slugDisplay}/{amount}`,
            label: 'Bid Collection',
            parameters: [
              {
                type: 'number',
                name: 'amount',
                label: 'Enter a bid amount (SOL)',
                min: Number(uiPrice) / 10,
                max: Number(uiPrice),
              }
            ]
          },
          {
            href: `/api/tensor/explore/${(Number(index) + 19) % 20}`,
            label: 'Previous',
            parameters: [
            ]
          },
          {
            href: `/api/tensor/explore/${collection.slugDisplay}`,
            label: `Buy Floor`,
            parameters: [
            ]
          },
          {
            href: `/api/tensor/explore/${(Number(index) + 1) % 20}`,
            label: 'Next',
            parameters: [
            ]
          },
        ]
      },
      title: collection.name,
      description: 'Explore NFTs on Tensor',
    } satisfies ActionGetResponse,
  );
});

app.openapi(createRoute({
  method: 'get',
  path: '/{index}',
  tags: ['Tensor Explore Collections'],
  request: {
    params: z.object({
      index: z.string().openapi({
        param: {
          name: 'index',
          in: 'path',
        },
        type: 'number',
        example: '2',
      }),
    }),
  },
  responses: actionsSpecOpenApiGetResponse,
}), async (c) => {
  const index = c.req.param('index');
  if(isNaN(Number(index))){
    return c.json(
      {
        message: 'Invalid index parameter'
      } satisfies ActionError,
      {status: 404}
    );
  }
  if(!collections){
    collections = (await getCollectionsBy24hVolume()).collections;
  }
  const collection = collections[Number(index)];
  const buyNowPriceNetFees = collection.stats.buyNowPriceNetFees
    ? parseInt(collection.stats.buyNowPriceNetFees)
    : await getListingsByCollection(collection.collId)
      .then(resp => getTotalPrice(
        parseInt(resp.mints[0].listing.price),
        collection.sellRoyaltyFeeBPS,
        resp.mints[0].listing.source
      ));
  const numListed = collection.stats.numListed;
  if (numListed < 1) {
    return c.json(
      {
        type: 'action',
        icon: getURL(collection),
        label: `Not Available`,
        title: collection.name,
        'description': 'Explore NFTs on Tensor',
        disabled: true,
        error: {
          message: `Collection has no listed NFTs`,
        },
      } satisfies ActionGetResponse,
      {
        status: 200,
      },
    );
  }
  const uiPrice = formatTokenAmount(
    buyNowPriceNetFees / LAMPORTS_PER_SOL,
  );
  return c.json(
    {
      type: 'action',
      icon: getURL(collection),
      label: `${uiPrice} SOL`,
      links: {
        actions: [
          {
            href: `/api/tensor/explore/${collection.slugDisplay}/{amount}`,
            label: 'Bid Collection',
            parameters: [
              {
                type: 'number',
                name: 'amount',
                label: 'Enter a bid amount (SOL)',
                min: Number(uiPrice) / 10,
                max: Number(uiPrice),
              }
            ]
          },
          {
            href: `/api/tensor/explore/${(Number(index) + 19) % 20}`,
            label: 'Previous',
            parameters: [
            ]
          },
          {
            href: `/api/tensor/explore/${collection.slugDisplay}`,
            label: `Buy Floor`,
            parameters: [
            ]
          },
          {
            href: `/api/tensor/explore/${(Number(index) + 1) % 20}`,
            label: 'Next',
            parameters: [
            ]
          },
        ]
      },
      title: collection.name,
      description: 'Explore NFTs on Tensor',
    } satisfies ActionGetResponse,
  );
});
app.openapi(createRoute({
  method: 'post',
  path: '/{collectionSlug}/{amount}',
  tags: ['Tensor Explore Collections'],
  request: {
    params: z.object({
      collectionSlug: z.string().openapi({
        param: {
          name: 'collectionSlug',
          in: 'path',
        },
        type: 'string',
        example: 'madlads',
      }),
      amount: z.string().openapi({
        param: {
          name: 'amount',
          in: 'path',
        },
        type: 'number',
        example: '1.1',
      }),
    }),
    body: actionSpecOpenApiPostRequestBody,
  },
  responses: actionsSpecOpenApiPostResponse,
}), async (c) => {
  const collectionSlug = c.req.param('collectionSlug');
  const amount = c.req.param('amount');
  if (isNaN(Number(amount))) {
    return c.json(
      {
        message: `Given parameters can't used for collection bid`,
      } satisfies ActionError,
      {
        status: 500,
      },
    );
  }
  try {
    const { account } = (await c.req.json()) as ActionPostRequest;
    const collection = await findCollectionBySlug(collectionSlug);
    if (!collection) {
      return c.json(
        {
          message: `Collection ${collectionSlug} not found`,
        } satisfies ActionError,
        {
          status: 422,
        },
      );
    }
    const transaction = await createBidNftTransaction(account, Number(amount), collection.collId);

    if (!transaction) {
      throw new Error('Failed to create transaction');
    }

    const response: ActionPostResponse = {
      transaction: transaction!,
      'message': 'Bid Placed! See tensor.trade for more',
    };

    return c.json(response);
  } catch (e) {
    console.error(
      `Failed to prepare bid collection transaction for ${collectionSlug}`,
      e,
    );
    return c.json(
      {
        message: `Failed to prepare transaction`,
      } satisfies ActionError,
      {
        status: 500,
      },
    );
  }
});

app.openapi(createRoute({
  method: 'post',
  path: '/{index}',
  tags: ['Tensor Explore Collections'],
  request: {
    params: z.object({
      index: z.string().openapi({
        param: {
          name: 'index',
          in: 'path',
        },
        type: 'integer',
        example: '1',
      }),
    }),
    body: actionSpecOpenApiPostRequestBody,
  },
  responses: actionsSpecOpenApiPostResponse,
}), async (c) => {
  const index = c.req.param('index');
  try {
    const { account } = (await c.req.json()) as ActionPostRequest;
    if (isNaN(Number(index))) {
      const collectionSlug = index; // If not integer, treat it as slug
      try {
        const { account } = (await c.req.json()) as ActionPostRequest;
        const collection = await findCollectionBySlug(collectionSlug);
        if (!collection) {
          return c.json(
            {
              message: `Collection ${collectionSlug} not found`,
            } satisfies ActionError,
            {
              status: 422,
            },
          );
        }
        const floorMint = (await getListingsByCollection(collection.collId))
          .mints[0];
        if (!floorMint) {
          return c.json(
            {
              message: `Collection has no listed NFTs`,
            } satisfies ActionError,
            {
              status: 422,
            },
          );
        }

        const transaction = await createBuyNftTransaction(floorMint, account);

        if (!transaction) {
          throw new Error('Failed to create transaction');
        }

        const response: ActionPostResponse = {
          transaction: transaction,
          message: 'Bought! Explore More'
        };

        return c.json(response);
      } catch (e) {
        console.error(
          `Failed to prepare buy floor transaction for ${collectionSlug}`,
          e,
        );
        return c.json(
          {
            message: `Failed to prepare transaction`,
          } satisfies ActionError,
          {
            status: 500,
          },
        );
      }

    }
    const collection = collections[Number(index)];
    if (!collection) {
      return c.json(
        {
          message: `Collection not found`,
        } satisfies ActionError,
        {
          status: 422,
        },
      );
    }
    const uiPrice = formatTokenAmount(
      collection.stats.buyNowPriceNetFees / LAMPORTS_PER_SOL,
    );
    const transaction = await getEmptyTransaction(account);
    if(!transaction){
      throw new Error('Failed to create transaction');
    }
    const response: ActionPostResponse = {
      transaction: transaction,
      links: {
        next: {
          type: 'inline',
          action: {
            'type': 'action',
            'icon': getURL(collection),
            'description': 'Explore NFTs on Tensor',
            'label': 'Tensor Explore',
            'title': collection.name,
            'links': {
              actions: [
                {
                  href: `/api/tensor/explore/${collection.slugDisplay}/{amount}`,
                  label: 'Bid Collection',
                  parameters: [
                    {
                      type: 'number',
                      name: 'amount',
                      label: 'Enter a bid amount (SOL)',
                      min: Number(uiPrice) / 10,
                      max: Number(uiPrice),
                    }
                  ]
                },
                {
                  href: `/api/tensor/explore/${(Number(index) + 19) % 20}`,
                  label: 'Previous',
                  parameters: [
                  ]
                },
                {
                  href: `/api/tensor/explore/${collection.slugDisplay}`,
                  label: `Buy Floor`,
                  parameters: [
                  ]
                },
                {
                  href: `/api/tensor/explore/${(Number(index) + 1) % 20}`,
                  label: 'Next',
                  parameters: [
                  ]
                },
              ]
            }
          },
        }
      }
    }
    return c.json(response);
  } catch (e) {
    console.error(
      `Failed to prepare buy floor transaction for collection`,
      e,
    );
    return c.json(
      {
        message: `Failed to prepare transaction`,
      } satisfies ActionError,
      {
        status: 500,
      },
    );
  }
});




export default app;
