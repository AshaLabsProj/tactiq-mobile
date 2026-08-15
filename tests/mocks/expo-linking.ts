export const createURL = (path = "") => `skilltracker://${path.replace(/^\//, "")}`;
export const canOpenURL = async () => true;
export const openURL = async () => true;
export const getInitialURL = async () => null;
