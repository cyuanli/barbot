import asyncio
from datetime import datetime, timedelta, timezone
import json
import logging
import os
from json.decoder import JSONDecodeError
from websockets import connect, ConnectionClosed
from zoneinfo import ZoneInfo

from azure.messaging.webpubsubservice import WebPubSubServiceClient
from barbot_controller import BarbotController, BarbotActuationError

logging.basicConfig(level=logging.INFO)

STATUS_SERVICE = None
JOB_SERVICE = None


async def send_status_message(barbot: BarbotController):
    global STATUS_SERVICE
    try:
        STATUS_SERVICE.send_to_all(
            message={
                "timestamp": datetime.now(tz=ZoneInfo("Europe/Zurich")).isoformat(),
                "remainingJobTime": barbot.remaining_job_time(),
            }
        )
    except Exception as e:
        logging.error(f"Failed to send status: {e}")


async def send_status(barbot: BarbotController, interval: int):
    while True:
        await send_status_message(barbot)
        await asyncio.sleep(interval)


async def receive_job(barbot: BarbotController):
    global JOB_SERVICE, STATUS_SERVICE
    token = JOB_SERVICE.get_client_access_token()
    async with connect(token["url"]) as websocket:
        logging.debug("WebSocket connected.")
        while True:
            try:
                message = json.loads(await websocket.recv())
                barbot.actuate_pumps(message["durations"])
                await send_status_message(barbot)
            except JSONDecodeError:
                logging.error("Received invalid JSON.")
            except BarbotActuationError as exception:
                logging.error(f"Failed to actuate pumps: {exception}")
            except ConnectionClosed:
                logging.error("WebSocket connection closed.")
                break


async def start_tasks(barbot: BarbotController):
    send_status_task = asyncio.create_task(send_status(barbot, 2))
    receive_job_task = asyncio.create_task(receive_job(barbot))
    await asyncio.gather(send_status_task, receive_job_task)


def main():
    try:
        connection_string = os.environ["PUBSUB_CONNECTION_STRING"]
    except KeyError:
        logging.error("No connection string.")
        raise EnvironmentError("No connection string.")
    global JOB_SERVICE, STATUS_SERVICE
    STATUS_SERVICE = WebPubSubServiceClient.from_connection_string(
        connection_string, "status"
    )
    JOB_SERVICE = WebPubSubServiceClient.from_connection_string(
        connection_string, "job"
    )
    barbot = BarbotController()
    try:
        asyncio.run(start_tasks(barbot))
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
