FROM python:3.12-slim-bookworm
RUN mkdir /bridge
WORKDIR /bridge
COPY requirements.txt .
RUN /usr/local/bin/python -m pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 6201
