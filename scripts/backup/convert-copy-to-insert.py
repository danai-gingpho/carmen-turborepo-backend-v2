import re

def parse_copy_line(line):
    # ตัวอย่าง: COPY "B01".tb_unit (id, name, ...) FROM stdin;
    m = re.match(r'^COPY\s+([^\s]+)\s+\(([^)]+)\)\s+FROM stdin;', line)
    if not m:
        return None, None
    table = m.group(1)
    columns = [col.strip() for col in m.group(2).split(',')]
    return table, columns

def sql_value(val):
    if val == r'\N':
        return 'NULL'
    # escape single quote
    return "'" + val.replace("'", "''") + "'"

def convert_copy_to_insert(input_path, output_path):
    with open(input_path, encoding='utf-8') as fin, open(output_path, 'w', encoding='utf-8') as fout:
        in_copy = False
        table = None
        columns = []
        rows = []
        for line in fin:
            line = line.rstrip('\n')
            if not in_copy:
                table, columns = parse_copy_line(line)
                if table:
                    in_copy = True
                    rows = []
                continue
            if line == r'\.':
                # write INSERTs
                if table and columns:
                    for row in rows:
                        values = ', '.join(sql_value(val) for val in row)
                        fout.write(f'INSERT INTO {table} ({", ".join(columns)}) VALUES ({values});\n')
                in_copy = False
                continue
            # in copy data
            row = line.split('\t')
            rows.append(row)

if __name__ == '__main__':
    convert_copy_to_insert(
        'blueledgers.backup.sql',  # ไฟล์ input
        'blueledgers_insert.sql'   # ไฟล์ output
    )