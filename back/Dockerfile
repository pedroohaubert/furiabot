FROM python:3.11-slim
WORKDIR /app
COPY ./requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt
COPY . /app
ENV HOST=0.0.0.0
ENV PORT=8000
EXPOSE ${PORT}
CMD uvicorn main:app --host ${HOST} --port ${PORT}