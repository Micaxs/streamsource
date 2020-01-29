#!/bin/bash

file=$1

# Define the location for the MP4 and HLS files.
output=/home/streaming/vod/$file;

# Update database that processing started
curl -X POST http://127.0.0.1:3000/cb/$file/process -H "Content-Type: application/json" -d '{"status": "PROCESSING"}';

# HLS Path
rm -rf $output;
mkdir $output;
chmod 777 $output;
playlist_path=/home/streaming/vod/$file/playlist.m3u8;
ts_path=/home/streaming/vod/$file/stream_%05d.ts;

# Convert the recorded stream to mp4 format, making it available via HTTP
/usr/bin/ffmpeg -y -i $output.flv -acodec copy -vcodec copy $output/$file.mp4 &
wait $!;

# Covert MP4 to HLS Fragments ( /home/streaming/vod/FILE/playlist.m3u8 || /home/streaming/vod/FILE/*.ts
/usr/bin/ffmpeg -i $output/$file.mp4 -max_muxing_queue_size 1000 -c:a copy -c:v copy -flags -global_header -map 0 -f segment -segment_list $playlist_path -segment_time 10 -segment_format mpegts $ts_path &
wait $!;

# Generate a thumbnail
/usr/bin/ffmpeg -i $output/$file.mp4 -vf "thumbnail,scale=1280:720" -frames:v 1 $output/$file.jpg &
wait $!;

# Move FLV
mv $output.flv $output/$file.flv;

# Update database that processing finished
curl -X POST http://127.0.0.1:3000/cb/$file/process -H "Content-Type: application/json" -d '{"status": "DONE"}';
