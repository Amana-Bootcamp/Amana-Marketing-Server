const crypto = require('crypto');

// Known encryption key for class demonstration
const ENCRYPTION_KEY = 'amana-marketing-key-2024';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt a password using AES-256-CBC
 * @param {string} password - The plain text password to encrypt
 * @returns {string} - The encrypted password with IV prepended
 */
function encryptPassword(password) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Prepend IV to encrypted data
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt a password using AES-256-CBC
 * @param {string} encryptedPassword - The encrypted password with IV
 * @returns {string} - The decrypted plain text password
 */
function decryptPassword(encryptedPassword) {
    try {
        const parts = encryptedPassword.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        
        const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error.message);
        return null;
    }
}

/**
 * Simple alternative encryption for demonstration (Caesar cipher with shift)
 * @param {string} password - The plain text password
 * @returns {string} - The encrypted password
 */
function simpleEncrypt(password) {
    const shift = 7; // Simple shift value
    return password.split('').map(char => {
        if (char.match(/[a-z]/i)) {
            const code = char.charCodeAt(0);
            const base = code >= 65 && code <= 90 ? 65 : 97;
            return String.fromCharCode((code - base + shift) % 26 + base);
        }
        return char;
    }).join('');
}

/**
 * Simple alternative decryption for demonstration (Caesar cipher with shift)
 * @param {string} encryptedPassword - The encrypted password
 * @returns {string} - The decrypted password
 */
function simpleDecrypt(encryptedPassword) {
    const shift = 7; // Same shift value used in encryption
    return encryptedPassword.split('').map(char => {
        if (char.match(/[a-z]/i)) {
            const code = char.charCodeAt(0);
            const base = code >= 65 && code <= 90 ? 65 : 97;
            return String.fromCharCode((code - base - shift + 26) % 26 + base);
        }
        return char;
    }).join('');
}

module.exports = {
    encryptPassword,
    decryptPassword,
    simpleEncrypt,
    simpleDecrypt,
    ENCRYPTION_KEY
};
