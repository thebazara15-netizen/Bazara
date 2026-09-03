class InboxError extends Error{constructor(message,status=400,code='INBOX_ERROR'){super(message);this.status=status;this.code=code;}}
const id=(v,label='id')=>{const n=Number(v);if(!Number.isSafeInteger(n)||n<1)throw new InboxError(`Invalid ${label}`,400,'INVALID_ID');return n;};
const limit=(v,fallback,max)=>{if(v==null||v==='')return fallback;const n=Number(v);if(!Number.isInteger(n)||n<1||n>max)throw new InboxError(`limit must be between 1 and ${max}`,400,'INVALID_LIMIT');return n;};
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const decode=value=>{if(!value)return null;try{const parsed=JSON.parse(Buffer.from(value,'base64url').toString());if(!parsed||typeof parsed!=='object')throw 0;return parsed;}catch{throw new InboxError('Malformed cursor',400,'INVALID_CURSOR');}};
const textBody=v=>{if(typeof v!=='string'||!v.trim())throw new InboxError('Message cannot be empty',400,'MESSAGE_EMPTY');const body=v.trim();if(body.length>4000)throw new InboxError('Message exceeds 4000 characters',400,'MESSAGE_TOO_LONG');return body;};
const clientId=v=>{if(typeof v!=='string'||!/^[A-Za-z0-9_-]{8,100}$/.test(v))throw new InboxError('Invalid clientMessageId',400,'INVALID_CLIENT_MESSAGE_ID');return v;};
module.exports={InboxError,id,limit,encode,decode,textBody,clientId};
