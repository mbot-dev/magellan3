const fs = require("fs");
const chokidar = require("chokidar");
const convert = require("xml-js");
const OqsFunc = require("./oqsFunc");

const STATUS_PENDING = "pending";
const STATUS_WATCHING = "watching";
const STATUS_ERROR = "error";
const URL_TO_FACE = "https://dashing-skunk-nominally.ngrok-free.app/karte/api/v1/pvt/face";
// const URL_TO_FACE = "http://localhost:8066/karte/api/v1/pvt/face";
const DEBUG = false;
const DEBUG_PARSED = true;
const POST = true;
const DELETE = true;

// 被保険者証一部負担金割合 = 数値 ただし 1割負担=010 等に設定されている
// 上記以外は全て文字列
// Databse は全て文字列で格納する
// 無効: 40 41
// ResultOfQualificationConfirmation=2: 47, 50,

const HEADER_ELEMENTS = [
  { name: "処理実行日時", key: "ProcessExecutionTime" },
  { name: "資格確認日", key: "QualificationConfirmationDate" }, // yyyyMMdd
  { name: "医療機関コード", key: "MedicalInstitutionCode" },
  { name: "任意のファイル識別子", key: "ArbitraryFileIdentifier" },
  { name: "照会区分", key: "ReferenceClassification" }, // string  1: マイナンバーカード  2: 被保険者証情報
  { name: "処理結果区分", key: "SegmentOfResult" }, // string  1: 正常終了  2: 処理中  3: 異常終了
  { name: "エラーコード", key: "ErrorCode" }, // SegmentOfResult != 1 の場合のみ 別紙6-1 処理結果コード
  { name: "エラーメッセージ", key: "ErrorMessage" },
  { name: "文字コード識別", key: "CharacterCodeIdentifier", drop: true }, // string 0: UTF-8  1: SHIFT_JIS
];

const QualificationConfirmSearchInfo = [
  { name: "保険者番号", key: "InsurerNumber" },
  { name: "被保険者証記号", key: "InsuredCardSymbol" },
  { name: "被保険者証番号", key: "InsuredIdentificationNumber" },
  { name: "被保険者証枝番", key: "InsuredBranchNumber" }, // string 注意
  { name: "生年月日", key: "Birthdate" }, // yyyyMMdd
  {
    name: "限度額適用認定証提供同意フラグ",
    key: "LimitApplicationCertificateRelatedConsFlg",
  }, // 0: 未同意  1: 同意
  { name: "任意のファイル識別子", key: "ArbitraryIdentifier" },
];

const BODY_ELEMENYS = [
  { name: "処方箋発行形態", key: "PrescriptionIssueSelect" }, // 患者が選択した処方箋の発行形態
  { name: "処理結果状況", key: "ProcessingResultStatus" }, // 個人単位でオンライン資格確認システムの処理結果を表す区分 1: 正常終了 2: 異常終了 別紙5-1_業務コード仕様 [OQSCD004]
  { name: "処理結果コード", key: "ProcessingResultCode" }, // 処理結果状況がエラーの場合及び正常終了で付帯情報がある場合 別紙6-1_処理結果コード
  { name: "処理結果メッセージ", key: "ProcessingResultMessage" }, // その内容 -> そのまま表示
  // 1: 有効
  // 2: 無効
  // 3: 無効（新しい資格あり）
  // 4: 該当資格なし
  // 5: 複数該当       医療保険: ○  医療扶助: X
  // 6: 有効（未登録）  医療保険: X  医療扶助: ○
  { name: "資格有効性", key: "QualificationValidity", len: 1 },
];

