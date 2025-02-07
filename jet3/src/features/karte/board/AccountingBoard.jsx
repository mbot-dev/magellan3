import { useEffect, useReducer, useRef } from 'react';
import styled from 'styled-components';
import { v4 } from 'uuid';
import sanitizeHtml from "sanitize-html";
import dateFormat from "dateformat";
import { useReactToPrint } from 'react-to-print';
import { useClerk } from "../../../hook/useClerk";
import { useFacility } from "../../../hook/useFacility";
import { useIntersectionObserver } from "../../../hook/useIntersectionObserver";
import { getHistory, postKarte } from "../../../io/karteIO";
import {
  GROUP_DIAGNOSIS, GROUP_FIRST_VISIT,
  GROUP_FOLLOW_UP_VISIT, isClaimGroup, VISIT_TYPE_FIRST, VISIT_TYPE_FOLLOW_UP
} from "../../../models/claim";
import {
  currFacility, incrementRevisionNumber, ISO_DATE_TIME, STATUS_FINAL, STATUS_NEW, STATUS_UPDATE
} from '../../../models/karteCtx';
import { useStateValue } from "../../../reducers/state";
import { fromNowRough } from '../../../util/dt2';
import { getRevision } from "./pManager";
import { StickyColumn, StickyBody } from '../../../aux/commonStyles';
import ContextMenu from "../../../cmp/ContextMenu";
import { DISCARD_TEXT, MODIFY, SAVE_TEXT } from "../../../aux/FormUtil";
import SOAEditor2 from './SOAEditor2';
import withDisplayBlock from "../../../aux/withDisplayBlock";
import { UndoButton, RedoButton } from "../../../cmp/IconButtons";
import DaingerSelection from '../../../cmp/DaingerSelection';
import DualRenderer from './DualRenderer';
import { useKarteState } from '../karteState';
import { AttributeLabel, AttributeValue, IndexRow, TimeCell, UpperLeft, SOACell } from './BoardCmp';
import SimpleAlert from '../../../cmp/SimpleAlert';
import { updateStatus } from '../../../io/pvtIO';
import { receiptInitialState, accountingReducer } from './accountingReducer';
import AccountingInvoice from './AccountingInvoice';
import AccountingDetail from './AccountingDetail';

const DESC = true;
const PAGE_SIZE = 6;
const DEBUG = false;

const ADDITIONAL_ATTRIBUTES = [
  { label: '受診時年齢', attr: 'ageAt', id: v4(), border: true },
  { label: '来院時刻', attr: 'pvtTime', id: v4() },
  { label: '診療科', attr: 'deptName', id: v4() },
  { label: '健康保険', attr: 'hisProviderName', id: v4() },
  { label: '医師', attr: 'phyFullName', id: v4() },
  { label: '代行入力', attr: 'clerkName', id: v4() },
  { label: 'バージョン', attr: 'revision', id: v4() },
];

const SELECTED = 'selected';
const EDITING = 'editing';
const EDIT_END = 'editEnd';

