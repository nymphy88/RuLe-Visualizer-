# backend/timeout.py
# [cite: 2025-11-05]

import signal
import functools

class TimeoutError(Exception):
    pass

def timeout(seconds):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            def handler(signum, frame):
                raise TimeoutError(f"Function {func.__name__} timed out after {seconds} seconds")

            # Set the signal handler and alarm
            signal.signal(signal.SIGALRM, handler)
            signal.alarm(seconds)

            try:
                result = func(*args, **kwargs)
            finally:
                # Disable the alarm
                signal.alarm(0)
            return result
        return wrapper
    return decorator

# Example usage:
if __name__ == '__main__':
    import time

    @timeout(5)
    def long_running_function():
        print("Starting long running function...")
        time.sleep(10)
        print("Finished long running function.")

    try:
        long_running_function()
    except TimeoutError as e:
        print(e)

    @timeout(5)
    def short_running_function():
        print("Starting short running function...")
        time.sleep(2)
        print("Finished short running function.")
        return "Success"

    try:
        result = short_running_function()
        print(f"Result: {result}")
    except TimeoutError as e:
        print(e)
