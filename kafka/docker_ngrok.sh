#bin/bash
docker run --net=host -it -e NGROK_AUTHTOKEN=1b1YqgtJgh6CFrOHvtW2FvpCvXf_5KBtDJHLWhrgxCs3vhm5s ngrok/ngrok:latest http --url=dashing-skunk-nominally.ngrok-free.app 8066
