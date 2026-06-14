import psycopg
from urllib.parse import urlparse

url = 'postgresql://b2b_user:pkXcAPK8w02PusDtjZ3FHWa7iGmi7Qmr@dpg-d7dsgt7lk1mc73evsht0-a.oregon-postgres.render.com:5432/b2b_db_72l1'
parsed = urlparse(url)
print('URL:', url)
print('Hostname:', parsed.hostname)
print('Port:', parsed.port)
print('Database:', parsed.path.lstrip('/'))
print('Username:', parsed.username)

try:
    conn = psycopg.connect(url, sslmode='require')
    print('CONNECTED')
    conn.close()
except Exception as e:
    print('ERROR:', type(e).__name__, e)
