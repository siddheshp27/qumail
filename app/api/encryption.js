import crypto from 'crypto';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { operation, plaintext, ciphertext, key } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    if (operation === 'encrypt') {
      if (!plaintext) {
        return res.status(400).json({ error: 'Plaintext is required for encryption' });
      }

      const result = encrypt(plaintext, key);
      return res.status(200).json(result);
    } else if (operation === 'decrypt') {
      if (!ciphertext) {
        return res.status(400).json({ error: 'Ciphertext is required for decryption' });
      }

      const result = decrypt(ciphertext, key);
      return res.status(200).json(result);
    } else {
      return res.status(400).json({ error: 'Invalid operation' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function encrypt(plaintext, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'base64'), iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    ciphertext: `${iv.toString('hex')}:${encrypted}`
  };
}

function decrypt(ciphertext, key) {
  const [ivHex, encrypted] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'base64'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return {
    plaintext: decrypted
  };
}
