# マゼラン

法令工学をベースとした「レセ一体型電子カルテシステム」を開発する。

</br>

## 基本構成

* 図にレセプトサーバーの基本構成を示す。
* サーバーは DI コンテナとして実装する

 ![Receipt Archtecture](docs/images/Z3-13.jpg?raw=true "Magellan")

## 処理の流れ

* カルテから診療行為が送信される
* （１）送信された診療行為を算定回数フィルターに通す。（算定回数制約と実績から上限を超えている診療行為をドロップする）
* （２）カルテの内容から、暗黙的に算定できるもの、加算できるものを追加する。＊２）
* （３）追加分の診療行為をもう一度算定回数フィルターに通す。
* （４）全ての診療行為の排反チェックを行う。
* （５）診療行為の区分ごとに点数の計算を行う。
* （６）会計用及び月次請求用のレセプトを作成する。

## ＊２）加算項目等の追加

* （１）追加できる可能性がある全ての項目を論理式で表し、テキストファイルに定義する。
* （２）これを　LARK をベースとしたパーサーでZ3の論理式に変換する。
* （３）パースした全ての論理式を Solver に追加する。
* （４）カルテが保存された時の状況から、年齢、時刻、施設基準、届出、検査内容　等々を抽出し、上記Solverのパラメータに設定する。
* （５）充足する条件を解析し、True になる診療行為のみ、元の電子カルテへ追加する

#### Z3 パーサー

```python
from lark import Lark, Transformer, v_args
from z3 import *

@v_args(inline=True)  # This decorator allows passing arguments directly
class Z3Transformer(Transformer):
   def atom(self, name):
       return Bool(name)

   def and_expr(self, first, *rest):
       return And(first, *rest)

   def or_expr(self, first, *rest):
       return Or(first, *rest)
   
   def not_expr(self, expr):
       return Not(expr)

   def xor_expr(self, left, right):
       return Xor(left, right)

   def if_expr(self, cond, true_expr, false_expr):
       return If(cond, true_expr, false_expr)

   def variable(self, name):
       return Bool(name)

class Z3Parser:
    grammar = """
    ?start: expression

    ?expression: atom
            | and_expr
            | or_expr
            | not_expr
            | xor_expr
            | if_expr

    and_expr: "And" "(" expression ( "," expression)* ")"
    or_expr: "Or" "(" expression ( "," expression)* ")"
    not_expr: "Not" "(" expression ")"
    xor_expr: "Xor" "(" expression "," expression ")"
    if_expr: "If" "(" expression "," expression "," expression ")"

    atom: VAR -> variable

    VAR: /[a-zA-Z_\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF][a-zA-Z0-9_\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]*/

    %import common.WS
    %ignore WS
"""
    def __init__(self):
        self.parser = Lark(self.grammar, start='start', parser='lalr', transformer=Z3Transformer())

    def parse(self, text):
        return self.parser.parse(text)
```

## Z3 を使用する

* 仕様書は形式言語で書かない限り実装には齟齬が生じる（寺町先生）
* 業務用ソフトウェアはテストケースが膨大となり、法令工学でしかカバーできない（安光さん）
* Z3 はソフトウェアの検証やセキュリティチェック等に使用されている（ChatGPT）

#### 実装試験

* 対象　支払い基金に請求する際のCSVデータ仕様（電子レセプトの作成手引き 132ページ）
* 点数、数量、単位が文脈によって意味が変わる（単純な　単価x数量　の和ではない）
* 項目によって、出力が必要であったり、してはいけなかったり、オプションだったりする
* わかり易くない日本語がある　読むと不安になる...知りたい事がなかなか...

#### 注意

* 対象は制約を解く問題ではなく、仕様をZ3で表し、その解を実データにマッピングすること

#### 手順比較

* 通常方法
  * map、filter、reduce、リスト内包表記 等でインライン的にデータを生成
  * 対象や文脈で処理が異なる場合は、専用のクラスを生成し、メソッドの中にルールを隠蔽する（オブジェクト指向的アプローチ）
* Z3
  * 得たいデータをZ3変数で表す
  * ルールを隠蔽しないで、Z3変数の論理式で表し、solver に全て加える
  * sat になったらZ3変数を実データにマッピングする

