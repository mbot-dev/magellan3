import React, { useRef } from "react";
import styled from "styled-components";
import ContentEditable from 'react-contenteditable';
import { useRedKey } from "../../../hook/useRedKey";

const SOAEditor2 = ({ htmlText, onInput }) => {
  const ref = useRef(undefined);

  useRedKey(ref, () => {
    document.execCommand('foreColor', false, '#ff0000');
  });

  const onContentChange = React.useCallback(evt => {
    onInput(evt.currentTarget.innerHTML);
  }, []);

  const handleFocus = () => {
    if (ref?.current) {
      ref.current.style.outline = 'none';
    }
  };

  return (
    <EditorDiv>
      <ContentEditable
        innerRef={ref}
        onChange={onContentChange}
        onBlur={onContentChange}
        onFocus={handleFocus}
        html={htmlText} />
    </EditorDiv>
  );
};

const EditorDiv = styled.div`
    width: 100%;
    height: 100%;
    min-height: 128px;
    padding: 4px;
    resize: none;
`;

export default SOAEditor2;