import React from 'react';
import AsesorPanel from '../components/asesor/AsesorPanel';
import EmergencyLogout from '../components/EmergencyLogout';

const AsesorDashboard: React.FC = () => {
  return (
    <>
      <EmergencyLogout />
      <AsesorPanel />
    </>
  );
};

export default AsesorDashboard;
