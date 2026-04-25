import React, { createContext, useContext, useState, useCallback } from 'react';
import Alert from '../components/Alert';

const AlertContext = createContext();

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }) => {
    const [alert, setAlert] = useState({
        show: false,
        message: '',
        type: 'info',
        duration: 4000
    });

    const showAlert = useCallback((messageOrObj, type = 'info', duration = 4000) => {
        if (typeof messageOrObj === 'object' && messageOrObj !== null) {
            setAlert({
                show: true,
                message: messageOrObj.message,
                type: messageOrObj.type || 'info',
                duration: messageOrObj.duration || 4000
            });
        } else {
            setAlert({ show: true, message: messageOrObj, type, duration });
        }
    }, []);

    const hideAlert = useCallback(() => {
        setAlert(prev => ({ ...prev, show: false }));
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            {alert.show && (
                <Alert
                    message={alert.message}
                    type={alert.type}
                    duration={alert.duration} // Alert component handles auto-close via useEffect if duration is passed
                    onClose={hideAlert}
                />
            )}
        </AlertContext.Provider>
    );
};
