import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { WebPubSubServiceClient } from "@azure/web-pubsub";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger: negotiate');

    const connectionString = process.env.PUBSUB_CONNECTION_STRING;
    if (!connectionString) {
        context.log.error('No connection string.');
        context.res = {
            status: 500,
            body: { "message": "No connection string" }
        };
        return;
    }

    const client = new WebPubSubServiceClient(connectionString, 'status');
    try {
        const userId = req.headers['x-ms-client-principal-name'] || '';
        const tokenResponse = await client.getClientAccessToken({ userId: userId });

        context.res = {
            status: 200,
            body: tokenResponse.url
        };
    } catch (e) {
        context.log.error(`Failed to get connection URL: ${e}`);
        context.res = {
            status: 500,
            body: { "message": "Failed to get connection URL" }
        };
    }

};

export default httpTrigger;
