-- datetime -> varchar(255)
-- id, not null -> all columns
-- index -> to create app view fast. (not secondary use)
-- peron number ...

create table m_user (
    id varchar(255) primary key,
    username varchar(255) not null,
    password varchar(255) not null default '',
    phone_num varchar(255) not null default '',
    e164 varchar(255) not null default '',
    full_name varchar(255) not null default '',
    kana varchar(255) not null default '',
    license varchar(255) not null default '',
    narcotic_license_num varchar(255) not null default '',
    user_role varchar(255) not null default 'admin',
    memo varchar(255) not null default '',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'pending',
    -- email
    UNIQUE(username)
);

create table m_facility (
    id varchar(255) primary key,
    short_name varchar(255) not null default '',
    name varchar(255) not null default '',
    founder varchar(255) not null default '',
    administrator varchar(255) not null default '',
    insurance_facility_code varchar(255) not null default '',
    zip_code varchar(255) not null default '',
    prefecture varchar(255) not null default '',
    prefecture_code varchar(255) not null default '',
    address varchar(255) not null default '',
    telephone varchar(255) not null default '',
    facsimile varchar(255) not null default '',
    url varchar(255) not null default '',
    memo varchar(255) not null default '',
    owner varchar(255) not null default '',  -- user_id
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'pending'
);

-- Assosiation Table
create table users_facilities (
    user_id varchar(255) not null,
    facility_id varchar(255) not null,
    user_role varchar(255) not null default 'user',
    status varchar(255) not null default 'pending',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    --
    FOREIGN KEY(user_id) REFERENCES m_user(id),
    FOREIGN KEY(facility_id) REFERENCES m_facility(id)
);

create table m_facility_id (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    code varchar(255) not null default '',
    name varchar(255) not null default '',
    memo varchar(255) not null default '',
    --
    FOREIGN KEY(facility_id) REFERENCES m_facility(id) ON DELETE CASCADE
);

create table m_department (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    code varchar(255) not null,
    name varchar(255) default '',
    --
    FOREIGN KEY(facility_id) REFERENCES m_facility(id) ON DELETE CASCADE
);

create table m_time_schedule (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    regular_am_start varchar(255) not null default '',
    regular_am_end varchar(255) not null default '',
    regular_pm_start varchar(255) not null default '',
    regular_pm_end varchar(255) not null default '',
    --
    FOREIGN KEY(facility_id) REFERENCES m_facility(id) ON DELETE CASCADE
);

create table m_week_schedule (
    id varchar(255) primary key,
    schedule_id varchar(255) not null,
    day integer null default 0,  -- 0: 日曜日 1: 月曜日 ...
    name varchar(255) not null default '',  -- mon tue ...
    disp varchar(255) not null default '',  -- 月 火 ...
    am_start varchar(255) not null default '',
    am_end varchar(255) not null default '',
    pm_start varchar(255) not null default '',
    pm_end varchar(255) not null default '',
    --
    FOREIGN KEY(schedule_id) REFERENCES m_time_schedule(id) ON DELETE CASCADE
);

create table m_holiday (
    id varchar(255) primary key,
    schedule_id varchar(255) not null,
    name varchar(255) not null default '',
    disp varchar(255) not null default '',  -- 日曜日　祝日　水曜日 ...
    memo varchar(255) not null default '',
    --
    FOREIGN KEY(schedule_id) REFERENCES m_time_schedule(id) ON DELETE CASCADE
);

create table m_standard (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    code varchar(255) not null default '',
    name varchar(255) not null default '',
    short_name varchar(255) not null default '',
    notification integer not null default 0,
    memo varchar(255) not null default '',
    updated_at varchar(255) not null,
    --
    FOREIGN KEY(facility_id) REFERENCES m_facility(id) ON DELETE CASCADE
);

create table m_notification (
    facility_id varchar(255) not null,
    code varchar(255) not null,
    kbn varchar(255) not null,
    name varchar(255) not null,
    method varchar(255) not null,
    zvar varchar(255) not null,
    --
    FOREIGN KEY(facility_id) REFERENCES m_facility(id) ON DELETE CASCADE
);

create table m_pt_number(
    facility_id varchar(255) primary key,
    num_digits integer not null default 6,
    curr_num integer not null default 0
);

create table m_patient (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    pt_id varchar(255) not null default '',
    full_name varchar(255) not null default '',
    name_of_other varchar(255) not null default '',
    kana varchar(255) not null default '',
    name_of_other_kana varchar(255) not null default '',
    gender varchar(255) not null default '',
    sex2 varchar(255) not null default '',
    dob varchar(255) not null default '',
    nationality varchar(255) not null default '',
    race varchar(255) not null default'',
    marital_status varchar(255) not null default '',
    mobile varchar(255) not null default '',
    email varchar(255) not null default '',
    death_flag boolean not null default false,                  -- 死亡フラグ
    memo varchar(255) not null default '',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    --
    UNIQUE (facility_id, pt_id)
);