const ResultOfQualificationConfirmation = [
  { name: "被保険者証区分", key: "InsuredCardClassification" }, // 02: 被保険者証（退職） 03: 短期被保険者証（一般） 04: 短期被保険者証（退職）06: 特例退職被保険者証  A1: 医療扶助
  { name: "保険者番号", key: "InsurerNumber" },
  { name: "被保険者証記号", key: "InsuredCardSymbol" },
  { name: "被保険者証番号", key: "InsuredIdentificationNumber" },
  { name: "被保険者証枝番", key: "InsuredBranchNumber" },
  { name: "本人・家族の別", key: "PersonalFamilyClassification" }, // 1: 本人  2: 家族
  { name: "被保険者氏名(世帯主氏名)", key: "InsuredName" },
  { name: "氏名", key: "Name" },
  { name: "氏名（その他）", key: "NameOfOther" },
  { name: "氏名カナ", key: "NameKana" },
  { name: "氏名カナ（その他）", key: "NameOfOtherKana" },
  { name: "性別1", key: "Sex1" }, // 1: 男  2: 女  3: 未設定
  { name: "性別2", key: "Sex2" }, // 平成24年9月21日事務連絡 被保険者証の性別表記について」または「生活保護法による医療券等の記載要領について」（平成11年8月27日社援保第41号）に基づく取り扱いを実施している場合に設定する。
  { name: "生年月日", key: "Birthdate" },
  { name: "住所", key: "Address" }, // 保険者に届け出ている住所 カルテの住所と一致しない場合がある
  { name: "郵便番号", key: "PostNumber" },
  { name: "資格取得年月日", key: "QualificationDate" },
  { name: "資格喪失年月日", key: "DisqualificationDate" },
  { name: "被保険者証交付年月日", key: "InsuredCertificateIssuanceDate" },
  { name: "被保険者証有効開始年月日", key: "InsuredCardValidDate" },
  { name: "被保険者証有効終了年月日", key: "InsuredCardExpirationDate" },
  {
    name: "被保険者証一部負担金割合",
    key: "InsuredPartialContributionRatio",
    number: true,
  }, // 1割負担=010jjj
  { name: "未就学区分", key: "PreschoolClassification" }, // 1: 未就学  2: 就学中
  { name: "資格喪失事由", key: "ReasonOfLoss" }, // prefix=0 -> 01: 死亡  02: 生活保護受給開始  03: 医療保険等の資格取得  99: その他
  { name: "保険者名称", key: "InsurerName" },
  {
    name: "高齢受給者証情報",
    key: "ElderlyRecipientCertificateInfo",
    children: [
      {
        name: "高齢受給者証交付年月日",
        key: "ElderlyRecipientCertificateDate",
      },
      {
        name: "高齢受給者証有効開始年月日",
        key: "ElderlyRecipientValidStartDate",
      },
      {
        name: "高齢受給者証有効終了年月日",
        key: "ElderlyRecipientValidEndDate",
      },
      {
        name: "高齢受給者証一部負担金割合",
        key: "ElderlyRecipientContributionRatio",
      },
    ],
  },
  {
    name: "限度額適用認定証提供同意フラグ",
    key: "LimitApplicationCertificateRelatedConsFlg",
  },
  {
    name: "限度額適用認定証提供同意日時",
    key: "LimitApplicationCertificateRelatedConsTime",
  }, // YYYYMMDDHHmmss
  {
    name: "限度額適用認定証関連情報",
    key: "LimitApplicationCertificateRelatedInfo",
    children: [
      {
        name: "限度額適用認定証区分",
        key: "LimitApplicationCertificateClassification",
      },
      {
        name: "限度額適用認定証適用区分",
        key: "LimitApplicationCertificateClassificationFlag",
      },
      {
        name: "限度額適用認定証交付年月日",
        key: "LimitApplicationCertificateDate",
      },
      {
        name: "限度額適用認定証有効開始年月日",
        key: "LimitApplicationCertificateValidStartDate",
      },
      {
        name: "限度額適用認定証有効終了年月日",
        key: "LimitApplicationCertificateValidEndDate",
      },
      {
        name: "限度額適用認定証長期入院該当年月日",
        key: "LimitApplicationCertificateLongTermDate",
      },
    ],
  },
  {
    name: "特定疾病療養受療証提供同意フラグ",
    key: "SpecificDiseasesCertificateRelatedConsFlg",
  },
  {
    name: "特定疾病療養受療証提供同意日時",
    key: "SpecificDiseasesCertificateRelatedConsTime",
  },
  {
    name: "特定疾病療養受療証情報リスト",
    key: "SpecificDiseasesCertificateList",
    children: [
      {
        name: "特定疾病療養受療証情報",
        key: "SpecificDiseasesCertificateInfo",
        children: [
          {
            name: "特定疾病療養受療証認定疾病区分",
            key: "SpecificDiseasesDiseaseCategory",
          },
          {
            name: "特定疾病療養受療証交付年月日",
            key: "SpecificDiseasesCertificateDate",
          },
          {
            name: "特定疾病療養受療証有効開始年月日",
            key: "SpecificDiseasesValidStartDate",
          },
          {
            name: "特定疾病療養受療証有効終了年月日",
            key: "SpecificDiseasesValidEndDate",
          },
          {
            name: "特定疾病療養受療証自己負担限度額",
            key: "SpecificDiseasesSelfPay",
          },
        ],
      },
    ],
  },
  {
    name: "特定健診情報閲覧同意フラグ",
    key: "SpecificHealthCheckupsInfoConsFlg",
  },
  {
    name: "特定健診情報閲覧同意日時",
    key: "SpecificHealthCheckupsInfoConsTime",
  },
  {
    name: "特定健診情報閲覧有効期限",
    key: "SpecificHealthCheckupsInfoAvailableTime",
  },
  { name: "薬剤情報閲覧同意フラグ", key: "PharmacistsInfoConsFlg" },
  { name: "薬剤情報閲覧同意日時", key: "PharmacistsInfoConsTime" },
  { name: "薬剤情報閲覧有効期限", key: "PharmacistsInfoAvailableTime" },
  { name: "診療情報閲覧同意フラグ", key: "DiagnosisInfoConsFlg" },
  { name: "診療情報閲覧同意日時", key: "DiagnosisInfoConsTim" },
  { name: "診療情報閲覧有効期限", key: "DiagnosisInfoAvailableTime" },
  { name: "手術情報閲覧同意フラグ", key: "OperationInfoConsFlg" },
  { name: "手術情報閲覧同意日時", key: "OperationInfoConsTime" },
  { name: "手術情報閲覧有効期限", key: "OperationInfoAvailableTime" },
];

