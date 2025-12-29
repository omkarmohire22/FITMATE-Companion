import http.client
import json

conn = http.client.HTTPConnection("localhost", 8000, timeout=10)
payload = json.dumps({
    "name": "Omkar Mohire",
    "email": "mohireomkar19@gmail.com",
    "password": "password123",
    "role": "trainee"
})
headers = {"Content-Type": "application/json"}
try:
    conn.request("POST", "/api/auth/register", payload, headers)
    res = conn.getresponse()
    print(res.status, res.reason)
    body = res.read()
    try:
        print(body.decode())
    except Exception:
        print(body)
except Exception as e:
    print("Request error:", e)
finally:
    conn.close()