create table m_address(
    id varchar(255) primary key,
    address_class varchar(255) not null default '',
    name varchar(255) not null default '',
    zip_code varchar(255) not null default '',
    address varchar(255) not null default '',
    telephone varchar(255) not null default '',
    memo varchar(255) not null default '',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    patient_id varchar(255) not null,
    --
    FOREIGN KEY(patient_id) REFERENCES m_patient(id) ON DELETE CASCADE
);

create table m_health_insurance (
    id varchar(255) primary key,
    insured_card_classification varchar(255) not null default '',  -- 保険証区分
    insurer_number varchar(255) not null default '',  -- 保険者番号
    insurer_name varchar(255) not null default '',  -- 保険者名
    insured_card_symbol varchar(255) not null default '',  -- 被保険者証記号
    insured_identification_number varchar(255) not null default '',  -- 被保険者証番号
    insured_branch_number varchar(255) not null default '',  -- 被保険者証枝番
    personal_family_classification varchar(255) not null default '',  -- 本人家族区分
    insured_name varchar(255) not null default '',  -- 被保険者氏名(世帯主氏名)
    name varchar(255) not null default '',  -- 氏名
    name_of_other varchar(255) not null default '',  -- 氏名（その他）
    name_kana varchar(255) not null default '',  -- 氏名カナ
    name_of_other_kana varchar(255) not null default '',  -- 氏名カナ（その他）
    sex1 varchar(255) not null default '',  -- 性別
    sex2 varchar(255) not null default '',  -- 性別
    birthdate varchar(255) not null default '',  -- 生年月日
    address varchar(255) not null default '',  -- 住所
    post_number varchar(255) not null default '',  -- 郵便番号
    qualification_date varchar(255) not null default '',  -- 資格取得日
    disqualification_date varchar(255) not null default '',  -- 資格喪失日
    insured_certificate_issuance_date varchar(255) not null default '',  -- 被保険者証交付日
    insured_card_valid_date varchar(255) not null default '',  -- 被保険者証有効期限開始日
    insured_card_expiration_date varchar(255) not null default '',  -- 被保険者証有効期限終了日
    insured_partial_contribution_ratio varchar(255) not null default '',  -- 被保険者証一部負担金割合
    preschool_classification varchar(255) not null default '',  -- 未就学区分
    reason_of_loss varchar(255) not null default '',  -- 資格喪失事由
    out_date bool not null default false,  -- 退院日
    patient_id varchar(255) not null,
    --
    FOREIGN KEY(patient_id) REFERENCES m_patient(id) ON DELETE CASCADE
);

create table m_public_health_insurance (
    id varchar(255) primary key,
    public_class varchar(255) not null default '',              -- 公費の種類
    public_name varchar(255) not null default '',               -- 公費の名称
    insurer_number varchar(255) not null default '',            -- 負担者番号
    insured_person_number varchar(255) not null default '',     -- 受給者番号
    rate_admission varchar(255) not null default '',            -- 入院 - 負担率
    money_admission varchar(255) not null default '',           -- 入院 - 固定額
    rate_out_patient varchar(255) not null default '',          -- 外来 - 負担率（割）
    money_out_patient varchar(255) not null default '',         -- 外来 - 固定額
    issued_date varchar(255) not null default '',               -- 適用開始日
    expired_date varchar(255) not null default '',              -- 適用終了日
    priority varchar(255) not null default '',                  -- 優先順位
    memo varchar(255) not null default '',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    insurance_id varchar(255) not null,
    --
    FOREIGN KEY(insurance_id) REFERENCES m_health_insurance (id) ON DELETE CASCADE
);

create table m_patient_visit (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    pvt_date_time varchar(255) not null,
    patient_id varchar(255) not null,
    full_name varchar(255) not null default '',
    kana varchar(255) not null default '',
    gender varchar(255) not null default '',
    sex2 varchar(255) not null default '',
    dob varchar(255) not null default '',
    phy_id varchar(255) not null default '',
    phy_full_name varchar(255) not null default '',
    phy_kana varchar(255) not null default '',
    dept_id varchar(255) not null default '',
    dept_name varchar(255) not null default '',
    his_id varchar(255) not null default '',
    his_provider_name varchar(255) not null default '',  -- 保険名称
    qualification_confirmation_date varchar(255) not null default '',  -- 資格確認日
    qualification_validity varchar(255) not null default '',  -- 資格有効性
    new_patient boolean not null default false,  -- 新患フラグ
    new_his boolean not null default false,  -- 新保険フラグ
    locked_by varchar(255) not null default '',  -- 0: close 1: open
    status varchar(255) not null default 'F',
    memo varchar(255) not null default '',
    --
    UNIQUE(facility_id, patient_id, pvt_date_time)
);

create table m_allergy (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    patient_id varchar(255) not null,
    physician_id varchar(255) not null,
    dept_id varchar(255) not null default '',
    dept_name varchar(255) not null default '',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    --
    substance varchar(255) not null,
    severity varchar(255) not null default '',
    identified_at varchar(255) not null default '',
    memo varchar(255) not null default ''
);