const Check = [
  { name: "資格確認日", key: "QualificationConfirmationDate" }, // yyyyMMdd
  { name: "医療機関コード", key: "MedicalInstitutionCode" },
  {
    name: "処理結果状況",
    key: "ProcessingResultStatus",
    func: "ProcessingResultStatus",
    arg: ["ProcessingResultStatus"],
  },
  {
    name: "照会区分",
    key: "ReferenceClassification",
    func: "ReferenceClassification",
    arg: ["ReferenceClassification"],
  },
  {
    name: "資格有効性",
    key: "QualificationValidity",
    func: "QualificationValidity",
    arg: ["QualificationValidity"],
  },
  // Insurance Info
  {
    name: "被保険者証区分",
    key: "InsuredCardClassification",
    func: "InsuredCardClassification",
    arg: ["InsuredCardClassification"],
  },
  { name: "保険名称", key: "InsurerName" },
  { name: "被保険者証記号", key: "InsuredCardSymbol" },
  { name: "被保険者証番号", key: "InsuredIdentificationNumber" },
  {
    name: "本人家族区分",
    key: "PersonalFamilyClassification",
    func: "PersonalFamilyClassification",
    arg: ["PersonalFamilyClassification"],
  },
  { name: "被保険者氏名(世帯主氏名)", key: "InsuredName" },
  { name: "氏名", key: "Name" },
  { name: "氏名（その他）", key: "NameOfOther" },
  { name: "氏名カナ", key: "NameKana" },
  { name: "氏名カナ（その他）", key: "NameOfOtherKana" },
  { name: "性別1", key: "Sex1", func: "Sex", arg: ["Sex1"] }, // 1: 男  2: 女  3: 未設定
  { name: "性別2", key: "Sex2", func: "Sex", arg: ["Sex2"] }, // 平成24年9月21日事務連絡 被保険者証の性別表記について」または「生活保護法による医療券等の記載要領について」（平成11年8月27日社援保第41号）に基づく取り扱いを実施している場合に設定する。
  { name: "生年月日", key: "Birthdate" },
  {
    name: "高齢者",
    key: "ElderlyRecipientCertificateInfo",
    func: "ElderlyRecipientCertificateInfo",

    arg: ["ElderlyRecipientCertificateInfo"],
  },
  {
    name: "未就学児",
    key: "PreschoolClassification",
    func: "PreschoolClassification",
    arg: ["PreschoolClassification"],
  },
  { name: "被保険者証一部負担金割合", key: "InsuredPartialContributionRatio" }, // 1割負担=010jjj
  // 同意情報
  {
    name: "限度額",
    key: "LimitApplicationCertificateRelatedConsFlg",
    func: "LimitApplicationCertificateRelatedConsFlg",
    arg: ["LimitApplicationCertificateRelatedConsFlg"],
  },
  {
    name: "特定疾病",
    key: "SpecificDiseasesCertificateRelatedConsFlg",
    func: "SpecificDiseasesCertificateRelatedConsFlg",
    arg: ["SpecificDiseasesCertificateRelatedConsFlg"],
  },
  {
    name: "特定検診",
    key: "SpecificHealthCheckupsInfoConsFlg",
    func: "SpecificHealthCheckupsInfoConsFlg",
    arg: ["SpecificHealthCheckupsInfoConsFlg"],
  },
  {
    name: "薬剤",
    key: "PharmacistsInfoConsFlg",
    func: "PharmacistsInfoConsFlg",
    arg: ["PharmacistsInfoConsFlg"],
  },
  {
    name: "診療",
    key: "DiagnosisInfoConsFlg",
    func: "DiagnosisInfoConsFlg",
    arg: ["DiagnosisInfoConsFlg"],
  },
  {
    name: "手術",
    key: "OperationInfoConsFlg",
    func: "OperationInfoConsFlg",
    arg: ["OperationInfoConsFlg"],
  },
];

