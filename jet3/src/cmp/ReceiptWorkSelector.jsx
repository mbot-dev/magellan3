import {useEffect, useState, useRef} from 'react';
import styled from 'styled-components';
import { useOutsideClick } from '../hook/useOutsideClick';
import { RiCheckFill } from "react-icons/ri";
import { MdArrowDropDown } from 'react-icons/md';
import { BaseButton } from '../aux/commonStyles';

const ReceiptWorkSelector = ({options, myRender, disabled, localDispatch, dispatch, right=true}) => {
    const [isOpen, setOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const ref = useRef(undefined);
    
    useOutsideClick(ref, () => {
        setOpen(false);
    });

    useEffect(() => {
        if (!myRender) {
            return;
        }
        const index = options.findIndex(op => op.render === myRender);
        setSelectedOption(options[index]);

    }, [myRender]);

    const toggling = () => {
        setOpen(!isOpen);
    };

    const handleOptionSelected = item => {
        setOpen(!isOpen);
        if (item.label !== selectedOption.label) {
            localDispatch({type: 'changeRenderer', payload: item.render});
            const hide = item.render === 'receipt' ? true : false;
            dispatch({type: 'forceHideStampBox', payload: hide});
            setSelectedOption(item);
        }
    };

    const renderButton = () => {
        return <ButtonStyle>
            <span>{selectedOption?.label ?? ''}</span>
            <IconStyle>
                <MdArrowDropDown/>
            </IconStyle>
        </ButtonStyle>;
    };

    return options && (
        <DropDown>
            <DropdownButton type='button' className='w3-padding-small w3-round-small' onClick={toggling} disabled={disabled}>
                {renderButton()}
            </DropdownButton>
            <div ref={ref}>
                <DropdownContent className='w3-white w3-card w3-round-small' style={{'--disp': isOpen ? 'block' : 'none', '--right': right ? 0 : null}}>
                    {
                        options.map((op, i) => {
                            const { label } = op;
                            const check = label === selectedOption?.label;
                            return (
                                <MenuButton
                                    key={i}
                                    type='button'
                                    className='w3-padding-small w3-hover-light-gray'
                                    onClick={()=>handleOptionSelected(op)}
                                >
                                    <MenuStyle>
                                        <FlexWidth>
                                            <RiCheckFill color={check ? 'var(--on-background)' : 'transparent'}/>
                                        </FlexWidth>
                                        <FlexWidthAuto>
                                            {label}
                                        </FlexWidthAuto>
                                    </MenuStyle>
                                </MenuButton>
                            );
                        })
                    }
                </DropdownContent>
            </div>
        </DropDown>
    );
};

const DropDown = styled.div`
    position: relative;
    display: inline-block;
`;

const DropdownButton = styled(BaseButton)`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    border-bottom: 3px solid var(--secondary)
`;

const DropdownContent = styled.div`
    display: var(--disp);
    position: absolute;
    right: var(--right);
    padding: 2px;
    z-index: 30;
`;

const MenuButton = styled(BaseButton)`
    width: 100%;
    text-align: left;
    font-size: 0.9rem;
`;

const ButtonStyle = styled.div`
    display: flex;
    align-items: center;
    column-gap: 2px;
`;

const MenuStyle = styled.div`
    display: flex;
    align-items: center;
    column-gap: 2px;
`;

const IconStyle = styled.div`
    display: flex;
    jsutify-content: center;
    aligin-items: center; 
`;

const FlexWidth = styled.div`
    flex: 0 0 22px;
`;

const FlexWidthAuto = styled.div`
    flex: 0 0 auto;
`;

export default ReceiptWorkSelector;
