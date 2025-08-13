// components/Notification.js
import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const notify = (message, status) => {
    if(status) {
        toast.success(message);
    } else {
        toast.error(message);
    }
};

const Notification = () => {
    return <ToastContainer style={{zIndex: '100000020'}}
    autoClose={2000}/>;
};

export default Notification;
