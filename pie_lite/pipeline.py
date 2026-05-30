import sys

from .crm import process_new_leads
from .server import start_server


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m pie_lite.pipeline [process|serve|start]")
        sys.exit(1)

    command = sys.argv[1]

    if command == "process":
        print("Processing new leads...")
        new = process_new_leads()
        print(f"Added {len(new)} new leads.")
    elif command == "serve":
        start_server()
    elif command == "start":
        print("Processing new leads...")
        new = process_new_leads()
        print(f"Added {len(new)} new leads.")
        print("Starting dashboard server...")
        start_server()
    else:
        print(f"Unknown command: {command!r}")
        print("Usage: python -m pie_lite.pipeline [process|serve|start]")
        sys.exit(1)


if __name__ == "__main__":
    main()