create table m_infection (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    patient_id varchar(255) not null,
    physician_id varchar(255) not null,
    dept_id varchar(255) not null default '',  -- business
    dept_name varchar(255) not null default '',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    --
    factor varchar(255) not null,
    exam_value varchar(255) not null,
    identified_at varchar(255) not null default '',
    memo varchar(255) not null default ''
);

create table m_blood_type (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    patient_id varchar(255) not null,
    physician_id varchar(255) not null,
    dept_id varchar(255) not null default '',  -- business
    dept_name varchar(255) not null default '',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    --
    abo varchar(255) not null default '',
    rh varchar(255) not null default '',
    other varchar(255) not null default '',
    memo varchar(255) not null default ''
);

create table m_life_style (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    patient_id varchar(255) not null,
    physician_id varchar(255) not null,
    dept_id varchar(255) not null default '',  -- business
    dept_name varchar(255) not null default '',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    --
    occupation varchar(255) not null default '',
    tobacco varchar(255) not null default '',
    alcohol varchar(255) not null default '',
    other varchar(255) not null default '',
    memo varchar(255) not null default ''
);

create table m_family_history (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    patient_id varchar(255) not null,
    physician_id varchar(255) not null,
    dept_id varchar(255) not null default '',  -- business
    dept_name varchar(255) not null default '',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    --
    relation varchar(255) not null default '',
    age varchar(255) not null default '',
    diagnosis varchar(255) not null default '',
    memo varchar(255) not null default ''
);

create table m_past_history (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    patient_id varchar(255) not null,
    physician_id varchar(255) not null,
    dept_id varchar(255) not null default '',  -- business
    dept_name varchar(255) not null default '',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    --
    time_expression varchar(255) not null default '',
    event_expression varchar(255) not null default '',
    memo varchar(255) not null default ''
);

create table m_childhood (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    patient_id varchar(255) not null,
    physician_id varchar(255) not null,
    dept_id varchar(255) not null default '',
    dept_name varchar(255) not null default '',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    --
    facility varchar(255) not null default '',
    delivery_weeks varchar(255) not null default '',
    delivery_method varchar(255) not null default '',
    body_weight varchar(255) not null default '',
    body_height varchar(255) not null default '',
    chest_circumference varchar(255) not null default '',
    head_circumference varchar(255) not null default '',
    memo varchar(255) not null default ''
);

create table m_vaccination (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    patient_id varchar(255) not null,
    physician_id varchar(255) not null,
    dept_id varchar(255) not null default '',
    dept_name varchar(255) not null default '',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default '',
    --
    vaccine varchar(255) not null default '',
    injected varchar(255) not null default '',
    age varchar(255) not null default '',
    memo varchar(255) not null default ''
);

create table m_summary_memo (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    patient_id varchar(255) not null,
    content text
);

create table m_diagnosis (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    patient_id varchar(255) not null,
    physician_id varchar(255) not null,
    phy_receipt_id varchar(255) not null default '',
    dept_id varchar(255) not null default '',
    dept_name varchar(255) not null default '',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    --
    code varchar(255) not null not null default '',             -- code
    name varchar(255) not null default '',
    icd1012 varchar(255) not null default '',
    icd1022 varchar(255) not null default '',
    modifier integer not null default 0,                        -- modifier?
    diagnosis_category varchar(255) not null default '',
    date_of_onset varchar(255) not null,                        -- change datetime
    date_of_remission varchar(255) not null default '',         -- change datetime
    outcome varchar(255) not null default ''
);

create table m_karte_entry (
    id varchar(255) primary key,
    revision varchar(255) not null,  -- first-uuid.rev
    outdate_id varchar(255) not null default '',  -- outdate uuid
    facility_id varchar(255) not null,
    patient_id varchar(255) not null,
    physician_id varchar(255) not null,
    dept_id varchar(255) not null default '',
    dept_name varchar(255) not null default '',
    his_id varchar(255) not null default '',  -- 適用保険
    pvt_id varchar(255) not null default '',  -- PVT uuid (PK)
    clerk_id varchar(255) not null default '', 
    protocol varchar(255) not null default '',  -- ToDo
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    --
    memo varchar(255) not null default ''
);

create table m_soa (
    id varchar(255) primary key,
    karte_id varchar(255) not null,
    created_at varchar(255) not null default '',
    updated_at varchar(255) not null default '',
    status varchar(255) not null default '',
    content text,
    --
    FOREIGN key(karte_id) REFERENCES m_karte_entry(id) ON DELETE CASCADE
);