#### 感想

* 普通はやはりオブジェクト指向を選択すると思うが、、、
* 一旦解を得てから実データを得るのは、妙にいいところがある ^^;

#### 改良案

* 論理式はテキストで書いて外出しする（加算項目の Auto Injection で行っている方法）
* Z3変数の値を実データに変換するのは、マッパーclassを開発する
* 文字列を編集する必要がある場合、一旦 Int 変数（or EnumSort）で答えを得て、それを引数に別の関数をコールする

<br/>
  
## 初めての方へ（第一段階の目標）

* 電子カルテから診療行為の集合を受け取り、それぞれに「算定可否」の判定をつけて返す
  * 診療行為:　医師が患者に対して行う治療行為（処方、注射、手術、検査 等々で 2023/11/13現在 9,100 種類ある）
  * 算定可否:　支払い基金に請求できると判断すること、審査をパスして報酬を受け取ること、審査に不合格で返戻になること、等を包括した概念
* 法令工学を応用し、矛盾のない算定可否を判定する

|                        | | | | |
|------------------------|--|--|--|--|
| カルテから受信した診療行為 | A | B | C | D | E |  
| 開発システムの判定 | ○ | x | ○ | x | ○ |

</br>

## 法令工学が必要な理由 - 診療行為の制約 -

診療行為は施行した全てを算定できるわけではなく、以下のような制約付きのものがある。今二つの診療行為 A と B があるとすると、

* 包括・被包括の関係
  * B は Aに包括され、A しか算定できない
* 背反関係
  * A と B はどちらか一方しか算定できない
* 算定回数
  * A は１日に１回しか算定できない。 B は一月に2回までしか算定できない...
  
また制約にはそれを適用する単位（集計期間）が定められている。

* １日について適用されるもの
  * 同じ日に A と B を行った場合...
* 同一月内について適用されるもの
  * 同じ月内に A と B を行った場合...
* 同時の時に適用されるもの
  * A B を同時に行った場合...
* 同一の週について適用されるもの
  * 日曜日から始まって土曜日までの同じ週の A と B について...

</br>

診療行為の制約は法令により文書で定められている。これは膨大で難解である。そのため、請求する側の病院とそれを審査する側の支払い基金との間に、業界用語の「解釈の違い」が生じ、「取れると思ったのに取れない」 トラブルが頻発する。取れなかった場合は収入が減少するのは勿論、入金も遅れるなど、病院にとっては経営的に大きな痛手である。こうしたことから、請求ノウハウを支援する会社が少なからずある。
ここに法令工学を応用し、矛盾を解決する理由がある。

</br>

## 医科電子点数表

上記の混乱を避けるため、支払い基金も「算定ルールの明確化や算定ロジックを機械可読にする電子テーブル」を開発している。そして支払い基金はこのテーブル、「医科電子点数表」を元に審査することが公表されている。この表は下記のテーブルから構成されており、すべての診療行為について制約があるかどうか分かる仕組みになっている。

* 補助マスター:　全ての診療行為に対して、それが次のどのテーブルと関係しているかを示す
* 包括・被包括テーブル:　他の診療行為に包括される診療行為を収載
* 背反テーブル:　他の診療行為との併算定ができない診療行為を収載したもので、次の４種類がある
  * １日につき背反となるもの
  * 同一の月内で背反となるもの
  * 同時の場合に背反となるもの
  * 同一の週（日曜日から始まって土曜日までの同じ週）につき背反となるもの
* 入院基本料テーブル:　入院基本料と入院基本料加算の加算算定可否の相関関係を表す
* 算定回数テーブル:　当該診療行為の算定単位ごとの算定回数を表す

#### 制約の件数（2023/11/13現在）

 | マスター | 登録件数 | 備考 |
