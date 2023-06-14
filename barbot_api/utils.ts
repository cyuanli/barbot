import { Context } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { WebPubSubServiceClient } from "@azure/web-pubsub";

const getContainer = (context: Context, containerId: string) => {
    const endpoint = process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_DB_KEY;
    if (!endpoint || !key) {
        context.log.error("No Cosmos DB endpoint or key.");
        context.res = {
            status: 500,
            body: { "message": "No Cosmos DB endpoint or key." },
        };
        return;
    }
    const client = new CosmosClient({ endpoint, key });
    const database = client.database("barbotDB");
    return database.container(containerId);
}

export const getRecipes = async function (context: Context): Promise<any> {
    const recipesContainer = getContainer(context, "recipes");
    const { resources: recipes } = await recipesContainer.items
        .query("SELECT * from c")
        .fetchAll();
    return recipes;
}

export const getRecipe = async function (context: Context, recipeId: string): Promise<any> {
    const recipesContainer = getContainer(context, "recipes");
    const { resource: recipe } = await recipesContainer.item(recipeId, recipeId).read();
    return recipe;
}

export const getConfig = async function (context: Context): Promise<any> {
    const recipesContainer = getContainer(context, "configs");
    const { resource: config } = await recipesContainer.item("default", "default").read();
    return config;
}

export const getWebPubSubClient = async function (context: Context, hub: string): Promise<any> {
    const connectionString = process.env.PUBSUB_CONNECTION_STRING;
    if (!connectionString) {
        context.log.error('No connection string.');
        context.res = {
            status: 500,
            body: { "message": "No connection string" }
        };
        return;
    }
    return new WebPubSubServiceClient(connectionString, hub);
}