create table m_bundle (
    id varchar(255) primary key,
    karte_id varchar(255) not null,
    facility_id varchar(255) not null,
    patient_id varchar(255) not null,
    physician_id varchar(255) not null,
    dept_id varchar(255) not null default '',
    dept_name varchar(255) not null default '',
    his_id varchar(255) not null default '',  -- 適用保険
    provider_number varchar(255) not null default '',  -- 保険者番号
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    batch_no integer not null default 0,
    "group" varchar(255) not null,                              -- receippt code, custome code
    entity varchar(255) not null default '',                    -- エンティティ
    category varchar(255) not null default '',
    name varchar(255) not null default '',                      -- 名称
    quantity varchar(255) not null default '',                  -- 数量 用法あり
    unit varchar(255) not null default '',                      -- 日分 何回分 数量
    issued_to varchar(255) not null default '',                 -- 院内/院外処方
    oral boolean not null default false,                        -- 内服
    prn boolean not null default false,                         -- 頓用
    topical boolean not null default false,                     -- 外用
    temporary boolean not null default false,                   -- 臨時
    freq_per_day varchar(255) not null default '',                -- 1日の服用回数
    mandatory varchar(255) not null default '',                 -- 必須項目
    --
    FOREIGN KEY(karte_id) REFERENCES m_karte_entry(id) ON DELETE CASCADE
);

create table m_claim_item (
    id varchar(255) primary key,
    bundle_id varchar(255) not null,
    facility_id varchar(255) not null,
    patient_id varchar(255) not null,
    physician_id varchar(255) not null,
    dept_id varchar(255) not null default '',                   -- Send ORA
    dept_name varchar(255) not null default '',                 -- Display purpose
    his_id varchar(255) not null default '',  -- 適用保険
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    batch_no integer not null default 0,
    --- 
    code varchar(255) not null,                                 -- pv_group 内で unique
    name varchar(255) not null default '',
    value double precision not null default 1,                  -- default=1?                 
    drop integer not null default 0,                            -- drop
    -- Disease
    icd1012 varchar(255) not null default '',                   -- icd-10
    diagnosis_category varchar(255) not null default '',        -- 病名区分
    date_of_onset varchar(255) not null,                        -- 病名開始日
    outcome varchar(255) not null default '',
    date_of_remission varchar(255) not null default '',         -- 病名終了日
    -- Claim
    category varchar(255) not null default '',                  -- 点数区分
    "group" varchar(255) not null default '',                   -- 診療種区分 レセプト点数コード
    type integer not null default -1,                           -- rocedure, medicine, material..
    quantity varchar(255) not null default '1',                 -- 数量 値 用法あり & Input の value
    quantity_per_once varchar(255) not null default '',         -- 1回の数量
    freq_per_day varchar(255) not null default '',              -- 1日の服薬回数
    unit varchar(255) not null default '',                      -- 単位
    dose_type varchar(255) not null default '',                 -- 内用、外用,注射
    memo varchar(255) not null default '',                      -- メモ
    description varchar(255) not null default '',               -- description
    -- Input
    str_value varchar(255) not null default '',
    value_type varchar(255) not null default '',                -- 値の型
    frac_digits integer not null default 0,
    equation varchar(255) not null default '',
    equation_params varchar(255) not null default '',
    eval_func varchar(255) not null default '',
    eval_params varchar(255) not null default '',
    -- File Camera
    filename varchar(255) not null default '',
    size integer not null default 0,
    content_type varchar(255) not null default '',              -- image/png ...
    last_modified bigint not null default 0,
    thumbnail varchar(255) not null default '',
    body varchar(255) not null default '',
    make_model varchar(255) not null default '',
    --
    FOREIGN KEY(bundle_id) REFERENCES m_bundle(id) ON DELETE CASCADE
);

create table m_document_entry (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    patient_id varchar(255) not null,
    physician_id varchar(255) not null,
    dept_id varchar(255) not null default '',
    dept_name varchar(255) not null default '',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    --
    doc_type varchar(255) not null default '',                  -- business
    issued_at varchar(255) not null,
    referral_facility varchar(255) not null default '',
    referral_dept varchar(255) not null default '',
    referral_doctor varchar(255) not null default '',
    disease varchar(255) not null default '',
    memo varchar(255) not null default ''
);

create table m_document (
    entry_id varchar(255) not null,
    content jsonb not null,
    --
    FOREIGN KEY(entry_id) REFERENCES m_document_entry(id) ON DELETE CASCADE
);

create table m_lab_module (
    id varchar(255) primary key,
    order_id varchar(255) not null default '',
    fc_id varchar(255) not null default '',                         -- magellanId not Institution ID
    pt_id varchar(255) not null default '',                         -- Business  patientId
    order_date varchar(255) not null default '',                    -- Order at
    sampling_date varchar(255) not null default '',                 -- Smpling at
    test_date varchar(255) not null default '',                     -- Test at
    lab_code varchar(255) not null default '',
    lab_name varchar(255) not null default '',
    pt_name varchar(255) not null default '',
    pt_kana varchar(255) not null default '',
    pt_dob varchar(255) not null default '',
    pt_gender varchar(255) not null default '',
    --
    UNIQUE(fc_id, order_id)
);

