-- Date: 2023/11/09 15:00:00
-- ALTER TABLE master_disease ALTER COLUMN tokutei_shikkan TYPE integer USING tokutei_shikkan::integer;
-- select code, name, col_043 from master_procedure where tensu_kbn ='A' and col_043 = '4' and hosp_clinic_flg != 1 and in_out_flg != 1 order by tensu_kbn, kbn_no, kbn_eda;

-- 病名マスター
create table master_disease (
    col_01 integer,
    col_02 char(1) default 'B',
    code varchar(255),
    change_to varchar(255),            -- 移行先
    col_05 integer,
    name varchar(255),
    col_07 integer,
    short_name varchar(255),
    col_09 integer,
    kana varchar(255),
    col_11 varchar(255),
    col_12 varchar(255),
    col_13 varchar(255),
    icd_10_1 varchar(255),
    icd_10_2 varchar(255),
    icd_10_1_2013 varchar(255),
    icd_10_2_2013 varchar(255),
    col_18 varchar(255) default '',
    single_use varchar(255),            -- 単独使用禁止
    col_20 varchar(255),                -- 保険請求区分
    tokutei_shikkan varchar(255),        -- 特定疾患
    onset_at varchar(255),              -- 収載年月日
    updated_at varchar(255),             -- 変更年月日
    discontinued_at varchar(255),        -- 廃止年月日
    col_25 varchar(255),
    col_26 varchar(255),
    col_27 varchar(255),
    col_28 varchar(255),
    col_29 varchar(255),
    col_30 varchar(255),
    col_31 varchar(255),
    col_32 varchar(255),
    col_33 varchar(255),
    col_34 varchar(255),
    col_35 varchar(255),
    col_36 varchar(255),
    col_37 varchar(255),
    col_38 varchar(255),
    col_39 varchar(255),
    col_40 varchar(255) default '',
    col_41 varchar(255) default '',
    col_42 varchar(255),
    col_43 varchar(255),
    col_44 varchar(255),
    col_45 varchar(255),
    col_46 varchar(255)
);

-- 修飾語マスター
create table master_modifier (
    col_01 integer,
    col_02 char(1) default 'Z',
    code varchar(255),
    col_04 varchar(255) default '',
    col_05 varchar(255) default '',
    col_06 integer,
    name varchar(255),
    col_08 varchar(255) default '',
    col_09 integer,
    kana varchar(255),
    col_11 varchar(255) default '',
    col_12 varchar(255),
    col_13 varchar(255),
    onset_at varchar(255),
    updated_at varchar(255),
    discontinued_at varchar(255),
    col_17 varchar(255),
    col_18 varchar(255),
    col_19 varchar(255)
);