const AccountingBoard = ({ patient }) => {
  const [{ bundleArraySubmitted, bundleCopied, user, isOnline, settings }, dispatch] = useStateValue();
  const karteDispath = useKarteState()[1];
  const [{ boardState, render, fetchMode, karteList, entryDates, numKarte, kartePeriod, pivot, receiptPivot, selectedIndex, transitionError,
    alert, karteToDiscard, soaText, soaEditing, canUndo, canRedo, testPop, receiptMode, amount }, localDispatch] = useReducer(accountingReducer, receiptInitialState);
  const facility = useFacility(user);
  const clerk = useClerk(user);
  const element = useRef(undefined);
  const receiptRef = useRef(undefined);

  useIntersectionObserver(element, 0.1, () => {
    localDispatch({ type: 'nextPage' });
  });

  useEffect(() => {
    if (!patient.id || !facility || !render || !fetchMode || !user) {
      return;
    }
    const asyncGet = async (mode, fc_id, pt_id, limit, offset, client_order, render) => {
      try {
        const result = await getHistory(fc_id, pt_id, limit, offset, client_order, render);
        if (mode === 'reset') {
          localDispatch({ type: 'setData', payload: result });
          return;
        }
        if (mode === 'append') {
          localDispatch({ type: 'appendKarte', payload: result });
        }
      } catch (err) {
        localDispatch({ type: 'setTransitionError', payload: err.message });
      }
    };
    const { currPage, mode } = fetchMode;
    const facility_id = facility.id;
    const patient_id = patient.id;
    const limit = PAGE_SIZE;
    const offset = (currPage - 1) * PAGE_SIZE;
    const client_order = DESC ? 'desc' : 'asc';
    asyncGet(mode, facility_id, patient_id, limit, offset, client_order, render);

  }, [patient.id, facility, user, render, fetchMode, patient?.visit?.id]);

  useEffect(() => {
    if (numKarte === null && kartePeriod === null) {
      return;
    }
    karteDispath({ type: 'setKarteShape', payload: { numKarte, kartePeriod, } });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numKarte, kartePeriod]);

  // boardState -> editing | editEnd -> dirty list
  useEffect(() => {
    if (!patient) {
      return;
    }
    if (boardState === EDITING) {
      dispatch({ type: 'addDirty', ptId: patient.ptId });
    }
    if (boardState === EDIT_END) {
      dispatch({ type: 'removeDirty', ptId: patient.ptId });
    }

  }, [dispatch, boardState, patient]);

  // Bundle がサブミットされた時
  useEffect(() => {
    let accept = boardState === EDITING;
    accept = accept && bundleArraySubmitted;
    accept = accept && bundleArraySubmitted.patient.ptId === patient.ptId;
    accept = accept && bundleArraySubmitted.array.length > 0;
    if (!accept) {
      return;
    }
    // bundleArraySubmitted = immutable, so copy it
    const coppied = JSON.parse(JSON.stringify(bundleArraySubmitted));
    coppied.array.forEach(bundle => {
      if (bundle.group === GROUP_DIAGNOSIS) {
        const diagnosis = bundle.claimItems[0];
        const { pvt } = patient;
        if (pvt) {
          diagnosis.pvtPhyId = pvt.phyId;
          diagnosis.pvtDeptId = pvt.deptId;
          diagnosis.hisCombinationNumber = pvt.hisCombinationNumber;
        }
        diagnosis.dateOfOnset = dateFormat(new Date(), ISO_DATE_TIME);
      }
      localDispatch({ type: 'addBundle', payload: bundle });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundleArraySubmitted]);

  // カルテを修正する
  const handleModifyKarte = () => {
    const target = karteList[selectedIndex];
    const text = target?.soa?.content ?? '';  // 修正するカルテのSOA Text
    localDispatch({ type: 'setSoaText', payload: `${text}` });
    localDispatch({ type: 'modifyKarte', payload: clerk });
  };

  // 保存
  const handleSave = () => {
    // 保存対象のカルテ
    const target = karteList[selectedIndex];  // Index
    // 病名があるか?
    const hasDisease = target.p.length > 0 && target.p[0].group === GROUP_DIAGNOSIS;
    if (!hasDisease) {
      localDispatch({ type: 'setAlert', payload: [TEXT_WITHOUT_DIAGNOSIS] });
      return;
    }
    // 初診再診属性を設定する
    let visitType = '';
    target.p.some(bundle => {
      const { group } = bundle;
      if (group.startsWith(GROUP_FIRST_VISIT)) {
        visitType = VISIT_TYPE_FIRST;
        return true;
      }
      if (group.startsWith(GROUP_FOLLOW_UP_VISIT)) {
        visitType = VISIT_TYPE_FOLLOW_UP;
        return true;
      }
      return false;
    });
    // Base charge alert
    if (!visitType) {
      localDispatch({ type: 'setAlert', payload: [TEXT_WITHOUT_VISIT_TYPE] });
      return;
    }
    // Clone the target then save it
    const karteToSave = JSON.parse(JSON.stringify(target));
    karteToSave.protocol = visitType; // 初診・再診を保存カルテの属性に設定する
    // SOA htmlText
    const sanitized = sanitizeHtml(soaText, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a', 'font', 'br', 'div', 'p'],
      allowedAttributes: {
        'a': ['href'],
        'font': ['color']
      }
    });
    karteToSave.soa = {
      id: v4(),
      content: sanitized
    };
    // エントリー情報設定
    const confirmed = dateFormat(new Date(), ISO_DATE_TIME); // 確定日
    karteToSave.updatedAt = confirmed; // 更新日  作成日は変更されない

    // 新規カルテの場合
    if (karteToSave.status === STATUS_NEW) {
      karteToSave.status = STATUS_FINAL; // status=F
      karteToSave.createdAt = confirmed; // created = firstConfirmed = started
      //-------------------------------------
      karteToSave.soa.karte_id = karteToSave.id; // relation
      karteToSave.soa.status = karteToSave.status; // status
      karteToSave.soa.createdAt = karteToSave.createdAt;
      karteToSave.soa.createdAt = karteToSave.updatedAt;
      //---------------------------------------------------------------------
      // Bundle composite setting
      //---------------------------------------------------------------------
      const { facilityId, patientId, physicianId, hisId, providerNumber, deptId, deptName, createdAt, updatedAt, status } = karteToSave;
      let batchNo = 1;
      karteToSave.p.forEach(b => {
        b.id = b.id ? b.id : v4();
        b.karte_id = karteToSave.id; // relation
        b.facilityId = facilityId;
        b.patientId = patientId;
        b.physicianId = physicianId;
        b.hisId = hisId;
        b.providerNumber = providerNumber;
        b.deptId = deptId;
        b.deptName = deptName;
        b.createdAt = createdAt;
        b.updatedAt = updatedAt;
        b.status = status;
        b.batchNo = batchNo;
        // 親子関係
        let claim_batch = 1;
        b.claimItems.forEach(c => {
          c.id = c.id ? c.id : v4();
          c.bundle_id = b.id; // relation
          c.facilityId = facilityId;
          c.patientId = patientId;
          c.physicianId = physicianId;
          c.hisId = hisId;
          c.deptId = deptId;
          c.deptName = deptName;
          c.createdAt = createdAt;
          c.updatedAt = updatedAt;
          c.status = status;
          c.batchNo = claim_batch;
          claim_batch += 1;
          //---------------------------------------------------------------------
          // ClaimItem の Value = bundle.quantity * item.quantity
          //---------------------------------------------------------------------
          if (isClaimGroup(b.group) && !c.drop) {
            const cNum = Number(c.quantity);
            c.value = isNaN(cNum) ? 1 : cNum;
          }
        });
        batchNo += 1;
      });
    }
    // 修正の場合
    if (karteToSave.status === STATUS_UPDATE) {
      const idToOutDate = karteToSave.id; // out date するカルテ = old edition
      karteToSave.id = v4(); // 新規の uuid
      karteToSave.outdateId = idToOutDate; // 保存するカルテの outDate 属性を使用し、DB側でout date をする
      karteToSave.revision = incrementRevisionNumber(karteToSave.revision); // リビション設定
      karteToSave.status = STATUS_FINAL; // F
      //---------------------------------------------------------
      karteToSave.soa.karte_id = karteToSave.id;
      karteToSave.soa.status = karteToSave.status;
      karteToSave.soa.createdAt = karteToSave.createdAt;
      karteToSave.soa.createdAt = karteToSave.updatedAt;
      //---------------------------------------------------------
      // Bundle composite setting
      //---------------------------------------------------------
      const { facilityId, patientId, physicianId, hisId, providerNumber, deptId, deptName, createdAt, updatedAt, status } = karteToSave;
      let batchNo = 1;
      karteToSave.p.forEach(b => {
        b.id = v4(); // 新規の uuid
        b.karte_id = karteToSave.id;
        b.facilityId = facilityId;
        b.patientId = patientId;
        b.physicianId = physicianId;
        b.hisId = hisId;
        b.providerNumber = providerNumber;
        b.deptId = deptId;
        b.deptName = deptName;
        b.createdAt = createdAt;
        b.updatedAt = updatedAt;
        b.status = status;
        b.batchNo = batchNo;
        let claim_batch = 1;
        b.claimItems.forEach(c => {
          c.id = v4(); // 新規の uuid
          c.bundle_id = b.id;
          c.facilityId = facilityId;
          c.patientId = patientId;
          c.physicianId = physicianId;
          c.hisId = hisId;
          c.deptId = deptId;
          c.deptName = deptName;
          c.createdAt = createdAt;
          c.updatedAt = updatedAt;
          c.status = status;
          c.batchNo = claim_batch;
          claim_batch += 1;
          //---------------------------------------------------------------------
          // ClaimItem の Value = bundle.quantity * item.quantity
          //---------------------------------------------------------------------
          if (isClaimGroup(b.group) && !c.drop) {
            const cNum = Number(c.quantity);
            c.value = isNaN(cNum) ? 1 : cNum;
          }
        });
        batchNo += 1;
      });
    }
    // 保存
    const asyncPost = async (karte) => {
      localDispatch({ type: 'setStateTransition' });
      try {
        await postKarte(karte);
        localDispatch({ type: 'karteSaved' });
        localDispatch({ type: 'reset' });

      } catch (err) {
        console.log(`Save karte Error ${err}`);
        localDispatch({ type: 'setTransitionErr', payload: err.message });
      }
    };
    if (isOnline) {
      if (DEBUG) {
        console.log(JSON.stringify(karteToSave, null, 3));
      }
      asyncPost(karteToSave);
    }
  };

  // Discard ?
  const showDiscardAlert = () => {
    localDispatch({ type: 'alertDiscard' });
  };

  // Select cancel on the discard dialog
  const cancelDiscard = () => {
    localDispatch({ type: 'cancelDiscard' });
  };

  // Select discard
  const handleDiscard = () => {
    localDispatch({ type: 'discard' });
    localDispatch({ type: 'karteSaved' });
    localDispatch({ type: 'reset' });
  };

  const handleSelectKarte = e => {
    e.preventDefault();
    const col = Number(e.currentTarget.getAttribute('data-item'));
    localDispatch({ type: 'setSelected', payload: col });
  };

  const handleUndo = () => {
    localDispatch({ type: 'undo' });
  };

  const handleRedo = () => {
    localDispatch({ type: 'redo' });
  };

  const handleSoaInput = text => {
    localDispatch({ type: 'setSoaInput', payload: text });
  };

  const handleSoaBlur = () => {
    localDispatch({ type: 'setSoaBlur' });
  };

  const handleTestPopSelect = item => {
    localDispatch({ type: 'testPop', payload: null });
    const { action, data } = item;
    // data: dnd: {}  important!
    const dnd = data?.dnd ?? null;

    if (action === 'copy' && dnd) {
      dispatch({ type: 'copyBundle', bundle: dnd });
      return;
    }
    if (action === 'paste' && bundleCopied) {
      const bdl = JSON.parse(bundleCopied);
      dispatch({ type: 'dropStamp', stamp: bdl });
      return;
    }
    if (action === 'edit' && dnd) {
      const bundle = JSON.parse(dnd);
      const { group } = bundle;
      if (group === GROUP_DIAGNOSIS) {
        dispatch({ type: 'setDiagnosisToChange', target: bundle });
      } else {
        const r = /^[A-Z]/;
        const reducerAction = r.test(group) ? 'setInputToChange' : 'setBundleToChange';
        dispatch({ type: reducerAction, target: bundle });
      }
      return;
    }
    if (action === 'delete' && dnd) {
      const bundle = JSON.parse(dnd);
      localDispatch({ type: 'deleteBundle', payload: bundle.id });
      return;
    }
  };

  const handleTestPopCancel = () => {
    localDispatch({ type: 'testPop', payload: null });
  };

  const handleInvoice = () => {
    localDispatch({ type: 'changeRenderer', payload: 'receipt' });
    localDispatch({ type: 'setReceiptMode', payload: 'invoice' });
  };

  const handleAmountChange = (name, value) => {
    localDispatch({ type: 'setAmount', payload: value });
  };

  const handleValidateAmountChange = (name, value) => {
    localDispatch({ type: 'setAmount', payload: value });
  };

  const handleReceipt = () => {
    const asyncPut = async (fcId, pvtId, status) => {
      localDispatch({ type: 'setStateTransition' });
      try {
        await updateStatus(fcId, pvtId, status);
        localDispatch({ type: 'setReceiptMode', payload: 'receipt' });
      } catch (err) {
        localDispatch({ type: 'setTransitionErr', payload: err.message });
      }
    };
    const karte = karteList[0];
    const { pvtId } = karte;
    if (!pvtId) {
      return;
    }
    const facilityId = currFacility(user).id;
    asyncPut(facilityId, pvtId, 'done');
  };

  const isInvoiceOk = () => {
    let ok = true;
    ok = ok && render === 'dual';
    ok = ok && boardState === SELECTED;
    return ok || receiptMode === 'receipt';
  };

  const isReceiptOk = () => {
    let ok = true;
    ok = ok && render === 'receipt';
    ok = ok && receiptMode === 'invoice';
    return ok;
  };

  const isPrintOk = () => {
    let ok = true;
    ok = ok && render === 'receipt';
    ok = ok && (receiptMode === 'invoice' || receiptMode === 'receipt');
    return ok;
  };

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  });

  return (
    <Layout className='z3-karte'>
      <div className='z3-flex z3-text-09-rem' style={{ '--align': 'center', padding: '0 16px 0 16px' }}>
        <button
          className='w3-button w3-round-small'
          disabled={boardState !== SELECTED || boardState === EDITING || render !== 'dual'}
          onClick={handleModifyKarte}
        >
          {MODIFY}
        </button>
        <UndoButton
          size='18px'
          disabled={soaEditing || !canUndo}
          onClick={handleUndo}
        />
        <RedoButton
          size='18px'
          disabled={soaEditing || !canRedo}
          onClick={handleRedo}
        />
        <button
          className='w3-button w3-round-small'
          disabled={boardState !== EDITING}
          onClick={handleSave}
        >{SAVE_TEXT}
        </button>
        {
          boardState === EDITING &&
          <button
            className='w3-button w3-hover-red w3-round-small'
            disabled={false}
            onClick={showDiscardAlert}
          >{DISCARD_TEXT}
          </button>
        }
        <FlexWidth />
        <button
          className='w3-button w3-round-small'
          disabled={!isInvoiceOk()}
          onClick={handleInvoice}
        >
          {TEXT_INVOICE}
        </button>
        <button
          className='w3-button w3-round-small'
          disabled={!isReceiptOk()}
          onClick={handleReceipt}
        >
          {TEXT_RECEIPT}
        </button>
        <button
          className='w3-button w3-round-small'
          disabled={!isPrintOk()}
          onClick={handlePrint}
        >
          {TEXT_PRINT}
        </button>
        <div className='z3-flex-glue' />
      </div>
      {
        render === 'dual' && pivot && receiptPivot &&
        <Board>
          <MyTable>
            <StickyColumn>
              <tr>
                <UpperLeft>{TEXT_DATE_OF_EXAM}</UpperLeft>
                {
                  karteList.map((karte, col) => {
                    const { createdAt } = karte;
                    const date = dateFormat(createdAt, DATE_FORMAT_JA);
                    const frmNow = fromNowRough(createdAt);
                    const selected = col === selectedIndex;
                    return (
                      <TimeCell
                        key={createdAt}
                        style={{
                          '--cell-width': render === 'dual' ? 'var(dual-cell-width)' : render === 'receipt' ? 'var(receipt-cell-width)' : 'var(data-cell-width)',
                          '--bk': selected ? 'var(--primary)' : 'var(--karte)',
                          '--on-bk': selected ? 'var(--on-primary)' : 'var(--on-header)',
                          '--text': `'（${frmNow}）'`
                        }}
                        data-item={col}
                        onClick={handleSelectKarte}
                      >
                        {date}
                      </TimeCell>
                    );
                  })
                }
              </tr>
            </StickyColumn>
            <DualRenderer
              facility={facility}
              karteList={karteList}
              entryDates={entryDates}
              pivot={pivot}
              receiptPivot={receiptPivot}
              localDispatch={localDispatch}
            />
            <StickyBody>
              <tr>
                <IndexRow>{TEXT_SOA_TITLE[0]}<br />{TEXT_SOA_TITLE[1]}<br />{TEXT_SOA_TITLE[2]}</IndexRow>
                {
                  karteList.map(karte => {
                    return karte.status === 'F' ? (
                      <SOACell
                        key={karte.id}
                        style={{
                          '--cell-width': render === 'dual' ? 'var(--dual-cell-width)' : render === 'receipt' ? 'var(--receipt-cell-width)' : 'var(--data-cell-width)',
                          '--bk': settings.isSoaColoring ? 'var(--soa)' : 'var(--karte)',
                          '--on-bk': settings.isSoaColoring ? 'var(--on-soa)' : 'var(--on-karte)',
                        }}
                      >
                        <div dangerouslySetInnerHTML={{ __html: karte.soa?.content }} />
                      </SOACell>
                    ) : (
                      <SOACell
                        key={karte.id}
                        style={{
                          '--cell-width': render === 'dual' ? 'var(--dual-cell-width)' : render === 'receipt' ? 'var(--receipt-cell-width)' : 'var(--data-cell-width)',
                          '--bk': settings.isSoaColoring ? 'var(--soa)' : 'var(--karte)',
                          '--on-bk': settings.isSoaColoring ? 'var(--on-soa)' : 'var(--on-karte)',
                        }}
                      >
                        <SOAEditor2
                          htmlText={soaText}
                          onInput={handleSoaInput}
                          onBlur={handleSoaBlur}
                        />
                      </SOACell>
                    );
                  })
                }
              </tr>
            </StickyBody>
            <StickyBody>
              {
                ADDITIONAL_ATTRIBUTES.map(attr => {
                  return (
                    <tr key={attr.id}>
                      <AttributeLabel width='dual'>{attr.label}</AttributeLabel>
                      {
                        karteList.map(karte => {
                          const key = attr['attr'];
                          let value;
                          if (key === 'revision') {
                            value = getRevision(karte[key]);
                          } else {
                            value = karte[key];
                          }
                          const id = `${attr.id}${karte.id}`;
                          return (
                            <AttributeValue
                              key={id}
                              style={{ '--cell-width': render === 'dual' ? 'var(--dual-cell-width)' : render === 'receipt' ? 'var(--receipt-cell-width)' : 'var(--data-cell-width)' }}
                            >{value}
                            </AttributeValue>
                          );
                        })
                      }
                    </tr>
                  );
                })
              }
            </StickyBody>
          </MyTable>
          {DESC && <Observable ref={element} />}
        </Board>
      }
      {
        render === 'receipt' &&
        <div style={{ maxHeight: 'calc(100vh - 100px)', overflow: 'scroll' }}>
          <div ref={receiptRef} className='z3-print-ref'>
            <div className="z3-receipt-size z3-break-before z3-inside-avoid">
              <AccountingInvoice
                facility={facility}
                patient={patient}
                karte={karteList[0]}
                date={entryDates[0]}
                receiptPivot={receiptPivot}
                mode={receiptMode}
                amount={amount}
                onChange={handleAmountChange}
                onValidate={handleValidateAmountChange}
              />
            </div>
            <div className="z3-receipt-size z3-break-before z3-inside-avoid">
              <AccountingDetail
                facility={facility}
                patient={patient}
                karte={karteList[0]}
                date={entryDates[0]}
                receiptPivot={receiptPivot}
              />
            </div>
          </div>
        </div>
      }
      {
        transitionError &&
        <SimpleAlert
          width='384px'
          onCancel={() => localDispatch({ type: 'recoverState' })}
        >
          {
            transitionError.map((msg, i) => {
              return (
                <p key={i}>{msg}</p>
              );
            })
          }
        </SimpleAlert>
      }
      {
        alert &&
        <SimpleAlert
          width='384px'
          onCancel={() => localDispatch({ type: 'setAlert', payload: null })}
        >
          {
            alert.map((msg, i) => {
              return (
                <p key={i}>{msg}</p>
              );
            })
          }
        </SimpleAlert>
      }
      {
        karteToDiscard &&
        <DaingerSelection
          messages={[TEXT_DISCARD_QUESTION]}
          daingerText={DISCARD_TEXT}
          onDainger={handleDiscard}
          onCancel={cancelDiscard}
        />
      }
      {
        testPop &&
        <ContextMenu
          clickPoint={testPop.point}
          menus={testPop.menus}
          onSelect={handleTestPopSelect}
          onCancel={handleTestPopCancel}
        />
      }
    </Layout>
  );
};