create table m_lab_test (
    id varchar(255) primary key,
    lab_code varchar(255) not null default '',                      -- 0  R  ラボコード
    lab_name varchar(255) not null default '',                      -- 1  O  ラボ名称
    fc_id varchar(255) not null default '',                         -- 2  R  施設ID -- magellan
    fc_name varchar(255) not null default '',                       -- 3  O  施設名称
    dept_id varchar(255) not null default '',                       -- 4  O  診療科コード  table-1
    phy_name varchar(255) not null default '',                      -- 5  O  依頼医師名
    serial_num varchar(255) not null default '',                    -- 6  O  検査結果通番
    pt_id varchar(255) not null default '',                         -- 7  R  患者ID  -- Business
    pt_name varchar(255) not null default '',                       -- 8  R  患者氏名
    pt_kana varchar(255) not null default '',                       -- 9  RE 患者カナ（半角）
    pt_dob varchar(255) not null default '',                        -- 10 R  患者生年月日
    pt_gender varchar(255) not null default '',                     -- 11 R  患者性別    table-2
    pt_consent varchar(255) not null default '',                    -- 12 R  同意患者識別子 table-3
    height varchar(255) not null default '',                        -- 13 C  身長
    weight varchar(255) not null default '',                        -- 14 C  体重
    dialysis varchar(255) not null default '',                      -- 15 C  透析区分    table-4
    meal_clss varchar(255) not null default '',                     -- 16 C  食事区分    table-5
    meal_text varchar(255) not null default '',                     -- 17 O  食事区分テキスト
    pregnancy varchar(255) not null default '',                     -- 18 O  妊娠週数
    order_id varchar(255) not null default '',                      -- 19 R  オーダーID fc_id:pt_id:sampling_date:lab_code => lab order ID
    hosp_visit varchar(255) not null default '',                    -- 20 R  入外区分    table-6
    order_date varchar(255) not null default '',                    -- 21 RE 検査依頼日時 YYYYMMDDHHMMSS
    order_comment varchar(255) not null default '',                 -- 22 O  オーダーコメント
    sampling_date varchar(255) not null default '',                 -- 23 R  検体採取日時 YYYYMMDDHHMMSS
    spc_type varchar(255) not null default '',                      -- 24 R  検体タイプ   table-7
    spc_name varchar(255) not null default '',                      -- 検体名称   table-7
    spc_code_sys varchar(255) not null default '',                  -- 検体コード体系   table-7
    spc_comment varchar(255) not null default '',                   -- 25 O  検体コメント
    urine_vol varchar(255) not null default '',                     -- 26 C  尿量
    test_code varchar(255) not null default '',                     -- 27 RE テスト項目独自コード
    test_name varchar(255) not null default '',                     -- 28 RE テスト項目名称
    test_heading varchar(255) not null default '',                  -- 29 R  テスト項目見出し    table-8
    jlacten varchar(255) not null default '',                       -- 30 RE JLAC10
    receipt_code varchar(255) not null default '',                  -- 31 O  レセ電コード
    test_date varchar(255) not null default '',                     -- 32 O  検査実施日（受付日） YYYYMMDDHHMMSS
    result_status varchar(255) not null default '',                 -- 33 R  検査結果状態  table-9
    result_value varchar(255) not null default '',                  -- 34 C  結果値 結果なし以外は必須
    value_form varchar(255) not null default '',                    -- 35 RE 結果値形態コード U（以上） E（以下） L（未満） O（超過） B（結果なし） table-10
    value_type varchar(255) not null default '',                    -- 35 RE 結果値形態コード表記
    unit varchar(255) not null default '',                          -- 36 O  単位
    ref_value_clss varchar(255) not null default '',                -- 37 O  基準値区分コード -（範囲） E（以下） L（未満） U（以上）    table-11
    lower_limit varchar(255) not null default '',                   -- 38 O  下限値
    upper_limit varchar(255) not null default '',                   -- 39 O  上限値
    abnormal_flg varchar(255) not null default '',                  -- 40 O  異常値フラグ L H LL HH < > N A AA U D B W S R I MS VS     table-12
    comment_code1 varchar(255) not null default '',                 -- 41 O  結果コメントコード1
    comment1 varchar(255) not null default '',                      -- 42 O  結果コメント
    comment_code2 varchar(255) not null default '',                 -- 43 O  結果コメントコード
    comment2 varchar(255) not null default '',                      -- 44 O  結果コメント
    module_id varchar(255) not null,
    --
    FOREIGN KEY(module_id) REFERENCES m_lab_module(id) ON DELETE CASCADE
);

-- 医療機関で使用する診療行為
-- デフォルトのうち、どれを使用するかを選択
create table m_using_procedure (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    entity varchar(255) not null default '',
    entity_order integer not null default 0,
    name varchar(255) not null default '',
    short_name varchar(255) not null default '',        -- stamp_box
    category varchar(255) not null default '',
    --
    FOREIGN KEY(facility_id) REFERENCES m_facility(id) ON DELETE CASCADE
);