-- 診療行為マスター
create table master_procedure (    
    col_001 integer,  -- 変更区分
    col_002 char(1) default 'S',  -- マスター種別
    code varchar(255),  -- 診療行為コード
    col_004 integer,
    name varchar(255),  -- 省略漢字名称
    col_006 integer,
    kana varchar(255),  -- 省略カナ名称
    unit_code varchar(255),  -- データ規格コード
    col_009 integer,
    unit varchar(255),  -- データ規格漢字名称
    tensu_type varchar(255),  -- 点数区分
    tensu varchar(255),  -- 点数 numeric(9,2)
    in_out_flg varchar(255),  --入外適用区分
    col_014 varchar(255),  -- 後期高齢者適用区分   
    claim_class varchar(255),  -- 点数欄集計先識別
    col_016 varchar(255),  -- 包括対象検査 １：血液化学検査の包括項目 etc
    col_017 varchar(255) default '0',
    col_018 varchar(255),
    hosp_clinic_flg varchar(255),  -- 病院診療所区分 1,4 以外
    col_020 varchar(255),
    col_021 varchar(255),
    col_022 varchar(255),
    col_023 varchar(255),
    col_024 varchar(255) default '0',
    col_025 varchar(255),  -- 傷病名関連区分
    col_026 varchar(255) default '0',
    col_027 varchar(255),
    col_028 varchar(255),
    col_029 varchar(255),  -- 医薬品関連区分
    col_030 varchar(255),  -- きざみ値識別
    col_031 varchar(255),  -- 下限値 to Decimal
    col_032 varchar(255),  -- 上限値 to Decimal
    col_033 varchar(255),  -- データ規格コード(unit)
    col_034 varchar(255),  -- きざみ点数
    col_035 varchar(255),  -- 上限エラー処理
    col_036 varchar(255),
    col_037 varchar(255),
    col_038 varchar(255),  -- 注加算コード
    col_039 varchar(255),  -- 注加算通番
    col_040 varchar(255),
    col_041 varchar(255),  -- 下限年齢
    col_042 varchar(255),  -- 上限年齢  
    col_043 varchar(255),  -- 時間外加算
    col_044 varchar(255),
    col_045 varchar(255),
    col_046 varchar(255),  -- 処置乳幼児区分            
    col_047 varchar(255),
    col_048 varchar(255),
    col_049 varchar(255),
    col_050 varchar(255),  -- 検査等実施判断区分
    col_051 varchar(255),  -- 検査等実施判断グループ
    col_052 varchar(255),  -- 逓減対象区分
    col_053 varchar(255),
    col_054 varchar(255),
    col_055 varchar(255),
    col_056 varchar(255),  -- 外来管理加算区分
    col_057 varchar(255),  -- 旧点数
    col_058 varchar(255),
    col_059 varchar(255),
    col_060 varchar(255),
    col_061 varchar(255),
    col_062 varchar(255),  -- 通則加算所定点数対象区分
    col_063 varchar(255),
    col_064 varchar(255),
    col_065 varchar(255) default '0',
    col_066 varchar(255),  -- 入院用claim_class
    col_067 varchar(255),
    col_068 varchar(255),  -- 告示等識別区分（１）
    col_069 varchar(255),
    col_070 varchar(255),
    col_071 varchar(255),
    col_072 varchar(255),
    col_073 varchar(255),
    col_074 varchar(255),
    col_075 varchar(255),
    col_076 varchar(255),
    col_077 varchar(255),
    col_078 varchar(255),
    col_079 varchar(255),
    col_080 varchar(255),
    col_081 varchar(255),
    col_082 varchar(255),
    col_083 varchar(255),
    col_084 varchar(255),
    tensu_kbn varchar(255),  -- 区分番号　アルファベット
    col_086 varchar(255),
    updated_at varchar(255),
    discontinued_at varchar(255),  -- 廃止年月日
    col_089 varchar(255),
    kbn_sho varchar(255),  -- 区分 章
    kbn_bu varchar(255),  -- 区分 部
    kbn_no varchar(255),  -- 区分 番号
    kbn_eda varchar(255),  -- 区分 枝番
    kbn_ko varchar(255),  -- 区分 項番
    col_095 varchar(255),
    col_096 varchar(255),
    col_097 varchar(255),
    col_098 varchar(255),
    col_099 varchar(255),
    col_100 varchar(255),
    col_101 varchar(255),
    col_102 varchar(255),
    col_103 varchar(255),
    col_104 varchar(255),
    col_105 varchar(255),
    col_106 varchar(255),
    col_107 varchar(255),
    col_108 varchar(255),
    col_109 varchar(255),
    col_110 varchar(255),
    col_111 varchar(255),
    col_112 varchar(255),
    full_name varchar(255),
    col_114 varchar(255),
    col_115 varchar(255),
    col_116 varchar(255),
    col_117 varchar(255),
    col_118 varchar(255),
    col_119 varchar(255),
    col_120 varchar(255),
    col_121 varchar(255),  -- 創外固定機器かさん
    col_122 varchar(255),
    col_123 varchar(255),
    col_124 varchar(255),
    col_125 varchar(255),
    col_126 varchar(255),
    col_127 varchar(255),
    col_128 varchar(255) default '',
    col_129 varchar(255) default '',
    col_130 varchar(255) default '',
    col_131 varchar(255) default '',
    col_132 varchar(255) default '',
    col_133 varchar(255) default '',
    col_134 varchar(255) default '',
    col_135 varchar(255) default '',
    col_136 varchar(255) default '',
    col_137 varchar(255) default '',
    col_138 varchar(255) default '',
    col_139 varchar(255) default '',
    col_140 varchar(255) default '',
    col_141 varchar(255) default '',
    col_142 varchar(255) default '',
    col_143 varchar(255) default '',
    col_144 varchar(255) default '',
    col_145 varchar(255) default '',
    col_146 varchar(255) default '',
    col_147 varchar(255) default '',
    col_148 varchar(255) default '',
    col_149 varchar(255) default '',
    col_150 varchar(255)  default ''
);

