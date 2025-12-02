import CryptoJS from 'crypto-js';

const CHECK_PHRASE = "CLINIC_FLOW_SECURE";
const CHECK_KEY = "clinic_auth_check";

export const encryptData = (data: any, pin: string): string => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), pin).toString();
};

export const decryptData = (ciphertext: string, pin: string): any => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, pin);
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        return decryptedData;
    } catch (e) {
        return null;
    }
};

export const setupPin = (pin: string) => {
    const encryptedCheck = encryptData(CHECK_PHRASE, pin);
    localStorage.setItem(CHECK_KEY, encryptedCheck);
};

export const verifyPin = (pin: string): boolean => {
    const encryptedCheck = localStorage.getItem(CHECK_KEY);
    if (!encryptedCheck) return false; // No PIN set

    const decrypted = decryptData(encryptedCheck, pin);
    return decrypted === CHECK_PHRASE;
};

export const isPinSet = (): boolean => {
    return !!localStorage.getItem(CHECK_KEY);
};

export const saveSecureData = (key: string, data: any, pin: string) => {
    const encrypted = encryptData(data, pin);
    localStorage.setItem(key, encrypted);
};

export const loadSecureData = (key: string, pin: string): any => {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    return decryptData(encrypted, pin);
};