-- 医療機関が使用している Input Bundle
-- Tree表示のみ
create table m_using_input (
    id varchar(255) primary key,
    facility_id varchar(255) not null,                      -- index
    entity varchar(255) not null default '',
    entity_order integer not null default 0,
    name varchar(255) not null default '',
    category varchar(255) not null default '',
    "group" varchar(255) not null default '',
    items varchar(255) not null default '',  -- item1 item2... tooltip 用
    --
    FOREIGN KEY(facility_id) REFERENCES m_facility(id) ON DELETE CASCADE
);

create table m_disease_stamp (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    physician_id varchar(255) not null,
    dept_id varchar(255) not null default '',
    dept_name varchar(255) not null default '',
    entity varchar(255) not null default 'disease',         -- disease fixed
    freq integer not null default 1,                        -- 使用頻度
    code varchar(255) not null default '',
    name varchar(255) not null default '',
    stamp_name varchar(255) not null default '',            -- Stamp名称
    icd1012 varchar(255) not null default '',
    icd1022 varchar(255) not null default '',
    modifier integer not null default 1,    
    drop integer not null default 0
);

create table m_stamp (
    id varchar(255) primary key,                        -- id
    facility_id varchar(255) not null,
    physician_id varchar(255) not null,
    dept_id varchar(255) not null default '',
    dept_name varchar(255) not null default '',
    entity varchar(255) not null default '',            -- entity
    category varchar(255) not null default '',          -- 区分
    "group" varchar(255) not null default '',             -- 診療種区分 claim007 classCode
    name varchar(255) not null default '',              -- 区分名称
    stamp_name varchar(255) not null default '',        -- Stamp名称
    hash varchar(255) not null default '',              -- Hash(sum of = child code)
    freq integer not null default 1,                    -- 使用頻度
    quantity varchar(255) not null default '',
    unit varchar(255) not null default '',              -- 単位
    issued_to varchar(255) not null default '',         -- 院内/院外処方
    oral boolean not null default false,                -- 内服
    prn boolean not null default false,                 -- 頓用
    topical boolean not null default false,             -- 外用
    temporary boolean not null default false,            -- 臨時
    freq_per_day varchar(255) not null default ''        -- 1日の服用回数
);

create table m_stamp_item (
    id varchar(255) primary key,
    category varchar(255) not null default '',          -- 区分
    dose_type varchar(255) not null default '',         -- 内用、外用, 注射   null
    type integer not null default -1,                   -- procedure, medicine, material..
    code varchar(255) not null default '',              -- code
    name varchar(255) not null default '',              -- 名称
    quantity varchar(255) not null default '',          -- 数量 用法あり
    quantity_per_once varchar(255) not null default '',    -- 1回の数量
    freq_per_day varchar(255) not null default '',        -- 1日の服薬回数
    unit varchar(255) not null default '',              -- 単位
    "group" varchar(255) not null default '',           -- 診療種区分 claim007 classCode  receipt 点数コード
    drop integer not null default 0,                    -- drop=False
    stamp_id varchar(255) not null,
    --
    FOREIGN KEY(stamp_id) REFERENCES m_stamp(id) ON DELETE CASCADE
);

create table m_user_settings (
    id varchar(255) primary key,  -- = user_id
    settings jsonb
);

create table m_ping (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    patient_id varchar(255) not null,
    event varchar(255) not null,
    detail varchar(255) not null,
    scheduled_at  varchar(255) not null default '',
    expiration_at varchar(255) not null default '',
    start_at varchar(255) not null default '',
    end_at varchar(255) not null default '',
    status varchar(255) not null default ''
);

-- 診療行為
-- category: 診療報酬の区分
-- group: 決まらない
create table procedure_catalogue (
    id varchar(255) primary key,
    entity varchar(255) not null default '',
    entity_order integer not null default 0,
    name varchar(255) not null default '',
    short_name varchar(255) not null default '',  -- stamp_box
    category varchar(255) not null default ''
);

-- InputCatalogue = Input Bundle template
-- entity_order, filled, items -> specific
create table input_catalogue (
    id varchar(255) primary key,
    entity varchar(255) not null default '',
    entity_order integer not null default 0,             -- group の順に依存しない
    name varchar(255) not null default '',
    category varchar(255) not null default '',
    "group" varchar(255) not null default '',
    quantity varchar(255) not null default '1',
    unit varchar(255) not null default '',
    mandatory varchar(255) not null default '',         -- 0 1 ...
    items varchar(255) not null default ''              -- item1 item2...
);

-- InputItem = ClaimItem template
create table input_item (
    id varchar(255) primary key,
    code varchar(255) not null default '',
    name varchar(255) not null default '',
    string_value varchar(255) not null default '',
    value double precision not null default 0,
    unit varchar(255) not null default '',
    value_type varchar(255) not null default '',
    fraction_digits integer not null default 0,
    equation varchar(255) not null default '',
    equation_params varchar(255) not null default '',
    eval_func varchar(255) not null default '',
    eval_params varchar(255) not null default '',
    input_catalog_id varchar(255) not null,
    --
    FOREIGN KEY(input_catalog_id) REFERENCES input_catalogue(id) ON DELETE CASCADE
);