|---------|--------|--|
| 補助テーブル | 9,100 | すべての診療行為に対する制約の有無 |
| 包括・被包括テーブル | 202,206 | 表裏の関係含む |
| １日につき背反となもの | 33,384 | 表裏の関係含む |
| 同一の月内で背反となるもの | 19,696 | 表裏の関係含む |
| 同時の背反 | 15,876 | 表裏の関係含む |
| １週間につき背反となもの | 360 | 表裏の関係含む |
| 入院基本料 | 5,941 | |
| 算定回数制限 | 3,647 |  |
| 病名マスター | 27,298 | |
| 診療行為マスター | 9,100 |  = 補助マスターの件数 |
| 医薬品マスター | 20,439 | 内服、外用、点眼... |
| 特定器材マスター | 1, 317 | フィルム・ガーゼ...  |
| 用法マスター | 3,174 | 電子処方箋対応 |

#### いくつかの件数

 | 項目 | 件数 | 対応マスター件数 |  備考 |
|---------|--------|--|----|
| 1日で背反となる診療行為 | 1,196 | 33,384 | 1,196!　通りあるわけではない |
| 同一月内で背反となる診療行為 | 1,035 | 19,696 | |
| 同時で背反となる診療行為 | 1,529 | 15,876 |  |
| 1週間で背反となる診療行為 | 108 | 360 |  |
| 包括診療行為 | 1,162 | 202,206 |  |  
| 算定回数制限のある診療行為 | 3,206 | 3,647 |  |
| 制約のない診療行為 | 4,763 |  | 役半分は制約なし |

</br>

## 法令工学アプローチ

今回は法律文書ではなく上記の医科電子点数表を述語論理化し、Z3 等の SAT/SMT ソルバーで矛盾のない算定可否を判定する。すでに片山先生から基本原理と具体的プログラムをいただいている。  

#### レセプト背反処理の原理的記述

```
Ｖ: 全医療行為の集合
Ｅ(⊆Ｖ×Ｖ): 背反医療行為対の集合
Ｓ(⊆Ｖ): レセプト

Ｓが背反条件を満たす<=>
　　 任意の v1,v2 in Ｓ について，(v1,v2)はＥには属さない
        すなわち，レセプトＳの中には背反医療行為対が存在しない．
```

充足性判定によるレセプト背反性判定

```
医療行為vを命題変数と考えて，次の命題論理式ＰとＱを作る．
Ｐ＝And([Not(And(v1,v2)) | for (v1,v2) in Ｅ])
Ｑ＝And([v | for v in Ｓ])
このとき次が成立する．

定理　「Ｓが背反条件を満たす <=> And(P,Q) が充足可能」
```

#### 具体的プログラム

```Python
from z3 import *
A,B,C,D,E=Bools(‘A B C D E’) # 診療行為
背反=lambda p,q:Not(And(p,q))
s=Solver()
# 背反医療行為：P=And(背反(A,B),背反(B,C),背反(D,E))
s.add(背反(A,B)) 
s.add(背反(B,C))
s.add(背反(D,E))
＃レセプト：Q=And(A,C,D)
s.add(A) 
s.add(C)
s.add(D)
if s.check()==sat:
    print('レセプトは背反問題なし')
    print(s.model())
else:
    print('レセプトは背反問題あり’)
#[A = True, D = True, B = False, E = False, C = True] 
```

```python
# レセプトABD　背反に違反
s=Solver()
# 背反医療行為対　背反(A,B),背反(B,C),背反(D,E)
s.add(背反(A,B))
s.add(背反(B,C))
s.add(背反(D,E))
# レセプトABD
s.add(A)
s.add(B)
s.add(D)
if s.check()==sat:
    print('レセプトは背反問題なし')
    print(s.model())
else:
    print('レセプトは背反問題あり’)

# レセプトは背反問題あり
# unsat 
```

```python
# レセプトの背反情報の検出
s=Solver()
# 背反医療行為対　背反(A,B),背反(B,C),背反(D,E)
s.assert_and_track(背反(A,B),'pAB')  # pABはタグ
s.assert_and_track(背反(B,C),'pBC')
s.assert_and_track(背反(D,E),'pDE')
# レセプトABD
s.assert_and_track(A,'pA')
s.assert_and_track(B,'pB')
s.assert_and_track(D,'pD')
if s.check()==sat:
    print('レセプトは背反問題なし')
    print(s.model())
else:
    print('レセプトは背反問題あり')
    print('unsat_core=',s.unsat_core())

#レセプトは背反問題あり
```