-- 医薬品マスター
create table master_medicine (
    col_01 integer,
    col_02 char(1) default 'Y',
    code varchar(255),
    col_04 integer,
    name varchar(255),
    col_06 integer,
    kana varchar(255),
    unit_code varchar(255),
    col_09 integer,
    unit varchar(255),
    tensu_type varchar(255),  -- 点数区分
    tensu varchar(255),  -- 点数 numeric               
    col_13 varchar(255) default '0',
    koseishin varchar(255),  -- 麻薬・毒薬・覚醒剤原料・向精神薬
    col_15 varchar(255),
    col_16 varchar(255),
    col_17 varchar(255),
    col_18 varchar(255) default '0',
    col_19 varchar(255),
    col_20 varchar(255),  -- 造影剤
    col_21 varchar(255),
    col_22 varchar(255),
    col_23 varchar(255),
    col_24 varchar(255),
    col_25 varchar(255),
    col_26 varchar(255),
    col_27 varchar(255),
    dose_type varchar(255),  -- 剤形  medicine_form
    col_29 varchar(255) default '',
    updated_ymd varchar(255),
    discontinued_at varchar(255),
    yj_code varchar(255),  -- 薬価基準収載医薬品コード
    col_33 varchar(255),
    col_34 varchar(255),
    product_name varchar(255),
    col_36 varchar(255),  -- 薬価基準収載年月日
    col_37 varchar(255),  -- 一般名コード
    col_38 varchar(255),  -- 一般名処方の標準的な記載
    col_39 varchar(255),  -- 一般名処方の加算対象区分
    col_40 varchar(255),  -- 抗HIV薬区分
    col_41 varchar(255),
    col_42 varchar(255)
);

-- 特定器材マスター
create table master_tool (
    col_01 integer,
    col_02 char(1) default 'T',
    code varchar(255),
    col_04 integer,
    name varchar(255),
    col_06 integer,
    kana varchar(255),
    unit_code varchar(255),
    col_09 integer,
    unit varchar(255),
    tensu_type varchar(255),              -- 点数区分
    tensu varchar(255),            -- 点数 numeric(12,2)
    col_13 varchar(255) default '0',
    col_14 varchar(255),
    col_15 varchar(255),
    col_16 varchar(255),
    col_17 varchar(255),
    col_18 varchar(255),
    col_19 varchar(255),
    col_20 varchar(255),
    col_21 varchar(255),
    col_22 varchar(255),
    col_23 varchar(255),
    col_24 varchar(255),
    col_25 varchar(255) default '',
    col_26 varchar(255),
    col_27 varchar(255),
    updated_at varchar(255),
    transitional_at varchar(255),
    discontinued_at varchar(255),
    col_31 varchar(255),
    col_32 varchar(255),
    col_33 varchar(255),
    col_34 varchar(255) default '',
    col_35 varchar(255) default '',
    col_36 varchar(255) default '',
    full_name varchar(255) default '',
    col_38 varchar(255) default ''
);

-- コメントマスター
create table master_comment (
    col_01 integer,
    col_02 char(1) default 'C',
    col_03 char(1) default '8',
    col_04 varchar(255),
    col_05 varchar(255),
    col_06 integer,
    name varchar(255),
    col_08 integer,
    kana varchar(255),
    col_10 varchar(255),
    col_11 varchar(255),
    col_12 varchar(255),
    col_13 varchar(255),
    col_14 varchar(255),
    col_15 varchar(255),
    col_16 varchar(255),
    col_17 varchar(255),
    col_18 varchar(255) default '0',
    col_19 varchar(255) default '0',
    col_20 varchar(255),
    updated_at varchar(255),
    discontinued_at varchar(255),
    code varchar(255),
    col_24 varchar(255),
    col_25 varchar(255) default '',
    col_26 varchar(255) default '',
    col_27 varchar(255) default '',
    col_28 varchar(255) default '',
    col_29 varchar(255) default '',
    col_30 varchar(255) default ''
);

