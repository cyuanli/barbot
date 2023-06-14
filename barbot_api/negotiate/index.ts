import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getWebPubSubClient } from "../utils";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const client = await getWebPubSubClient(context, 'status');
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
