import {useState} from 'react';
import styled from 'styled-components';
import {v4} from 'uuid';

// Blue #0693E3
// Orange #FCB900
// Green #00D084
const TWITTER_COLORS = [
    {key: v4(), color: '#FF6900'},
    {key: v4(), color: '#FCB900'},
    {key: v4(), color: '#7BDCB5'},
    {key: v4(), color: '#00D084'},
    {key: v4(), color: '#8ED1FC'},
    {key: v4(), color: '#0693E3'},
    {key: v4(), color: '#ABB8C3'},
    {key: v4(), color: '#EB144C'},
    {key: v4(), color: '#F78DA7'},
    {key: v4(), color: '#9900EF'}
];

const SimpleColorPalette = ({onPicked}) => {
    const [selectedColor, setSelectedColor] = useState(TWITTER_COLORS[0].color);

    const handlePicked = color => {
        setSelectedColor(color);
        onPicked(color);
    };

    return (
        <Palette>
            {
                TWITTER_COLORS.map(item => {
                    const { key, color } = item;
                    return (
                        <Cell
                            key={key}
                            color={color}
                            selected={color === selectedColor}
                            onClick={()=> handlePicked(color)}
                        />
                    );
                })
            }
        </Palette>
    );
};

const Palette = styled.div`
    display: flex;
`;

const Cell = styled.div`
    width: 32px;
    height: 24px;
    cursor: default;
    background-color: ${props => props.color};
    border: ${props => props.selected ? '3px double #8e8e8e' : 'none'};
`;

export default SimpleColorPalette;

