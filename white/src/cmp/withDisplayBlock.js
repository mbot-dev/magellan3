import React from 'react';

const withDisplayBlock = Component => props => {
    const display = props.show ? {display: 'block'} : {display: 'none'};
    return (
        <div style={display}>
            <Component {...props}/>
        </div>
    )
};
export default withDisplayBlock;