create table test_patient (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    pt_id varchar(255) not null,
    full_name varchar(255) not null,
    kana varchar(255) not null,
    gender varchar(255) not null,
    dob varchar(255) not null,
    nationality varchar(255) not null default '',
    race varchar(255) not null default'',
    marital_status varchar(255) not null default '',
    mobile varchar(255) not null default '',
    email varchar(255) not null default '',
    house_holder varchar(255) not null default '',
    relation_to_holder varchar(255) not null default '',        -- 世帯主との関係
    death_flag boolean not null default false,                  -- 死亡フラグ
    memo varchar(255) not null default '',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F'
);

create table test_address(
    id varchar(255) primary key,
    address_class varchar(255) not null default '',
    name varchar(255) not null default '',
    zip_code varchar(255) not null default '',
    address varchar(255) not null default '',
    telephone varchar(255) not null default '',
    memo varchar(255) not null default '',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    patient_id varchar(255) not null,
    --
    FOREIGN KEY(patient_id) REFERENCES test_patient(id) ON DELETE CASCADE
);

create table test_health_insurance (
    id varchar(255) primary key,
    combination_number varchar(255) not null default '',        -- 組み合わせ番号
    rate_admission varchar(255) not null default '',            -- 入院負担率
    rate_out_patient varchar(255) not null default '',          -- 外来負担率
    non_display varchar(255) not null default '',               -- O: 外来非表示 I: 入院非表示 N: 非表示無し
    provider_class varchar(255) not null default '',            -- 保険の種類 060: 国保
    provider_number varchar(255) not null default '',           -- 保険者番号
    provider_name varchar(255) not null default '',             -- 保険制度名称　国保
    person_symbol varchar(255) not null default '',             -- 記号
    person_number varchar(255) not null default '',             -- 番号
    person_continuation varchar(255) not null default '',       -- 継続区分
    person_assistance varchar(255) not null default '',         -- 補助区分
    person_assistance_name varchar(255) not null default '',    -- 補助区分名称
    relation_to_person varchar(255) not null default '',        -- 本人家族区分 1: 本人 0: 家族
    rate_class varchar(255) not null default '',                -- 高齢者負担割 （10: 1割, 30: 3割, 未設定とそれ以外は1割）
    person_name varchar(255) not null default '',               -- 被保険者名
    start_date varchar(255) not null default '',                -- 適用開始日
    expired_date varchar(255) not null default '',              -- 適用終了日
    check_date varchar(255) not null default '',                -- 最終確認日
    memo varchar(255) not null default '',
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    patient_id varchar(255) not null, 
    --
    FOREIGN KEY(patient_id) REFERENCES test_patient(id) ON DELETE CASCADE
);

create table r_bundle (
    id varchar(255) primary key,
    karte_id varchar(255) not null,
    facility_id varchar(255) not null,
    patient_id varchar(255) not null,
    physician_id varchar(255) not null,
    dept_id varchar(255) not null default '',
    dept_name varchar(255) not null default '',
    his_id varchar(255) not null default '',  -- 適用保険
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    batch_no integer not null default 0,
    "group" varchar(255) not null,
    --
    rcp_provider_number varchar(255) not null default '', -- 保険者番号
    rcp_cover_cost varchar(255) not null default '', -- 負担者区分
    rcp_code varchar(255) not null, -- レセプトコード（診療種別）
    rcp_name varchar(255) not null, -- レセプト名称
    rcp_tensu varchar(255) not null, -- 請求PIVOT用点数
    rcp_kaisu varchar(255) not null,  -- 回数 = bundle quantity
    rcp_hash varchar(255) not null default '', -- PIVOT用ハッシュ
    rcp_examined_at varchar(255) not null default '', -- 診療内容
    rcp_claim_month varchar(255) not null default '', -- 請求月
    rcp_day_at varchar(255) not null default '', -- 診療日
    --
    FOREIGN KEY(karte_id) REFERENCES m_karte_entry(id) ON DELETE CASCADE
);

