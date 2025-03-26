class OqsFunc {
  nowAsOqsDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    return `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`
  }

  dateFromString(s) {
    const y = parseInt(s.substring(0, 4))
    const m = parseInt(s.substring(4, 6))
    const d = parseInt(s.substring(6))
    return new Date(y, m, d)
  }

  ageAt(birthDate, at) {
    if (!birthDate || !at) {
      return ''
    }
    const birth = this.dateFromString(birthDate)
    const now = this.dateFromString(at)
    const age = now.getFullYear() - birth.getFullYear()
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
      return age - 1
    }
    return age
  }

  ProcessingResultStatus(value) {
    // 個人単位でオンライン資格確認システムの処理結果を表す区分 1: 正常終了 2: 異常終了 別紙5-1_業務コード仕様 [OQSCD004]eturn value
    if (value === '1') {
      return '正常終了(1)'
    }
    if (value === '2') {
      return '異常終了(2)'
    }
    return `Invalid Value: ${value}`
  }

  ReferenceClassification(value) {
    if (value === '1') {
      return 'マイナンバーカード(1)'
    }
    if (value === '2') {
      return '被保険者証情報(2)'
    }
    return `Invalid Value: ${value}`
  }

  QualificationValidity(value) {
    if (value === '1') {
      return '有効(1)'
    }
    if (value === '2') {
      return '無効(2)'
    }
    if (value === '3') {
      return '無効（新しい資格あり）(3)'
    }
    if (value === '4') {
      return '該当資格なし(4)'
    }
    if (value === '5') {
      return '複数該当(5)' // 医療保険: ○  医療扶助: X
    }
    if (value === '6') {
      return '有効（未登録）(6)' // 医療保険: X  医療扶助: ○
    }
    return `Invalid Value: ${value}`
  }

  InsuredCardClassification(value) {
    // 01 被保険者証（一般）一般被保険者証
    // ※令和6年12月2日の制度改正（健康保険証の発行終了）以降、欠番扱いとするが、
    // 制度改正前に遡って資格確認された場合は制度改正前の名称（設定値）を返却する。
    // また、制度改正後に保険者が欠番になったコードを設定した資格情報を登録した場合は、
    // 医療機関にもそのまま返却する
    if (value === '01') {
      return '被保険者証（一般）(01)'
    }
    if (value === '02') {
      return '被保険者証（退職）(02)'
    }
    if (value === '03') {
      return '短期被保険者証（一般）(03)'
    }
    if (value === '04') {
      return '短期被保険者証（退職）(04)'
    }
    if (value === '06') {
      return '特例退職被保険者証(06)'
    }
    if (value === 'A1') {
      return '医療扶助(A1)'
    }
    return `Invalid Value: ${value}`
  }

  PersonalFamilyClassification(value) {
    // 後期高齢者
    if (!value) {
      return ''
    }
    if (value === '1') {
      return '本人(1)'
    }
    if (value === '2') {
      return '家族(2)'
    }
    return `Invalid Value: ${value}`
  }

  Sex(value) {
    // 性別2の値 設定なしのケース
    if (!value) {
      return ''
    }
    // 1: 男  2: 女  3: 未設定
    if (value === '1') {
      return '男(1)'
    }
    if (value === '2') {
      return '女(2)'
    }
    if (value === '3') {
      return '未設定(3)'
    }
    return `Invalid Value: ${value}`
  }

  ElderlyRecipientCertificateInfo(obj) {
    // 高齢受給者証情報
    if (!obj) {
      return '無'
    }
    const issued = obj['ElderlyRecipientCertificateDate']
    const start = obj['ElderlyRecipientValidStartDate']
    const end = obj['ElderlyRecipientValidEndDate']
    const ratio = obj['ElderlyRecipientContributionRatio']
    if (!issued && !start && !end && !ratio) {
      return '無'
    }
    const now = this.nowAsOqsDate()
    if (start && now >= start) {
      return '有'
    }
    if (end && now <= end) {
      return '有'
    }
    return '無'
  }

  PreschoolClassification(value) {
    if (!value) {
      return ''
    }
    if (value === '1') {
      return '未就学(1)'
    }
    if (value === '2') {
      return '就学中(2)'
    }
    return `Invalid Value: ${value}`
  }

  LimitApplicationCertificateRelatedConsFlg(value) {
    // 限度額適用証明提供同意フラグ
    if (!value) {
      return ''
    }
    if (value === '0') {
      return '未同意(0)'
    }
    if (value === '1') {
      
      return '同意(1)'
    }
    return `Invalid Value: ${value}`
  }

  SpecificDiseasesCertificateRelatedConsFlg(value) {
    // 特定疾病療養受療証提供同意フラグ
    return this.OQSCD016(value)
  }

  SpecificHealthCheckupsInfoConsFlg(value) {
    // 特定健診情報閲覧同意フラグ
    return this.OQSCD016(value)
  }

  PharmacistsInfoConsFlg(value) {
    // 薬剤情報閲覧同意フラグ
    return this.OQSCD016(value)
  }

  DiagnosisInfoConsFlg(value) {
    // 診療情報閲覧同意フラグ
    return this.OQSCD016(value)
  }

  OperationInfoConsFlg(value) {
    // 手術情報閲覧同意フラグ
    return this.OQSCD016(value)
  }

  OQSCD016(value) {
    // 0 同意なし
    // 1 同意あり
    // 2 同意有効期限切れ
    // 3 同意取得困難
    // 2：同意有効期限切れ」は訪問診療等・オンライン診療等のインターフェイスでのみ設定される。
    //「3：同意取得困難」は救急医療のインターフェイスでのみ設定される。
    if (!value) {
      return ''
    }
    if (value === '0') {
      return '同意なし(0)'
    }
    if (value === '1') {
      return '同意あり(1)'
    }
    if (value === '2') {
      return '同意有効期限切れ(2)'
    }
    if (value === '3') {
      return '同意取得困難(3)'
    }
    return `Invalid Value: ${value}`
  }
}

module.exports = OqsFunc
