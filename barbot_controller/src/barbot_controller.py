import logging
import threading
import time

from serial import Serial, SerialException

SERIAL_PORT = "/dev/ttyUSB0"
TIME_UNIT = 500  # time resolution of the arduino in ms


class BarbotInitializationError(Exception):
    pass


class BarbotActuationError(Exception):
    pass


class BarbotController:
    def __init__(self):
        """
        Initialize the Barbot instance by setting up the serial connection,
        loading ingredients, configuration, and recipes.
        """
        logging.debug("Initalizing barbot ...")
        self.lock = threading.Lock()
        for i in range(5 * 60):
            try:
                self.serial = Serial(SERIAL_PORT)
                time.sleep(2)  # Wait a bit for serial connection
            except SerialException:
                if i % 10 == 0:
                    logging.warning(
                        "Barbot is not connected to %s, try again ...", SERIAL_PORT
                    )
                time.sleep(1)
                continue
            break
        if not hasattr(self, "serial"):
            logging.error("Failed to initialize Barbot on %s.", SERIAL_PORT)
            raise BarbotInitializationError(
                f"Failed to initialize Barbot on {SERIAL_PORT}."
            )
        self.pump_end_time = time.time()
        logging.debug("Barbot is ready.")

    def __del__(self):
        """
        Destructor for the Barbot instance, ensuring the serial connection is closed.
        """
        if hasattr(self, "serial"):
            self.serial.close()

    def actuate_pumps(self, durations):
        """
        Actuate pumps based on the provided durations.

        Args:
            durations (list): A list of durations for each pump to actuate.
        """
        now = time.time()
        if now < self.pump_end_time:
            remaining_time = self.pump_end_time - now
            logging.warning(
                "Pumps are already being actuated for another %.2f seconds.",
                remaining_time,
            )
            raise BarbotActuationError(
                f"Pumps are already being actuated for another {remaining_time:.2f} seconds."
            )
        logging.debug("Actuating pumps with durations: %s", durations)
        job_str = self._create_pump_job_string(durations)
        try:
            self.serial.write(bytes(job_str, "ascii"))
        except SerialException as exception:
            logging.error("Failed to actuate pumps.")
            raise BarbotActuationError(
                "Failed to actuate pumps: " + str(exception)
            ) from exception
        self.pump_end_time = (
            now + sum(durations) / 1000
        )  # durations are in milliseconds

    def _create_pump_job_string(self, durations):
        job_str = ""
        char_offset = ord("0")
        for pump_duration in durations:
            pump_job_ord = round(pump_duration / TIME_UNIT) + char_offset
            if pump_job_ord > ord("~"):
                raise ValueError(
                    f"Pump duration too large, cannot pump for {pump_duration} ms."
                )
            job_str += chr(pump_job_ord)
        return job_str + "\n"