create table r_item (
    id varchar(255) primary key,
    bundle_id varchar(255) not null,
    facility_id varchar(255) not null,
    patient_id varchar(255) not null, 
    physician_id varchar(255) not null,
    dept_id varchar(255) not null default '',                   -- Send ORA
    dept_name varchar(255) not null default '',                 -- Display purpose
    his_id varchar(255) not null default '',  -- 適用保険
    created_at varchar(255) not null,
    updated_at varchar(255) not null,
    status varchar(255) not null default 'F',
    --
    code varchar(9) not null,
    name varchar(255) not null,
    tensu_type varchar(255) not null default '',
    tensu varchar(255),
    quantity varchar(255) not null,
    unit_code varchar(255) not null default '',
    unit varchar(255) not null default '',
    injected boolean not null default false,
    --
    cost varchar(255) not null default '', -- 医療機関購入価格
    unit_code_22 varchar(255) not null default '', --別表22
    --
    rcp_batch_no integer not null default 0, -- バッチ番号
    rcp_rec_type varchar(255) not null, -- レコードタイプ SI IY TO CO
    rcp_code varchar(255) not null, -- レセプトコード（診療識別 11 12 21....）
    rcp_cover_cost varchar(255) not null, -- 負担者区分
    rcp_quantity varchar(255) not null default '', -- 数量
    rcp_tensu varchar(255) not null default '', -- 請求点数
    rcp_kaisu varchar(255) not null default '1', -- 回数
    rcp_unit_code varchar(255) not null default '', -- 単位コード
    rcp_unit_price varchar(255) not null default '', -- 単価
    rcp_spare varchar(255) not null default '', -- 単位
    rcp_product_name varchar(300) not null default '', -- 製品名
    rcp_cmt_code_1 varchar(9) not null default '',
    rcp_cmt_name_1 varchar(100) not null default '',
    rcp_cmt_code_2 varchar(9) not null default '',
    rcp_cmt_name_2 varchar(100) not null default '',
    rcp_cmt_code_3 varchar(9) not null default '',
    rcp_cmt_name_3 varchar(100) not null default '',
    --
    rcp_date varchar(255) not null default '', -- 診療日 1-31
    FOREIGN KEY(bundle_id) REFERENCES r_bundle(id) ON DELETE CASCADE
);

create table r_dayliy_receipt (
    id varchar(255) primary key,
    facility_id varchar(255) not null,
    visit_id varchar(255) not null,
    patient_id varchar(255) not null,
    physician_id varchar(255) not null,
    dept_id varchar(255) not null default '',
    dept_name varchar(255) not null default '',
    created_at varchar(255) not null default '',
    updated_at varchar(255) not null default '',
    status varchar(255) not null default 'F',
    --
    date_of_exam varchar(255) not null default '', -- 診療日
    insurance_id varchar(255) not null default '', -- 健康保険
    total_tensu varchar(255) not null default '', -- 合計点数
    contribution_insurance varchar(255) not null default '', -- 保険負担金額
    contribution_none_insurance varchar(255) not null default '', -- 自費負担金額
    billing_fee varchar(255) not null default '', -- 請求金額
    carry_over varchar(255) not null default '', -- 繰越金額
    total_billing varchar(255) not null default '', -- 請求合計金額
    payment varchar(255) not null default '' -- 支払金額
);

-- user-facility association
create index on users_facilities(user_id);
create index on users_facilities(facility_id);
create index on m_time_schedule(facility_id);
create index on m_week_schedule(schedule_id);
create index on m_holiday(schedule_id);

-- patient and fk
-- unique(facility_id, pt_id)
create index on m_patient(facility_id, full_name);
create index on m_patient(facility_id, kana);
create index on m_address(patient_id);
create index on m_health_insurance(patient_id);
create index on m_public_health_insurance(insurance_id);

-- pvt
create index on m_patient_visit(facility_id, pvt_date_time);

-- risk
create index on m_allergy(facility_id, patient_id, created_at);
create index on m_infection(facility_id, patient_id, created_at);
create index on m_blood_type(facility_id, patient_id, created_at);
create index on m_life_style(facility_id, patient_id, created_at);
create index on m_family_history(facility_id, patient_id, created_at);
create index on m_past_history(facility_id, patient_id, created_at);
create index on m_childhood(facility_id, patient_id, created_at);
create index on m_vaccination(facility_id, patient_id, created_at);
create index on m_summary_memo(facility_id, patient_id);

-- diagnosis created_at? code? todo
create index on m_diagnosis(facility_id, patient_id, date_of_onset);

-- karte and fk  not on status(change freq)
create index on m_karte_entry(facility_id, patient_id, created_at);
create index on m_soa(karte_id);
create index on m_bundle(karte_id);
create index on m_claim_item(bundle_id);

-- document
create index on m_document_entry(facility_id, patient_id, issued_at);
create index on m_document(entry_id);

-- lab unique(fc_id:order_id)
create index on m_lab_module(fc_id, pt_id, sampling_date);
create index on m_lab_test(module_id);

-- using
create index on m_using_procedure(facility_id);
create index on m_using_input(facility_id);

-- input
create index on input_item(input_catalog_id);

-- notificaiton
create index on m_notification(facility_id);

-- disease stamp
create index on m_disease_stamp(facility_id, icd1012);

-- stamp
create index on m_stamp(facility_id, entity);
create index on m_stamp_item(stamp_id);

-- ping
create index on m_ping(facility_id, patient_id);

-- receipt
create index on r_bundle(karte_id);
create index on r_item(bundle_id);
create index on r_item(facility_id, patient_id, created_at);
create index on r_dayliy_receipt(facility_id, date_of_exam);
