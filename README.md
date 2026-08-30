<div dir="rtl">

<div align="center">

<img src="docs/logo.webp" alt="Variza" width="150">

# Variza Node.js SDK

کیت توسعه Node.js واریزا برای اتصال ساده و سریع فروشگاه‌ها و وب‌سایت‌ها به سرویس پرداخت واریزا.

</div>

<div align="center">

![Node Version](https://img.shields.io/badge/Node-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5%2B-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tests](https://img.shields.io/github/actions/workflow/status/the6fallenangel/variza-node-sdk/ci.yml?label=CI&style=flat-square&logo=github)
![npm Version](https://img.shields.io/npm/v/@the6fallenangel/variza-node-sdk?style=flat-square&logo=npm)
![npm Downloads](https://img.shields.io/npm/dm/@the6fallenangel/variza-node-sdk?style=flat-square&logo=npm)
![License](https://img.shields.io/github/license/the6fallenangel/variza-node-sdk?style=flat-square)

</div>

این SDK امکانات موردنیاز برای ایجاد لینک پرداخت و دریافت و اعتبارسنجی اعلان‌های پرداخت (Webhook) را در اختیار شما قرار می‌دهد تا بتوانید پرداخت‌های کارت‌به‌کارت را به‌صورت خودکار در سیستم خود مدیریت کنید.

---

## ✨ ویژگی‌ها

- 🚀 **بدون وابستگی** — هیچ وابستگی در زمان اجرا (runtime) ندارد و روی `http`/`https` داخلی Node.js ساخته شده است.
- 🔒 **اعتبارسنجی امن Webhook** — با استفاده از HMAC-SHA256 و مقایسه امضا با `timingSafeEqual`.
- 🧩 **پشتیبانی از TypeScript** — همراه با تعریف کامل تایپ‌ها؛ از هر دو ماژول ESM و CommonJS پشتیبانی می‌کند.
- 🟢 **پشتیبانی از Node.js 18** و نسخه‌های بالاتر.

---

## 📦 نصب

برای نصب SDK کافیست دستور زیر را اجرا کنید.

<div dir="ltr">

```bash
npm install @the6fallenangel/variza-node-sdk
```

</div>

---

## 🚀 ساخت لینک پرداخت

ابتدا یک نمونه از `VarizaClient` با توکن API خود ایجاد کنید. سپس با ارسال اطلاعات سفارش، لینک پرداخت را دریافت کرده و کاربر را به آن هدایت کنید.

<div dir="ltr">

```ts
import { Expiry, VarizaClient } from "@the6fallenangel/variza-node-sdk";

const client = new VarizaClient({ token: "your-token" });

const link = await client.pay({
  amount: 50000, // amount in Toman (min 1000)
  returnUrl: "https://shop.example/return",
  title: "Order #123", // optional
  cardLast4: "1234", // optional — pick a specific card
  expiresIn: Expiry.OneHour, // optional — link validity period
  memberPhone: "09123456789", // optional — marketplace team member phone
});

// redirect the user here
// link.payUrl
```

</div>

در مبلغ، واحد پول **تومان** است. در صورت نیاز می‌توانید برای لینک پرداخت عنوان سفارش، چهار رقم آخر کارت مقصد و مدت اعتبار لینک را نیز مشخص کنید. پس از ایجاد لینک، کافی است کاربر را به `payUrl` هدایت کنید.

> 🏪 **مارکت‌پلیس** — اگر از پلن مارکت‌پلیس استفاده می‌کنید، مالک می‌تواند با ارسال `memberPhone` (شماره `09xxxxxxxxx` عضو) لینک را به نام آن عضو ایجاد کند. کارت مقصد و محدودیت‌ها مربوط به عضو سنجیده می‌شود ولی اعتبار از مالک کسر و وب‌هوک به آدرس مالک ارسال می‌گردد.

### مدت اعتبار لینک پرداخت

برای تعیین مدت اعتبار لینک می‌توانید از مقدارهای آماده `Expiry` استفاده کنید:

| ثابت                   | مقدار   | توضیح      |
| ---------------------- | ------- | ---------- |
| `Expiry.ThirtyMinutes` | `30m`   | ۳۰ دقیقه   |
| `Expiry.OneHour`       | `1h`    | ۱ ساعت     |
| `Expiry.TwoHours`      | `2h`    | ۲ ساعت     |
| `Expiry.SixHours`      | `6h`    | ۶ ساعت     |
| `Expiry.OneDay`        | `1d`    | ۱ روز      |
| `Expiry.ThreeDays`     | `3d`    | ۳ روز      |
| `Expiry.OneWeek`       | `1w`    | ۱ هفته     |
| `Expiry.Never`         | `never` | بدون انقضا |

---

## 🔔 وب‌هوک

پس از تأیید موفق پرداخت، واریزا نتیجه پرداخت را از طریق یک درخواست `POST` به آدرس Webhook شما ارسال می‌کند.

بدنه درخواست به‌صورت JSON خام ارسال می‌شود و برای اطمینان از صحت درخواست، هدر `X-Webhook-Signature` نیز همراه آن قرار می‌گیرد. SDK امکان اعتبارسنجی این امضا را با استفاده از Webhook Secret در اختیار شما قرار می‌دهد.

<div dir="ltr">

```ts
import { VarizaPaymentEvent, verify } from "@the6fallenangel/variza-node-sdk";

const rawBody = await readRawBody(request); // raw body — exactly as sent
const signature = request.headers["x-webhook-signature"] ?? "";

if (!verify(rawBody, signature, "your-webhook-secret")) {
  return 400;
}

const event = VarizaPaymentEvent.fromJson(rawBody);

if (event.isPaymentPaid()) {
  // mark the order paid using event.attemptCode (idempotent)
  // if payment was for a team member, event.memberPhone contains their phone (otherwise null)
  const memberPhone = event.memberPhone; // '09123456789' | null
}

return 200;
```

</div>

> 💡 روش جایگزین: به‌جای `verify()` می‌توانید از `assertValid()` استفاده کنید که در صورت نامعتبر بودن امضا، خطای `InvalidSignatureError` پرتاب می‌کند.

### ⚠️ نکته مهم درباره Webhook

پردازش Webhook باید به‌صورت **idempotent** انجام شود؛ یعنی اگر یک رویداد بیش از یک بار دریافت شد، نباید باعث ثبت دوباره پرداخت یا تغییر اشتباه وضعیت سفارش شود.

واریزا در صورت دریافت پاسخ نامعتبر از سمت شما یا عدم دریافت پاسخ موفق، رویداد را دوباره ارسال می‌کند. تلاش‌های مجدد با فاصله‌های ۳۰، ۶۰، ۱۸۰ و ۶۰۰ ثانیه انجام می‌شوند و یک رویداد حداکثر ۵ بار ارسال خواهد شد.

به همین دلیل توصیه می‌شود پس از دریافت و اعتبارسنجی Webhook، در سریع‌ترین زمان ممکن پاسخ **HTTP 200** را برگردانید و پردازش‌های سنگین را به صف یا Job منتقل کنید.

---

## 🚨 مدیریت خطاها

| وضعیت HTTP | خطا               | توضیح                   |
| ---------- | ----------------- | ----------------------- |
| `422`      | `ValidationError` | خطای اعتبارسنجی درخواست |
| `429`      | `RateLimitError`  | محدودیت نرخ درخواست     |
| سایر       | `ApiError`        | سایر خطاهای API         |

<div dir="ltr">

```ts
import {
  RateLimitError,
  ValidationError,
} from "@the6fallenangel/variza-node-sdk";

try {
  const link = await client.pay(request);
} catch (error) {
  if (error instanceof ValidationError) {
    // invalid input fields
  } else if (error instanceof RateLimitError) {
    // rate limited — wait a bit
  }
}
```

</div>

تمام این خطاها از `VarizaError` ارث می‌برند و اطلاعاتی مانند کد وضعیت HTTP، خطاهای API و بدنه پاسخ را در اختیار شما قرار می‌دهند.

---

## 🧪 توسعه و اجرای تست‌ها

برای دریافت وابستگی‌های پروژه:

<div dir="ltr">

```bash
npm install
```

</div>

برای اجرای تست‌ها و بررسی تایپ‌ها:

<div dir="ltr">

```bash
npm test
```

</div>

تست‌های پروژه به‌صورت خودکار در CI روی نسخه‌های مختلف Node.js (20، 22 و 24) اجرا می‌شوند.

---

## 📄 مجوز

این پروژه تحت مجوز **MIT** منتشر شده است.

مستندات کامل API و راهنمای اتصال به واریزا را می‌توانید در صفحه مستندات فنی واریزا مشاهده کنید. برای آشنایی بیشتر با واریزا و قابلیت‌های آن به [variza.ir](https://variza.ir) مراجعه کنید.

</div>

---

## 🇬🇧 English

**Variza Node.js SDK** is the Node.js kit for connecting your stores and websites to the Variza payment service — create payment links and receive/verify payment webhooks to automate card-to-card payments in your system.

### ✨ Features

- 🚀 **Zero dependencies** — no runtime dependencies, built on Node's built-in `http`/`https`.
- 🔒 **Secure webhook verification** — HMAC-SHA256 with timing-safe comparison (`timingSafeEqual`).
- 🧩 **TypeScript support** — ships with full type definitions; supports both ESM and CommonJS.
- 🟢 **Supports Node.js 18** and above.

### 📦 Installation

```bash
npm install @the6fallenangel/variza-node-sdk
```

### Create a payment link

Create a `VarizaClient` with your API token, send the order details, and redirect the customer to the returned link.

```ts
import { Expiry, VarizaClient } from "@the6fallenangel/variza-node-sdk";

const client = new VarizaClient({ token: "your-token" });

const link = await client.pay({
  amount: 50000, // amount in Toman (min 1000)
  returnUrl: "https://shop.example/return",
  title: "Order #123", // optional
  cardLast4: "1234", // optional — pick a specific card
  expiresIn: Expiry.OneHour, // optional — link validity period
  memberPhone: "09123456789", // optional — marketplace team member phone
});

// redirect the user here
// link.payUrl
```

The amount is in **Toman**. You can optionally set an order title, the last four digits of the destination card, and the link validity period. Once created, redirect the customer to `payUrl`.

> 🏪 **Marketplace** — If you use a marketplace team plan, the owner can pass `memberPhone` (`09xxxxxxxxx` of a member) to create the link on behalf of that member. Destination card and limits are checked against the member, but credit is deducted from the owner and webhook is delivered to owner's `callback_url`.

### Payment link expiry

| Constant               | Value   | Description   |
| ---------------------- | ------- | ------------- |
| `Expiry.ThirtyMinutes` | `30m`   | 30 minutes    |
| `Expiry.OneHour`       | `1h`    | 1 hour        |
| `Expiry.TwoHours`      | `2h`    | 2 hours       |
| `Expiry.SixHours`      | `6h`    | 6 hours       |
| `Expiry.OneDay`        | `1d`    | 1 day         |
| `Expiry.ThreeDays`     | `3d`    | 3 days        |
| `Expiry.OneWeek`       | `1w`    | 1 week        |
| `Expiry.Never`         | `never` | Never expires |

### Webhook

After a successful payment, Variza sends the result to your webhook URL via a `POST` request. The body is sent as raw JSON, along with an `X-Webhook-Signature` header. The SDK verifies the signature using your Webhook Secret.

```ts
import { VarizaPaymentEvent, verify } from "@the6fallenangel/variza-node-sdk";

const rawBody = await readRawBody(request); // raw body — exactly as sent
const signature = request.headers["x-webhook-signature"] ?? "";

if (!verify(rawBody, signature, "your-webhook-secret")) {
  return 400;
}

const event = VarizaPaymentEvent.fromJson(rawBody);

if (event.isPaymentPaid()) {
  // mark the order paid using event.attemptCode (idempotent)
  // if payment was for a team member, event.memberPhone contains their phone (otherwise null)
  const memberPhone = event.memberPhone; // '09123456789' | null
}

return 200;
```

> 💡 Alternative: use `assertValid()` instead of `verify()` to throw an `InvalidSignatureError` on an invalid signature.

#### ⚠️ Important webhook notes

Webhook handling must be **idempotent** — receiving the same event more than once must not double-register a payment or wrongly change the order status.

If Variza receives an invalid response or no successful response, it re-delivers the event with retries at 30, 60, 180, and 600 seconds, up to 5 times. Return **HTTP 200** as soon as possible after receiving and verifying a webhook, and move heavy processing to a queue or job.

### Error handling

| HTTP Status | Error             | Description                |
| ----------- | ----------------- | -------------------------- |
| `422`       | `ValidationError` | Request validation error   |
| `429`       | `RateLimitError`  | Request rate limit reached |
| other       | `ApiError`        | Other API errors           |

```ts
import {
  RateLimitError,
  ValidationError,
} from "@the6fallenangel/variza-node-sdk";

try {
  const link = await client.pay(request);
} catch (error) {
  if (error instanceof ValidationError) {
    // invalid input fields
  } else if (error instanceof RateLimitError) {
    // rate limited — wait a bit
  }
}
```

All errors extend `VarizaError` and carry the HTTP status code, API errors, and the response body.

### Development & tests

```bash
npm install
npm test
```

Tests run automatically in CI across Node.js 20, 22, and 24.

### License

Released under the **MIT** license. See the Variza developer docs for full API documentation, and visit [variza.ir](https://variza.ir) to learn more.
