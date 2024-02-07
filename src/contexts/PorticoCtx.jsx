import axios from 'axios';
import React, { createContext, useContext, useEffect, useState } from 'react';
const token = import.meta.env.VITE_INFLUXDB_TOKEN;
const url = import.meta.env.VITE_INFLUXDB_URL;
const org = 'RadiusLab';
import mev from '../assets/videos/mev.mp4';

export const PorticoCtx = createContext({
  initialRoles: {},
  queryRoles: async () => {},
  queryLogs: async () => {},
  pRoles: {},
  pLogs: [],
  pLabels: {},
  pVideo: {},
  preventNewLogs: false,
  pIndex: 0,
});

export const usePortico = () => useContext(PorticoCtx);

export const ContextProvider = ({ children }) => {
  const [videoSrc] = useState(mev);
  const [logs, setLogs] = useState([]);
  const [roles, setRoles] = useState({});
  const [labels, setLabels] = useState({});
  const [logsReady, setLogsReady] = useState(false);
  const [index, setIndex] = useState(0);

  const handleIndex = () => {
    setIndex((index) => index + 1);
  };

  async function queryLogs(timestamp) {
    const data = {
      timestamp,
    };
    try {
      const response = await axios.post(`${url}/logs`, data);
      const result = [...response.data];
      setLogs(result);
      return [...result];
    } catch (error) {
      console.error('QUERY ERROR', error);
    }
  }

  async function queryRoles() {
    try {
      const response = await axios.get(`${url}/roles`);
      const result = { ...response.data };
      setRoles(result);
      return { ...result };
    } catch (error) {
      console.error('QUERY ERROR', error);
    }
  }

  useEffect(() => {
    const swapped = {};
    Object.entries(roles).forEach(([key, value]) => {
      swapped[value] = key;
    });
    setLabels(swapped);
  }, [roles]);

  useEffect(() => {
    const runReqs = async () => {
      const roles = await queryRoles();
      if (!logsReady) {
        const checkLogs = async () => {
          const logs = await queryLogs(roles.timestamp);
          console.log(logs);
          if (logs.length) {
            console.log('Logs are ready');
            setLogsReady(true);
          } else {
            console.log('Logs are not ready, checking again...');
            setTimeout(checkLogs, 1000); // Check again after 1 second
          }
        };
        setTimeout(checkLogs, 1000);
      }
    };
    console.log('Checking for logs...');
    runReqs();
  }, [logsReady]);

  return (
    <PorticoCtx.Provider
      value={{
        videoSrc,
        pLabels: labels,
        pRoles: roles,
        pLogs: logs,
        queryRoles,
        queryLogs,
        preventNewLogs: setLogsReady,
        // isDataLoaded,
        setPIndex: setIndex,
        pIndex: index,
      }}
    >
      {children}
    </PorticoCtx.Provider>
  );
};