const Layout = styled.div`
    padding-top: 16px;
    overflow-y: hidden;
`;

const Board = styled.div`
    display: flex;
    flex-wrap: nowrap;
    max-height: calc(100vh - 180px);  // measure
    overflow-x: auto;
`;

const FlexWidth = styled.div`
    flex: 0 0 32px;
    `;

const Observable = styled.div`
    width: 32px;
    flex-shrink: 0;
    align-items: stretch;
`;

const MyTable = styled.table.attrs({
  className: 'w3-table w3-border w3-bordered'
})`
    flex-shrink: 0;
`;

const TEXT_DATE_OF_EXAM = '診療日';
const TEXT_INVOICE = '請求';
const TEXT_RECEIPT = '領収';
const TEXT_PRINT = '印刷';
const TEXT_SOA_TITLE = ['主訴', '所見', '評価'];
const TEXT_DISCARD_QUESTION = '編集した内容を破棄しますか?';
const DATE_FORMAT_JA = "yyyy'年'm'月'd'日'";
const TEXT_WITHOUT_DIAGNOSIS = '傷病名がありません。';
const TEXT_WITHOUT_VISIT_TYPE = '診断料が設定されていません。';

const NamedAccountingBoard = withDisplayBlock(AccountingBoard);
export default NamedAccountingBoard;
