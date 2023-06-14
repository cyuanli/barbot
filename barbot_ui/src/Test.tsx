import React, { useState } from 'react';
import useBarbotModel from './BarbotModel';

const Test = () => {
    const { handleTestPump } = useBarbotModel();
    const [seconds, setSeconds] = useState(Array(7).fill(1));

    const handleInputChange = (idx: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const newSeconds = [...seconds];
        newSeconds[idx] = event.target.value;
        setSeconds(newSeconds);
    }

    const handleButtonClick = (idx: number) => {
        const secs = Number(seconds[idx]);
        if (!isNaN(secs)) {
            handleTestPump(idx, secs);
        }
    }

    return (
        <div className="test-window">
            {seconds.map((sec, idx) => (
                <div key={idx} className="test-input">
                    <label>
                        Pump {idx}
                        <input
                            type="number"
                            min="0"
                            value={sec}
                            onChange={event => handleInputChange(idx, event)}
                        />
                    </label>
                    <button onClick={() => handleButtonClick(idx)}>
                        Test
                    </button>
                </div>
            ))}
        </div>
    );
};

export default Test;
