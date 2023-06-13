import React, { useState } from 'react';
import useBarbotModel from './BarbotModel';

const ConfigEditor = () => {
    const { config, handleNewConfig } = useBarbotModel();
    const [editedConfig, setEditedConfig] = useState(config);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        const [configType, key] = name.split('.');

        setEditedConfig(prevConfig => {
            if (configType === 'ingredients' || configType === 'flow_rates') {
                return {
                    ...prevConfig,
                    [configType]: {
                        ...prevConfig[configType],
                        [key]: configType === 'flow_rates' ? parseFloat(value) : value,
                    },
                };
            }
            return prevConfig;
        });
    };

    const handleTimeOffsetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEditedConfig(prevConfig => ({
            ...prevConfig,
            time_offset: parseFloat(event.target.value),
        }));
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        handleNewConfig(editedConfig);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="config-grid">
                <div className="config-row">
                    <div></div>
                    <label>Ingredient</label>
                    <label>Flow rate (ml/s)</label>
                </div>
                {Object.entries(editedConfig.ingredients).map(([key, value]) => (
                    <div key={key} className="config-row">
                        <label>{key}</label>
                        <input type="text" name={`ingredients.${key}`} value={value} onChange={handleInputChange} />
                        <input type="number" step="5" name={`flow_rates.${key}`} value={editedConfig.flow_rates[key]} onChange={handleInputChange} />
                    </div>
                ))}
                <div className="config-row">
                    <div></div>
                    <label>Time offset (ms)</label>
                    <input type="number" step="100" name="time_offset" value={editedConfig.time_offset} onChange={handleTimeOffsetChange} />
                </div>
                <button type="submit" className={config === editedConfig ? 'button-disabled' : 'confirm-button'}>Save</button>
            </div>

        </form>
    );
};

export default ConfigEditor;
