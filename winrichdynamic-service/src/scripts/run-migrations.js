const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

const CUSTOMER_CODE_REGEX = /^C\d{2}\d{2}\d{4}$/i;

const normalizeText = (value) => String(value || '').trim().toLowerCase();
const normalizePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('66') && digits.length >= 11) {
    return `0${digits.slice(2)}`;
  }
  return digits;
};

const isObjectId = (value) => value instanceof ObjectId;
const isHexObjectId = (value) => typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);
const toObjectId = (value) => {
  if (!value) return null;
  if (isObjectId(value)) return value;
  if (isHexObjectId(String(value))) return new ObjectId(String(value));
  return null;
};

const isEmpty = (value) => value === undefined || value === null || String(value).trim() === '';

const buildCustomerPrefix = (date = new Date()) => {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `C${year}${month}`;
};

const formatCustomerCode = (prefix, sequence) =>
  `${prefix}${String(sequence).padStart(4, '0')}`;

const buildSalesOrderNumber = (id) => {
  const raw = String(id || '');
  const suffix = raw.slice(-6).toUpperCase();
  return `SO${suffix}`;
};

async function migrateAdminIds(db) {
  const admins = await db
    .collection('admins')
    .find({}, { projection: { name: 1, phone: 1, email: 1 } })
    .toArray();

  if (!admins.length) {
    console.log('[migrations] no admins found, skip admin-id migration');
    return;
  }

  const byId = new Map();
  const byName = new Map();
  const byEmail = new Map();
  const byPhone = new Map();

  for (const admin of admins) {
    const id = admin._id;
    const idStr = String(id);
    byId.set(idStr, id);

    const name = normalizeText(admin.name);
    if (name && !byName.has(name)) byName.set(name, id);

    const email = normalizeText(admin.email);
    if (email && !byEmail.has(email)) byEmail.set(email, id);

    const phone = normalizePhone(admin.phone);
    if (phone && !byPhone.has(phone)) {
      byPhone.set(phone, id);
      if (phone.startsWith('0')) {
        byPhone.set(`66${phone.slice(1)}`, id);
      }
    }
  }

  const resolveAdminId = (value) => {
    if (!value) return null;
    if (typeof value === 'object' && value._id) return resolveAdminId(value._id);
    if (isObjectId(value)) {
      const id = byId.get(String(value));
      return id || null;
    }
    const raw = String(value).trim();
    if (!raw) return null;
    if (raw.length === 24 && byId.has(raw)) return byId.get(raw);
    const name = normalizeText(raw);
    if (name && byName.has(name)) return byName.get(name);
    const email = normalizeText(raw);
    if (email && byEmail.has(email)) return byEmail.get(email);
    const phone = normalizePhone(raw);
    if (phone && byPhone.has(phone)) return byPhone.get(phone);
    return null;
  };

  const collections = [
    { name: 'customers', field: 'assignedTo', type: 'string' },
    { name: 'quotations', field: 'assignedTo', type: 'string' },
    { name: 'deals', field: 'ownerId', type: 'string' },
    { name: 'projects', field: 'ownerId', type: 'string' },
    { name: 'leads', field: 'ownerId', type: 'string' },
    { name: 'activities', field: 'ownerId', type: 'string' },
    { name: 'notes', field: 'ownerId', type: 'string' },
    { name: 'orders', field: 'ownerId', type: 'objectId' },
  ];

  for (const { name, field, type } of collections) {
    const collection = db.collection(name);
    const cursor = collection.find(
      { [field]: { $exists: true, $ne: null, $ne: '' } },
      { projection: { [field]: 1 } }
    );

    let scanned = 0;
    let updated = 0;
    let unresolved = 0;

    for await (const doc of cursor) {
      scanned += 1;
      const current = doc[field];
      const resolved = resolveAdminId(current);
      if (!resolved) {
        unresolved += 1;
        continue;
      }

      const nextValue = type === 'objectId' ? resolved : String(resolved);
      const alreadyObjectId = isObjectId(current);
      const currentStr = current ? String(current) : '';

      const isSame =
        type === 'objectId'
          ? alreadyObjectId && currentStr === String(resolved)
          : currentStr === String(resolved);

      if (isSame) continue;

      await collection.updateOne(
        { _id: doc._id },
        { $set: { [field]: nextValue, updatedAt: new Date() } }
      );
      updated += 1;
    }

    console.log(
      `[migrations] ${name}.${field}: scanned=${scanned} updated=${updated} unresolved=${unresolved}`
    );
  }
}

