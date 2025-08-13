# Slip2Go API Documentation (v1.2)
_Last updated: 07-05-2025_

**Base API URL:** `connect.slip2go.com/api`

## Overview
Slip2Go provides APIs for slip verification. You can verify QR slips and apply conditions such as receiver account, amount, and date.

## Disclaimer
- Slip2Go provides omni-channel services for slip verification.
- Slip2Go is not associated with any bank transfer protocol or payment gateway. The service verifies against official bank APIs but does not guarantee whether a transaction occurred.

---

## Table of Contents
- [Authentication](#authentication)
  - [IP Whitelist](#ip-whitelist)
  - [API Secret](#api-secret)
  - [Request Description](#request-description)
  - [Example (JavaScript)](#example-javascript)
- [API Endpoints](#api-endpoints)
  - [Verify slip by QR-Code](#verify-slip-by-qr-code)
  - [Verify slip by QR Image](#verify-slip-by-qr-image)
  - [Get slip by referenceId](#get-slip-by-referenceid-get-verified-slip)
  - [Get account information](#get-account-information)
- [Request Examples](#request-examples)
- [Response Examples](#response-examples)
  - [Success Codes](#success-codes)
  - [Success Responses](#success-responses)
  - [Error Codes](#error-codes)
  - [Error Responses](#error-responses)
- [Data Description](#data-description)
  - [Account Type List](#account-type-list-for-condition-check)
  - [Bank Codes](#bank-code-from-response)

---

## Authentication

### IP Whitelist
1. Specify allowed IPs per shop for using the API Secret.
2. Default is `*` which allows any IP.
3. Up to 10 IPs per shop.

### API Secret
1. Every request must include the API secret.
   - Header key: `Authorization`
   - Header value: `Bearer {apiSecret}`
2. Find the API Secret in the **API Connect** menu after login.
3. Each shop has one API Secret at a time. You can regenerate it.
4. When regenerated, the previous secret becomes unusable.

### Request Description
| Property | Value |
|---|---|
| Method | `GET` / `POST` (depends on endpoint) |
| URL | Depends on endpoint |
| Header | `Authorization: Bearer {apiSecret}` |
| Body | Depends on endpoint |

### Example (JavaScript)
```javascript
const axios = require('axios');

const config = {
  method: 'GET',
  url: 'https://{apiUrl}/api/account/info',
  headers: {
    'Authorization': 'Bearer {secretKey}',
    'Content-Type': 'application/json'
  }
};

axios.request(config)
  .then((response) => {
    console.log(JSON.stringify(response.data));
  })
  .catch((error) => {
    console.log(error);
  });
```

---

## API Endpoints

### Verify slip by QR-Code
- **Endpoint:** `/verify-slip/qr-code/info`
- **Method:** `POST`
- **Authorization:** required
- **Request Body:** JSON

**Description:** Provide a decoded QR code and optional check conditions. The API validates the QR and applies conditions.

#### Request Fields
| Key | Type | Required | Description | Example |
|---|---|:---:|---|---|
| `payload` | object | ✔ | Wrapper for request data | `{ "qrCode": "..." }` |
| `payload.qrCode` | string | ✔ | Decoded QR code string | `"0123456789xxx"` |
| `checkCondition` | object | 𐄂 | Condition container | `{ ... }` |
| `checkCondition.checkDuplicate` | boolean | 𐄂 | Check duplicate slip | `true` |
| `checkCondition.checkReceiver` | array | 𐄂 | Receiver account checks. If any matches, it is valid. | `[{...}, {...}]` |
| `checkCondition.checkReceiver[].accountType` | string | 𐄂 | Receiver account type | `"01004"` = ธนาคารกสิกร |
| `checkCondition.checkReceiver[].accountNameTH` | string | 𐄂 | Receiver name (Thai, partial match) | `"สมชาย สลิปทูโก"` |
| `checkCondition.checkReceiver[].accountNameEN` | string | 𐄂 | Receiver name (EN, partial match) | `"Somchay Slip2go"` |
| `checkCondition.checkReceiver[].accountNumber` | string | 𐄂 | Account number or merchantId / phoneNumber / citizenID. Partial match. | `"xxxxxx1234"` |
| `checkCondition.checkAmount` | object | 𐄂 | Transfer amount check | `{ "type": "eq", "amount": 10000 }` |
| `checkCondition.checkAmount.type` | string | 𐄂 | `eq` \| `gte` \| `lte` (default `eq`) | `eq` |
| `checkCondition.checkAmount.amount` | number | 𐄂 | Amount to check (no thousands separator) | `10000` |
| `checkCondition.checkDate` | object | 𐄂 | Transfer date check | `{ "type": "eq", "date": "2025-10-05T14:48:00.000Z" }` |
| `checkCondition.checkDate.type` | string | 𐄂 | `eq` \| `gte` \| `lte` (default `eq`) | `eq` |
| `checkCondition.checkDate.date` | string (Date ISO, GMT) | 𐄂 | Transfer date in ISO format, GMT only | `"2025-10-05T14:48:00.000Z"` |

#### Example Requests
Without condition:
```json
{
  "payload": {
    "qrCode": "xxx-xxxx-xxxxxx"
  }
}
```

With conditions:
```json
{
  "payload": {
    "qrCode": "xxx-xxxx-xxxxxx",
    "checkCondition": {
      "checkDuplicate": true,
      "checkReceiver": [
        {
          "accountType": "01004",
          "accountNameTH": "สมชาย สลิปทูโก",
          "accountNameEN": "Somchay Slip2go",
          "accountNumber": "xxxxxx1234"
        },
        { "accountNumber": "xxxxxx1234" },
        { "accountNameTH": "สมชาย สลิปทูโก", "accountNameEN": "Somchay Slip2go" }
      ],
      "checkAmount": { "type": "eq", "amount": 10000 },
      "checkDate": { "type": "eq", "date": "2025-10-05T14:48:00.000Z" }
    }
  }
}
```

#### Response Fields
| Key | Type | Description | Example |
|---|---|---|---|
| `code` | string | Result code | `"200000"` |
| `message` | string | Result message | `"Slip found"` |
| `data` | object | Slip info | `{ ... }` |
| `data.referenceId` | string (UUID) | Slip2Go reference ID | `"92887bd5-60d3-4744-9a98-b8574e..."` |
| `data.decode` | string | Decoded QR | `"123456789xxx"` |
| `data.transRef` | string | Bank transfer reference | `"015073xxx5xxx12245"` |
| `data.dateTime` | string | Transfer datetime (ISO) | `"2025-10-05T14:48:00.000Z"` |
| `data.amount` | number | Transfer amount | `100` |
| `data.ref1` | string \| null | Bank ref1 | `"xxxxx"` |
| `data.ref2` | string \| null | Bank ref2 | `"xxxxx"` |
| `data.ref3` | string \| null | Bank ref3 | `"xxxxx"` |
| `data.receiver.account.name` | string | Receiver account name (partial) | `"Somchay Slip2go"` |
| `data.receiver.account.bank.account` | string | Receiver bank account (partial) | `"xxx-x-x5366-x"` |
| `data.receiver.account.proxy.type` | string | Proxy type: `NATID` \| `MSISDN` \| `EWALLTID` \| `EMAIL` \| `BILLERID` \| `ORFT` | `"NATID"` |
| `data.receiver.account.proxy.account` | string | Proxy account number | `"12850X500"` |
| `data.receiver.bank.id` | string | Receiver bank id | `"004"` |
| `data.receiver.bank.name` | string | Receiver bank name | `"ธนาคารกสิกรไทย"` |
| `data.sender.account.name` | string | Sender account name (partial) | `"xxx2Go xxVerifyxx"` |
| `data.sender.account.bank.account` | string | Sender bank account (partial) | `"xxx-x-45xx-5"` |
| `data.sender.bank.id` | string | Sender bank id | `"025"` |
| `data.sender.bank.name` | string | Sender bank name | `"ธนาคารกรุงศรีอยุธยา"` |

#### Example Response
```json
{
  "code": "200000",
  "message": "Slip found",
  "data": {
    "referenceId": "92887bd5-60d3-4744-9a98-b8574e...",
    "decode": "20014242082547BPM049885102TH9104xxxx",
    "transRef": "015073144041ATF00999",
    "dateTime": "2025-10-05T14:48:00.000Z",
    "amount": 1,
    "ref1": null,
    "ref2": null,
    "ref3": null,
    "receiver": {
      "account": {
        "name": "บริษัท สลิปทูโก จํากัด",
        "bank": { "account": "xxx-x-x5366-x" },
        "proxy": { "type": "NATID", "account": "xxx-x-x5366-x" }
      },
      "bank": { "id": "004", "name": "ธนาคารกสิกรไทย" }
    },
    "sender": {
      "account": {
        "name": "บริษัท สลิปทูโก จํากัด",
        "bank": { "account": "xxx-x-x9866-x" }
      },
      "bank": { "id": "004", "name": "ธนาคารกสิกรไทย" }
    }
  }
}
```

#### Example Usage
**JavaScript**
```javascript
const axios = require('axios');

const config = {
  method: 'POST',
  maxBodyLength: Infinity,
  url: '{apiUrl}/api/verify-slip/qr-code/info',
  headers: { 'Authorization': 'Bearer {secretKey}' },
  data: { payload: { qrCode: '0123456789xxx' } }
};

axios.request(config)
  .then((response) => console.log(JSON.stringify(response.data)))
  .catch((error) => console.log(error));
```

**cURL**
```bash
curl --location '{apiUrl}/api/verify-slip/qr-code/info'   --header 'Content-Type: application/json'   --header 'Authorization: Bearer {secretKey}'   --data '{
    "payload": { "qrCode": "xxxxxxxxxxxxxxxxxxxxx" }
  }'
```

---

### Verify slip by QR Image
- **Endpoint:** `/verify-slip/qr-image/info`
- **Method:** `POST`
- **Authorization:** required
- **Request:** `multipart/form-data`

**Description:** Upload a slip image file and optional conditions. The API extracts and verifies the QR from image and applies conditions.

#### Request Fields
| Key | Type | Required | Description | Example |
|---|---|:---:|---|---|
| `file` | file | ✔ | Slip image file | `xxx.png` |
| `payload` | JSON | 𐄂 | Condition object | see below |

`payload` fields:
| Key | Type | Required | Description | Example |
|---|---|:---:|---|---|
| `checkDuplicate` | boolean | 𐄂 | Check duplicate slip | `true` |
| `checkReceiver` | array | 𐄂 | Receiver account checks | `[{...}]` |
| `checkReceiver[].accountType` | string | 𐄂 | Account type | `"01004"` |
| `checkReceiver[].accountNameTH` | string | 𐄂 | Thai name (partial) | `"สมชาย สลิปทูโก"` |
| `checkReceiver[].accountNameEN` | string | 𐄂 | English name (partial) | `"Somchay Slip2go"` |
| `checkReceiver[].accountNumber` | string | 𐄂 | Account or merchantId/phone/citizenID. Partial. | `"xxxxxx1234"` |
| `checkAmount` | object | 𐄂 | Amount condition | `{ "type": "eq", "amount": 10000 }` |
| `checkAmount.type` | string | 𐄂 | `eq` \| `gte` \| `lte` (default `eq`) | `eq` |
| `checkAmount.amount` | number | 𐄂 | Amount to check | `10000` |
| `checkDate` | object | 𐄂 | Date condition | `{ "type": "eq", "date": "2025-10-05T14:48:00.000Z" }` |
| `checkDate.type` | string | 𐄂 | `eq` \| `gte` \| `lte` (default `eq`) | `eq` |
| `checkDate.date` | string | 𐄂 | ISO datetime (GMT) | `"2025-10-05T14:48:00.000Z"` |

#### Example Payload
```json
{
  "checkDuplicate": true,
  "checkReceiver": [{
    "accountType": "01004",
    "accountNameTH": "สมชาย สลิปทูโก",
    "accountNameEN": "Somchay Slip2go",
    "accountNumber": "xxxxxx1234"
  }],
  "checkAmount": { "type": "eq", "amount": 10000 }
}
```

#### Response Fields
_Same structure as [Verify slip by QR-Code](#response-fields)._

#### Example Response
```json
{
  "code": "200000",
  "message": "Slip found",
  "...": "See structure above"
}
```

#### Example Usage
**JavaScript**
```javascript
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const data = new FormData();
const payload = {
  checkDuplicate: true,
  checkReceiver: [{
    accountType: '01004',
    accountNameTH: 'สมชาย สายไหม',
    accountNameEN: 'Somchay Saimai',
    accountNumber: 'xxxxxxx1234'
  }],
  checkAmount: { type: 'eq', amount: 200.31 }
};

data.append('file', fs.createReadStream('/Users/Desktop/slip.jpg'));
data.append('payload', JSON.stringify(payload));

const config = {
  method: 'POST',
  maxBodyLength: Infinity,
  url: '{apiUrl}/api/verify-slip/qr-image/info',
  headers: {
    'Authorization': 'Bearer {apiSecret}',
    ...data.getHeaders()
  },
  data
};

axios.request(config)
  .then((response) => console.log(JSON.stringify(response.data)))
  .catch((error) => console.log(error));
```

**cURL**
```bash
curl --location '{apiUrl}/api/verify-slip/qr-image/info'   --header 'Authorization: Bearer {secretKey}'   --form 'file=@"/Users/Chay/Desktop/slip.jpg"'   --form 'payload={
    "checkDuplicate": true,
    "checkReceiver": [{
      "accountType": "01004",
      "accountNameTH": "สมชาย สายไหม",
      "accountNameEN": "Somchay Saimai",
      "accountNumber": "xxxxxxx1234"
    }],
    "checkAmount": { "type": "eq", "amount": 200.31 }
  }'
```

---

### Get slip by referenceId (Get verified slip)
- **Endpoint:** `/verify-slip/{referenceId}`
- **Method:** `GET`
- **Authorization:** required
- **Params:** `referenceId` (UUID)

**Description:** Retrieve information of a verified slip without consuming quota.

#### Request
| Key | Type | Required | Description | Example |
|---|---|:---:|---|---|
| `referenceId` | UUID | ✔ | Reference ID of a previously verified slip | `"92887bd5-60d3-4744-9a98-b8574e..."` |

#### Response
Same fields as in the QR-Code endpoint, plus:
| Key | Type | Description | Example |
|---|---|---|---|
| `verifyDate` | string | First verification datetime (ISO) | `"2025-10-05T14:48:00.000Z"` |

#### Example Usage
**JavaScript**
```javascript
const axios = require('axios');

const config = {
  method: 'GET',
  url: '{apiUrl}/api/verify-slip/{referenceId}',
  headers: { 'Authorization': 'Bearer {secretKey}' }
};

axios.request(config)
  .then((response) => console.log(JSON.stringify(response.data)))
  .catch((error) => console.log(error));
```

**cURL**
```bash
curl --location '{apiUrl}/api/verify-slip/{referenceId}'   --header 'Authorization: Bearer {secretKey}'
```

---

### Get account information
- **Endpoint:** `/account/info`
- **Method:** `GET`
- **Authorization:** required

**Description:** Get current account and package information.

#### Response
| Key | Type | Description | Example |
|---|---|---|---|
| `code` | string | Result code | `"200001"` |
| `message` | string | Result message | `"Get Info Success"` |
| `data.shopName` | string | Shop name | `"Slip2Go Shop"` |
| `data.package` | string | Current package | `"BASIC-1"` |
| `data.packageExpiredDate` | string (ISO) | Package expiry | `"2025-10-05T14:48:00.000Z"` |
| `data.quotaLimit` | number | Max quota | `400` |
| `data.quotaRemaining` | number | Remaining quota | `100` |
| `data.creditRemaining` | number | Remaining credit | `100` |
| `data.autoRenewalPackage` | boolean | Auto renewal | `true` |
| `data.checkSlipByCredit` | boolean | Scan by credit | `false` |

#### Example Usage
**JavaScript**
```javascript
const axios = require('axios');

const config = {
  method: 'GET',
  url: '{apiUrl}/api/account/info',
  headers: { 'Authorization': 'Bearer {secretKey}' }
};

axios.request(config)
  .then((response) => console.log(JSON.stringify(response.data)))
  .catch((error) => console.log(error));
```

**cURL**
```bash
curl --location '{apiUrl}/api/account/info'   --header 'Authorization: Bearer {secretKey}'
```

---

## Request Examples
- **Verify without condition**
```json
{ "payload": { "qrCode": "xxx-xxxx-xxxxxx" } }
```
- **Check slip duplicated**
```json
{
  "payload": { "qrCode": "xxx-xxxx-xxxxxx" },
  "checkCondition": { "checkDuplicate": true }
}
```
- **Check receiver account number**
```json
{
  "payload": { "qrCode": "xxx-xxxx-xxxxxx" },
  "checkCondition": { "checkReceiver": [{ "accountNumber": "4201853666" }] }
}
```
- **Check receiver account name**
```json
{
  "payload": { "qrCode": "xxx-xxxx-xxxxxx" },
  "checkCondition": {
    "checkReceiver": [{ "accountNameTH": "สลิปทูโก", "accountNameEN": "slip2go" }]
  }
}
```
- **Check transfer amount (≥ 1000 THB)**
```json
{
  "payload": { "qrCode": "xxx-xxxx-xxxxxx" },
  "checkCondition": { "checkAmount": { "type": "gte", "amount": 1000 } }
}
```
- **Check transfer date (≥ 2025-10-05 14:48 GMT)**
```json
{
  "payload": { "qrCode": "xxx-xxxx-xxxxxx" },
  "checkCondition": {
    "checkDate": { "type": "gte", "date": "2025-10-05T14:48:00.000Z" }
  }
}
```
- **Check receiver account type and number (KBank)**
```json
{
  "payload": { "qrCode": "xxx-xxxx-xxxxxx" },
  "checkCondition": {
    "checkReceiver": [{ "accountType": "01004", "accountNumber": "4201853666" }]
  }
}
```
- **Check receiver account type and number (PromptPay PhoneNumber)**
```json
{
  "payload": { "qrCode": "xxx-xxxx-xxxxxx" },
  "checkCondition": {
    "checkReceiver": [{ "accountType": "02001", "accountNumber": "0902369994" }]
  }
}
```
- **Check receiver account type and number (Merchant such as KShop)**
```json
{
  "payload": { "qrCode": "xxx-xxxx-xxxxxx" },
  "checkCondition": {
    "checkReceiver": [{ "accountType": "03000", "accountNumber": "075413264" }]
  }
}
```
- **Check receiver account type and number (True Money)**
```json
{
  "payload": { "qrCode": "xxx-xxxx-xxxxxx" },
  "checkCondition": {
    "checkReceiver": [{ "accountType": "04000", "accountNumber": "0902369994" }]
  }
}
```
- **Check more than one condition**
```json
{
  "payload": { "qrCode": "xxx-xxxx-xxxxxx" },
  "checkCondition": {
    "checkReceiver": [{ "accountType": "01004", "accountNumber": "4201853666" }],
    "checkAmount": { "type": "gte", "amount": 1000 },
    "checkDate": { "type": "gte", "date": "2025-10-05T14:48:00.000Z" }
  }
}
```
- **Check multi receiver conditions**
```json
{
  "payload": { "qrCode": "xxx-xxxx-xxxxxx" },
  "checkCondition": {
    "checkReceiver": [
      { "accountNumber": "4201853666" },
      { "accountType": "01004", "accountNumber": "7192488543" },
      { "accountNameTH": "สลิปทูโก ตรวจสลิป", "accountNameEN": "slip2go checkslip" }
    ]
  }
}
```

---

## Response Examples

### Success Codes
| # | Status | Detail | HTTP | Response Code | Quota Deducted |
|---:|---|---|:---:|:---:|:---:|
| 1 | Slip found | พบข้อมูลสลิปในระบบธนาคาร | 200 | 200000 | ✔ |
| 2 | Get Info Success | ขอข้อมูลสำเร็จ | 200 | 200001 | 𐄂 |
| 3 | Slip is Valid | ข้อมูลสลิปถูกต้อง | 200 | 200200 | ✔ |
| 4 | Recipient Account Not Match | บัญชีผู้รับไม่ถูกต้อง | 200 | 200401 | ✔ |
| 5 | Transfer Amount Not Match | ยอดโอนไม่ตรงเงื่อนไข | 200 | 200402 | ✔ |
| 6 | Transfer Date Not Match | วันที่โอนไม่ตรงเงื่อนไข | 200 | 200403 | ✔ |
| 7 | Slip Not Found | ไม่พบสลิปในระบบธนาคาร | 200 | 200404 | ✔ |
| 8 | Slip is Duplicated | สลิปซ้ำในระบบ | 200 | 200501 | 𐄂 |

### Success Responses
**Slip Found**
```json
{
  "code": "200000",
  "message": "Slip found",
  "data": {
    "referenceId": "92887bd5-60d3-4744-9a98-b8574e...",
    "decode": "0041000600000101030040220014242082547BPM049885102TH9104xxxx",
    "transRef": "184440173749COT08999",
    "dateTime": "2024-05-29T05:37:00.000Z",
    "amount": 1000,
    "ref1": "",
    "ref2": "",
    "ref3": "",
    "receiver": {
      "account": {
        "name": "บริษัท สลิปทูโก จํากัด",
        "bank": { "account": "xxx-x-x1234-x" },
        "proxy": { "type": "BILLERID", "account": "XXXXXXXXXXX1234" }
      },
      "bank": { "id": "002", "name": "ธนาคารกรุงเทพ" }
    },
    "sender": {
      "account": {
        "name": "นาย สมชาย อัธยาศัยดี",
        "bank": { "account": "xxx-x-x1234-x" }
      },
      "bank": { "id": "004", "name": "ธนาคารกสิกรไทย" }
    }
  }
}
```

**Get Info Success (account info)**
```json
{
  "code": "200001",
  "message": "Get Info Success",
  "data": {
    "shopName": "myShop",
    "package": "BASIC-1",
    "packageExpiredDate": "2024-05-29T05:37:00.000Z",
    "quotaLimit": 400,
    "quotaRemaining": 100,
    "creditRemaining": 0,
    "autoRenewalPackage": false,
    "checkSlipByCredit": false
  }
}
```

**Slip is Valid**
```json
{ "code": "200200", "message": "Slip is Valid", "data": { "... same as Slip Found ..." } }
```

**Recipient Account Not Match**
```json
{ "code": "200401", "message": "Recipient Account Not Match", "data": { "... same as Slip Found ..." } }
```

**Transfer Amount Not Match**
```json
{ "code": "200402", "message": "Transfer Amount Not Match", "data": { "... same as Slip Found ..." } }
```

**Transfer Date Not Match**
```json
{ "code": "200403", "message": "Transfer Date Not Match", "data": { "... same as Slip Found ..." } }
```

**Slip is Duplicated**
```json
{ "code": "200501", "message": "Slip is Duplicated", "data": { "... same as Slip Found ..." } }
```

### Error Codes
| # | Status | Detail | HTTP | Response Code |
|---:|---|---|:---:|:---:|
| 1 | QR Code is Incorrect | QR code does not match bank criteria | 400 | 400001 |
| 2 | File is Incorrect | Wrong file format | 400 | 400002 |
| 3 | Reference Id is Invalid | Reference id not exist | 400 | 400003 |
| 4 | Request object is invalid | Request object not correct | 400 | 400400 |
| 5 | Token Mismatch | Token is not exist | 401 | 401001 |
| 6 | Token Mismatch | Shop not found | 401 | 401002 |
| 7 | Token Mismatch | Account suspended | 401 | 401003 |
| 8 | Package Expired | Package is already expired | 401 | 401004 |
| 9 | Insufficient Quota | Insufficient quota available | 401 | 401005 |
| 10 | Insufficient Credit | Insufficient credit available | 401 | 401006 |
| 11 | IP Address not allowed | IP address not in whitelist | 401 | 401007 |
| 12 | Internal Server Error | Slip2Go system error | 500 | 500500 |

### Error Responses
```json
{ "code": "400001", "message": "QR Code is incorrect" }
```
```json
{ "code": "400002", "message": "File is Incorrect" }
```
```json
{ "code": "400003", "message": "Reference id is Invalid" }
```
```json
{ "code": "400400", "message": "Request object is Invalid" }
```
```json
{ "code": "401001", "message": "Token Mismatch" }
```
```json
{ "code": "401002", "message": "Token Mismatch" }
```
```json
{ "code": "401003", "message": "Token Mismatch" }
```
```json
{ "code": "401004", "message": "Package Expired" }
```
```json
{ "code": "401005", "message": "Insufficient Quota" }
```
```json
{ "code": "401006", "message": "Insufficient Credit" }
```
```json
{ "code": "401007", "message": "IP Address not allowed" }
```
```json
{ "code": "500500", "message": "Internal Server Error" }
```

---

## Data Description

### Account Type List (for condition check)
| Account Type | Code |
|---|---|
| ธนาคารกรุงเทพ - Bangkok Bank | `01002` |
| ธนาคารกสิกรไทย - Kasikorn Bank | `01004` |
| ธนาคารกรุงไทย - Krung Thai Bank | `01006` |
| ธนาคารทหารไทยธนชาต - TMB Thanachart Bank | `01011` |
| ธนาคารไทยพาณิชย์ - SCB Siam Commercial Bank | `01014` |
| ธนาคารกรุงศรีอยุธยา - Krungsri Bank | `01025` |
| ธนาคารเกียรตินาคินภัทร - Kiatnakin Bank | `01069` |
| ธนาคารซีไอเอ็มบีไทย - CIMB Thai Bank | `01022` |
| ธนาคารทิสโก้ - TISCO Bank | `01067` |
| ธนาคารยูโอบี - UOB United Overseas Bank | `01024` |
| ธนาคารไทยเครดิต - Thai Credit Bank | `01071` |
| ธนาคารแลนด์แอนด์เฮ้าส์ - LH Bank | `01073` |
| ธนาคารไอซีบีซี (ไทย) - ICBC Thai | `01070` |
| SME Bank | `01098` |
| BAAC | `01034` |
| EXIM Bank | `01035` |
| GSB Government Saving Bank | `01030` |
| GHB | `01033` |
| Islamic Bank | `01066` |
| PromptPay - Phone Number | `02001` |
| PromptPay - Bank Account Number | `02002` |
| PromptPay - CitizenID | `02003` |
| PromptPay - E-Wallet (Rabbit LINE Pay, True Money Wallet) | `02004` |
| PromptPay - G-wallet (เป๋าตัง GSB E-Wallet) | `02005` |
| Merchant (K+ Shop, แมมมณี, Be Merchant NextGen, TTB Smart Shop) | `03000` |
| True Money Wallet | `04000` |

### Bank Code (from Response)
| Bank Name | Code |
|---|---|
| ธนาคารกรุงเทพ - Bangkok Bank | `002` |
| ธนาคารกสิกรไทย - Kasikorn Bank | `004` |
| ธนาคารกรุงไทย - Krung Thai Bank | `006` |
| ธนาคารทหารไทยธนชาต - TMB Thanachart Bank | `011` |
| ธนาคารไทยพาณิชย์ - SCB Siam Commercial Bank | `014` |
| ธนาคารกรุงศรีอยุธยา - Krungsri Bank | `025` |
| ธนาคารเกียรตินาคินภัทร - Kiatnakin Bank | `069` |
| ธนาคารซีไอเอ็มบีไทย - CIMB Thai Bank | `022` |
| ธนาคารทิสโก้ - TISCO Bank | `067` |
| ธนาคารยูโอบี - UOB United Overseas Bank | `024` |
| ธนาคารไทยเครดิต - Thai Credit Bank | `071` |
| ธนาคารแลนด์แอนด์เฮ้าส์ - LH Bank | `073` |
| ธนาคารไอซีบีซี (ไทย) - ICBC Thai | `070` |
| SME Bank | `098` |
| BAAC | `034` |
| EXIM Bank | `035` |
| GSB Government Saving Bank | `030` |
| GHB | `033` |
| Islamic Bank | `066` |
