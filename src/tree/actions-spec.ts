import { OpenAPIHono } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { actionsSpecOpenApiGetResponse } from './openapi';
import { html } from 'hono/html';
import { Context, Env, TypedResponse } from 'hono';
const app = new OpenAPIHono();
app.openapi(createRoute({
    method: 'get',
    path: '/actions.json',
    responses: actionsSpecOpenApiGetResponse,
}), async (c) => {
    return c.json({
        rules: [
            {
                "pathPattern": "/api/tensor/explore/**",
                "apiPath": "https://tensorexplore.qseckn.workers.dev/api/tensor/explore/**",
            },
            {
                "pathPattern": "/api/tensor/explore/",
                "apiPath": "https://tensorexplore.qseckn.workers.dev/api/tensor/explore/",
            },
            {
                "pathPattern": "/api/tensor/explore/**/**",
                "apiPath": "https://tensorexplore.qseckn.workers.dev/api/tensor/explore/**/**",
            },
        ]
    });
});
const homepageHTML = html `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Rock (1996)</title>
    <meta property="og:title" content="The Rock" />
    <meta property="og:type" content="video.movie" />
    <meta property="og:url" content="https://www.imdb.com/title/tt0117500/" />
    <meta property="og:image" content="https://ia.media-imdb.com/images/rock.jpg" />
</head>
<body>
    <h1>Welcome to Solana Actions API</h1>
    <p>This is a sample homepage for the Solana Actions API.</p>
    <p>You can find the actions.json file at <a href="/actions.json">/actions.json</a>.</p>
</body>
</html>
`;
app.openapi(createRoute({
    method: 'get',
    path: '/',
    responses: {
        200: {
            description: 'Successful response',
            content: {
                'text/html': {
                    schema: {
                        type: 'string'
                    }
                }
            }
        }
    }
}), (c: Context<Env,'/'> ,{}) => {
    return c.html('<h1>Solana Actions - Tensor Explore visit <a href="/api/tensor/explore/">here</a></h1>') as unknown as TypedResponse<{}, 200, string>;
});
export default app;
