import socket
import sys

def check_connection(host, port):
    print(f"Resolving {host}...")
    try:
        ip = socket.gethostbyname(host)
        print(f"IP: {ip}")
    except Exception as e:
        print(f"DNS Error: {e}")
        return

    print(f"Connecting to {host}:{port}...")
    try:
        with socket.create_connection((host, port), timeout=10) as sock:
            print("Successfully connected!")
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    host = "smtp.gmail.com"
    port = 587
    if len(sys.argv) > 1:
        host = sys.argv[1]
    if len(sys.argv) > 2:
        port = int(sys.argv[2])
    
    check_connection(host, port)
