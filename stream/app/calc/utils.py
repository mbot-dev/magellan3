from datetime import datetime, timedelta
import calendar

# マスター収載日や廃止日のフォーマット
def now_as_date(format='%Y%m%d'):
    now = datetime.now()
    return now.strftime(format)

def now_as_datetime(format='%Y-%m-%dT%H:%M:%S'):
    now = datetime.now()
    return now.strftime(format)

# magellan 電子カルテの created_at yyyy-mm-ddThh:mm:ss+09:00 -> datetime object に変換する
def datetime_from_created_at(created_at):
    return  datetime.strptime(created_at, '%Y-%m-%dT%H:%M:%S%z')

# 同一日の開始と終了
def get_day_window(created_at):
    dt = datetime_from_created_at(created_at)
    start = dt.replace(hour=0, minute=0, second=0, microsecond=0).strftime('%Y-%m-%dT%H:%M:%S%z')
    end = dt.replace(hour=23, minute=59, second=59, microsecond=999999).strftime('%Y-%m-%dT%H:%M:%S%z')
    return start, end

# 同一週の開始と終了
def get_week_window(created_at):
    dt = datetime_from_created_at(created_at)
    days = (dt.weekday() + 1) % 7
    start = (dt - timedelta(days=days)).replace(hour=0, minute=0, second=0, microsecond=0).strftime('%Y-%m-%dT%H:%M:%S%z')
    end = (dt + timedelta(days=6 - days)).replace(hour=23, minute=59, second=59, microsecond=999999).strftime('%Y-%m-%dT%H:%M:%S%z')
    return start, end

# 同一月の開始と終了
def get_month_window(created_at):
    dt = datetime_from_created_at(created_at)
    start = dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0).strftime('%Y-%m-%dT%H:%M:%S%z')
    end = dt.replace(day=calendar.monthrange(dt.year, dt.month)[1], hour=23, minute=59, second=59, microsecond=999999).strftime('%Y-%m-%dTT%H:%M:%S%z')
    return start, end

# 確定日の日
def day_from_created_at(created_at):
    return datetime_from_created_at(created_at).day

def find_item(lst, key, value):
    return next((dic for dic in lst if dic.get(key) == value), None)

def find_index(lst, key, value):
    try:
        index = next(i for i, dic in enumerate(lst) if dic.get(key) == value)
        return index
    except StopIteration:
        return -1
