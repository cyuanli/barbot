FROM python:3.10

WORKDIR /app
COPY src /app
COPY pyproject.toml /app/

RUN pip3 install --upgrade pip
RUN pip3 install poetry
RUN poetry config virtualenvs.create false
RUN poetry install --only main

ENV FLASK_APP=/app/api.py

CMD ["flask", "run", "--host=0.0.0.0"]
