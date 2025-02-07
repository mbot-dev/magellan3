import styled from "styled-components";
import withDisplayNull from '../../aux/withDisplayNull';

const AdminSelector = () => {
    return (
        <Dropdown>
            <button className='w3-button w3-round'>用法</button>
            <DropdownMenu>
                <ul className="w3-ul">
                    <li>内服
                        <ul className="w3-ul">
                            <li>1日1回</li>
                            <li>1日2回</li>
                            <li>1日3回</li>
                            <li>1日4回</li>
                            <li>1日5回</li>
                            <li>頓用</li>
                        </ul>
                    </li>
                    <li>外用
                        <ul className="w3-ul">
                            <li>貼付</li>
                            <li>塗布</li>
                            <li>湿布</li>
                            <li>撒布</li>
                            <li>噴霧</li>
                            <li>消毒</li>
                            <li>点耳</li>
                            <li>点眼</li>
                            <li>点鼻</li>
                            <li>うがい</li>
                            <li>吸入</li>
                            <li>トローチ</li>
                            <li>膀胱洗浄</li>
                            <li>鼻腔内洗浄</li>
                            <li>浣腸</li>
                            <li>肛門挿入</li>
                            <li>腟内挿入</li>
                            <li>膀胱注入</li>
                        </ul>
                    </li>
                </ul>
            </DropdownMenu>
        </Dropdown>
    );
};

const DropdownMenu = styled.div`
    display: none;
    position: absolute;
    background-color: #f9f9f9;
    min-width: 300px;
    width: 100%;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    padding: 12px 16px;
    max-height: 300px;
    overflow: auto;
    z-index: 10;
`;

const Dropdown = styled.div`
    position: relative;
    display: inline-block;
    cursor: pointer;
    &:hover ${DropdownMenu} {
        display: block;
    }
`;

const EnhancedAdminSelector = withDisplayNull(AdminSelector);
export default EnhancedAdminSelector;

/*
dropdown-menu {
    background-color: #f8f9fa;
    border: 1px solid #ced4da;
}
.dropdown-menu li {
    transition: background-color .2s ease;
}
.dropdown-menu li:hover {
    background-color: #e9ecef;
}
.dropdown-menu .submenu {
    background-color: #e9ecef;
    border: 1px solid #ced4da;
}
*/