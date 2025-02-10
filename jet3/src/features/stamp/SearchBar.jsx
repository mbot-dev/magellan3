import { useEffect } from "react";
import styled from "styled-components";
import { useStateValue } from "../../reducers/state";
import { useMargaret } from "../../io/MargaretProvider";
import { clinicFilter } from "../../models/claim";
import { normalizeText } from "../../util/strings";

const EXCLUDE_NORMALIZE = ["がん"];

const SearchBar = ({
  procedureKbn,
  search,
  procedureClass,
  commentClass,
  localDispatch,
  children,
}) => {
  const margaret = useMargaret();
  const dispatch = useStateValue()[1];

  useEffect(() => {
    if (!procedureKbn || !search || !localDispatch || !dispatch) {
      return;
    }
    const asyncGet = async (search) => {
      let data = [];
      try {
        if (/^[A-Z]\d{3}$/.test(search)) {
          const kbn = search[0];
          const kbn_no = search.slice(1);
          data = await margaret
            .getApi("master")
            .findProceduresByKbnKbnNo(kbn, kbn_no, kbn_no);
        } else if (/^\d{9}$/.test(search)) {
          data = await margaret.getApi("master").findMasterByCode(search);
        } else {
          data = await margaret.getApi("master").findMasterByName(search);
        }
        const filtered = data.filter((x) => clinicFilter(procedureKbn, x));
        localDispatch({
          type: "setSearchResults",
          results: filtered,
          mode: "search",
        });
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    const norm =
      EXCLUDE_NORMALIZE.indexOf(search) > -1 ? search : normalizeText(search);

    asyncGet(norm);
  }, [search, procedureKbn, localDispatch, dispatch]);

  useEffect(() => {
    if (!procedureClass || !procedureClass?.kbn_no) {
      return;
    }
    const asyncGet = async (procedureClass) => {
      const { kbn, kbn_no } = procedureClass;
      try {
        const data = await margaret
          .getApi("master")
          .findProceduresByKbnKbnNo(kbn, kbn_no[0], kbn_no[1]);
        const filtered = data.filter((x) => clinicFilter(procedureKbn, x));
        localDispatch({ type: "setSearchResults", results: filtered });
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    asyncGet(procedureClass);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [procedureClass]);

  useEffect(() => {
    if (!commentClass) {
      return;
    }
    const asyncGet = async (commentClass) => {
      const { code } = commentClass;
      try {
        const data = await margaret.getApi("master").findCommentByCode(code);
        localDispatch({ type: "setSearchResults", results: data });
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    asyncGet(commentClass);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentClass]);

  return <Bar>{children}</Bar>;
};

const Bar = styled.div`
  display: flex;
  align-items: center;
  column-gap: 16px;
  padding: 0 16px;
  height: 44px;
  background-color: var(--surface);
  overflow-y: visible;
  border-bottom: 1px solid var(--border-color);
`;

export default SearchBar;
