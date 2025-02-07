from datetime import datetime
import asyncpg
import simplejson as json

upcert_ql = """
    insert into {}({}) values({}) 
    on conflict(id)
    do
    update set {}
"""

def add_quote(stri):
    return f'\'{stri}\''

async def init_connection(conn):
    await conn.set_type_codec("jsonb", schema="pg_catalog", encoder=json.dumps, decoder=json.loads)

async def create_master_pool(master):
    op = await asyncpg.create_pool(dsn=master, init=init_connection)
    def _inner():
        return op
    return _inner

async def create_karte_pool(karte):
    mp = await asyncpg.create_pool(dsn=karte, init=init_connection)
    def _inner():
        return mp
    return _inner

async def get_column_spec(conn, table):
    sql = 'select column_name, data_type from information_schema.columns where table_name = $1'
    rows = await conn.fetch(sql, table)
    return [(row.get('column_name'), row.get('data_type'), row.get('column_default')) for row in rows]

async def get_column_names(conn, table):
    sql = 'select column_name from information_schema.columns where table_name = $1'
    rows = await conn.fetch(sql, table)
    return [row.get('column_name') for row in rows]

async def get_select_columns(conn, table, alias):
    columns = await get_column_names(conn, table)
    return ','.join([f'{alias}.{c}' for c in columns])

async def upcert2(conn, table, obj):
    column_spec = await get_column_spec(conn, table)
    column_len = len(column_spec)
    insert_list = list()
    dollar_list = list()
    set_list = list()
    values = list()
    index = 1;
    for spec in column_spec:
        cn = spec[0]
        ct = spec[1]
        insert_list.append(cn)
        dollar_list.append(f'${index}')
        set_list.append(f'{cn}=${index}')
        value = obj.get(cn)
        if ct == 'integer':
            value = int(value) if value is not None else 0
            values.append(value)
        elif ct == 'text':
            value = str(value) if value is not None else ''
            values.append(value)
        else:
            value = value if value is not None else ''
            values.append(f'{value}')
        index += 1

    inserts = ','.join(insert_list)
    dollars = ','.join(dollar_list)
    sets = ','.join(set_list)
    values2 = values
    id_ = obj.get('id')
    sql = f'insert into {table}({inserts}) values({dollars}) on conflict(id) do update set {sets}'
    return await conn.execute(sql, *values2)

async def insert(conn, table, obj):
    column_spec = await get_column_spec(conn, table)
    insert_list = list()
    dollar_list = list()
    values = list()
    index = 1;
    for spec in column_spec:
        cn = spec[0]  # column_name
        ct = spec[1]  # column_type
        value = obj.get(cn)
        if cn == 'group':
            insert_list.append(f'"{cn}"')
        else:
            insert_list.append(cn)
        dollar_list.append(f'${index}')  # $1,$2...
        if ct == 'integer':
            values.append(int(value)) if value is not None else values.append(0)
        elif ct == 'bigint':  # lastmodified
            values.append(int(value)) if value is not None else values.append(0)
        elif ct == 'double precision':  # claim item value.. ToDo drop
            values.append(float(value)) if value is not None else values.append(0)
        elif ct == 'boolean':
            values.append(bool(value)) if value is not None else values.append(False)
        elif ct == 'text':
            value = str(value) if value is not None else ''
            values.append(value)
        else:
            values.append(f'{value}') if value is not None else values.append('')  # empty ??
        index += 1

    inserts = ','.join(insert_list)
    dollars = ','.join(dollar_list)
    sql = f'insert into {table}({inserts}) values({dollars})'
    return await conn.execute(sql, *values)

async def update_by_id(conn, table, id_, obj):
    id_quoute = add_quote(id_)
    column_spec = await get_column_spec(conn, table)
    set_list = list()
    values = list()
    index = 1;
    for spec in column_spec:
        cn = spec[0]
        ct = spec[1]
        value = obj.get(cn)
        if value is None:
            continue
        set_list.append(f'{cn}=${index}')  # $1...
        if ct == 'integer':
            values.append(int(value))
        elif ct == 'bigint':
            values.append(int(value))
        elif ct == 'double precision':
            values.append(float(value))
        elif ct == 'boolean':
            values.append(bool(value))
        elif ct == 'text':
            values.append(str(value))
        else:
            values.append(value)
        index += 1
    
    set_columns = ','.join(set_list)
    sql = f'update {table} set {set_columns} where id = {id_quoute}'
    # print(f'update_by_id: {sql}')
    return await conn.execute(sql, *values)

async def delete_by_id(conn, table, id_):
    sql = f'delete from {table} where id = $1'
    return await conn.execute(sql, id_)

async def upcert(conn, table, obj):
    # Manual Upcert (Not use PG's)
    id_ = obj.get('id')
    sql = f'select id from {table} where id = $1'
    stored_id = await conn.fetchval(sql, id_)
    if bool(stored_id):
        return await update_by_id(conn, table, id_, obj)
    else:
        return await insert(conn, table, obj)
    
async def to_safe_dict(conn, table, obj):
    safe = dict()
    column_names = await get_column_names(conn, table)
    for name in column_names:
        value = obj.get(name)
        if value is not None:
            safe[name] = value
    return safe

def now_as_str():
    return datetime.now().strftime('%Y-%m-%dT%H:%M:%S%z')

