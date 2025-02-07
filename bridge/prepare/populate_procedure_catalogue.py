import uuid
import csv
from datetime import datetime
import asyncio
import asyncpg

async def get_column_spec(conn, table):
    sql = 'select column_name, data_type from information_schema.columns where table_name = $1'
    rows = await conn.fetch(sql, table)
    return [(row.get('column_name'), row.get('data_type')) for row in rows]

async def insert(conn, table, obj):
    column_spec = await get_column_spec(conn, table)
    insert_list = list()
    dollar_list = list()
    values = list()
    index = 1;
    for spec in column_spec:
        # print(spec)
        cn = spec[0]  # column_name
        ct = spec[1]  # column_type
        value = obj.get(cn, None)
        
        if cn == 'group':
            insert_list.append(f'"{cn}"')
        else:
            insert_list.append(cn)

        dollar_list.append(f'${index}')  # $1,$2...

        if ct == 'integer':
            values.append(int(value)) if value is not None else values.append(0)
        elif ct == 'bigint':
            values.append(int(value)) if value is not None else values.append(0)
        elif ct == 'double precision':
            values.append(float(value)) if value is not None else values.append(0)
        elif ct == 'boolean':
            values.append(bool(value)) if value is not None else values.append(False)
        elif ct.startswith('timestamp'):
            if value is None:
                values.append(datetime.now())
            elif isinstance(value, datetime):
                values.append(value)
            elif isinstance(value, str):
                values.append(datetime.strptime(value, '%Y-%m-%dT%H:%M:%S'))  # str to datetime
        else:
            # jsonb
            values.append(value) if value is not None else values.append('')  # empty ??
        index += 1

    inserts = ','.join(insert_list)
    dollars = ','.join(dollar_list)

    sql = f'insert into {table}({inserts}) values({dollars})'

    return await conn.execute(sql, *values)

async def main(path, dsn):
    conn = await asyncpg.connect(dsn)
    async with conn.transaction():

        with open(path, newline='', encoding='utf-8') as csv_file:
            read_csv = csv.reader(csv_file, delimiter=',')
            for row in read_csv:
                rec = dict()
                rec['id'] = str(uuid.uuid4())  # id
                rec['entity'] = row[0]  # entity
                rec['entity_order'] = row[1]  # entity_order
                rec['name'] = row[2]
                rec['short_name'] = row[3]
                if len(row) == 5:
                    rec['category'] = row[4]
                else:
                    rec['category'] = ''

                await insert(conn, 'procedure_catalogue', rec)
    
    await conn.close()


if __name__ == "__main__":
    path = 'procedure_catalogue.csv'
    dsn = "postgresql://large:large_user@large:5432/large"
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(main(path, dsn))
    except KeyboardInterrupt:
        pass