###

背反7：1週間につき背反

* レセプトRが背反7を満たす
 ⇔ 次を満たす医療行為のインスタンスの対(a,d1), (b,d2)がRに存在しない.  
 (a,b) in 背反7 かつ　|d1-d2|<=7  
　このためには，レセプトR中の診療記録に日付を付加する．  
　　R={(a,d)|a:診療行為, d:日付}  
* 背反7をレセプトRに従ってインスタンス化する．
     背反7_R = {((a,d1),(b,d2))|(a,d1),(b,d2) in R, (a,b) in 背反7, |d2-d1|<=7}
* Rと背反7_Rに対して「充足性判定によるレセプトの背反性判定」を適用する．
* 背反7 => 背反7_R のコスト？

</br>

## プロトタイプ実装

#### 最初のターゲット

* クリニック等の小規模病院用のレセプトを想定し、プロトタイプ実装をした
* 患者来院 -> カルテ作成 -> レセプト計算（プロトタイプは支払い基金等の大規模システムにも拡張が可能である）
* 問題は命題 P と Q を作ることに帰着できる

#### P 作成

* カルテのすべての診療行為を抽出する
* 抽出した診療行為のすべての制約を検索する（補助テーブルを検索すれば制約があるかどうか、診療行為個々に分かる）
* 制約のある診療行為についてのみ、互いの対を作り、背反しているかどうかを判定する（包括及び背反マスターを検索する）
* これらの背反関係 Not(And(A, B)) を全のペアに対して作成し、 P へ加える  

#### Q 作成

* 算定回数制限のあるものについては、実績を取得し、今回のカルテで算定が可能かどうかの辞書を作成する。次のものに分類される。
  * 1日の実施回数
  * 同一月内の実施回数
  * 1週間における実施回数
* A, B が背反している場合、次の手順により Q へ投入する
  * A, B が共に算定回数をパスしているとき、背反区分により A または B を選ぶ　＊１）
  * どちらか一方のみ算定回数をパスしている場合、パスしている方を Q へ投入する
  * 共倒れの場合（AもBも算定回数の上限にあるとき） And(Not(A), Not(B)) を投入する
  * 上記は P 側の論理式 Not(And(A, B)) との積を満たす

#### Solve

* P のすべての And をとる
* Q のすべての And をとる
* And(And(P), and(Q)) が充足するかどうかどうかを check する

#### ＊1）背反区分

* 背反区分は３通りある A, B が背反の場合、
  * 背反区分1 -> A をとる
  * 背反区分2 -> B をとる
  * 背反区分3 -> どちらか一方を選択できる -> Xor(A, B) で可能
  * 3は充足条件を満たすものが２種類存在するので、解を探索できるようにする

```python
s.chaeck を while文 に入れ、処理の最後で充足モデルの Not を制約に加える
 while(s.check() == sat):
        m = s.model()
        .....
        s.add(Not(And(b[i] == m[b[i]])))
```

</br>

## 実装後、SAT ソルバーを使用すべき理由があらためて分かったこと

* 包括・背反・算定回数ルールを、論理式、つまりPとQの作成問題に帰着できたので、実装のゴールがすぐ近くにあることが分かり、非常に少ない労力で達成できた
* このアプローチはそのまま長期に耐えうるものであり、機能拡張やメンテナンスにおいても、はるかに良い見通しを得ることができた
* これを従来型の if then else switch で解を得ようとすると、バグが入り込みやすくなり、検証にも多大の労力が必要となる。また言語依存性が高くなり、長期的なメンテナンスも困難となる

