const unsigned int PUMP_TIME_UNIT = 500;
const unsigned int N_PINS = 7;
const unsigned int pins[] = { 12, 11, 10, 9, 8, 7, 6 };
const unsigned int LED_GREEN = 2;

int job[N_PINS];

void print() {
  Serial.println();
}

template<typename T, typename... Types>
void print(T first, Types... other) {
  Serial.print(first);
  print(other...);
}

void setup() {
  for (int i = 0; i < N_PINS; ++i) {
    pinMode(pins[i], OUTPUT);
  }
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  const bool received_job = wait_for_job();
  if (received_job) {
    run_job();
    clear_buffer();
  }
}

bool wait_for_job() {
  print("Waiting for job.");
  digitalWrite(LED_GREEN, HIGH);
  while (!Serial.available()) delay(10);
  digitalWrite(LED_GREEN, LOW);
  unsigned int pos = 0;
  while (Serial.available()) {
    const char data = Serial.read();
    if (data == '\n') {
      break;
    }
    job[pos] = data - '0';
    if (job[pos] < 0 || job[pos] > 60) {
      print("Instruction not between 0 and 60. Received: ", (int)data);
      return false;
    }
    ++pos;
    delay(10);
  }
  if (pos != N_PINS) {
    print("Job has wrong number of instructions: ", pos);
    return false;
  }
  print("Received valid job.");
  return true;
}

bool run_job() {
  print("Running job.");
  digitalWrite(LED_BUILTIN, HIGH);
  for (int i = 0; i < N_PINS; ++i) {
    if (job[i] > 0) {
      const int t = job[i] * PUMP_TIME_UNIT;
      print("Actuating pump ", i, " for ", t, " ms");
      digitalWrite(pins[i], HIGH);
      delay(t);
      digitalWrite(pins[i], LOW);
    }
  }
  digitalWrite(LED_BUILTIN, LOW);
  print("Job done.");
  return true;
}

bool clear_buffer() {
  if (Serial.available()) {
    while (Serial.available()) {
      print("Cleared from buffer: ", Serial.read());
      delay(10);
    }
    return true;
  }
  return false;
}