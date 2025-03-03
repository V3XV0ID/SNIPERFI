import { handleError } from './errorHandler';
import config from '../../config/app.config';

export const validateWallet = (walletInfo) => {
    if (!walletInfo || !walletInfo.public_key) {
        throw new Error('Invalid wallet information');
    }
    return true;
};

export const formatBalance = (balance) => {
    return balance ? Number(balance).toFixed(4) : '0.0000';
};

export const sanitizePrivateKey = (key) => {
    return key ? `${key.slice(0, 4)}...${key.slice(-4)}` : '';
};