import psycopg

url = 'postgresql://b2b_user:pkXcAPK8w02PusDtjZ3FHWa7iGmi7Qmr@dpg-d7dsgt7lk1mc73evsht0-a.oregon-postgres.render.com:5432/b2b_db_72l1'
print('url=', url)
try:
    conn = psycopg.connect(url, sslmode='require')
    print('connected')
    conn.close()
except Exception as e:
    import traceback
    traceback.print_exc()
