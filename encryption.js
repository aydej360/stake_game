// encrypt.js
"use strict";

const crypto = require('crypto');

const ENCRYPTION_KEY = Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
const HMAC_KEY = Buffer.from('abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd', 'hex');

function encryptData(data) {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(data.toString(), 'utf8', 'base64');
        encrypted += cipher.final('base64');

        const payload = {
            iv: iv.toString('base64'),
            data: encrypted
        };

        const jsonPayload = JSON.stringify(payload);
        const hmac = crypto.createHmac('sha256', HMAC_KEY).update(jsonPayload).digest('base64');

        const result = Buffer.from(JSON.stringify({ payload, hmac })).toString('base64');
        return result;
    } catch (error) {
        return "";
    }
}

module.exports = { encryptData };