```python
未熟児をインキュベートし、酸素吸入と喀痰吸引をおこなった場合
  
背反マスターの定義（表裏の関係を含む）
------------------------------------
喀痰吸引:インキュベーター 背反=1日 区分=どちらか一方
酸素吸入:インキュベーター 背反=1日 区分=インキュベータ
インキュベーター:酸素吸入 包括 包括単位=1日
インキュベーター:喀痰吸引 背反=1日 区分=どちらか一方
インキュベーター:酸素吸入 背反=1日 区分=インキュベータ
  

マスターをパースして自動生成した命題
------------------------------------
P = And(Not(And(喀痰吸引, インキュベータ)),
        Not(And(酸素吸入, インキュベータ)),
        Not(And(インキュベータ, 酸素吸入)),
        Not(And(インキュベータ, 喀痰吸引)))
  

区分に従って採用した診療行為　＊
------------------------------------
Q = And(Xor(喀痰吸引, インキュベータ), インキュベータ, Xor(インキュベータ, 喀痰吸引))
  


充足可能な算定
------------------------------------
1  140003810      喀痰吸引   0
2  140005610      酸素吸入   0
3  140028410  インキュベーター   1
  

  
＊ 算定回数制限を考慮している
A と B の診療行為について

1. A も B も算定回数の制限に達していない場合 -> 区分に従って、A, B, Xor(A, B) の３通りをとる
2. どちらか一方のみ制限に達している場合 -> 達していない方を採用
3. どちらも制限に達している場合 -> And(Not(A), Not(B))　を投入
上記はいずれも命題 P の論理式 Not(And(A, B)) との積を満たす

```

## スケールアップ

* 上記プログラムを、SNS システムで採用されているパブリッシュ・サブスクライブ型の非同期分散処理システムへ、サブスクライバー（ワーカー）として組み込んだ。ワーカーの数を上げることで、その気になれば 秒100万 のレセプト検証システムも可能である。
 </br>

![Magellan System](docs/images/M-25.jpg?raw=true "Magellan System")
  
* large: カルテ及びレセプトデータベース
* small: マスターデータベース
* bridge: サーバーAPI
* probe: 電子カルテ&レセクライアント
* nebula: メディアサーバー
* iss: アクセストークン発行サーバー
* (magellanic)stream: パブリッシュ・サブスクライブ型プロセッサ（faust-streaming: Kafka + Python　による実装）
  * この中にレセプトTopic を設ける
  * 電子カルテが診療録をパブリッシュする
  * サブクライバーの法令レセがレセプトのチェックを行う
  * 算定結果はシンクがシステムへ通知する

</br>

## 第二段階のテーマ

* 診療行為と矛盾しない病名をつける
  * 偏頭痛の治療に血圧を下げる処方をした -> 偏頭痛以外に高血圧の病名が必要（本人は高血圧ではない）
* 加算の述語論理展開
  * ある一定の条件を満たすと、加算（金額が多くなる）がつく
* 各種届け出問題
  * 特定の施設基準を満たしていないと算定できない診療行為がある
* 予防接種スケジュール
  * 年齢、間隔、ワクチンの種類等、複雑なルールがある
* 同意・非同意の問題
* 等々

</br>

## 片山先生（参考文献）

* [国民年金法の述語論理による記述と検証　SMTソルバーZ3Pyを用いたケーススタディ　片山先生](https://web.archive.org/web/20200326070423id_/https://www.jstage.jst.go.jp/article/jssst/36/3/36_3_33/_pdf)
* [SATソルバーによるレセプト処理２](docs/SATソルバーによるレセプト処理２.pptx)
* [SATソルバーによるレセプト処理３](docs/SATソルバーによるレセプト処理３.pptx)
* [定理証明技術SATソルバーによるレセプト処理](docs/定理証明技術SATソルバーによるレセプト処理2.pptx)
 </br>

## リンク

* [基本マスター](https://www.ssk.or.jp/seikyushiharai/tensuhyo/kihonmasta/index.html)
* [医科電子点数表　活用の手引き・背反マスター](https://www.ssk.or.jp/seikyushiharai/tensuhyo/ikashika/index.html)
* [電子レセプト作成](https://www.ssk.or.jp/seikyushiharai/iryokikan/iryokikan_02.html)

* [電子処方箋 厚生労働省](https://www.mhlw.go.jp/stf/denshishohousen.html)
* [令和６年度診療報酬改定 コメント仕様あり](https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000188411_00045.html)
 </br>

### 変更履歴

#### 2024-04-10

* Auto Injection 追加

#### 2023-12-2

* ディレクトリ変更

#### 2023-11-13

* スクラッチリリース