-- 用法マスター
create table master_administration (
    code varchar(255),
    admin_code varchar(255),
    admin_type varchar(255),
    detail_code varchar(255),
    detail_type varchar(255),
    timing_code varchar(255),
    timing_type varchar(255),
    name varchar(255),
    serial_num varchar(255),
    start_at varchar(255),
    discontinued_at varchar(255),
    admin_code_type varchar(255),
    single_condition varchar(255),
    admin_timing varchar(255),
    admin_time varchar(255),
    admin_interval varchar(255),
    admin_parts varchar(255),
    kana varchar(255),
    receipt_code varchar(255)
);

-- 電子点数票 補助テーブル
create table IF NOT EXISTS tbl_helper (
    update_flg integer,
    code varchar(255),
    name varchar(255),
    inclusion1 integer,
    group1 varchar(255),
    inclusion2 integer,
    group2 varchar(255),
    inclusion3 integer,
    group3 varchar(255),
    nand_day integer,
    nand_month integer,
    nand_same integer,
    nand_week integer,
    reserve14 integer default 0,
    reserve15 integer default 0,
    reserve16 varchar(255) default '0',
    reserve17 varchar(255) default '',
    reserve18 varchar(255) default '0',
    reserve19 integer default 0,
    admission_charge varchar(255),
    calc_count integer,
    reserve22 integer default 0,
    reserve23 integer default 0,
    reserve24 integer default 0,
    reserve25 integer default 0,
    onset_at varchar(255),
    discontinued_at varchar(255)
);

-- 包括・被包括
create table IF NOT EXISTS tbl_nand_inclusion (
    update_flg integer,
    group_code varchar(255),
    code varchar(255),
    name varchar(255),
    special_case integer,
    onset_at varchar(255),
    discontinued_at varchar(255)
);

-- 1 日につき背反となるもの
create table IF NOT EXISTS tbl_nand_day (
    update_flg integer,
    code1 varchar(255),
    name1 varchar(255),
    code2 varchar(255),
    name2 varchar(255),
    exclusive_type integer,
    special_case integer,
    reserve8 integer default 0,
    onset_at varchar(255),
    discontinued_at varchar(255)
);

-- 同一月内で背反となるもの
create table IF NOT EXISTS tbl_nand_month (
    update_flg integer,
    code1 varchar(255),
    name1 varchar(255),
    code2 varchar(255),
    name2 varchar(255),
    exclusive_type integer,
    special_case integer,
    reserve8 integer default 0,
    onset_at varchar(255),
    discontinued_at varchar(255)
);

-- 同時に背反となるもの
create table IF NOT EXISTS tbl_nand_same (
    update_flg integer,
    code1 varchar(255),
    name1 varchar(255),
    code2 varchar(255),
    name2 varchar(255),
    exclusive_type integer,
    special_case integer,
    reserve8 integer default 0,
    onset_at varchar(255),
    discontinued_at varchar(255)
);

--  1 週間につき背反となるもの
create table IF NOT EXISTS tbl_nand_week (
    update_flg integer,
    code1 varchar(255),
    name1 varchar(255),
    code2 varchar(255),
    name2 varchar(255),
    exclusive_type integer,
    special_case integer,
    reserve8 integer default 0,
    onset_at varchar(255),
    discontinued_at varchar(255)
);

-- 入院基本料
create table IF NOT EXISTS tbl_admission_charge (
    update_flg integer,
    group_code varchar(255),
    code varchar(255),
    name varchar(255),
    additional_type varchar(255),
    reserve6 integer default 0,
    onset_at varchar(255),
    discontinued_at varchar(255)
);

-- 算定回数
create table IF NOT EXISTS tbl_calculation_count (
    update_flg integer,
    code varchar(255),
    name varchar(255),
    unit_code varchar(255),
    unit_name varchar(255),
    upper_limit integer,
    special_case integer,
    reserve8 varchar(255) default '0',
    reserve9 varchar(255) default '0',
    reserve10 integer default 0,
    reserve11 integer default 0,
    reserve12 integer default 0,
    onset_at varchar(255),
    discontinued_at varchar(255)
);

-- Department
create table IF NOT EXISTS tbl_dept_code (
    code varchar(255) not null,
    name varchar(255) default ''
);