async function backfillCustomerCodes(db) {
  const customers = db.collection('customers');
  const cursor = customers.find(
    { customerCode: { $type: 'string' } },
    { projection: { customerCode: 1 } }
  );

  const maxByPrefix = new Map();
  const usedCodes = new Set();

  for await (const doc of cursor) {
    const code = String(doc.customerCode || '').trim();
    if (!CUSTOMER_CODE_REGEX.test(code)) continue;
    usedCodes.add(code);
    const prefix = code.slice(0, 5);
    const seq = Number(code.slice(5));
    if (!Number.isNaN(seq)) {
      maxByPrefix.set(prefix, Math.max(maxByPrefix.get(prefix) || 0, seq));
    }
  }

  const missingCursor = customers
    .find(
      {
        $or: [
          { customerCode: { $exists: false } },
          { customerCode: null },
          { customerCode: '' },
        ],
      },
      { projection: { createdAt: 1 } }
    )
    .sort({ createdAt: 1 });

  let updated = 0;
  for await (const doc of missingCursor) {
    const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
    const prefix = buildCustomerPrefix(createdAt);
    let nextSeq = (maxByPrefix.get(prefix) || 0) + 1;
    let code = formatCustomerCode(prefix, nextSeq);

    while (usedCodes.has(code)) {
      nextSeq += 1;
      code = formatCustomerCode(prefix, nextSeq);
    }

    usedCodes.add(code);
    maxByPrefix.set(prefix, nextSeq);

    await customers.updateOne(
      { _id: doc._id },
      { $set: { customerCode: code, updatedAt: new Date() } }
    );
    updated += 1;
  }

  console.log(`[migrations] customers.customerCode backfill updated=${updated}`);
}

async function backfillOrderCustomerId(db) {
  const customers = await db
    .collection('customers')
    .find({}, { projection: { phoneNumber: 1 } })
    .toArray();

  const phoneMap = new Map();
  const duplicates = new Set();

  for (const customer of customers) {
    const phone = normalizePhone(customer.phoneNumber);
    if (!phone) continue;
    if (phoneMap.has(phone)) {
      duplicates.add(phone);
      continue;
    }
    phoneMap.set(phone, customer._id);
  }

  const orders = db.collection('orders');
  const cursor = orders.find(
    {
      $or: [
        { customerId: { $exists: false } },
        { customerId: null },
        { customerId: '' },
      ],
      customerPhone: { $exists: true, $ne: '' },
    },
    { projection: { customerPhone: 1 } }
  );

  let updated = 0;
  let unresolved = 0;

  for await (const order of cursor) {
    const phone = normalizePhone(order.customerPhone);
    if (!phone || duplicates.has(phone)) {
      unresolved += 1;
      continue;
    }
    const customerId = phoneMap.get(phone);
    if (!customerId) {
      unresolved += 1;
      continue;
    }
    await orders.updateOne(
      { _id: order._id },
      { $set: { customerId, updatedAt: new Date() } }
    );
    updated += 1;
  }

  console.log(
    `[migrations] orders.customerId backfill updated=${updated} unresolved=${unresolved}`
  );
}

