from decimal import Decimal
import asyncpg
import simplejson as json


def add_quote(stri):
    return f"'{stri}'"


async def init_connection(conn):
    await conn.set_type_codec(
        "jsonb", schema="pg_catalog", encoder=json.dumps, decoder=json.loads
    )


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
    sql = "select column_name, data_type from information_schema.columns where table_name = $1"
    rows = await conn.fetch(sql, table)
    return [(row.get("column_name"), row.get("data_type")) for row in rows]


async def get_column_names(conn, table):
    sql = "select column_name from information_schema.columns where table_name = $1"
    rows = await conn.fetch(sql, table)
    return [row.get("column_name") for row in rows]


async def get_select_columns(conn, table, alias):
    columns = await get_column_names(conn, table)
    return ",".join([f"{alias}.{c}" for c in columns])


async def insert(conn, table, obj):
    column_spec = await get_column_spec(conn, table)
    insert_list = list()
    dollar_list = list()
    values = list()
    index = 1
    for spec in column_spec:
        # print(spec)
        cn = spec[0]  # column_name
        ct = spec[1]  # column_type
        value = obj.get(cn)

        if cn == "group":
            insert_list.append(f'"{cn}"')
        else:
            insert_list.append(cn)

        dollar_list.append(f"${index}")  # $1,$2...

        if ct == "integer":
            values.append(int(value)) if value is not None else values.append(0)
        elif ct == "bigint":
            values.append(int(value)) if value is not None else values.append(0)
        elif ct == "double precision":
            values.append(float(value)) if value is not None else values.append(0)
        elif ct == "boolean":
            values.append(bool(value)) if value is not None else values.append(False)
        elif ct == "numeric":
            # Not work
            values.append(Decimal(value)) if value is not None else values.append(
                Decimal("0")
            )
        else:
            values.append(value) if value is not None else values.append("")  # empty ??
        index += 1

    inserts = ",".join(insert_list)
    dollars = ",".join(dollar_list)

    sql = f"insert into {table}({inserts}) values({dollars})"

    return await conn.execute(sql, *values)


async def update_by_id(conn, table, id_, obj):
    id_quoute = add_quote(id_)
    column_spec = await get_column_spec(conn, table)
    set_list = list()
    values = list()
    index = 1
    for spec in column_spec:
        cn = spec[0]
        ct = spec[1]

        value = obj.get(cn)
        if value is None:
            continue

        set_list.append(f"{cn}=${index}")  # $1...

        if ct == "integer":
            values.append(int(value))
        elif ct == "bigint":
            values.append(int(value))
        elif ct == "double precision":
            values.append(float(value))
        elif ct == "numeric":
            # Not work
            values.append(Decimal(value))
        elif ct == "boolean":
            values.append(bool(value))
        else:
            values.append(value)

        index += 1

    set_columns = ",".join(set_list)

    sql = f"update {table} set {set_columns} where id = {id_quoute}"

    return await conn.execute(sql, *values)


async def delete_by_id(conn, table, id_):
    sql = f"delete from {table} where id = $1"
    return await conn.execute(sql, id_)


async def upcert(conn, table, obj):
    # Manual Upcert (Not use PG's)
    id_ = obj.get("id")
    sql = f"select id from {table} where id = $1"
    val = await conn.fetchval(sql, id_)
    if val is None:
        await insert(conn, table, obj)
    else:
        await update_by_id(conn, table, id_, obj)


async def to_safe_dict(conn, table, obj):
    safe = dict()
    column_names = await get_column_names(conn, table)
    for name in column_names:
        value = obj.get(name)
        if value is not None:
            safe[name] = value
    return safe