function lowercaseFirstChar(str) {
  if (!str) {
    return str;
  }
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function camelToSnake(str) {
  str = lowercaseFirstChar(str);
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function convertKeysToSnakeCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map((v) => convertKeysToSnakeCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const newKey = camelToSnake(key);
      result[newKey] = convertKeysToSnakeCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
}

class ResWatcher {
  constructor(emitter) {
    this.state = STATUS_PENDING;
    this.emitter = emitter;
    this.facilityId = null;
    this.token = null;
    this.watcher = null;
    this.parser = convert;
    this.oqsFunc = new OqsFunc();
  }

  start(directoryToWatch) {
    console.log(`Watching ${directoryToWatch} will start...`);
    if (!fs.existsSync(directoryToWatch)) {
      this.state = STATUS_ERROR;
      this.emitter.emit("error", `directory [${directoryToWatch}] not exsits.`);
      return;
    }
    if (this.state === STATUS_WATCHING) {
      this.emitter.emit("watching-event", "already watching");
      return;
    }
    this.state = STATUS_WATCHING;
    this.emitter.emit("watching-event", "watching started");
    this.watcher = chokidar.watch(directoryToWatch).on("all", (evt, path) => {
      console.log(evt, path);
      if (evt !== "add" || !path.endsWith(".xml")) {
        return;
      }
      fs.readFile(path, "utf8", (error, data) => {
        if (error) {
          console.log(`fs.readFile ${error}`);
        } else {
          this.handleXml(data, path);
        }
      });
    });
  }

  setLogin(facilityId, token) {
    this.facilityId = facilityId;
    this.token = token;
  }

  setToken(token) {
    this.token = token;
  }

  async stop() {
    if (this.state === STATUS_WATCHING) {
      await this.watcher.close();
      this.watcher = null;
      this.oqsFunc = null;
      this.state = STATUS_PENDING;
      this.emitter.emit("watching-event", "watching stopped");
      return;
    }
    this.emitter.emit("error", "not watching");
  }

  status() {
    return this.state;
  }

  extract2(ele, attrs, obj) {
    attrs.forEach((attr) => {
      const { key, children } = attr;
      const target = ele[key];
      if (children && target) {
        const o = {};
        obj[key] = o;
        this.extract2(target, children, o);
      } else {
        const val = ele[key]?.["_text"] ?? null;
        if (val && !attr.drop) {
          obj[key] = val;
        }
      }
    });
  }

  async handleXml(data, path) {
    try {
      const text = convert.xml2json(data, { compact: true, spaces: 4 }); // this.parser.parse(data)
      const json = JSON.parse(text);
      if (DEBUG_PARSED) {
        console.log(JSON.stringify(json, null, 3));
      }
      const visit = {};
      // Parse Heaader
      const header = json["XmlMsg"]?.["MessageHeader"];
      if (!header) {
        console.log("Error: No header");
        return;
      }
      //------------------------------------------
      // Return, not post to face
      //------------------------------------------
      if (header["SegmentOfResult"]["_text"] !== "1") {
        console.log("SegmentOfResult !== 1");
        if (header["ErrorCode"]) {
          console.log(
            `Error: ${header["ErrorCode"]} ${header["ErrorMessage"]}`,
          );
        }
        return;
      }
      // Parse Header
      console.log("Extraction started...");
      this.extract2(header, HEADER_ELEMENTS, visit);
      // Parse Body
      const body = json["XmlMsg"]?.["MessageBody"];
      if (body) {
        if (body?.["QualificationConfirmSearchInfo"]) {
          const ele = body["QualificationConfirmSearchInfo"];
          this.extract2(ele, QualificationConfirmSearchInfo, visit);
        }
        this.extract2(body, BODY_ELEMENYS, visit);

        const resultList = body["ResultList"];
        if (resultList) {
          const ele = resultList["ResultOfQualificationConfirmation"];
          this.extract2(ele, ResultOfQualificationConfirmation, visit);
        }
      }

      // Summry
      console.log("........................................");
      Check.forEach((attr) => {
        const { name, key, func, arg } = attr;
        if (func) {
          const args = arg ? arg.map((a) => visit[a]) : [];
          const val = this.oqsFunc[func](...args);
          console.log(`${name}(${key}) = ${val}`);
        } else {
          const val = visit[key] ?? "";
          console.log(`${name}(${key}) = ${val}`);
        }
      });
      console.log("........................................");

      // to snake case
      const converted = convertKeysToSnakeCase(visit);
      if (DEBUG) {
        console.log(JSON.stringify(converted, null, 3));
      }
      converted.facility_id = this.facilityId;

      // Upload
      if (POST) {
        const config = {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token.accessToken}`,
            "Content-Type": "application/json;charset=utf-8",
          },
          body: JSON.stringify(converted),
        };
        const res = await fetch(URL_TO_FACE, config);
        console.log(`API call status ${res.status} for ${URL_TO_FACE}`);
      }
      // Delete
      if (DELETE) {
        fs.unlink(path, () => {
          console.log(`Deleted ${path}`);
        });
      }
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = ResWatcher;