async function backfillOrdersFromQuotations(db) {
  const orders = db.collection('orders');
  const quotations = db.collection('quotations');

  const existingNumbers = new Set(
    await orders.distinct('salesOrderNumber', {
      salesOrderNumber: { $type: 'string', $ne: '' },
    })
  );

  const cursor = orders.find(
    {
      $or: [
        { sourceQuotationId: { $exists: true, $ne: '' } },
        { quotationId: { $exists: true, $ne: '' } },
      ],
    },
    {
      projection: {
        sourceQuotationId: 1,
        quotationId: 1,
        ownerId: 1,
        customerId: 1,
        deliveryAddress: 1,
        deliveryProvince: 1,
        deliveryDistrict: 1,
        deliverySubdistrict: 1,
        deliveryPostalCode: 1,
        paymentTerms: 1,
        salesOrderNumber: 1,
        orderType: 1,
      },
    }
  );

  let updated = 0;
  let unresolved = 0;

  for await (const order of cursor) {
    const qidRaw = order.sourceQuotationId || order.quotationId;
    const qid = toObjectId(qidRaw);
    if (!qid) {
      unresolved += 1;
      continue;
    }

    const quotation = await quotations.findOne({ _id: qid });
    if (!quotation) {
      unresolved += 1;
      continue;
    }

    const update = {};

    if (isEmpty(order.orderType)) {
      update.orderType = 'sales_order';
    }

    if (isEmpty(order.salesOrderNumber)) {
      const candidate = String(quotation.salesOrderNumber || '').trim();
      let number = candidate || buildSalesOrderNumber(order._id);
      if (existingNumbers.has(number)) {
        const fallback = `SO${String(order._id).slice(-8).toUpperCase()}`;
        if (!existingNumbers.has(fallback)) {
          number = fallback;
        } else {
          number = '';
        }
      }
      if (number) {
        update.salesOrderNumber = number;
        existingNumbers.add(number);
      }
    }

    if (isEmpty(order.ownerId) && quotation.assignedTo) {
      const ownerId = toObjectId(quotation.assignedTo);
      if (ownerId) update.ownerId = ownerId;
    }

    if (isEmpty(order.customerId) && quotation.customerId) {
      const customerId = toObjectId(quotation.customerId);
      if (customerId) update.customerId = customerId;
    }

    if (isEmpty(order.paymentTerms) && quotation.paymentTerms) {
      update.paymentTerms = quotation.paymentTerms;
    }

    const shipSame = quotation.shipToSameAsCustomer ?? true;
    const shippingAddress = shipSame
      ? quotation.customerAddress || quotation.shippingAddress || ''
      : quotation.shippingAddress || quotation.customerAddress || '';

    if (isEmpty(order.deliveryAddress) && shippingAddress) {
      update.deliveryAddress = shippingAddress;
    }
    if (isEmpty(order.deliveryProvince) && quotation.deliveryProvince) {
      update.deliveryProvince = quotation.deliveryProvince;
    }
    if (isEmpty(order.deliveryDistrict) && quotation.deliveryDistrict) {
      update.deliveryDistrict = quotation.deliveryDistrict;
    }
    if (isEmpty(order.deliverySubdistrict) && quotation.deliverySubdistrict) {
      update.deliverySubdistrict = quotation.deliverySubdistrict;
    }
    if (isEmpty(order.deliveryPostalCode) && quotation.deliveryZipcode) {
      update.deliveryPostalCode = quotation.deliveryZipcode;
    }

    if (Object.keys(update).length === 0) {
      continue;
    }

    update.updatedAt = new Date();
    await orders.updateOne({ _id: order._id }, { $set: update });
    updated += 1;
  }

  console.log(
    `[migrations] orders backfill from quotation updated=${updated} unresolved=${unresolved}`
  );
}

async function runMigration(db, name, handler) {
  const migrations = db.collection('migrations');
  const exists = await migrations.findOne({ name });
  if (exists) {
    console.log(`[migrations] skip ${name}`);
    return;
  }
  console.log(`[migrations] run ${name}`);
  await handler(db);
  await migrations.insertOne({ name, appliedAt: new Date() });
  console.log(`[migrations] done ${name}`);
}

async function run() {
  if (!MONGODB_URI) {
    console.log('[migrations] MONGODB_URI not set, skip');
    return;
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = DB_NAME ? client.db(DB_NAME) : client.db();
    await runMigration(db, '2026-01-08-admin-ids', migrateAdminIds);
    await runMigration(db, '2026-01-08-customer-codes', backfillCustomerCodes);
    await runMigration(db, '2026-01-08-orders-customer-id', backfillOrderCustomerId);
    await runMigration(db, '2026-01-08-orders-from-quotations', backfillOrdersFromQuotations);
  } catch (error) {
    console.error('[migrations] failed:', error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  run();
}
