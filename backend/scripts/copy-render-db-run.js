process.env.REMOTE_DATABASE_URL = 'postgres://b2b_user:pkXcAPK8w02PusDtjZ3FHWa7iGmi7Qmr@dpg-d7dsgt7lk1mc73evsht0-a.oregon-postgres.render.com:5432/b2b_db_72l1';
process.env.LOCAL_DATABASE_URL = 'postgres://postgres:Dhirendra%235@localhost:5432/myapp_db';
require('./copy-render-db');
