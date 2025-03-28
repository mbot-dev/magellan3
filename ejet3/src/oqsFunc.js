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

  // 限度額適用認定証同意フラグ
  OQSCD001(value) {
    if (value === '0') {
      return '未同意(0)'
    }
    if (value === '1') {
      return '同意(1)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 照会区分
  OQSCD002(value) {
    if (value === '1') {
      return 'マイナンバーカード(1)'
    }
    if (value === '2') {
      return '被保険者証情報(2)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 処理結果区分
  OQSCD003(value) {
    if (value === '1') {
      return '正常終了(1)'
    }
    if (value === '2') {
      return '処理中(2)'
    }
    if (value === '9') {
      return '異常終了(9)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 処理結果状況
  OQSCD004(value) {
    if (value === '1') {
      return '正常終了(1)'
    }
    if (value === '2') {
      return 'エラー(2)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 文字コード識別
  OQSCD005(value) {
    if (value === '1') {
      return 'UTF8(1)'
    }
    if (value === '2') {
      return 'Shift_JIS(2)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 資格有効性
  OQSCD006(value) {
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
      return '複数該当(5)'
    }
    if (value === '6') {
      return '有効（未登録）(6)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 性別
  OQSCD007(value) {
    if (value === '1') {
      return '男(1)'
    }
    if (value === '2') {
      return '女(2)'
    }
    if (value === '3') {
      return '未設定(3)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 資格喪失事由
  OQSCD008(value) {
    if (value === '01') {
      return '死亡(01)'
    }
    if (value === '02') {
      return '生活保護受給開始(02)'
    }
    if (value === '03') {
      return '医療保険等の資格取得(03)'
    }
    if (value === '99') {
      return '医療保険等の資格取得(99)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 本人・家族区分
  OQSCD009(value) {
    if (value === '1') {
      return '本人(1)'
    }
    if (value === '2') {
      return '家族(2)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 被保険者証区分
  OQSCD010(value) {
    if (value === '01') {
      return '一般(01)'
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
    if (value === '05') {
      return '特別療養費支給対象者(05)'
    }
    if (value === '06') {
      return '特例退職被保険者証(06)'
    }
    if (value === '07') {
      return '自衛官(07)'
    }
    if (value === 'A1') {
      return '医療扶助(A1)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 限度額適用認定証区分
  OQSCD011(value) {
    if (value === '01') {
      return '限度額適用区分認定証(01)'
    }
    if (value === '02') {
      return '限度額適用・標準負担額減額認定証(02)'
    }
    if (value === '03') {
      return '標準負担額減額認定証(03)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 限度額適用認定証適用区分
  OQSCD012(value) {
    if (value === 'A01') {
      return 'ア(A01)'
    }
    if (value === 'A02') {
      return 'イ(A02)'
    }
    if (value === 'A03') {
      return 'ウ(A03)'
    }
    if (value === 'A04') {
      return 'エ(A04)'
    }
    if (value === 'A05') {
      return 'オ(A05)'
    }
    if (value === 'A06') {
      return 'オ（境）(A06)'
    }
    if (value === 'B01') {
      return '現役並みⅢ(B01)'
    }
    if (value === 'B02') {
      return '現役並みⅡ(B02)'
    }
    if (value === 'B03') {
      return '現役並みⅠ(B03)'
    }
    if (value === 'B09') {
      // 後期高齢者
      return '一般Ⅱ(B09)'
    }
    if (value === 'B10') {
      // 後期高齢者
      return '一般Ⅰ(B10)'
    }
    if (value === 'B04') {
      // 70歳～74歳高齢者
      return '一般(B04)'
    }
    if (value === 'B05') {
      return '低所得Ⅱ(B05)'
    }
    if (value === 'B06') {
      return '低所得Ⅰ(B06)'
    }
    if (value === 'B07') {
      return '低所得Ⅰ（老福）(B07)'
    }
    if (value === 'B08') {
      return '低所得Ⅰ（境）(B08)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 特定疾病療養受療証認定疾病区分
  OQSCD013(value) {
    if (value === '1') {
      return '人工透析を必要とする慢性腎不全'
    }
    if (value === '2') {
      return '先天性血液凝固因子障害（第VIII因子、第IX因子）'
    }
    if (value === '3') {
      return '血液凝固因子製剤の投与に起因するHIV感染症'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 限度額適用認定証情報変更有無
  OQSCD014(value) {
    if (value === '0') {
      return '変更なし(0)'
    }
    if (value === '1') {
      return '変更あり または 判定不能(1)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 未就学区分
  OQSCD015(value) {
    if (value === '1') {
      return '未就学該当(1)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 同意区分
  OQSCD016(value) {
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
    return value ? `Invalid Value: ${value}` : ''
  }

  // 処方箋発行形態
  OQSCD017(value) {
    if (value === '1') {
      return '電子処方箋(1)'
    }
    if (value === '2') {
      return '紙の処方箋(2)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 医療券・調剤券別
  OQSCD018(value) {
    if (value === '01') {
      return '医療券(01)'
    }
    if (value === '02') {
      return '調剤券(02)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 診療別
  OQSCD019(value) {
    if (value === '01') {
      return '入院(01)'
    }
    if (value === '02') {
      return '入院外(02)'
    }
    if (value === '03') {
      return '歯科(03)'
    }
    if (value === '04') {
      return '調剤(04)'
    }
    if (value === '05') {
      return '訪問看護(05)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 単独・併用別
  OQSCD020(value) {
    if (value === '01') {
      return '単独(01)'
    }
    if (value === '02') {
      return '併用(02)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 社会保険状況
  OQSCD021(value) {
    if (value === '01') {
      return 'あり(01)'
    }
    if (value === '02') {
      return 'なし(02)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 社会保険状況の整合性フラグ
  OQSCD022(value) {
    if (value === '1') {
      return '不整合あり(1)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 感染症の予防及び感染症の患者に対する医療に関する法律第37条の2の該当状況
  OQSCD023(value) {
    if (value === '01') {
      return 'あり(01)'
    }
    if (value === '02') {
      return 'なし(02)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 後期高齢者医療の該当状況
  OQSCD024(value) {
    if (value === '01') {
      return 'あり(01)'
    }
    if (value === '02') {
      return 'なし(02)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 都道府県費の該当状況
  OQSCD025(value) {
    if (value === '01') {
      return 'あり(01)'
    }
    if (value === '02') {
      return 'なし(02)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 指定医療機関確認フラグ
  OQSCD026(value) {
    if (value === '0') {
      return '一致(0)'
    }
    if (value === '1') {
      return '不一致(1)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 同一個人有無フラグ
  OQSCD027(value) {
    if (value === '1') {
      return '同一個人あり(1)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 診療区分
  OQSCD028(value) {
    if (value === '1') {
      return '外来(1)'
    }
    if (value === '2') {
      return '訪問診療等(2)'
    }
    if (value === '3') {
      return 'オンライン診療等(3)'
    }
    if (value === '4') {
      return '救急時(4)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 医療情報種別
  OQSCD029(value) {
    if (value === 'TKK') {
      return '特定健診情報(TKK)'
    }
    if (value === 'YZK') {
      return '薬剤情報等(YZK)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 薬剤情報等
  OQSCD030(value) {
    if (value === '0') {  
      return '表示しない(0)'
    }
    if (value === '1') {
      return '表示する(1)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 同意有効期限切れ理由
  OQSCD031(value) {
    if (value === '0') {
      return '診療形態毎に異なるため、３．コード定義に関する補足を参照(0)'
    }
    if (value === '1') {
      return '医療機関による同意取り消し(1)'
    }
    if (value === '2') {
      return '患者による同意取り消し(2)'
    }
    if (value === '3') {
      return '用途変更による同意取り消し(3)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 資格情報変更確認フラグ
  OQSCD032(value) {
    if (value === '0') {
      return '一致(0)'
    }
    if (value === '1') {
      return '不一致(1)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // URL取得区分
  OQSCD033(value) {
    if (value === '2') {
      return '訪問診療等(2)'
    }
    if (value === '3') {
      return 'オンライン診療等(3)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // URL取得区分
  OQSCD034(value) {
    if (value === '1') {
      return 'PDF形式(1)'
    }
    if (value === '2') {
      return 'PNG形式(2)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // URL取得区分
  OQSCD035(value) {
    if (value === '0') {
      return '変更しない(0)'
    }
    if (value === '1') {
      return '変更する(1)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 閲覧同意情報種別
  OQSCD036(value) {
    if (value === 'TSR') {
      return '特定疾病療養受療証情報(TSR)'
    }
    if (value === 'TKK') {
      return '特定健診情報(TKK)'
    }
    if (value === 'YZK') {
      return '薬剤情報 / 薬剤・処方(YZK)'
    }
    if (value === 'SRJ') {
      return '診療情報 / 診療・その他アレルギー等・薬剤アレルギー等・検査情報(SRJ)'
    }
    if (value === 'SHJ') {
      return '手術情報 / 手術・傷病名・感染症情報(SHJ)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 利用設定区分
  OQSCD037(value) {
    if (value === '0') {
      return '利用しない(0)'
    }
    if (value === '1') {
      return '利用する(1)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 電子処方箋利用区分
  OQSCD038(value) {
    if (value === '0') {
      return '利用しない(0)'
    }
    if (value === '1') {
      return '電子処方箋のみ(1)'
    }
    if (value === '2') {
      return '電子処方箋+紙の処方箋併用(2)'
    }
    if (value === '3') {
      return '紙の処方箋のみ(3)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 処方箋発行形態選択タイミング
  OQSCD039(value) {
    if (value === '1') {
      return '資格確認時以外で確認する(1)'
    }
    if (value === '2') {
      return '資格確認時に確認する(2)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 情報要求パターン
  OQSCD040(value) {
    if (value === '1') {
      return '救急用サマリ―(1)'
    }
    if (value === '2') {
      return '救急用全量版(2)'
    }
    if (value === '3') {
      return '電子処方箋+救急用サマリ―＋救急用全量版(3)'
    }
    if (value === '4') {
      return '現行通りの薬剤情報(4)'
    }
    if (value === '5') {
      return '現行通りの診療／薬剤情報(5)'
    }
    if (value === '6') {
      return '現行通りの特定健診情報(6)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 二要素認証要素区分
  OQSCD041(value) {
    if (value === '1') {
      return '記憶(1)'
    }
    if (value === '2') {
      return '生体情報(2)'
    }
    if (value === '3') {
      return '物理媒体(3)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 二要素認証方式区分
  OQSCD042(value, v41) {
    if (v41 === '1') {
      if (value === '01') {
        return 'ID/パスワード(01)'
      }
      if (value === '02') {
        return '暗証番号(PINコード)(02)'
      }
      if (value === '03') {
        return '秘密の質問(03)'
      }
      return value ? `Invalid Value: ${value}` : ''
    }
    if (v41 === '2') {
      if (value === '01') {
        return '指紋認証(01)'
      }
      if (value === '02') {
        return '顔認証(02)'
      }
      if (value === '03') {
        return '音声認証(03)'
      }
      if (value === '04') {
        return '静脈認証(04)'
      }
      if (value === '05') {
        return '虹彩認証(05)'
      }
      return value ? `Invalid Value: ${value}` : ''
    }
    if (v41 === '3') {
      if (value === '01') {
        return 'ICカード(01)'
      }
      if (value === '02') {
        return 'ワンタイムパスワード(02)'
      }
      if (value === '03') {
        return 'その他の物理媒体(03)'
      }
      return value ? `Invalid Value: ${value}` : ''
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 救急時閲覧権限有無
  OQSCD043(value) {
    if (value === '0') {
      return '権限無し(0)'
    }
    if (value === '1') {
      return '権限あり(1)'
    }
    return value ? `Invalid Value: ${value}` : ''
  }

  // 連携システムID
  OQSCD044(value) {
    if (value === '01') {
      return '医療費助成(01)'
    }
    if (value === '2') {
      return '母子保健(2)'
    }
    if (value === '4') {
      return '予防接種(4)'
    }
    if (value === '8') {
      return '介護保険(8)'
    }
    return value ? `Invalid Value: ${value}` : ''
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
}

module.exports = OqsFunc
