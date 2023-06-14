import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { WebPubSubServiceClient } from "@azure/web-pubsub";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger: job');

    const reqBody = req.body;

    if (!reqBody) {
        context.res = {
            status: 400,
            body: { "message": "Invalid JSON" }
        };
        return;
    }

    const durations = reqBody.durations;
    if (!durations) {
        context.res = {
            status: 400,
            body: { "message": "Missing 'durations' in JSON body" }
        };
        return;
    }

    const connectionString = process.env.PUBSUB_CONNECTION_STRING;
    if (!connectionString) {
        context.log.error('No connection string.');
        context.res = {
            status: 500,
            body: { "message": "No connection string" }
        };
        return;
    }

    const client = new WebPubSubServiceClient(connectionString, 'job');

    try {
        await client.sendToAll({ "durations": durations });
        context.res = {
            status: 200,
            body: { "message": "Message sent" }
        };
    } catch (e) {
        context.log.error(`Failed to send message: ${e}`);
        context.res = {
            status: 500,
            body: { "message": "Failed to send message" }
        };
    }
};

export default httpTrigger;
