import subprocess

def run_command(command):
    subprocess.run(command, shell=True, check=True)

name = input("Enter the YouTube URL: ")
run_command = ["./yt-dlp_macos", name]
run_command = ("python decoder.py *.webm")


