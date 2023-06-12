import asyncio
import json
import logging
import os
from json.decoder import JSONDecodeError
from websockets import connect, ConnectionClosed

from azure.messaging.webpubsubservice import WebPubSubServiceClient

from barbot_controller import BarbotController, BarbotActuationError


async def connect_pubsub(url: str):
    async with connect(url) as websocket:
        logging.debug("WebSocket connected.")
        barbot = BarbotController()
        while True:
            try:
                message = json.loads(await websocket.recv())
                barbot.actuate_pumps(message["durations"])
            except JSONDecodeError:
                logging.error("Received invalid JSON.")
            except BarbotActuationError as exception:
                logging.error("Failed to actuate pumps: %s", exception)
            except ConnectionClosed:
                logging.error("WebSocket connection closed.")
                break


def main(connection_string: str):
    service = WebPubSubServiceClient.from_connection_string(
        connection_string, hub="hub"
    )
    token = service.get_client_access_token()
    try:
        asyncio.run(connect_pubsub(token["url"]))
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    try:
        connection_string = os.environ["PUBSUB_CONNECTION_STRING"]
    except KeyError:
        logging.error("No connection string.")
        raise EnvironmentError("No connection string.")
    main(connection_string)
