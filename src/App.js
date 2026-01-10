import React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import DesktopApp from './DesktopApp';
import MobileApp from './mobile/MobileApp';

function App() {
    // Check if screen width is less than 768px (common tablet/mobile breakpoint)
    const isMobile = useMediaQuery('(max-width:768px)');

    // You can also use react-device-detect for more specific device checking if needed
    // but media query is usually sufficient and simpler for responsive design.

    return isMobile ? <MobileApp /> : <DesktopApp />;
}

export default App;