-- Prefecture
create table IF NOT EXISTS tbl_prefecture_code (
    code varchar(255) not null,
    name varchar(255) not null
);

-- Zip code
create table IF NOT EXISTS tbl_zip_code (
    national_code varchar(255) not null,
    old_code varchar(255) not null,
    zip_code varchar(255) not null,
    prefecture_kana varchar(255) not null,
    city_kana varchar(512) not null,
    town_kana varchar(512) not null,
    prefecture varchar(255) not null,
    city varchar(512) not null,
    town varchar(512) not null,
    splits_town varchar(255) not null,
    section_town varchar(255) not null,
    streat varchar(255) not null,
    overwraped_town varchar(255) not null,
    updated varchar(255) not null,
    reason_for_change varchar(255) not null
);

-- Short name of procedure
create table IF NOT EXISTS tbl_short_name (
    seq integer not null,
    kbn varchar(255) not null,
    descriotion varchar(512) not null,
    short_name varchar(255) not null,
    apply_to varchar(255) not null,
    auto_flg integer not null default 0
);

-- Master
COPY master_disease FROM '/usr/src/master_2025_02_03/b_20250101.txt' DELIMITER ',' CSV ENCODING 'SJIS';
COPY master_modifier FROM '/usr/src/master_2025_02_03/z_20250101.txt' DELIMITER ',' CSV ENCODING 'SJIS';
COPY master_procedure FROM '/usr/src/master_2025_02_03/s_ALL20250131.csv' DELIMITER ',' CSV ENCODING 'SJIS';
COPY master_medicine FROM '/usr/src/master_2025_02_03/y_ALL20250115.csv' DELIMITER ',' CSV ENCODING 'SJIS';
COPY master_tool FROM '/usr/src/master_2025_02_03/t_ALL20241227.csv' DELIMITER ',' CSV ENCODING 'SJIS';
COPY master_comment FROM '/usr/src/master_2025_02_03/c_ALL20241002.csv' DELIMITER ',' CSV ENCODING 'SJIS';
COPY master_administration FROM '/usr/src/master_2025_02_03/1_administration.csv' DELIMITER ',' CSV ENCODING 'UTF8';
COPY tbl_helper FROM '/usr/src/master_2025_02_03/01_nand.csv' DELIMITER ',' CSV ENCODING 'SJIS';
COPY tbl_nand_inclusion FROM '/usr/src/master_2025_02_03/02_nand.csv' DELIMITER ',' CSV ENCODING 'SJIS';
COPY tbl_nand_day FROM '/usr/src/master_2025_02_03/03-1_nand.csv' DELIMITER ',' CSV ENCODING 'SJIS';
COPY tbl_nand_month FROM '/usr/src/master_2025_02_03/03-2_nand.csv' DELIMITER ',' CSV ENCODING 'SJIS';
COPY tbl_nand_same FROM '/usr/src/master_2025_02_03/03-3_nand.csv' DELIMITER ',' CSV ENCODING 'SJIS';
COPY tbl_nand_week FROM '/usr/src/master_2025_02_03/03-4_nand.csv' DELIMITER ',' CSV ENCODING 'SJIS';
COPY tbl_admission_charge FROM '/usr/src/master_2025_02_03/04_nand.csv' DELIMITER ',' CSV ENCODING 'SJIS';
COPY tbl_calculation_count FROM '/usr/src/master_2025_02_03/05_nand.csv' DELIMITER ',' CSV ENCODING 'SJIS';
COPY tbl_zip_code FROM '/usr/src/master_2025_02_03/KEN_ALL_UTF8.csv' DELIMITER ',' CSV ENCODING 'UTF8';
COPY tbl_dept_code FROM '/usr/src/master_2025_02_03/utf_depts.csv' DELIMITER ',' CSV ENCODING 'UTF8';
COPY tbl_prefecture_code FROM '/usr/src/master_2025_02_03/utf_prefecture.csv' DELIMITER ',' CSV ENCODING 'UTF8';
COPY tbl_short_name (seq, kbn, descriotion, short_name, apply_to) FROM '/usr/src/master_2025_02_03/4-med-1.csv' DELIMITER ',' CSV ENCODING 'UTF8';